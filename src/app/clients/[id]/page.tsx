'use client';

import { getClientById } from "@/lib/data";
import { notFound, useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Calendar, Car, MoreVertical, Edit, PlusCircle, Pencil } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ServiceRecommendations } from "@/components/clients/recommendations";
import { ExpirationPrediction } from "@/components/clients/expiration-prediction";
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
import { AppLayout } from "@/components/layout/app-layout";
import { DeleteVehicleButton } from "@/components/clients/delete-vehicle-button";
import { DeleteServiceButton } from "@/components/clients/delete-service-button";


export default function ClientDetailPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
      return;
    }

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
  }, [user, userLoading, clientId, router]);

  if (userLoading || loading || !client || !user) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center space-x-4">
              <Avatar className="h-20 w-20 border">
                <AvatarImage src={client.avatarUrl} alt={client.name} data-ai-hint={client.avatarHint}/>
                <AvatarFallback>{client.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="font-headline text-3xl">{client.name}</CardTitle>
                <CardDescription className="flex items-center flex-wrap gap-x-4 gap-y-1 text-base">
                  <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> {client.email}</span>
                  <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> {client.phone}</span>
                  <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Cliente desde {new Date(client.createdAt).toLocaleDateString('pt-BR')}</span>
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
                      <CardContent className="grid md:grid-cols-3 gap-6">
                          <div className="md:col-span-1">
                              <Image src={vehicle.imageUrl} alt={`${vehicle.make} ${vehicle.model}`} data-ai-hint={vehicle.imageHint} width={600} height={400} className="rounded-lg object-cover aspect-video" />
                          </div>
                          <div className="md:col-span-2">
                              <h4 className="font-semibold mb-2">Histórico de Serviços</h4>
                              {vehicle.serviceHistory && vehicle.serviceHistory.length > 0 ? (
                              <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead>Serviço</TableHead>
                                          <TableHead>Data</TableHead>
                                          <TableHead className="text-right">Custo</TableHead>
                                          <TableHead className="text-center">Ações</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {vehicle.serviceHistory.map(service => (
                                          <TableRow key={service.id}>
                                              <TableCell className="font-medium">{service.serviceType}</TableCell>
                                              <TableCell>{new Date(service.date).toLocaleDateString('pt-BR')}</TableCell>
                                              <TableCell className="text-right">R$ {service.cost.toFixed(2).replace('.', ',')}</TableCell>
                                              <TableCell className="text-center flex items-center justify-center gap-1">
                                                  <ExpirationPrediction client={client} vehicle={vehicle} service={service} />
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
    </AppLayout>
  );
}

    