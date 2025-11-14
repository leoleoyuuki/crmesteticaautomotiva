'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { getClients } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearch } from '@/context/search-provider';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { History, MessageCircle, Lightbulb } from 'lucide-react';
import { addMonths, formatDistanceToNow, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type RenewalService = {
  clientId: string;
  clientName: string;
  clientPhone: string;
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
  serviceId: string;
  serviceType: string;
  expirationDate: string;
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
    return new Date(0); // Return a very old date for invalid inputs
};

export default function RenewalsPage() {
  const { user } = useUser()!;
  const [renewals, setRenewals] = useState<RenewalService[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchTerm } = useSearch();

  useEffect(() => {
    async function fetchRenewals() {
      if (!user) return;
      try {
        const clientsData = await getClients(user.uid);
        const allRenewals: RenewalService[] = [];
        
        const now = new Date();
        const twoMonthsFromNow = addMonths(now, 2);

        clientsData.forEach(client => {
          client.vehicles?.forEach(vehicle => {
            vehicle.serviceHistory?.forEach(service => {
              const expirationDate = toDate(service.expirationDate);
              
              // Include services that have not expired yet but will expire in the next 2 months
              if (isAfter(expirationDate, now) && isBefore(expirationDate, twoMonthsFromNow)) {
                allRenewals.push({
                  clientId: client.id,
                  clientName: client.name,
                  clientPhone: client.phone,
                  vehicleId: vehicle.id,
                  vehicleMake: vehicle.make,
                  vehicleModel: vehicle.model,
                  serviceId: service.id,
                  serviceType: service.serviceType,
                  expirationDate: expirationDate.toISOString(),
                });
              }
            });
          });
        });

        // Sort by expiration date, closest first
        allRenewals.sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
        
        setRenewals(allRenewals);
      } catch (error) {
        console.error("Failed to fetch renewals:", error);
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      fetchRenewals();
    }
  }, [user]);
  
  const getWhatsAppLink = (exp: RenewalService) => {
    const phone = `55${exp.clientPhone.replace(/\D/g, '')}`;
    const message = `Olá ${exp.clientName}, tudo bem? Notei que o serviço de ${exp.serviceType} para seu ${exp.vehicleMake} ${exp.vehicleModel} está prestes a vencer. Que tal agendar a renovação e manter seu carro sempre impecável?`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  const filteredRenewals = useMemo(() => {
    if (!searchTerm) return renewals;
    const lowercasedFilter = searchTerm.toLowerCase();
    return renewals.filter(service =>
      service.serviceType.toLowerCase().includes(lowercasedFilter) ||
      service.clientName.toLowerCase().includes(lowercasedFilter) ||
      service.vehicleMake.toLowerCase().includes(lowercasedFilter) ||
      service.vehicleModel.toLowerCase().includes(lowercasedFilter)
    );
  }, [renewals, searchTerm]);

  if (loading || !user) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><History /> Renovações</CardTitle>
                <CardDescription>
                  Serviços que precisam de atenção para renovação nos próximos 2 meses.
                </CardDescription>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lightbulb className="h-4 w-4 text-yellow-400" />
                    <strong>Dica:</strong> Envie uma foto de como o carro ficou na última vez para incentivar o cliente!
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Veículo</TableHead>
                            <TableHead>Serviço</TableHead>
                            <TableHead>Vence em</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-9 w-[150px] ml-auto" /></TableCell>
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
            <CardTitle className="font-headline flex items-center gap-2"><History /> Renovações</CardTitle>
            <CardDescription>
                Serviços que precisam de atenção para renovação nos próximos 2 meses.
            </CardDescription>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Lightbulb className="h-4 w-4 text-yellow-400" />
              <strong>Dica:</strong> Envie uma foto de como o carro ficou na última vez para incentivar o cliente!
            </div>
        </CardHeader>
        <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Vence em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
            {filteredRenewals.length > 0 ? (
                filteredRenewals.map(renewal => (
                <TableRow key={renewal.serviceId}>
                    <TableCell>
                      <Button variant="link" asChild className="p-0 h-auto font-medium">
                          <Link href={`/clients/${renewal.clientId}`}>
                              {renewal.clientName}
                          </Link>
                      </Button>
                    </TableCell>
                    <TableCell>{renewal.vehicleMake} {renewal.vehicleModel}</TableCell>
                    <TableCell className="font-medium">{renewal.serviceType}</TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-medium text-amber-400">
                                {formatDistanceToNow(new Date(renewal.expirationDate), { locale: ptBR, addSuffix: true })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {new Date(renewal.expirationDate).toLocaleDateString('pt-BR')}
                            </span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button asChild variant="outline" size="sm" className="bg-green-100 border-green-300 text-green-800 hover:bg-green-200 hover:text-green-900">
                            <a href={getWhatsAppLink(renewal)} target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="mr-2 h-4 w-4" />
                                WhatsApp
                            </a>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/clients/${renewal.clientId}/vehicles/${renewal.vehicleId}/services/new`}>Renovar</Link>
                        </Button>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        {searchTerm ? `Nenhuma renovação encontrada para "${searchTerm}"` : "Nenhum serviço para renovar nos próximos 2 meses."}
                    </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
        </CardContent>
    </Card>
  );
}
