'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

type UpcomingExpiration = {
    clientId: string;
    clientName: string;
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Data de Vencimento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expirations.length > 0 ? (
                expirations.map((exp) => (
                    <TableRow key={exp.serviceId}>
                        <TableCell className="font-medium">{exp.clientName}</TableCell>
                        <TableCell>{exp.vehicleMake} {exp.vehicleModel}</TableCell>
                        <TableCell>{exp.serviceType}</TableCell>
                        <TableCell>{new Date(exp.expirationDate).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-right">
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/clients/${exp.clientId}`}>Ver Cliente</Link>
                            </Button>
                        </TableCell>
                    </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhum vencimento próximo.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
