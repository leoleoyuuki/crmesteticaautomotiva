'use client';

import { useRouter, notFound, useParams } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ServiceForm } from '@/components/services/service-form';
import { ServiceRecordFormData } from '@/lib/types';
import { useEffect, useState, useTransition } from 'react';
import { getClientById, getVehicleById } from '@/lib/data';
import { addDoc, collection } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { useToast } from '@/hooks/use-toast';
import { addDays } from 'date-fns';

async function uploadImage(imageDataUrl: string): Promise<string> {
    const blob = await fetch(imageDataUrl).then(res => res.blob());
    const file = new File([blob], `service-${Date.now()}.jpg`, { type: 'image/jpeg' });

    const response = await fetch(`/api/upload?filename=${file.name}`, {
        method: 'POST',
        body: file,
    });

    if (!response.ok) {
        throw new Error('Falha no upload da imagem.');
    }

    const newBlob = await response.json();
    return newBlob.url;
}

export default function NewServicePage() {
  const { user } = useUser()!;
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const vehicleId = params.vehicleId as string;

  const [clientName, setClientName] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
        if(!user) return;
        setLoading(true);
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

  }, [user, clientId, vehicleId, router]);


  const handleAddService = async (data: ServiceRecordFormData, imageDataUrl: string | null) => {
    if (!user) return;
    
    startTransition(async () => {
      try {
        let finalImageUrl = '';
        if (imageDataUrl && imageDataUrl.startsWith('data:image')) {
          finalImageUrl = await uploadImage(imageDataUrl);
        }
        
        const serviceHistoryCollection = collection(firestore, 'users', user.uid, 'clients', clientId, 'vehicles', vehicleId, 'serviceHistory');

        const startDate = new Date(data.date);
        const expirationDate = addDays(startDate, data.durationDays);

        const newServiceData = {
            ...data,
            date: startDate.toISOString(),
            expirationDate: expirationDate.toISOString(),
            imageUrl: finalImageUrl,
        };
    
        await addDoc(serviceHistoryCollection, newServiceData);
        toast({
          title: "Serviço adicionado!",
          description: "Um novo serviço foi registrado com sucesso."
        });
        router.push(`/clients/${clientId}`);
        router.refresh();
      } catch (error) {
        console.error("Failed to add service record:", error);
        toast({
          variant: "destructive",
          title: "Erro ao adicionar",
          description: "Não foi possível adicionar o novo serviço."
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
          <CardTitle className="font-headline">Adicionar Novo Serviço</CardTitle>
          <CardDescription>
            Registrar um novo serviço para o veículo {vehicleName} do cliente {clientName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceForm 
            onSave={handleAddService}
            isPending={isPending}
            savingText="Adicionando..."
            cancelHref={`/clients/${clientId}`}
          />
        </CardContent>
      </Card>
  );
}
