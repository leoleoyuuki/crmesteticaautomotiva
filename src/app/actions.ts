'use server';

import { predictServiceExpiration, PredictServiceExpirationInput } from '@/ai/flows/predict-service-expiration';
import { recommendServicePackages, RecommendServicePackagesInput } from '@/ai/flows/recommend-service-packages';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { Client } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export async function addClient(userId: string, formData: Omit<Client, 'id' | 'createdAt' | 'vehicles' | 'avatarUrl' | 'avatarHint'>) {
    if (!firestore) {
        console.error("Firestore not initialized");
        return { success: false, error: "O Firestore não foi inicializado." };
    }
    if (!userId) {
        return { success: false, error: "Usuário não autenticado." };
    }

    const randomAvatar = PlaceHolderImages.filter(img => img.id.startsWith('avatar-'))[Math.floor(Math.random() * 4)];

    try {
        const clientsCollection = collection(firestore, 'users', userId, 'clients');
        const newClientData = {
            ...formData,
            createdAt: serverTimestamp(),
            avatarUrl: randomAvatar.imageUrl,
            avatarHint: randomAvatar.imageHint,
        };

        await addDoc(clientsCollection, newClientData).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: clientsCollection.path,
                operation: 'create',
                requestResourceData: newClientData
            });
            errorEmitter.emit('permission-error', permissionError);
        });

    } catch (error: any) {
        console.error('Error adding client:', error);
        return { success: false, error: error.message || 'Falha ao adicionar cliente.' };
    }
    
    revalidatePath('/clients');
    redirect('/clients');
}


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
