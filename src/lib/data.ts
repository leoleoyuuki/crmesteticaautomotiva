'use client';

import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import type { Client, Vehicle, ServiceRecord, Notification } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


export async function getClients(userId: string): Promise<Client[]> {
    if (!firestore) {
        console.error("Firestore not initialized");
        return [];
    }
    const clientsCollection = collection(firestore, 'users', userId, 'clients');
    try {
        const clientSnapshot = await getDocs(clientsCollection);
        const clientsList = clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
        
        const clientsWithVehicles = await Promise.all(clientsList.map(async (client) => {
            const vehiclesCollection = collection(firestore, 'users', userId, 'clients', client.id, 'vehicles');
            const vehiclesSnapshot = await getDocs(vehiclesCollection);
            const vehicles = vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Omit<Vehicle, 'serviceHistory'>));
            return { ...client, vehicles: vehicles || [] };
        }));

        return clientsWithVehicles;
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
            const clientData = { id: clientDoc.id, ...clientDoc.data() } as Client;
            
            const vehiclesCollection = collection(clientDocRef, 'vehicles');
            const vehiclesSnapshot = await getDocs(vehiclesCollection);
            clientData.vehicles = await Promise.all(vehiclesSnapshot.docs.map(async (vehicleDoc) => {
                const vehicleData = { id: vehicleDoc.id, ...vehicleDoc.data() } as Vehicle;
                
                const serviceHistoryCollection = collection(vehicleDoc.ref, 'serviceHistory');
                const serviceHistorySnapshot = await getDocs(serviceHistoryCollection);
                vehicleData.serviceHistory = serviceHistorySnapshot.docs.map(serviceDoc => ({ id: serviceDoc.id, ...serviceDoc.data() } as ServiceRecord));
                
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
            return { id: serviceDoc.id, ...serviceDoc.data() } as ServiceRecord;
        }
        return undefined;
    } catch (serverError) {
        console.error("Error fetching service record:", serverError);
        return undefined;
    }
}
