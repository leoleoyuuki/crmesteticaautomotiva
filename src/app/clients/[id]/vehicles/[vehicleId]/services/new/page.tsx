'use client';

import { useRouter, notFound, useParams } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ServiceForm } from '@/components/services/service-form';
import { addServiceRecord } from '@/app/actions';
import { ServiceRecordFormData } from '@/lib/types';
import { useEffect, useState } from 'react';
import { getClientById, getVehicleById } from '@/lib/data';

export default function NewServicePage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const vehicleId = params.vehicleId as string;

  const [clientName, setClientName] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
      return;
    }
    
    async function fetchData() {
        if(!user) return;
        const client = await getClientById(user.uid, clientId);
        const vehicle = await getVehicleById(user.uid, clientId, vehicleId);
        
        if(client && vehicle) {
            setClientName(client.name);
            setVehicleName(`${vehicle.make} ${vehicle.model}`);
        } else {
            notFound();
        }
        setLoading(false);
    }

    if(user) {
        fetchData();
    }

  }, [user, userLoading, clientId, vehicleId, router]);


  const handleAddService = async (data: ServiceRecordFormData) => {
    if (!user) return;
    await addServiceRecord(user.uid, clientId, vehicleId, data);
  };
  
  if(userLoading || loading) {
      return <AppLayout><div className="flex h-screen items-center justify-center">Carregando...</div></AppLayout>
  }

  return (
    <AppLayout>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Adicionar Novo Serviço</CardTitle>
          <CardDescription>
            Registrar um novo serviço para o veículo {vehicleName} do cliente {clientName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceForm 
            onSave={handleAddService}
            savingText="Adicionando..."
            cancelHref={`/clients/${clientId}`}
          />
        </CardContent>
      </Card>
    </AppLayout>
  );
}
