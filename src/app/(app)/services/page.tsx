'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { getClients } from '@/lib/data';
import { Client, Vehicle, ServiceRecord } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearch } from '@/context/search-provider';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

type AggregatedService = ServiceRecord & {
  clientName: string;
  clientId: string;
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
};

// Helper to safely convert Firestore timestamp or string to a Date object
const toDate = (timestamp: any): Date => {
    if (timestamp && typeof timestamp.seconds === 'number') {
      return new Date(timestamp.seconds * 1000);
    }
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return new Date(); // Fallback to now if conversion fails
};

export default function ServicesPage() {
  const { user } = useUser()!;
  const router = useRouter();
  const [services, setServices] = useState<AggregatedService[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchTerm } = useSearch();

  useEffect(() => {
    async function fetchServices() {
      if (!user) return;
      try {
        const clientsData = await getClients(user.uid);
        const allServices: AggregatedService[] = [];
        
        clientsData.forEach(client => {
          client.vehicles?.forEach(vehicle => {
            vehicle.serviceHistory?.forEach(service => {
              allServices.push({
                ...service,
                clientName: client.name,
                clientId: client.id,
                vehicleId: vehicle.id,
                vehicleMake: vehicle.make,
                vehicleModel: vehicle.model,
                date: toDate(service.date).toISOString()
              });
            });
          });
        });

        // Sort services by date, most recent first
        allServices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setServices(allServices);
      } catch (error) {
        console.error("Failed to fetch services:", error);
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      fetchServices();
    }
  }, [user]);

  const filteredServices = useMemo(() => {
    if (!searchTerm) return services;
    const lowercasedFilter = searchTerm.toLowerCase();
    return services.filter(service =>
      service.serviceType.toLowerCase().includes(lowercasedFilter) ||
      service.clientName.toLowerCase().includes(lowercasedFilter) ||
      service.vehicleMake.toLowerCase().includes(lowercasedFilter) ||
      service.vehicleModel.toLowerCase().includes(lowercasedFilter)
    );
  }, [services, searchTerm]);

  if (loading || !user) {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="font-headline">Serviços Prestados</CardTitle>
                        <CardDescription>Visualize todos os serviços realizados em todos os veículos.</CardDescription>
                    </div>
                    <Button asChild>
                        <Link href="/services/new"><PlusCircle className="mr-2 h-4 w-4"/>Adicionar Novo Serviço</Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Serviço</TableHead>
                            <TableHead>Veículo</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead className="text-right">Custo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
        <CardHeader>
             <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="font-headline">Serviços Prestados</CardTitle>
                    <CardDescription>Visualize todos os serviços realizados em todos os veículos.</CardDescription>
                </div>
                <Button asChild>
                    <Link href="/services/new"><PlusCircle className="mr-2 h-4 w-4"/>Adicionar Novo Serviço</Link>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
            {filteredServices.length > 0 ? (
                filteredServices.map(service => (
                <TableRow key={service.id} onClick={() => router.push(`/clients/${service.clientId}/vehicles/${service.vehicleId}/services/${service.id}/edit`)} className="cursor-pointer">
                    <TableCell className="font-medium">{service.serviceType}</TableCell>
                    <TableCell>{service.vehicleMake} {service.vehicleModel}</TableCell>
                    <TableCell>
                        <Button variant="link" asChild className="p-0 h-auto" onClick={(e) => { e.stopPropagation(); router.push(`/clients/${service.clientId}`)}}>
                           <Link href={`/clients/${service.clientId}`}>
                                {service.clientName}
                            </Link>
                        </Button>
                    </TableCell>
                    <TableCell>{new Date(service.date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right">R$ {service.cost.toFixed(2).replace('.', ',')}</TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        {searchTerm ? `Nenhum serviço encontrado para "${searchTerm}"` : "Nenhum serviço registrado."}
                    </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
        </CardContent>
    </Card>
  );
}
