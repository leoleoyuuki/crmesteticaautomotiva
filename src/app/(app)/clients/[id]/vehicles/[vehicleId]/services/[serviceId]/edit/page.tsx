'use client';

import { useEffect, useState, useTransition } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { getServiceRecordById } from '@/lib/data';
import { ServiceRecord, ServiceRecordFormData } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ServiceForm } from '@/components/services/service-form';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { useToast } from '@/hooks/use-toast';
import { addMonths } from 'date-fns';

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

export default function EditServicePage() {
  const { user } = useUser()!;
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const vehicleId = params.vehicleId as string;
  const serviceId = params.serviceId as string;

  const [service, setService] = useState<ServiceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchService() {
      if (!user) return;
      setLoading(true);
      const serviceData = await getServiceRecordById(user.uid, clientId, vehicleId, serviceId);
      if (!serviceData) {
        notFound();
      } else {
        setService(serviceData as ServiceRecord);
      }
      setLoading(false);
    }

    if (user) {
      fetchService();
    }
  }, [user, clientId, vehicleId, serviceId, router]);

  const handleUpdateService = async (data: ServiceRecordFormData, imageDataUrl: string | null) => {
    if (!user || !service) return;

    startTransition(async () => {
      try {
        let finalImageUrl = service.imageUrl || '';
        
        // Only upload if the image data is a new base64 string
        if (imageDataUrl && imageDataUrl.startsWith('data:image')) {
          finalImageUrl = await uploadImage(imageDataUrl);
        } else if (imageDataUrl === null) {
          // Image was removed
          finalImageUrl = '';
        }

        const serviceDocRef = doc(firestore, 'users', user.uid, 'clients', clientId, 'vehicles', vehicleId, 'serviceHistory', serviceId);
        
        const startDate = new Date(data.date);
        const expirationDate = addMonths(startDate, data.durationMonths);

        const updatedServiceData = {
            ...data,
            date: startDate.toISOString(),
            expirationDate: expirationDate.toISOString(),
            imageUrl: finalImageUrl,
        };
        
        await updateDoc(serviceDocRef, updatedServiceData as any);
        toast({
          title: "Serviço atualizado!",
          description: "O registro de serviço foi salvo."
        });
        router.push(`/clients/${clientId}`);
        router.refresh();
      } catch (error) {
        console.error("Failed to update service record:", error);
        toast({
          variant: "destructive",
          title: "Erro ao atualizar",
          description: "Não foi possível atualizar o serviço."
        });
      }
    });
  };

  if (loading || !service) {
    return (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-8">
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-20 w-full" />
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
          <CardTitle className="font-headline">Editar Serviço</CardTitle>
          <CardDescription>Atualize os detalhes do serviço de {service.serviceType}.</CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceForm 
            service={service}
            onSave={handleUpdateService}
            isPending={isPending}
            savingText="Atualizando..."
            cancelHref={`/clients/${clientId}`}
          />
        </CardContent>
      </Card>
  );
}
