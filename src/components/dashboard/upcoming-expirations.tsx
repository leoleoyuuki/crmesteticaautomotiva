'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from "../ui/scroll-area";


type UpcomingExpiration = {
    clientId: string;
    clientName: string;
    clientAvatar: string;
    vehicleId: string;
    vehicleMake: string;
    vehicleModel: string;
    serviceId: string;
    serviceType: string;
    expirationDate: string;
  };
  

interface UpcomingExpirationsProps {
  expirations: UpcomingExpiration[];
}

export function UpcomingExpirations({ expirations }: UpcomingExpirationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <Bell />
            Próximos Vencimentos
        </CardTitle>
        <CardDescription>
            Serviços com vencimento próximo para você entrar em contato com o cliente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {expirations.length > 0 ? (
                    expirations.map((exp) => (
                        <TableRow key={exp.serviceId}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={exp.clientAvatar} alt={exp.clientName} />
                                        <AvatarFallback>{exp.clientName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="font-medium">{exp.clientName}</div>
                                </div>
                            </TableCell>
                            <TableCell>{exp.vehicleMake} {exp.vehicleModel}</TableCell>
                            <TableCell>{exp.serviceType}</TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">{new Date(exp.expirationDate).toLocaleDateString('pt-BR')}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(exp.expirationDate), { locale: ptBR, addSuffix: true })}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/clients/${exp.clientId}`}>Ver Cliente</Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground h-48">
                            Nenhum vencimento próximo.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
