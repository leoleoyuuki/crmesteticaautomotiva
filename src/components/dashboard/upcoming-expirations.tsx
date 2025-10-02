import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Bell, Clock } from "lucide-react";

interface UpcomingExpirationsProps {
  expirations: Notification[];
}

export function UpcomingExpirations({ expirations }: UpcomingExpirationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <Bell />
            Próximos Vencimentos e Notificações
        </CardTitle>
        <CardDescription>
            Lembretes de serviços que estão prestes a vencer.
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
              <TableHead>Status da Notificação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expirations.map((exp) => (
              <TableRow key={exp.id}>
                <TableCell className="font-medium">{exp.clientName}</TableCell>
                <TableCell>{exp.vehicleModel}</TableCell>
                <TableCell>{exp.serviceType}</TableCell>
                <TableCell>{new Date(exp.dueDate).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>
                  <Badge variant={exp.status === 'sent' ? 'secondary' : exp.status === 'failed' ? 'destructive' : 'default'} className="capitalize">
                    {exp.status === 'scheduled' ? 'Agendado' : exp.status === 'sent' ? 'Enviado' : 'Falhou'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
             {expirations.length === 0 && (
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
