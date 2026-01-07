'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getClientsPaginated } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, MoreHorizontal, User, Edit, Trash2, Eye, Mail, Phone, Car, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Client } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase/auth/use-user';
import { DeleteClientButton } from '@/components/clients/delete-client-button';
import { useSearch } from '@/context/search-provider';
import { useRouter } from 'next/navigation';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

const PAGE_SIZE = 15;

export default function ClientsPage() {
  const { user, loading: userLoading } = useUser()!;
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { searchTerm } = useSearch();

  const fetchClients = async (loadMore = false) => {
    if (!user || !hasMore && loadMore) return;
    setLoading(true);
    try {
      const { clients: newClients, lastVisible: newLastVisible } = await getClientsPaginated(
        user.uid,
        PAGE_SIZE,
        loadMore ? lastVisible! : undefined
      );

      setClients(prev => loadMore ? [...prev, ...newClients] : newClients);
      setLastVisible(newLastVisible);
      setHasMore(newClients.length === PAGE_SIZE);

    } catch (error) {
      console.error("Failed to fetch clients:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      fetchClients(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    return clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);
  
  const renderSkeletons = () => (
    Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </TableCell>
        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[200px]" /></TableCell>
        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
        <TableCell><Skeleton className="h-6 w-8 rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
      </TableRow>
    ))
  );

  return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                  <CardTitle className="font-headline">Clientes</CardTitle>
                  <CardDescription>Gerencie seus clientes e veja seus históricos de serviço.</CardDescription>
              </div>
              <Button asChild className="shrink-0">
                  <Link href="/clients/new">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Adicionar Cliente</span>
                      <span className="inline sm:hidden">Novo</span>
                  </Link>
              </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile View */}
          <div className="md:hidden grid grid-cols-1 gap-4">
             {filteredClients.length > 0 ? (
                filteredClients.map(client => (
                    <div key={client.id} className="border rounded-lg p-4 space-y-3 bg-card/50 cursor-pointer" onClick={() => router.push(`/clients/${client.id}`)}>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-muted text-muted-foreground">
                                        <User className="h-5 w-5" />
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{client.name}</p>
                                    <p className="text-sm text-muted-foreground flex items-center gap-2"><Car className="h-4 w-4" /> {client.vehicles ? client.vehicles.length : 0} veículos</p>
                                </div>
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Toggle menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={() => router.push(`/clients/${client.id}`)}><Eye className="mr-2 h-4 w-4" />Ver Detalhes</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => router.push(`/clients/${client.id}/edit`)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DeleteClientButton userId={user!.uid} clientId={client.id} />
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1 pt-3 border-t border-border/50">
                           <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {client.email}</p>
                           <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {client.phone}</p>
                        </div>
                    </div>
                ))
            ) : (
                !loading && (
                    <div className="text-center text-muted-foreground py-10 px-4 border rounded-md">
                        <p>{searchTerm ? `Nenhum cliente encontrado para "${searchTerm}"` : "Nenhum cliente encontrado."}</p>
                    </div>
                )
            )}
             {loading && <div className="text-center p-4"> <Loader2 className="mx-auto animate-spin" /></div>}
             {!loading && hasMore && !searchTerm && (
                <Button onClick={() => fetchClients(true)} variant="outline" className="w-full mt-4">Carregar Mais</Button>
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                  <TableHead>Veículos</TableHead>
                  <TableHead><span className="sr-only">Ações</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(userLoading || (loading && clients.length === 0)) ? renderSkeletons() : (
                  filteredClients.length > 0 ? (
                    filteredClients.map(client => (
                    <TableRow key={client.id} onClick={() => router.push(`/clients/${client.id}`)} className="cursor-pointer">
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
                      <TableCell className="hidden lg:table-cell">{client.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{client.vehicles ? client.vehicles.length : 0}</Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => router.push(`/clients/${client.id}`)}><Eye className="mr-2 h-4 w-4" />Ver Detalhes</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => router.push(`/clients/${client.id}/edit`)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DeleteClientButton userId={user!.uid} clientId={client.id} />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                  ) : (
                      <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8 h-48">
                              {searchTerm ? `Nenhum cliente encontrado para "${searchTerm}"` : "Nenhum cliente encontrado."}
                          </TableCell>
                      </TableRow>
                  )
                )}
              </TableBody>
            </Table>
             {!loading && hasMore && !searchTerm && (
                <div className="pt-4 text-center">
                    <Button onClick={() => fetchClients(true)} variant="outline">Carregar Mais</Button>
                </div>
            )}
            {loading && clients.length > 0 && <div className="text-center p-4"> <Loader2 className="mx-auto animate-spin" /></div>}
          </div>
        </CardContent>
      </Card>
  );
}

    