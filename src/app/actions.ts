'use server';

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


// Revalidation Actions
export async function revalidateClients() {
    revalidatePath('/clients');
    revalidatePath('/dashboard');
}

export async function revalidateClient(clientId: string) {
    revalidatePath(`/clients/${clientId}`);
    revalidatePath('/dashboard');
}
