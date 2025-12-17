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
import { History, MessageCircle, Lightbulb, Car, User, Camera, Download } from 'lucide-react';
import { addDays, formatDistanceToNow, isAfter, isBefore, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import Image from "next/image";
import { RenewServiceButton } from '@/components/services/renew-service-button';
import { Badge } from '@/components/ui/badge';


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
  imageUrl?: string;
  serviceDate: string;
  notes?: string;
  cost: number;
  durationDays: number;
  isRenewed?: boolean;
};

// Helper to safelyy convert Firestore timestamp or string to a Date object
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
        const twoMonthsFromNow = addDays(now, 60);

        clientsData.forEach(client => {
          client.vehicles?.forEach(vehicle => {
            vehicle.serviceHistory?.forEach(service => {
              const expirationDate = toDate(service.expirationDate);
              
              // Include services that are already expired or will expire in the next 2 months
              if (isBefore(expirationDate, twoMonthsFromNow)) {
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
                  imageUrl: service.imageUrl,
                  serviceDate: service.date,
                  notes: service.notes,
                  cost: service.cost,
                  durationDays: service.durationDays,
                  isRenewed: service.isRenewed,
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
    const expirationDate = new Date(exp.expirationDate);
    const hasExpired = isPast(expirationDate);
    let message;

    if (hasExpired) {
        const timeAgo = formatDistanceToNow(expirationDate, { locale: ptBR });
        message = `Olá ${exp.clientName}, tudo bem? Notei que o serviço de ${exp.serviceType} para seu ${exp.vehicleMake} ${exp.vehicleModel} venceu há ${timeAgo}. Que tal agendarmos a renovação para manter seu carro impecável?`;
    } else {
        message = `Olá ${exp.clientName}, tudo bem? Notei que o serviço de ${exp.serviceType} para seu ${exp.vehicleMake} ${exp.vehicleModel} está prestes a vencer. Que tal agendar a renovação e manter seu carro sempre impecável?`;
    }
    
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
                  Serviços vencidos ou que precisam de atenção para renovação nos próximos 2 meses.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Lightbulb className="h-4 w-4 text-yellow-400" />
                    <strong>Dica:</strong> Envie uma foto de como o carro ficou na última vez para incentivar o cliente!
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead className="hidden sm:table-cell">Veículo</TableHead>
                            <TableHead className="hidden md:table-cell">Serviço</TableHead>
                            <TableHead>Status Vencimento</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                                <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-[120px]" /></TableCell>
                                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[150px]" /></TableCell>
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
                Serviços vencidos ou que precisam de atenção para renovação nos próximos 60 dias.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground mb-4">
              <Lightbulb className="h-4 w-4 text-yellow-400" />
              <strong>Dica:</strong> Envie uma foto de como o carro ficou na última vez para incentivar o cliente!
            </div>
            
            {/* Mobile View */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                {filteredRenewals.length > 0 ? (
                    filteredRenewals.map(renewal => {
                        const expirationDate = new Date(renewal.expirationDate);
                        const hasExpired = isPast(expirationDate);
                        return (
                            <div key={renewal.serviceId} className="border rounded-lg p-4 space-y-3 bg-card/50">
                                <div className="flex justify-between items-start">
                                    <div className="font-bold text-lg">{renewal.serviceType}</div>
                                    {renewal.isRenewed && <Badge variant="secondary">Renovado</Badge>}
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1 pt-2 border-t border-border/50">
                                    <p className="flex items-center gap-2"><User className="h-4 w-4" /> <Link href={`/clients/${renewal.clientId}`} className="hover:underline">{renewal.clientName}</Link></p>
                                    <p className="flex items-center gap-2"><Car className="h-4 w-4" /> {renewal.vehicleMake} {renewal.vehicleModel}</p>
                                </div>
                                <div className="pt-2">
                                    <p className={`text-sm ${hasExpired ? 'text-destructive' : 'text-muted-foreground'}`}>{hasExpired ? 'Venceu:' : 'Vence:'}</p>
                                    <p className={`font-medium ${hasExpired ? 'text-destructive' : 'text-amber-400'}`}>
                                        {hasExpired ? `há ${formatDistanceToNow(expirationDate, { locale: ptBR })}` : formatDistanceToNow(expirationDate, { locale: ptBR, addSuffix: true })}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {expirationDate.toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
                                    {renewal.imageUrl && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="flex-1">
                                                    <Camera className="mr-2 h-4 w-4" /> Foto
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl w-[95vw]">
                                                <DialogHeader>
                                                    <DialogTitle>Foto do Serviço: {renewal.serviceType}</DialogTitle>
                                                    <DialogDescription>
                                                        Realizado em: {new Date(renewal.serviceDate).toLocaleDateString('pt-BR')}
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="flex items-center justify-center">
                                                    <Image src={renewal.imageUrl} alt={`Foto do serviço ${renewal.serviceType}`} width={800} height={600} className="rounded-md object-contain max-h-[70vh]" />
                                                </div>
                                                <DialogFooter>
                                                    <Button asChild variant="outline">
                                                        <a href={renewal.imageUrl} download={`servico-${renewal.serviceId}.jpg`} target="_blank" rel="noopener noreferrer">
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Download da Foto
                                                        </a>
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                    <Button asChild variant="outline" size="sm" className="bg-green-100 border-green-300 text-green-800 hover:bg-green-200 hover:text-green-900 flex-1">
                                      <a href={getWhatsAppLink(renewal)} target="_blank" rel="noopener noreferrer">
                                          <MessageCircle className="mr-2 h-4 w-4" />
                                          WhatsApp
                                      </a>
                                    </Button>
                                     <RenewServiceButton service={renewal} userId={user.uid} asChild>
                                        <Button size="sm" className="flex-1" disabled={renewal.isRenewed}>Renovar</Button>
                                    </RenewServiceButton>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center text-muted-foreground py-10 px-4 border rounded-md">
                        <p>{searchTerm ? `Nenhuma renovação encontrada para "${searchTerm}"` : "Nenhum serviço vencido ou próximo do vencimento."}</p>
                    </div>
                )}
            </div>
            
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Cliente</TableHead>
                          <TableHead className="hidden sm:table-cell">Veículo</TableHead>
                          <TableHead className="hidden md:table-cell">Serviço</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                  {filteredRenewals.length > 0 ? (
                      filteredRenewals.map(renewal => {
                        const expirationDate = new Date(renewal.expirationDate);
                        const hasExpired = isPast(expirationDate);
                        return (
                          <TableRow key={renewal.serviceId} className={renewal.isRenewed ? 'bg-muted/50' : ''}>
                              <TableCell>
                                <Button variant="link" asChild className="p-0 h-auto font-medium -ml-2">
                                    <Link href={`/clients/${renewal.clientId}`}>
                                        {renewal.clientName}
                                    </Link>
                                </Button>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">{renewal.vehicleMake} {renewal.vehicleModel}</TableCell>
                              <TableCell className="font-medium hidden md:table-cell">{renewal.serviceType}</TableCell>
                              <TableCell>
                                  <div className="flex flex-col">
                                        {renewal.isRenewed ? (
                                            <Badge variant="secondary" className="w-fit">Renovado</Badge>
                                        ) : (
                                            <>
                                                <span className={`font-medium ${hasExpired ? 'text-destructive' : 'text-amber-400'}`}>
                                                    {hasExpired ? 'Venceu há' : 'Vence'} {formatDistanceToNow(expirationDate, { locale: ptBR, addSuffix: !hasExpired })}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {expirationDate.toLocaleDateString('pt-BR')}
                                                </span>
                                            </>
                                        )}
                                  </div>
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                  {renewal.imageUrl && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    <Camera className="mr-2 h-4 w-4" />
                                                    Ver Foto
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl w-[95vw]">
                                                <DialogHeader>
                                                    <DialogTitle>Foto do Serviço: {renewal.serviceType}</DialogTitle>
                                                    <DialogDescription>
                                                        Realizado em: {new Date(renewal.serviceDate).toLocaleDateString('pt-BR')}
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="flex items-center justify-center">
                                                    <Image src={renewal.imageUrl} alt={`Foto do serviço ${renewal.serviceType}`} width={800} height={600} className="rounded-md object-contain max-h-[70vh]" />
                                                </div>
                                                <DialogFooter>
                                                    <Button asChild variant="outline">
                                                        <a href={renewal.imageUrl} download={`servico-${renewal.serviceId}.jpg`} target="_blank" rel="noopener noreferrer">
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Download da Foto
                                                        </a>
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                  <Button asChild variant="outline" size="sm" className="bg-green-100 border-green-300 text-green-800 hover:bg-green-200 hover:text-green-900">
                                      <a href={getWhatsAppLink(renewal)} target="_blank" rel="noopener noreferrer">
                                          <MessageCircle className="mr-2 h-4 w-4" />
                                          <span className="hidden lg:inline">WhatsApp</span>
                                      </a>
                                  </Button>
                                  <RenewServiceButton service={renewal} userId={user.uid}>
                                    <Button variant="outline" size="sm" disabled={renewal.isRenewed}>
                                        {renewal.isRenewed ? "Renovado" : "Renovar"}
                                    </Button>
                                  </RenewServiceButton>
                              </TableCell>
                          </TableRow>
                        )
                      })
                  ) : (
                      <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8 h-48">
                              {searchTerm ? `Nenhuma renovação encontrada para "${searchTerm}"` : "Nenhum serviço vencido ou próximo do vencimento."}
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
