'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { VehicleFormData } from '@/lib/types';
import { useEffect, useState, useTransition } from 'react';
import { getClients } from '@/lib/data';
import { addDoc, collection } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle } from 'lucide-react';
import { Client } from '@/lib/types';
import { AddClientDialog } from '@/components/clients/add-client-dialog';


const formSchema = z.object({
  clientId: z.string({ required_error: 'Por favor, selecione um cliente.' }),
  make: z.string().min(2, { message: 'A marca deve ter pelo menos 2 caracteres.' }),
  model: z.string().min(1, { message: 'O modelo é obrigatório.' }),
  year: z.coerce.number().min(1900, { message: 'Ano inválido.' }).max(new Date().getFullYear() + 1, { message: 'Ano inválido.' }),
  licensePlate: z.string().min(7, { message: 'A placa deve ter 7 caracteres.' }).max(8, { message: 'A placa deve ter no máximo 8 caracteres.' }).toUpperCase(),
});

type VehicleFormValues = z.infer<typeof formSchema>;

export default function NewVehiclePage() {
  const { user } = useUser()!;
  const router = useRouter();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      licensePlate: '',
    }
  });

  const fetchClients = async () => {
    if (!user) return;
    setLoading(true);
    const clientData = await getClients(user.uid);
    setClients(clientData);
    setLoading(false);
  };

  useEffect(() => {
    if(user) {
        fetchClients();
    }
  }, [user]);

  const onClientAdded = (newClient: Client) => {
    setClients(prev => [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name)));
    form.setValue('clientId', newClient.id);
  }

  const handleAddVehicle = async (data: VehicleFormValues) => {
    if (!user) return;

    const { clientId, ...vehicleData } = data;
    const vehiclesCollection = collection(firestore, 'users', user.uid, 'clients', clientId, 'vehicles');
    
    startTransition(async () => {
        try {
            await addDoc(vehiclesCollection, vehicleData);
            toast({
                title: "Veículo adicionado!",
                description: "O novo veículo foi salvo com sucesso."
            });
            router.push(`/clients/${clientId}`);
            router.refresh();
        } catch (error) {
            console.error("Failed to add vehicle:", error);
            toast({
                variant: "destructive",
                title: "Erro ao salvar",
                description: "Não foi possível adicionar o veículo."
            });
        }
    });
  };
  
  if(loading) {
      return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Adicionar Novo Veículo</CardTitle>
          <CardDescription>Cadastre um novo veículo e atribua a um cliente.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddVehicle)} className="space-y-8">
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente</FormLabel>
                          <div className="flex gap-2">
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o proprietário do veículo" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {clients.map(client => (
                                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                             <AddClientDialog onClientAdded={onClientAdded} isOpen={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
                                <Button type="button" variant="outline" className="shrink-0">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Novo
                                </Button>
                            </AddClientDialog>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                            control={form.control}
                            name="make"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Marca</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Honda" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="model"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Modelo</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Civic" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                            control={form.control}
                            name="year"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Ano</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="Ex: 2023" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="licensePlate"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Placa</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: ABC1D23" {...field} className="uppercase"/>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => router.push('/vehicles')}>Cancelar</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isPending ? "Salvando..." : 'Salvar Veículo'}
                        </Button>
                    </div>
                </form>
            </Form>
        </CardContent>
      </Card>
  );
}
