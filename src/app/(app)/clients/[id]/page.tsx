'use client';

import { getClientById } from "@/lib/data";
import { notFound, useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Calendar, Car, MoreVertical, Edit, PlusCircle, Pencil, User, Camera, Wallet, Clock, StickyNote, Download } from "lucide-react";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
import { useUser } from "@/firebase/auth/use-user";
import { useEffect, useState } from "react";
import { Client } from "@/lib/types";
import { DeleteVehicleButton } from "@/components/clients/delete-vehicle-button";
import { DeleteServiceButton } from "@/components/clients/delete-service-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isPast, isWithinInterval, addDays, formatDistanceToNow, format } from "date-fns";
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


export default function ClientDetailPage() {
  const { user } = useUser()!;
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    async function fetchClient() {
      if (!user) return;
      const clientData = await getClientById(user.uid, clientId);
      if (!clientData) {
        notFound();
      } else {
        setClient(clientData as Client);
      }
      setLoading(false);
    }

    if(user) {
      fetchClient();
    }
  }, [user, clientId, router]);

  if (loading || !client || !user) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  const formattedDate = format(toDate(client.createdAt), "dd 'de' MMM 'de' yyyy", { locale: ptBR });

  const getExpirationBadge = (expirationDate: string) => {
    const now = new Date();
    const expiry = new Date(expirationDate);
    const oneMonthFromNow = addDays(now, 30);
    
    let variant: "destructive" | "default" | "secondary" = "secondary";
    let text = `Vence ${formatDistanceToNow(expiry, { locale: ptBR, addSuffix: true })}`;
    let className = "";

    if (isPast(expiry)) {
        variant = "destructive";
        text = `Venceu ${formatDistanceToNow(expiry, { locale: ptBR, addSuffix: true })}`;
    } else if (isWithinInterval(expiry, { start: now, end: oneMonthFromNow })) {
        variant = "default";
        className="bg-yellow-500 text-black hover:bg-yellow-600";
    }

    return <Badge variant={variant} className={cn("capitalize", className)}>{text}</Badge>;
  }

  return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <Avatar className="h-20 w-20 border">
                  <AvatarFallback className="bg-muted text-muted-foreground">
                      <User className="h-10 w-10"/>
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-left">
                  <CardTitle className="font-headline text-2xl md:text-3xl">{client.name}</CardTitle>
                  <CardDescription className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-x-4 gap-y-1 text-base mt-1 justify-center sm:justify-start">
                    {client.email && <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> {client.email}</span>}
                  </CardDescription>
                </div>
            </div>
            <div className="text-center sm:text-left text-muted-foreground space-y-2 text-sm">
                <p className="flex items-center justify-center sm:justify-start gap-2"><Phone className="w-4 h-4" /> {client.phone}</p>
                <p className="flex items-center justify-center sm:justify-start gap-2"><Calendar className="w-4 h-4" /> Cliente desde {formattedDate}</p>
            </div>
            <div className="flex flex-col sm:flex-row w-full items-center gap-2">
              <Button asChild variant="outline" className="w-full sm:w-auto"><Link href={`/clients/${client.id}/edit`}><Edit className="mr-2 h-4 w-4"/>Editar Cliente</Link></Button>
              <Button asChild variant="outline" className="w-full sm:w-auto"><Link href="/clients">Voltar</Link></Button>
            </div>
          </CardHeader>
        </Card>

        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <h2 className="text-2xl font-headline flex items-center gap-2">
                    <Car /> Veículos
                </h2>
                <Button asChild>
                    <Link href={`/clients/${client.id}/vehicles/new`}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Veículo
                    </Link>
                </Button>
            </div>
          
          {client.vehicles && client.vehicles.length > 0 ? (
            <div className="space-y-6">
              {client.vehicles.map(vehicle => (
                  <Card key={vehicle.id}>
                      <CardHeader className="flex flex-col sm:flex-row items-start justify-between gap-4">
                          <div className="flex-1">
                              <CardTitle className="font-headline">{vehicle.make} {vehicle.model}</CardTitle>
                              <CardDescription>{vehicle.year} - {vehicle.licensePlate}</CardDescription>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button size="sm" asChild className="flex-1">
                                <Link href={`/clients/${client.id}/vehicles/${vehicle.id}/services/new`}>
                                    <PlusCircle className="mr-2 h-4 w-4"/> Adicionar Serviço
                                </Link>
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild><Link href={`/clients/${client.id}/vehicles/${vehicle.id}/edit`} className="cursor-pointer flex items-center"><Pencil className="mr-2 h-4 w-4" />Editar Veículo</Link></DropdownMenuItem>
                                    <DeleteVehicleButton userId={user.uid} clientId={client.id} vehicleId={vehicle.id} onSelect={(e) => e.preventDefault()} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                      </CardHeader>
                      <CardContent>
                          <h4 className="font-semibold mb-4">Histórico de Serviços</h4>
                          
                          {/* Mobile View: Vertical Cards */}
                          <div className="grid grid-cols-1 sm:hidden gap-4">
                            {vehicle.serviceHistory && vehicle.serviceHistory.length > 0 ? (
                              vehicle.serviceHistory.map(service => (
                                <div key={service.id} className="border rounded-lg p-4 space-y-3 bg-card/50">
                                  <div className="font-bold text-lg">{service.serviceType}</div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> {format(new Date(service.date), 'dd/MM/yyyy')}</span>
                                    <span className="font-semibold flex items-center gap-2"><Wallet className="h-4 w-4" /> R$ {service.cost.toFixed(2).replace('.', ',')}</span>
                                  </div>
                                  <div className="flex items-center gap-2 pt-1">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    {getExpirationBadge(service.expirationDate)}
                                  </div>
                                  {service.notes && (
                                    <p className="text-sm text-muted-foreground pt-1 flex items-start gap-2"><StickyNote className="h-4 w-4 mt-0.5 shrink-0" /> {service.notes}</p>
                                  )}
                                  <div className="flex items-center justify-end gap-1 pt-2 border-t border-border/50">
                                     {service.imageUrl && (
                                          <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <Camera className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl w-[95vw]">
                                                <DialogHeader>
                                                <DialogTitle>Foto do Serviço: {service.serviceType}</DialogTitle>
                                                <DialogDescription>
                                                    Realizado em: {new Date(service.date).toLocaleDateString('pt-BR')}
                                                </DialogDescription>
                                                </DialogHeader>
                                                <div className="flex items-center justify-center">
                                                    <Image src={service.imageUrl} alt={`Foto do serviço ${service.serviceType}`} width={800} height={600} className="rounded-md object-contain max-h-[70vh]" />
                                                </div>
                                                <DialogFooter>
                                                    <Button asChild variant="outline">
                                                        <a href={service.imageUrl} download={`servico-${service.id}.jpg`} target="_blank" rel="noopener noreferrer">
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Download da Foto
                                                        </a>
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                          </Dialog>
                                      )}
                                      <Button variant="ghost" size="icon" asChild>
                                          <Link href={`/clients/${client.id}/vehicles/${vehicle.id}/services/${service.id}/edit`}>
                                              <Pencil className="h-4 w-4" />
                                          </Link>
                                      </Button>
                                      <DeleteServiceButton userId={user.uid} clientId={client.id} vehicleId={vehicle.id} serviceId={service.id} />
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center text-muted-foreground py-10 px-4 border rounded-md">
                                <p>Nenhum histórico de serviço para este veículo.</p>
                              </div>
                            )}
                          </div>

                          {/* Desktop View: Table */}
                          <div className="hidden sm:block overflow-x-auto">
                            {vehicle.serviceHistory && vehicle.serviceHistory.length > 0 ? (
                            <table className="w-full text-sm">
                                <thead className="border-b">
                                    <tr className="text-muted-foreground">
                                        <th className="text-left font-medium p-2">Serviço</th>
                                        <th className="text-left font-medium p-2">Data</th>
                                        <th className="text-left font-medium p-2">Vencimento</th>
                                        <th className="text-right font-medium p-2">Custo</th>
                                        <th className="text-center font-medium p-2">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vehicle.serviceHistory.map(service => (
                                        <tr key={service.id} className="border-b">
                                            <td className="font-medium p-2">{service.serviceType}</td>
                                            <td className="p-2">{format(new Date(service.date), 'dd/MM/yyyy')}</td>
                                            <td className="p-2">
                                                {getExpirationBadge(service.expirationDate)}
                                            </td>
                                            <td className="text-right p-2">R$ {service.cost.toFixed(2).replace('.', ',')}</td>
                                            <td className="p-2">
                                              <div className="text-center flex items-center justify-center gap-1">
                                                {service.imageUrl && (
                                                    <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <Camera className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-3xl w-[95vw]">
                                                        <DialogHeader>
                                                        <DialogTitle>Foto do Serviço: {service.serviceType}</DialogTitle>
                                                        <DialogDescription>
                                                            Realizado em: {new Date(service.date).toLocaleDateString('pt-BR')}
                                                        </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="flex items-center justify-center">
                                                            <Image src={service.imageUrl} alt={`Foto do serviço ${service.serviceType}`} width={800} height={600} className="rounded-md object-contain max-h-[70vh]" />
                                                        </div>
                                                        <DialogFooter>
                                                            <Button asChild variant="outline">
                                                                <a href={service.imageUrl} download={`servico-${service.id}.jpg`} target="_blank" rel="noopener noreferrer">
                                                                    <Download className="mr-2 h-4 w-4" />
                                                                    Download da Foto
                                                                </a>
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                    </Dialog>
                                                )}
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/clients/${client.id}/vehicles/${vehicle.id}/services/${service.id}/edit`}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <DeleteServiceButton userId={user.uid} clientId={client.id} vehicleId={vehicle.id} serviceId={service.id} />
                                              </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            ) : (
                                <div className="text-center text-muted-foreground p-10 border rounded-md">
                                    <p>Nenhum histórico de serviço para este veículo.</p>
                                </div>
                            )}
                          </div>
                      </CardContent>
                  </Card>
              ))}
            </div>
          ) : (
              <Card className="flex items-center justify-center p-10">
                  <div className="text-center text-muted-foreground">
                      <p>Nenhum veículo cadastrado para este cliente.</p>
                  </div>
              </Card>
          )}
        </div>
      </div>
  );
}
