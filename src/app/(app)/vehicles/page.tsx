'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { getClients } from '@/lib/data'; // We still need to fetch all clients to get all vehicles
import { Client, Vehicle } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearch } from '@/context/search-provider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, User, Calendar, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type AggregatedVehicle = Vehicle & {
  clientName: string;
  clientId: string;
};

const PAGE_SIZE = 15;

export default function VehiclesPage() {
  const { user, loading: userLoading } = useUser()!;
  const router = useRouter();
  const [allVehicles, setAllVehicles] = useState<AggregatedVehicle[]>([]);
  const [displayVehicles, setDisplayVehicles] = useState<AggregatedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { searchTerm } = useSearch();

  useEffect(() => {
    async function fetchAllVehicles() {
      if (!user) return;
      setLoading(true);
      try {
        const clientsData = await getClients(user.uid);
        const allAggregatedVehicles: AggregatedVehicle[] = [];
        
        clientsData.forEach(client => {
          client.vehicles?.forEach(vehicle => {
            allAggregatedVehicles.push({
              ...vehicle,
              clientName: client.name,
              clientId: client.id,
            });
          });
        });
        
        setAllVehicles(allAggregatedVehicles);
        setDisplayVehicles(allAggregatedVehicles.slice(0, PAGE_SIZE));

      } catch (error) {
        console.error("Failed to fetch vehicles:", error);
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      fetchAllVehicles();
    }
  }, [user]);

  const filteredVehicles = useMemo(() => {
    if (!searchTerm) return displayVehicles;
    return allVehicles.filter(vehicle =>
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, displayVehicles, allVehicles]);

  const loadMore = () => {
    setLoading(true);
    const nextPage = page + 1;
    const newVehicles = allVehicles.slice(0, nextPage * PAGE_SIZE);
    setDisplayVehicles(newVehicles);
    setPage(nextPage);
    setLoading(false);
  };
  
  const hasMore = displayVehicles.length < allVehicles.length;

  const renderSkeletons = () => (
    Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
            <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[80px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
        </TableRow>
    ))
  );

  return (
    <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex-1">
                    <CardTitle className="font-headline">Veículos</CardTitle>
                    <CardDescription>Visualize todos os veículos de seus clientes.</CardDescription>
                </div>
                 <Button asChild className="w-full sm:w-auto shrink-0">
                    <Link href="/vehicles/new"><PlusCircle className="mr-2 h-4 w-4"/>Adicionar Veículo</Link>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
        {/* Mobile View */}
        <div className="md:hidden grid grid-cols-1 gap-4">
             {filteredVehicles.length > 0 ? (
                filteredVehicles.map(vehicle => (
                    <div key={vehicle.id} className="border rounded-lg p-4 space-y-3 bg-card/50 cursor-pointer" onClick={() => router.push(`/clients/${vehicle.clientId}`)}>
                        <div className="font-bold text-lg">{vehicle.make} {vehicle.model}</div>
                         <div className="text-sm text-muted-foreground space-y-1 pt-2 border-t border-border/50">
                            <p className="flex items-center gap-2"><User className="h-4 w-4" /> <Link href={`/clients/${vehicle.clientId}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{vehicle.clientName}</Link></p>
                            <p className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {vehicle.year}</p>
                        </div>
                        <div className="text-center font-mono text-sm tracking-widest pt-2 mt-2 border-t border-border/50 bg-muted/50 rounded-md p-2">
                            {vehicle.licensePlate}
                        </div>
                    </div>
                ))
            ) : (
                 !loading && (
                    <div className="text-center text-muted-foreground py-10 px-4 border rounded-md">
                        <p>{searchTerm ? `Nenhum veículo encontrado para "${searchTerm}"` : "Nenhum veículo cadastrado."}</p>
                    </div>
                )
            )}
             {loading && displayVehicles.length === 0 && <div className="text-center p-4"> <Loader2 className="mx-auto animate-spin" /></div>}
             {!loading && hasMore && !searchTerm && (
                <Button onClick={loadMore} variant="outline" className="w-full mt-4">Carregar Mais</Button>
            )}
        </div>
        
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead className="hidden sm:table-cell">Placa</TableHead>
                      <TableHead className="hidden md:table-cell">Ano</TableHead>
                      <TableHead>Proprietário</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
              {(userLoading || (loading && displayVehicles.length === 0)) ? renderSkeletons() : (
                  filteredVehicles.length > 0 ? (
                      filteredVehicles.map(vehicle => (
                      <TableRow key={vehicle.id} onClick={() => router.push(`/clients/${vehicle.clientId}`)} className="cursor-pointer">
                          <TableCell className="font-medium">{vehicle.make} {vehicle.model}</TableCell>
                          <TableCell className="hidden sm:table-cell font-mono">{vehicle.licensePlate}</TableCell>
                          <TableCell className="hidden md:table-cell">{vehicle.year}</TableCell>
                          <TableCell>
                              <Button variant="link" asChild className="p-0 h-auto -ml-2">
                                  <Link href={`/clients/${vehicle.clientId}`}>
                                      {vehicle.clientName}
                                  </Link>
                              </Button>
                          </TableCell>
                      </TableRow>
                      ))
                  ) : (
                      <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8 h-48">
                              {searchTerm ? `Nenhum veículo encontrado para "${searchTerm}"` : "Nenhum veículo cadastrado."}
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
            {loading && displayVehicles.length > 0 && <div className="text-center p-4"> <Loader2 className="mx-auto animate-spin" /></div>}
        </div>
        </CardContent>
    </Card>
  );
}

    