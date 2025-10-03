'use client';

import { useRouter, notFound, useParams } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { VehicleForm } from '@/components/vehicles/vehicle-form';
import { addVehicle } from '@/app/actions';
import { VehicleFormData } from '@/lib/types';
import { useEffect, useState } from 'react';
import { getClientById } from '@/lib/data';

export default function NewVehiclePage() {
  const { user } = useUser()!;
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClientName() {
        if(!user) return;
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
    await addVehicle(user.uid, clientId, data);
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
            savingText="Adicionando..."
            cancelHref={`/clients/${clientId}`}
          />
        </CardContent>
      </Card>
  );
}
