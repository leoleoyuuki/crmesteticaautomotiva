'use client';

import { getClientById } from "@/lib/data";
import { notFound, useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Calendar, Car, MoreVertical, Edit, PlusCircle, Pencil, User, Camera } from "lucide-react";
import { ServiceRecommendations } from "@/components/clients/recommendations";
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
import { isPast, isWithinInterval, addMonths, formatDistanceToNow } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

  const formattedDate = toDate(client.createdAt).toLocaleDateString('pt-BR');

  const getExpirationBadge = (expirationDate: string) => {
    const now = new Date();
    const expiry = new Date(expirationDate);
    const oneMonthFromNow = addMonths(now, 1);
    
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
          <CardHeader className="flex flex-row items-center space-x-4">
              <Avatar className="h-20 w-20 border">
                <AvatarFallback className="bg-muted text-muted-foreground">
                    <User className="h-10 w-10"/>
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="font-headline text-3xl">{client.name}</CardTitle>
                <CardDescription className="flex items-center flex-wrap gap-x-4 gap-y-1 text-base">
                  <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> {client.email}</span>
                  <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> {client.phone}</span>
                  <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Cliente desde {formattedDate}</span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline"><Link href={`/clients/${client.id}/edit`}><Edit className="mr-2 h-4 w-4"/>Editar Cliente</Link></Button>
                <Button asChild variant="outline"><Link href="/clients">Voltar</Link></Button>
              </div>
          </CardHeader>
        </Card>

        <ServiceRecommendations client={client} />

        <div>
            <div className="flex justify-between items-center mb-4">
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
                      <CardHeader className="flex flex-row items-start justify-between">
                          <div>
                              <CardTitle className="font-headline">{vehicle.make} {vehicle.model}</CardTitle>
                              <CardDescription>{vehicle.year} - {vehicle.licensePlate}</CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" asChild>
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
                                    <DropdownMenuItem asChild><Link href={`/clients/${client.id}/vehicles/${vehicle.id}/edit`} className="cursor-pointer">Editar Veículo</Link></DropdownMenuItem>
                                    <DeleteVehicleButton userId={user.uid} clientId={client.id} vehicleId={vehicle.id} onSelect={(e) => e.preventDefault()} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                      </CardHeader>
                      <CardContent>
                          <h4 className="font-semibold mb-2">Histórico de Serviços</h4>
                          {vehicle.serviceHistory && vehicle.serviceHistory.length > 0 ? (
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Serviço</TableHead>
                                      <TableHead>Data</TableHead>
                                      <TableHead>Vencimento</TableHead>
                                      <TableHead className="text-right">Custo</TableHead>
                                      <TableHead className="text-center">Ações</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {vehicle.serviceHistory.map(service => (
                                      <TableRow key={service.id}>
                                          <TableCell className="font-medium">{service.serviceType}</TableCell>
                                          <TableCell>{new Date(service.date).toLocaleDateString('pt-BR')}</TableCell>
                                          <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getExpirationBadge(service.expirationDate)}
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-right">R$ {service.cost.toFixed(2).replace('.', ',')}</TableCell>
                                          <TableCell className="text-center flex items-center justify-center gap-1">
                                             {service.imageUrl && (
                                                <Dialog>
                                                  <DialogTrigger asChild>
                                                     <Button variant="ghost" size="icon">
                                                        <Camera className="h-4 w-4" />
                                                      </Button>
                                                  </DialogTrigger>
                                                  <DialogContent className="max-w-3xl">
                                                    <DialogHeader>
                                                      <DialogTitle>Foto do Serviço: {service.serviceType}</DialogTitle>
                                                      <DialogDescription>
                                                        Realizado em: {new Date(service.date).toLocaleDateString('pt-BR')}
                                                      </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="flex items-center justify-center">
                                                       <Image src={service.imageUrl} alt={`Foto do serviço ${service.serviceType}`} width={800} height={600} className="rounded-md object-contain" />
                                                    </div>
                                                  </DialogContent>
                                                </Dialog>
                                              )}
                                              <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/clients/${client.id}/vehicles/${vehicle.id}/services/${service.id}/edit`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                              </Button>
                                              <DeleteServiceButton userId={user.uid} clientId={client.id} vehicleId={vehicle.id} serviceId={service.id} />
                                          </TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                          ) : (
                              <div className="text-center text-muted-foreground p-10 border rounded-md">
                                  <p>Nenhum histórico de serviço para este veículo.</p>
                              </div>
                          )}
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
