'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { getClients } from '@/lib/data'; // Still fetch all to aggregate services
import { Client, Vehicle, ServiceRecord } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearch } from '@/context/search-provider';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, Car, User, Calendar, Wallet, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type AggregatedService = ServiceRecord & {
  clientName: string;
  clientId: string;
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
};

const PAGE_SIZE = 15;

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
  const { user, loading: userLoading } = useUser()!;
  const router = useRouter();
  const [allServices, setAllServices] = useState<AggregatedService[]>([]);
  const [displayServices, setDisplayServices] = useState<AggregatedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { searchTerm } = useSearch();

  useEffect(() => {
    async function fetchAllServices() {
      if (!user) return;
      setLoading(true);
      try {
        const clientsData = await getClients(user.uid);
        const allAggregatedServices: AggregatedService[] = [];
        
        clientsData.forEach(client => {
          client.vehicles?.forEach(vehicle => {
            vehicle.serviceHistory?.forEach(service => {
              allAggregatedServices.push({
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
        allAggregatedServices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setAllServices(allAggregatedServices);
        setDisplayServices(allAggregatedServices.slice(0, PAGE_SIZE));
      } catch (error) {
        console.error("Failed to fetch services:", error);
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      fetchAllServices();
    }
  }, [user]);
  
  const filteredServices = useMemo(() => {
    if (!searchTerm) return displayServices;
    return allServices.filter(service =>
      service.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.vehicleMake.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, displayServices, allServices]);

  const loadMore = () => {
    setLoading(true);
    const nextPage = page + 1;
    const newServices = allServices.slice(0, nextPage * PAGE_SIZE);
    setDisplayServices(newServices);
    setPage(nextPage);
    setLoading(false);
  };

  const hasMore = displayServices.length < allServices.length;

  const renderSkeletons = () => (
    Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
            <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-[120px]" /></TableCell>
            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[150px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
        </TableRow>
    ))
  );

  return (
    <Card>
        <CardHeader>
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex-1">
                    <CardTitle className="font-headline">Serviços Prestados</CardTitle>
                    <CardDescription>Visualize todos os serviços realizados.</CardDescription>
                </div>
                <Button asChild className="w-full sm:w-auto shrink-0">
                    <Link href="/services/new"><PlusCircle className="mr-2 h-4 w-4"/>Adicionar Serviço</Link>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            {/* Mobile View */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                {filteredServices.length > 0 ? (
                    filteredServices.map(service => (
                        <div key={service.id} className="border rounded-lg p-4 space-y-3 bg-card/50 cursor-pointer" onClick={() => router.push(`/clients/${service.clientId}/vehicles/${service.vehicleId}/services/${service.id}/edit`)}>
                             <div className="flex items-center justify-between">
                                <span className="font-bold text-lg">{service.serviceType}</span>
                                <span className="font-semibold flex items-center gap-2"><Wallet className="h-4 w-4" /> R$ {service.cost.toFixed(2).replace('.', ',')}</span>
                             </div>
                             <div className="text-sm text-muted-foreground space-y-1 pt-2 border-t border-border/50">
                               <p className="flex items-center gap-2"><User className="h-4 w-4" /> <Link href={`/clients/${service.clientId}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{service.clientName}</Link></p>
                               <p className="flex items-center gap-2"><Car className="h-4 w-4" /> {service.vehicleMake} {service.vehicleModel}</p>
                               <p className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {new Date(service.date).toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    !loading && (
                        <div className="text-center text-muted-foreground py-10 px-4 border rounded-md">
                            <p>{searchTerm ? `Nenhum serviço encontrado para "${searchTerm}"` : "Nenhum serviço registrado."}</p>
                        </div>
                    )
                )}
                 {loading && displayServices.length === 0 && <div className="text-center p-4"> <Loader2 className="mx-auto animate-spin" /></div>}
                 {!loading && hasMore && !searchTerm && (
                    <Button onClick={loadMore} variant="outline" className="w-full mt-4">Carregar Mais</Button>
                )}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Serviço</TableHead>
                            <TableHead className="hidden sm:table-cell">Veículo</TableHead>
                            <TableHead className="hidden md:table-cell">Cliente</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead className="text-right">Custo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {(userLoading || (loading && displayServices.length === 0)) ? renderSkeletons() : (
                        filteredServices.length > 0 ? (
                            filteredServices.map(service => (
                            <TableRow key={service.id} onClick={() => router.push(`/clients/${service.clientId}/vehicles/${service.vehicleId}/services/${service.id}/edit`)} className="cursor-pointer">
                                <TableCell className="font-medium">{service.serviceType}</TableCell>
                                <TableCell className="hidden sm:table-cell">{service.vehicleMake} {service.vehicleModel}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                    <Button variant="link" asChild className="p-0 h-auto -ml-2" onClick={(e) => { e.stopPropagation(); router.push(`/clients/${service.clientId}`)}}>
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
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8 h-48">
                                    {searchTerm ? `Nenhum serviço encontrado para "${searchTerm}"` : "Nenhum serviço registrado."}
                                </TableCell>
                            </TableRow>
                        )
                    )}
                    </TableBody>
                </Table>
                {!loading && hasMore && !searchTerm && (
                    <div className="pt-4 text-center">
                        <Button onClick={loadMore} variant="outline">Carregar Mais</Button>
                    </div>
                )}
                {loading && displayServices.length > 0 && <div className="text-center p-4"> <Loader2 className="mx-auto animate-spin" /></div>}
            </div>
        </CardContent>
    </Card>
  );
}

    