
'use client';

import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import type { Client, Vehicle, ServiceRecord, Notification } from './types';


export async function getClients(): Promise<Client[]> {
    if (!firestore) {
        console.error("Firestore not initialized");
        return [];
    }
    const clientsCollection = collection(firestore, 'clients');
    const clientSnapshot = await getDocs(clientsCollection);
    const clientsList = clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
    
    const clientsWithVehicles = await Promise.all(clientsList.map(async (client) => {
        const vehiclesCollection = collection(firestore, 'clients', client.id, 'vehicles');
        const vehiclesSnapshot = await getDocs(vehiclesCollection);
        const vehicles = vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Omit<Vehicle, 'serviceHistory'>));
        return { ...client, vehicles: vehicles || [] };
    }));

    return clientsWithVehicles;
}

export async function getClientById(id: string): Promise<Client | undefined> {
    if (!firestore) {
        console.error("Firestore not initialized");
        return undefined;
    }
    const clientDocRef = doc(firestore, 'clients', id);
    const clientDoc = await getDoc(clientDocRef);

    if (clientDoc.exists()) {
        const clientData = { id: clientDoc.id, ...clientDoc.data() } as Client;
        
        // Fetch subcollections
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
}
