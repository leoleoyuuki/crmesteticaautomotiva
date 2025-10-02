'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Bell, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceToNow, isWithinInterval, addMonths } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from "../ui/scroll-area";


type UpcomingExpiration = {
    clientId: string;
    clientName: string;
    clientAvatar: string;
    clientPhone: string;
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
  const now = new Date();
  const oneMonthFromNow = addMonths(now, 1);

  const getWhatsAppLink = (exp: UpcomingExpiration) => {
    const phone = `55${exp.clientPhone.replace(/\D/g, '')}`;
    const message = `Olá ${exp.clientName}, tudo bem? Notei que o serviço de ${exp.serviceType} para seu ${exp.vehicleMake} ${exp.vehicleModel} está prestes a vencer. Que tal renová-lo com 10% de desconto este mês?`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

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
                    expirations.map((exp) => {
                        const expiryDate = new Date(exp.expirationDate);
                        const isExpiringSoon = isWithinInterval(expiryDate, { start: now, end: oneMonthFromNow });

                        return (
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
                                        <span className="font-medium">{expiryDate.toLocaleDateString('pt-BR')}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(expiryDate, { locale: ptBR, addSuffix: true })}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    {isExpiringSoon && (
                                        <Button asChild variant="outline" size="sm" className="bg-green-100 border-green-300 text-green-800 hover:bg-green-200 hover:text-green-900">
                                            <a href={getWhatsAppLink(exp)} target="_blank" rel="noopener noreferrer">
                                                <MessageCircle className="mr-2 h-4 w-4" />
                                                WhatsApp
                                            </a>
                                        </Button>
                                    )}
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/clients/${exp.clientId}`}>Ver Cliente</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    })
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
