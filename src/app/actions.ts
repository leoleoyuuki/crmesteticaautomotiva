'use server';

import { recommendServicePackages, RecommendServicePackagesInput } from '@/ai/flows/recommend-service-packages';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { ClientFormData, ServiceRecord, ServiceRecordFormData, Vehicle, VehicleFormData } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
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

export async function updateClient(userId: string, clientId: string, formData: ClientFormData) {
    if (!firestore) throw new Error("Firestore not initialized");
    if (!userId) throw new
Error("User not authenticated");

    const clientDocRef = doc(firestore, 'users', userId, 'clients', clientId);

    try {
        await updateDoc(clientDocRef, formData as any);
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

// Activation Code Actions
export async function generateActivationCode(adminId: string, durationMonths: number): Promise<{ success: boolean; code?: string; error?: string }> {
    if (adminId !== 'wtMBWT7OAoXHj9Hlb6alnfFqK3Q2') {
      return { success: false, error: 'Apenas administradores podem gerar códigos.' };
    }
    if (!firestore) {
      return { success: false, error: 'Firestore não inicializado.' };
    }
  
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const codesCollection = collection(firestore, 'activationCodes');
  
    try {
      await addDoc(codesCollection, {
        code,
        durationMonths,
        createdAt: serverTimestamp(),
        isUsed: false,
        usedBy: null,
        usedAt: null,
      });
      revalidatePath('/admin/codes');
      return { success: true, code };
    } catch (error) {
      console.error('Error generating code:', error);
      return { success: false, error: 'Falha ao gerar o código.' };
    }
}
  
export async function redeemActivationCode(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
    if (!firestore) {
        return { success: false, error: 'Firestore não inicializado.' };
    }

    const codesCollection = collection(firestore, 'activationCodes');
    const q = query(codesCollection, where('code', '==', code));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return { success: false, error: 'Código de ativação inválido.' };
    }

    const codeDoc = querySnapshot.docs[0];
    const codeData = codeDoc.data();

    if (codeData.isUsed) {
        return { success: false, error: 'Este código já foi utilizado.' };
    }

    const userDocRef = doc(firestore, 'users', userId);
    const now = new Date();
    const activatedUntil = addMonths(now, codeData.durationMonths);

    const batch = writeBatch(firestore);

    batch.update(codeDoc.ref, {
        isUsed: true,
        usedBy: userId,
        usedAt: serverTimestamp(),
    });

    batch.update(userDocRef, {
        isActivated: true,
        activatedUntil: activatedUntil.toISOString(),
    });

    try {
        await batch.commit();
        revalidatePath('/dashboard');
        redirect('/dashboard');
    } catch (error) {
        console.error('Error redeeming code:', error);
        return { success: false, error: 'Falha ao ativar a conta. Tente novamente.' };
    }
}
