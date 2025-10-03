'use client';

import { useEffect, useState } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { getServiceRecordById } from '@/lib/data';
import { updateServiceRecord } from '@/app/actions';
import { ServiceRecord, ServiceRecordFormData } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ServiceForm } from '@/components/services/service-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditServicePage() {
  const { user } = useUser()!;
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const vehicleId = params.vehicleId as string;
  const serviceId = params.serviceId as string;

  const [service, setService] = useState<ServiceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchService() {
      if (!user) return;
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

  const handleUpdateService = async (data: ServiceRecordFormData) => {
    if (!user || !service) return;
    await updateServiceRecord(user.uid, clientId, vehicleId, service.id, data);
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
            savingText="Atualizando..."
            cancelHref={`/clients/${clientId}`}
          />
        </CardContent>
      </Card>
  );
}
