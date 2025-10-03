'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getClients } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, MoreHorizontal, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Client } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase/auth/use-user';
import { DeleteClientButton } from '@/components/clients/delete-client-button';
import { useSearch } from '@/context/search-provider';

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


export default function ClientsPage() {
  const { user } = useUser()!;
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchTerm } = useSearch();

  useEffect(() => {
    async function fetchClients() {
      if (!user) return;
      try {
        const clientsData = await getClients(user.uid);
        const formattedClients = clientsData.map(client => ({
          ...client,
          createdAt: toDate(client.createdAt).toISOString(),
        }));
        setClients(formattedClients);
      } catch (error) {
        console.error("Failed to fetch clients:", error);
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      fetchClients();
    }
  }, [user]);

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    return clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  if (loading || !user) {
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
          {Array.from({ length: 5 }).map((_, i) => (
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
          ))}
          </TableBody>
        </Table>
        </CardContent>
        </Card>
    );
  }

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
              {filteredClients.length > 0 ? (
                filteredClients.map(client => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-muted text-muted-foreground">
                            <User className="h-5 w-5" />
                          </AvatarFallback>
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
                        <Link href={`/clients/${client.id}/edit`} passHref>
                          <DropdownMenuItem className="cursor-pointer">Editar</DropdownMenuItem>
                        </Link>
                        <DeleteClientButton userId={user.uid} clientId={client.id} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
              ) : (
                  <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          {searchTerm ? `Nenhum cliente encontrado para "${searchTerm}"` : "Nenhum cliente encontrado."}
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
  );
}
