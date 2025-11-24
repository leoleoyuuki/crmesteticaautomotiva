'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { getClients } from '@/lib/data';
import { Client, Vehicle } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearch } from '@/context/search-provider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, User, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

type AggregatedVehicle = Vehicle & {
  clientName: string;
  clientId: string;
};

export default function VehiclesPage() {
  const { user } = useUser()!;
  const router = useRouter();
  const [vehicles, setVehicles] = useState<AggregatedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchTerm } = useSearch();

  useEffect(() => {
    async function fetchVehicles() {
      if (!user) return;
      try {
        const clientsData = await getClients(user.uid);
        const allVehicles: AggregatedVehicle[] = [];
        
        clientsData.forEach(client => {
          client.vehicles?.forEach(vehicle => {
            allVehicles.push({
              ...vehicle,
              clientName: client.name,
              clientId: client.id,
            });
          });
        });
        
        setVehicles(allVehicles);
      } catch (error) {
        console.error("Failed to fetch vehicles:", error);
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      fetchVehicles();
    }
  }, [user]);

  const filteredVehicles = useMemo(() => {
    if (!searchTerm) return vehicles;
    const lowercasedFilter = searchTerm.toLowerCase();
    return vehicles.filter(vehicle =>
      vehicle.make.toLowerCase().includes(lowercasedFilter) ||
      vehicle.model.toLowerCase().includes(lowercasedFilter) ||
      vehicle.licensePlate.toLowerCase().includes(lowercasedFilter) ||
      vehicle.clientName.toLowerCase().includes(lowercasedFilter)
    );
  }, [vehicles, searchTerm]);

  if (loading || !user) {
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
                        {Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[80px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
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
                <div className="text-center text-muted-foreground py-10 px-4 border rounded-md">
                    <p>{searchTerm ? `Nenhum veículo encontrado para "${searchTerm}"` : "Nenhum veículo cadastrado."}</p>
                </div>
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
              {filteredVehicles.length > 0 ? (
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
              )}
              </TableBody>
          </Table>
        </div>
        </CardContent>
    </Card>
  );
}
