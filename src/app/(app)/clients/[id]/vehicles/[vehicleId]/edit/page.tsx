'use client';

import { useEffect, useState } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { getVehicleById } from '@/lib/data';
import { updateVehicle } from '@/app/actions';
import { Vehicle, VehicleFormData } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { VehicleForm } from '@/components/vehicles/vehicle-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditVehiclePage() {
  const { user } = useUser()!;
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const vehicleId = params.vehicleId as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVehicle() {
      if (!user) return;
      const vehicleData = await getVehicleById(user.uid, clientId, vehicleId);
      if (!vehicleData) {
        notFound();
      } else {
        setVehicle(vehicleData as Vehicle);
      }
      setLoading(false);
    }

    if (user) {
      fetchVehicle();
    }
  }, [user, clientId, vehicleId, router]);

  const handleUpdateVehicle = async (data: VehicleFormData) => {
    if (!user || !vehicle) return;
    await updateVehicle(user.uid, clientId, vehicle.id, data);
  };

  if (loading || !vehicle) {
    return (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-8">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
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
          <CardTitle className="font-headline">Editar Veículo</CardTitle>
          <CardDescription>Atualize os detalhes do veículo {vehicle.make} {vehicle.model}.</CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleForm 
            vehicle={vehicle}
            onSave={handleUpdateVehicle}
            savingText="Atualizando..."
            cancelHref={`/clients/${clientId}`}
          />
        </CardContent>
      </Card>
  );
}
