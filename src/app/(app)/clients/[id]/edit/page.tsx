'use client';

import { useEffect, useState } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { getClientById } from '@/lib/data';
import { updateClient } from '@/app/actions';
import { Client, ClientFormData } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ClientForm } from '@/components/clients/client-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditClientPage() {
  const { user } = useUser()!;
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClient() {
      if (!user) return;
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
    await updateClient(user.uid, client.id, data);
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
            savingText="Atualizando..."
          />
        </CardContent>
      </Card>
  );
}
