
import { getClientById } from "@/lib/data";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Calendar, Car, MoreVertical } from "lucide-react";
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
  } from "@/components/ui/dropdown-menu"

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const client = await getClientById(params.id);

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center space-x-4">
            <Avatar className="h-20 w-20 border">
              <AvatarImage src={client.avatarUrl} alt={client.name} data-ai-hint={client.avatarHint}/>
              <AvatarFallback>{client.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="font-headline text-3xl">{client.name}</CardTitle>
              <CardDescription className="flex items-center gap-4 text-base">
                <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> {client.email}</span>
                <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> {client.phone}</span>
                <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Cliente desde {new Date(client.createdAt).toLocaleDateString('pt-BR')}</span>
              </CardDescription>
            </div>
            <Button asChild variant="outline"><Link href="/clients">Voltar</Link></Button>
        </CardHeader>
      </Card>

      <ServiceRecommendations client={client} />

      <div>
        <h2 className="text-2xl font-headline mb-4 flex items-center gap-2">
            <Car /> Veículos
        </h2>
        {client.vehicles && client.vehicles.length > 0 ? (
          <div className="space-y-6">
            {client.vehicles.map(vehicle => (
                <Card key={vehicle.id}>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle className="font-headline">{vehicle.make} {vehicle.model}</CardTitle>
                            <CardDescription>{vehicle.year} - {vehicle.licensePlate}</CardDescription>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>Editar Veículo</DropdownMenuItem>
                                <DropdownMenuItem>Adicionar Serviço</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
                                        <TableHead className="text-center">Ações de IA</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {vehicle.serviceHistory.map(service => (
                                        <TableRow key={service.id}>
                                            <TableCell className="font-medium">{service.serviceType}</TableCell>
                                            <TableCell>{new Date(service.date).toLocaleDateString('pt-BR')}</TableCell>
                                            <TableCell className="text-right">R$ {service.cost.toFixed(2).replace('.', ',')}</TableCell>
                                            <TableCell className="text-center">
                                                <ExpirationPrediction client={client} vehicle={vehicle} service={service} />
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
                    <Button variant="link" className="mt-2">Adicionar Veículo</Button>
                </div>
            </Card>
        )}
      </div>
    </div>
  );
}
