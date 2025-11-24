'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Bell, MessageCircle, User, Lightbulb, Car } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { formatDistanceToNow, isWithinInterval, addMonths } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from "../ui/scroll-area";
import { useMemo } from "react";
import { useSearch } from "@/context/search-provider";


type UpcomingExpiration = {
    clientId: string;
    clientName: string;
    clientAvatar?: string;
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
  const { searchTerm } = useSearch();

  const getWhatsAppLink = (exp: UpcomingExpiration) => {
    const phone = `55${exp.clientPhone.replace(/\D/g, '')}`;
    const message = `Olá ${exp.clientName}, tudo bem? Notei que o serviço de ${exp.serviceType} para seu ${exp.vehicleMake} ${exp.vehicleModel} está prestes a vencer. Que tal renová-lo com 10% de desconto este mês?`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  const filteredExpirations = useMemo(() => {
    if (!searchTerm) {
      return expirations;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return expirations.filter(
      (exp) =>
        exp.clientName.toLowerCase().includes(lowercasedFilter) ||
        exp.vehicleMake.toLowerCase().includes(lowercasedFilter) ||
        exp.vehicleModel.toLowerCase().includes(lowercasedFilter) ||
        exp.serviceType.toLowerCase().includes(lowercasedFilter)
    );
  }, [expirations, searchTerm]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <Bell />
            Próximos Vencimentos
        </CardTitle>
        <CardDescription>
            Serviços com vencimento próximo. Para os que vencem em menos de 30 dias, um gatilho de mensagem do WhatsApp estará disponível.
        </CardDescription>
        <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
          <Lightbulb className="h-4 w-4 text-yellow-400" />
          <p><strong>Dica:</strong> Envie uma foto do resultado do último serviço para aumentar a chance de renovação!</p>
        </div>
      </CardHeader>
      <CardContent>
        {/* Mobile View */}
        <div className="md:hidden grid grid-cols-1 gap-4">
             {filteredExpirations.length > 0 ? (
                 filteredExpirations.map((exp) => {
                    const expiryDate = new Date(exp.expirationDate);
                    const isExpiringSoon = isWithinInterval(expiryDate, { start: now, end: oneMonthFromNow });

                    return (
                        <div key={exp.serviceId} className="border rounded-lg p-4 space-y-3 bg-card/50">
                            <div className="font-bold text-lg">{exp.serviceType}</div>
                             <div className="text-sm text-muted-foreground space-y-1 pt-2 border-t border-border/50">
                                <p className="flex items-center gap-2"><User className="h-4 w-4" /> <Link href={`/clients/${exp.clientId}`} className="hover:underline">{exp.clientName}</Link></p>
                                <p className="flex items-center gap-2"><Car className="h-4 w-4" /> {exp.vehicleMake} {exp.vehicleModel}</p>
                            </div>
                            <div className="pt-2">
                                <p className="text-sm text-muted-foreground">Vence:</p>
                                <p className="font-medium">
                                    {formatDistanceToNow(expiryDate, { locale: ptBR, addSuffix: true })}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {expiryDate.toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-border/50">
                                {isExpiringSoon && (
                                    <Button asChild variant="outline" size="sm" className="bg-green-100 border-green-300 text-green-800 hover:bg-green-200 hover:text-green-900 w-full">
                                        <a href={getWhatsAppLink(exp)} target="_blank" rel="noopener noreferrer">
                                            <MessageCircle className="mr-2 h-4 w-4" />
                                            WhatsApp
                                        </a>
                                    </Button>
                                )}
                                <Button asChild variant="outline" size="sm" className="w-full">
                                    <Link href={`/clients/${exp.clientId}`}>Ver Cliente</Link>
                                </Button>
                            </div>
                        </div>
                    )
                 })
            ) : (
                <div className="text-center text-muted-foreground py-10 px-4 border rounded-md">
                    <p>{searchTerm ? `Nenhum serviço encontrado para "${searchTerm}"` : "Nenhum vencimento próximo."}</p>
                </div>
            )}
        </div>
        
        {/* Desktop View */}
        <ScrollArea className="h-96 hidden md:block">
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
                {filteredExpirations.length > 0 ? (
                    filteredExpirations.map((exp) => {
                        const expiryDate = new Date(exp.expirationDate);
                        const isExpiringSoon = isWithinInterval(expiryDate, { start: now, end: oneMonthFromNow });

                        return (
                            <TableRow key={exp.serviceId}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback className="bg-muted text-muted-foreground">
                                                <User className="h-5 w-5" />
                                            </AvatarFallback>
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
                            {searchTerm ? `Nenhum serviço encontrado para "${searchTerm}"` : "Nenhum vencimento próximo."}
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
