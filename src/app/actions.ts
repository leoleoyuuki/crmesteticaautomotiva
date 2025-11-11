'use server';

import { recommendServicePackages, RecommendServicePackagesInput } from '@/ai/flows/recommend-service-packages';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { ClientFormData, ServiceRecord, ServiceRecordFormData, Vehicle, VehicleFormData } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { addMonths } from 'date-fns';

// Client Actions
export async function addClient(userId: string, formData: ClientFormData) {
    if (!firestore) throw new Error("Firestore not initialized");
    if (!userId) throw new Error("User not authenticated");

    const clientsCollection = collection(firestore, 'users', userId, 'clients');
    
    const newClientData = {
        ...formData,
        createdAt: serverTimestamp(),
    };

    await addDoc(clientsCollection, newClientData);
    
    revalidatePath('/clients');
    redirect('/clients');
}

export async function updateClient(userId: string, clientId: string, formData: ClientFormData) {
    if (!firestore) throw new Error("Firestore not initialized");
    if (!userId) throw new Error("User not authenticated");

    const clientDocRef = doc(firestore, 'users', userId, 'clients', clientId);

    await updateDoc(clientDocRef, formData as any);

    revalidatePath(`/clients`);
    revalidatePath(`/clients/${clientId}`);
    redirect(`/clients/${clientId}`);
}

export async function deleteClient(userId: string, clientId: string) {
    if (!firestore) throw new Error("Firestore not initialized");
    if (!userId) throw new Error("User not authenticated");

    const clientDocRef = doc(firestore, 'users', userId, 'clients', clientId);
    const batch = writeBatch(firestore);

    // This is a simplified deletion. For very large subcollections, a Cloud Function would be better.
    const vehiclesCollection = collection(clientDocRef, 'vehicles');
    const vehiclesSnapshot = await getDocs(vehiclesCollection);
    for (const vehicleDoc of vehiclesSnapshot.docs) {
        const serviceHistoryCollection = collection(vehicleDoc.ref, 'serviceHistory');
        const serviceHistorySnapshot = await getDocs(serviceHistoryCollection);
        serviceHistorySnapshot.forEach(serviceDoc => batch.delete(serviceDoc.ref));
        batch.delete(vehicleDoc.ref);
    }
    batch.delete(clientDocRef);

    await batch.commit();

    revalidatePath('/clients');
    redirect('/clients');
}

// Vehicle Actions
export async function addVehicle(userId: string, clientId: string, formData: VehicleFormData) {
    if (!firestore) throw new Error("Firestore not initialized");
    if (!userId) throw new Error("User not authenticated");

    const vehiclesCollection = collection(firestore, 'users', userId, 'clients', clientId, 'vehicles');
    await addDoc(vehiclesCollection, formData);

    revalidatePath(`/clients/${clientId}`);
    redirect(`/clients/${clientId}`);
}

export async function updateVehicle(userId: string, clientId: string, vehicleId: string, formData: VehicleFormData) {
    if (!firestore) throw new Error("Firestore not initialized");
    if (!userId) throw new Error("User not authenticated");

    const vehicleDocRef = doc(firestore, 'users', userId, 'clients', clientId, 'vehicles', vehicleId);
    await updateDoc(vehicleDocRef, formData as any);

    revalidatePath(`/clients/${clientId}`);
    redirect(`/clients/${clientId}`);
}

export async function deleteVehicle(userId: string, clientId: string, vehicleId: string) {
    if (!firestore) throw new Error("Firestore not initialized");
    if (!userId) throw new Error("User not authenticated");

    const vehicleDocRef = doc(firestore, 'users', userId, 'clients', clientId, 'vehicles', vehicleId);
    
    // Also delete service history subcollection
    const serviceHistoryCollection = collection(vehicleDocRef, 'serviceHistory');
    const serviceHistorySnapshot = await getDocs(serviceHistoryCollection);
    const batch = writeBatch(firestore);
    serviceHistorySnapshot.forEach(doc => batch.delete(doc.ref));
    batch.delete(vehicleDocRef);
    
    await batch.commit();

    revalidatePath(`/clients/${clientId}`);
    redirect(`/clients/${clientId}`);
}


// Service Record Actions
export async function addServiceRecord(userId: string, clientId: string, vehicleId: string, formData: ServiceRecordFormData) {
    if (!firestore) throw new Error("Firestore not initialized");
    if (!userId) throw new Error("User not authenticated");

    const serviceHistoryCollection = collection(firestore, 'users', userId, 'clients', clientId, 'vehicles', vehicleId, 'serviceHistory');
    
    const startDate = new Date(formData.date);
    const expirationDate = addMonths(startDate, formData.durationMonths);

    const newServiceData = {
        ...formData,
        date: startDate.toISOString(),
        expirationDate: expirationDate.toISOString()
    };
    
    await addDoc(serviceHistoryCollection, newServiceData);

    revalidatePath(`/clients/${clientId}`);
    redirect(`/clients/${clientId}`);
}

export async function updateServiceRecord(userId: string, clientId: string, vehicleId: string, serviceId: string, formData: ServiceRecordFormData) {
    if (!firestore) throw new Error("Firestore not initialized");
    if (!userId) throw new Error("User not authenticated");

    const serviceDocRef = doc(firestore, 'users', userId, 'clients', clientId, 'vehicles', vehicleId, 'serviceHistory', serviceId);
    
    const startDate = new Date(formData.date);
    const expirationDate = addMonths(startDate, formData.durationMonths);

    const updatedServiceData = {
        ...formData,
        date: startDate.toISOString(),
        expirationDate: expirationDate.toISOString()
    };
    
    await updateDoc(serviceDocRef, updatedServiceData as any);

    revalidatePath(`/clients/${clientId}`);
    redirect(`/clients/${clientId}`);
}

export async function deleteServiceRecord(userId: string, clientId: string, vehicleId: string, serviceId: string) {
    if (!firestore) throw new Error("Firestore not initialized");
    if (!userId) throw new Error("User not authenticated");

    const serviceDocRef = doc(firestore, 'users', userId, 'clients', clientId, 'vehicles', vehicleId, 'serviceHistory', serviceId);
    await deleteDoc(serviceDocRef);

    revalidatePath(`/clients/${clientId}`);
    redirect(`/clients/${clientId}`);
}


// AI Actions
export async function getServiceRecommendations(input: RecommendServicePackagesInput) {
    try {
        const result = await recommendServicePackages(input);
        return { success: true, data: result };
    } catch (error) {
        console.error('Error in getServiceRecommendations:', error);
        return { success: false, error: "Falha ao obter recomendações. Verifique o console do servidor para mais detalhes." };
    }
}
  
/**
 * This function is now deprecated for client-side use.
 * The logic has been moved to the /activate page component
 * to ensure the user's auth context is passed to Firestore.
 */
export async function redeemActivationCode(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
    console.warn("redeemActivationCode is being called from a server action and is deprecated.");
    return {
        success: false,
        error: "This function has been moved to the client."
    }
}
