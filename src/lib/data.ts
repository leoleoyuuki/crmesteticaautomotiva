'use client';

import { collection, doc, getDoc, getDocs, Timestamp, query, orderBy, limit, startAfter, where, DocumentData, QueryDocumentSnapshot, collectionGroup } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import type { Client, Vehicle, ServiceRecord, UserProfile, ActivationCode } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Helper to safely convert Firestore timestamp (or string) to an ISO string
const toISOString = (date: any): string => {
    if (date instanceof Timestamp) {
      return date.toDate().toISOString();
    }
    if (date && typeof date.seconds === 'number') {
        return new Date(date.seconds * 1000).toISOString();
    }
    if (typeof date === 'string') {
        const d = new Date(date);
        if (!isNaN(d.getTime())) {
            return d.toISOString();
        }
    }
    // Return a valid ISO string for invalid or missing dates to avoid downstream errors
    return new Date(0).toISOString();
};

export async function getUpcomingRenewals(userId: string, startDate: Date, endDate: Date): Promise<ServiceRecord[]> {
    if (!firestore) {
        console.error("Firestore not initialized");
        return [];
    }
    const servicesRef = collectionGroup(firestore, 'serviceHistory');
    const q = query(servicesRef, 
        where('userId', '==', userId), // Assuming you'll add userId to each service
        where('expirationDate', '>=', startDate.toISOString()),
        where('expirationDate', '<=', endDate.toISOString()),
        orderBy('expirationDate')
    );

    try {
        const querySnapshot = await getDocs(q);
        const renewals: ServiceRecord[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            renewals.push({
                id: doc.id,
                ...data,
                date: toISOString(data.date),
                expirationDate: toISOString(data.expirationDate),
            } as ServiceRecord);
        });
        return renewals;
    } catch (error) {
        console.error("Error fetching renewals: ", error);
        // Firestore will log a message in the console with a link to create the index.
        // You can also handle this error more gracefully in the UI.
        return [];
    }
}


export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!firestore) return null;
    const userDocRef = doc(firestore, 'users', userId);
    
    try {
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            return null;
        }
        const data = userDoc.data();
        return {
            id: userDoc.id,
            name: data.name,
            email: data.email,
            isActivated: data.isActivated || false,
            activatedUntil: data.activatedUntil ? toISOString(data.activatedUntil) : undefined,
        };
    } catch(serverError: any) {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
        } else {
            console.error("An unexpected error occurred in getUserProfile:", serverError);
        }
        return null;
    }
}


export async function getClients(userId: string): Promise<Client[]> {
    if (!firestore) {
        console.error("Firestore not initialized");
        return [];
    }
    const clientsCollection = collection(firestore, 'users', userId, 'clients');
    try {
        const clientSnapshot = await getDocs(clientsCollection);
        
        const clientsList = await Promise.all(clientSnapshot.docs.map(async (clientDoc) => {
            const clientData = clientDoc.data();
            const client: Client = { 
                id: clientDoc.id, 
                name: clientData.name,
                email: clientData.email,
                phone: clientData.phone,
                createdAt: toISOString(clientData.createdAt),
                vehicles: []
            };

            const vehiclesCollection = collection(firestore, 'users', userId, 'clients', client.id, 'vehicles');
            const vehiclesSnapshot = await getDocs(vehiclesCollection);
            
            client.vehicles = await Promise.all(vehiclesSnapshot.docs.map(async (vehicleDoc) => {
                const vehicleData = vehicleDoc.data();
                const vehicle: Vehicle = {
                    id: vehicleDoc.id,
                    make: vehicleData.make,
                    model: vehicleData.model,
                    year: vehicleData.year,
                    licensePlate: vehicleData.licensePlate,
                    serviceHistory: []
                };

                const serviceHistoryCollection = collection(firestore, 'users', userId, 'clients', client.id, 'vehicles', vehicle.id, 'serviceHistory');
                const serviceHistorySnapshot = await getDocs(serviceHistoryCollection);

                vehicle.serviceHistory = serviceHistorySnapshot.docs.map(serviceDoc => {
                    const serviceData = serviceDoc.data();
                    return {
                        id: serviceDoc.id,
                        serviceType: serviceData.serviceType,
                        notes: serviceData.notes,
                        cost: serviceData.cost,
                        durationDays: serviceData.durationDays,
                        date: toISOString(serviceData.date),
                        expirationDate: toISOString(serviceData.expirationDate),
                        imageUrl: serviceData.imageUrl,
                        isRenewed: serviceData.isRenewed,
                    } as ServiceRecord;
                });
                
                return vehicle;
            }));

            return client;
        }));

        return clientsList;

    } catch (serverError: any) {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: clientsCollection.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
        } else {
            console.error("An unexpected error occurred:", serverError);
        }
        return [];
    }
}

