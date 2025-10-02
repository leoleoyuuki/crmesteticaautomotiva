'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getClients } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, MoreHorizontal, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Client } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClients() {
      try {
        const clientsData = await getClients();
        // Convert Firestore Timestamp to string
        const formattedClients = clientsData.map(client => ({
            ...client,
            createdAt: client.createdAt ? new Date((client.createdAt as any).seconds * 1000).toISOString() : new Date().toISOString(),
        }));
        setClients(formattedClients);
      } catch (error) {
        console.error("Failed to fetch clients:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle className="font-headline">Clientes</CardTitle>
                <CardDescription>Gerencie seus clientes e veja seus históricos de serviço.</CardDescription>
            </div>
            <Button asChild>
                <Link href="/clients/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Cliente
                </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Telefone</TableHead>
              <TableHead>Veículos</TableHead>
              <TableHead><span className="sr-only">Ações</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-8 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : clients.length > 0 ? (
              clients.map(client => (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={client.avatarUrl} alt={client.name} data-ai-hint={client.avatarHint} />
                        <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{client.name}</div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{client.email}</TableCell>
                <TableCell className="hidden md:table-cell">{client.phone}</TableCell>
                <TableCell>
                  <Badge variant="outline">{client.vehicles ? client.vehicles.length : 0}</Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <Link href={`/clients/${client.id}`} passHref>
                        <DropdownMenuItem className="cursor-pointer">Ver Detalhes</DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhum cliente encontrado.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
