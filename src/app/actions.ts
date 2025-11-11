'use server';

import { recommendServicePackages, RecommendServicePackagesInput } from '@/ai/flows/recommend-service-packages';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * All Firestore write/update/delete actions have been moved directly into the 
 * client components that use them. This is to ensure that the Firebase SDK has 
 * access to the user's authentication context, which is not reliably passed 
 * in Server Actions, causing "Missing or insufficient permissions" errors.
 * 
 * The functions below are now either removed or exist only for read-only 
 * operations or non-Firestore logic.
 */


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

// Revalidation Actions
export async function revalidateClients() {
    revalidatePath('/clients');
    revalidatePath('/dashboard');
}

export async function revalidateClient(clientId: string) {
    revalidatePath(`/clients/${clientId}`);
    revalidatePath('/dashboard');
}