export async function getClientsPaginated(userId: string, pageSize: number, startAfterDoc?: QueryDocumentSnapshot<DocumentData>) {
    const clientsCollection = collection(firestore, 'users', userId, 'clients');
    let q;
    if (startAfterDoc) {
        q = query(clientsCollection, orderBy('createdAt', 'desc'), startAfter(startAfterDoc), limit(pageSize));
    } else {
        q = query(clientsCollection, orderBy('createdAt', 'desc'), limit(pageSize));
    }

    const documentSnapshots = await getDocs(q);
    const clients = documentSnapshots.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: toISOString(doc.data().createdAt),
        vehicles: [] // Vehicles not loaded in paginated view for performance
    })) as Client[];
    
    const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length-1];
    
    return { clients, lastVisible };
}

export async function getClientById(userId: string, id: string): Promise<Client | undefined> {
    if (!firestore) {
        console.error("Firestore not initialized");
        return undefined;
    }
    const clientDocRef = doc(firestore, 'users', userId, 'clients', id);
    try {
        const clientDoc = await getDoc(clientDocRef);

        if (clientDoc.exists()) {
            const clientData = { 
                id: clientDoc.id, 
                ...clientDoc.data(),
                createdAt: toISOString(clientDoc.data().createdAt)
            } as Client;
            
            const vehiclesCollection = collection(clientDocRef, 'vehicles');
            const vehiclesSnapshot = await getDocs(vehiclesCollection);
            clientData.vehicles = await Promise.all(vehiclesSnapshot.docs.map(async (vehicleDoc) => {
                const vehicleData = { id: vehicleDoc.id, ...vehicleDoc.data() } as Vehicle;
                
                const serviceHistoryCollection = collection(vehicleDoc.ref, 'serviceHistory');
                const serviceHistorySnapshot = await getDocs(serviceHistoryCollection);
                vehicleData.serviceHistory = serviceHistorySnapshot.docs.map(serviceDoc => {
                    const serviceData = serviceDoc.data();
                     return {
                        id: serviceDoc.id,
                        ...serviceData,
                        date: toISOString(serviceData.date),
                        expirationDate: toISOString(serviceData.expirationDate),
                     } as ServiceRecord
                });
                
                return vehicleData;
            }));
            
            return clientData;
        } else {
            return undefined;
        }
    } catch (serverError: any) {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: clientDocRef.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
        } else {
            console.error("An unexpected error occurred:", serverError);
        }
        return undefined;
    }
}

export async function getVehicleById(userId: string, clientId: string, vehicleId: string): Promise<Vehicle | undefined> {
    if (!firestore) {
        console.error("Firestore not initialized");
        return undefined;
    }
    const vehicleDocRef = doc(firestore, 'users', userId, 'clients', clientId, 'vehicles', vehicleId);
    try {
        const vehicleDoc = await getDoc(vehicleDocRef);
        if (vehicleDoc.exists()) {
            return { id: vehicleDoc.id, ...vehicleDoc.data() } as Vehicle;
        }
        return undefined;
    } catch (serverError: any) {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: vehicleDocRef.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
        } else {
            console.error("An unexpected error occurred:", serverError);
        }
        return undefined;
    }
}

export async function getServiceRecordById(userId: string, clientId: string, vehicleId: string, serviceId: string): Promise<ServiceRecord | undefined> {
    if (!firestore) {
        console.error("Firestore not initialized");
        return undefined;
    }
    const serviceDocRef = doc(firestore, 'users', userId, 'clients', clientId, 'vehicles', vehicleId, 'serviceHistory', serviceId);
    try {
        const serviceDoc = await getDoc(serviceDocRef);
        if (serviceDoc.exists()) {
             const serviceData = serviceDoc.data();
            return { 
                id: serviceDoc.id,
                ...serviceData,
                date: toISOString(serviceData.date),
                expirationDate: toISOString(serviceData.expirationDate)
            } as ServiceRecord;
        }
        return undefined;
    } catch (serverError: any) {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: serviceDocRef.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
        } else {
            console.error("An unexpected error occurred:", serverError);
        }
        return undefined;
    }
}

export async function getActivationCodes(): Promise<ActivationCode[]> {
    if (!firestore) return [];
    const codesCollection = collection(firestore, 'activationCodes');
    const q = query(codesCollection, orderBy('createdAt', 'desc'));
    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: toISOString(doc.data().createdAt),
        usedAt: doc.data().usedAt ? toISOString(doc.data().usedAt) : undefined,
      } as ActivationCode));
    } catch (serverError: any) {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: codesCollection.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
        } else {
            console.error("An unexpected error occurred:", serverError);
        }
        return [];
    }
}
