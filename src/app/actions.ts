'use server';

import { predictServiceExpiration, PredictServiceExpirationInput } from '@/ai/flows/predict-service-expiration';
import { recommendServicePackages, RecommendServicePackagesInput } from '@/ai/flows/recommend-service-packages';
import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { Client, ServiceRecord, Vehicle } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Client Actions
export async function addClient(userId: string, formData: Omit<Client, 'id' | 'createdAt' | 'vehicles' | 'avatarUrl' | 'avatarHint'>) {
    if (!firestore) throw new Error("Firestore not initialized");
    if (!userId) throw new Error("User not authenticated");

    const randomAvatar = PlaceHolderImages.filter(img => img.id.startsWith('avatar-'))[Math.floor(Math.random() * 4)];
    const clientsCollection = collection(firestore, 'users', userId, 'clients');
    
    const newClientData = {
        ...formData,
        createdAt: serverTimestamp(),
        avatarUrl: randomAvatar.imageUrl,
        avatarHint: randomAvatar.imageHint,
    };

    try {
        await addDoc(clientsCollection, newClientData);
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: clientsCollection.path,
            operation: 'create',
            requestResourceData: newClientData
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    }
    
    revalidatePath('/clients');
    redirect('/clients');
}

export async function updateClient(userId: string, clientId: string, formData: Omit<Client, 'id' | 'createdAt' | 'vehicles' | 'avatarUrl' | 'avatarHint'>) {
    if (!firestore) throw new Error("Firestore not initialized");
    if (!userId) throw new Error("User not authenticated");

    const clientDocRef = doc(firestore, 'users', userId, 'clients', clientId);

    try {
        await updateDoc(clientDocRef, formData);
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: clientDocRef.path,
            operation: 'update',
            requestResourceData: formData
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    }

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

    try {
        await batch.commit();
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: clientDocRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    }

    revalidatePath('/clients');
    redirect('/clients');
}

// Vehicle Actions
export async function addVehicle(userId: string, clientId: string, formData: Omit<Vehicle, 'id' | 'imageUrl' | 'imageHint' | 'serviceHistory'>) {
    if (!firestore) throw new Error("Firestore not initialized");
    if (!userId) throw new Error("User not authenticated");

    const randomVehicleImage = PlaceHolderImages.filter(img => img.id.startsWith('vehicle-'))[Math.floor(Math.random() * 4)];
    const vehiclesCollection = collection(firestore, 'users', userId, 'clients', clientId, 'vehicles');

    const newVehicleData = {
        ...formData,
        imageUrl: randomVehicleImage.imageUrl,
        imageHint: randomVehicleImage.imageHint,
    };

    await addDoc(vehiclesCollection, newVehicleData);

    revalidatePath(`/clients/${clientId}`);
    redirect(`/clients/${clientId}`);
}

export async function updateVehicle(userId: string, clientId: string, vehicleId: string, formData: Omit<Vehicle, 'id' | 'imageUrl' | 'imageHint' | 'serviceHistory'>) {
    if (!firestore) throw new Error("Firestore not initialized");
    if (!userId) throw new Error("User not authenticated");

    const vehicleDocRef = doc(firestore, 'users', userId, 'clients', clientId, 'vehicles', vehicleId);
    await updateDoc(vehicleDocRef, formData);

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
export async function addServiceRecord(userId: string, clientId: string, vehicleId: string, formData: Omit<ServiceRecord, 'id'>) {
    if (!firestore) throw new Error("Firestore not initialized");
    if (!userId) throw new Error("User not authenticated");

    const serviceHistoryCollection = collection(firestore, 'users', userId, 'clients', clientId, 'vehicles', vehicleId, 'serviceHistory');
    
    const newServiceData = {
        ...formData,
        date: new Date(formData.date).toISOString() // Ensure date is in ISO format
    };
    
    await addDoc(serviceHistoryCollection, newServiceData);

    revalidatePath(`/clients/${clientId}`);
    redirect(`/clients/${clientId}`);
}

export async function updateServiceRecord(userId: string, clientId: string, vehicleId: string, serviceId: string, formData: Omit<ServiceRecord, 'id'>) {
    if (!firestore) throw new Error("Firestore not initialized");
    if (!userId) throw new Error("User not authenticated");

    const serviceDocRef = doc(firestore, 'users', userId, 'clients', clientId, 'vehicles', vehicleId, 'serviceHistory', serviceId);
    
    const updatedServiceData = {
        ...formData,
        date: new Date(formData.date).toISOString()
    };
    
    await updateDoc(serviceDocRef, updatedServiceData);

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

export async function getExpirationPrediction(input: PredictServiceExpirationInput) {
    try {
        const result = await predictServiceExpiration(input);
        return { success: true, data: result };
    } catch (error) {
        console.error('Error in getExpirationPrediction:', error);
        return { success: false, error: "Falha ao prever a data de vencimento. Verifique o console do servidor para mais detalhes." };
    }
}
