'use client';

import { collection, doc, getDoc, getDocs, Timestamp } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import type { Client, Vehicle, ServiceRecord, Notification } from './types';
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
                avatarUrl: clientData.avatarUrl,
                avatarHint: clientData.avatarHint,
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
                    imageUrl: vehicleData.imageUrl,
                    imageHint: vehicleData.imageHint,
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
                        durationMonths: serviceData.durationMonths,
                        date: toISOString(serviceData.date),
                        expirationDate: toISOString(serviceData.expirationDate)
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
    } catch (serverError) {
        console.error("Error fetching vehicle:", serverError);
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
    } catch (serverError) {
        console.error("Error fetching service record:", serverError);
        return undefined;
    }
}
