'use client';

import { useRouter, notFound, useParams } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { VehicleForm } from '@/components/vehicles/vehicle-form';
import { VehicleFormData } from '@/lib/types';
import { useEffect, useState, useTransition } from 'react';
import { getClientById } from '@/lib/data';
import { addDoc, collection } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { useToast } from '@/hooks/use-toast';

export default function NewVehiclePage() {
  const { user } = useUser()!;
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchClientName() {
        if(!user) return;
        setLoading(true);
        const client = await getClientById(user.uid, clientId);
        if(client) {
            setClientName(client.name);
        } else {
            notFound();
        }
        setLoading(false);
    }

    if(user) {
        fetchClientName();
    }

  }, [user, clientId, router]);


  const handleAddVehicle = async (data: VehicleFormData) => {
    if (!user) return;

    const vehiclesCollection = collection(firestore, 'users', user.uid, 'clients', clientId, 'vehicles');
    
    startTransition(async () => {
        try {
            await addDoc(vehiclesCollection, data);
            toast({
                title: "Veículo adicionado!",
                description: "O novo veículo foi salvo com sucesso."
            });
            router.push(`/clients/${clientId}`);
            router.refresh();
        } catch (error) {
            console.error("Failed to add vehicle:", error);
            toast({
                variant: "destructive",
                title: "Erro ao salvar",
                description: "Não foi possível adicionar o veículo."
            });
        }
    });
  };
  
  if(loading) {
      return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Adicionar Novo Veículo</CardTitle>
          <CardDescription>Cadastre um novo veículo para {clientName}.</CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleForm 
            onSave={handleAddVehicle}
            isPending={isPending}
            savingText="Adicionando..."
            cancelHref={`/clients/${clientId}`}
          />
        </CardContent>
      </Card>
  );
}
