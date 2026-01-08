'use client';

import { useEffect, useState, useTransition } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { getClientById } from '@/lib/data';
import { Client, ClientFormData } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ClientForm } from '@/components/clients/client-form';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { useToast } from '@/hooks/use-toast';

export default function EditClientPage() {
  const { user } = useUser()!;
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchClient() {
      if (!user) return;
      setLoading(true);
      const clientData = await getClientById(user.uid, clientId);
      if (!clientData) {
        notFound();
      } else {
        setClient(clientData as Client);
      }
      setLoading(false);
    }

    if (user) {
      fetchClient();
    }
  }, [user, clientId, router]);

  const handleUpdateClient = async (data: ClientFormData) => {
    if (!user || !client) return;
    
    startTransition(async () => {
      try {
        const clientDocRef = doc(firestore, 'users', user.uid, 'clients', clientId);
        await updateDoc(clientDocRef, data as any);
        toast({
          title: 'Cliente atualizado!',
          description: `${data.name} foi atualizado com sucesso.`,
        });
        router.push(`/clients/${clientId}`);
        router.refresh();
      } catch (error) {
        console.error("Failed to update client:", error);
        toast({
          variant: "destructive",
          title: 'Erro ao atualizar',
          description: 'Não foi possível atualizar o cliente.',
        });
      }
    });
  };

  if (loading || !client) {
    return (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex justify-end gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
    );
  }

  return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Editar Cliente</CardTitle>
          <CardDescription>Atualize os detalhes de {client.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm 
            client={client}
            onSave={handleUpdateClient}
            isPending={isPending}
            savingText="Atualizando..."
          />
        </CardContent>
      </Card>
  );
}
