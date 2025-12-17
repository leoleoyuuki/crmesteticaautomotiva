'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ServiceRecordFormData, Client, Vehicle } from '@/lib/types';
import { useEffect, useState, useTransition, Suspense } from 'react';
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
import { Loader2, PlusCircle, CalendarIcon } from 'lucide-react';
import { AddClientDialog } from '@/components/clients/add-client-dialog';
import { AddVehicleDialog } from '@/components/vehicles/add-vehicle-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { ImageUpload } from '@/components/services/image-upload';


async function uploadImage(imageDataUrl: string): Promise<string> {
    const blob = await fetch(imageDataUrl).then(res => res.blob());
    const file = new File([blob], `service-${Date.now()}.jpg`, { type: 'image/jpeg' });

    const response = await fetch(`/api/upload?filename=${file.name}`, {
        method: 'POST',
        body: file,
    });

    if (!response.ok) {
        throw new Error('Falha no upload da imagem.');
    }

    const newBlob = await response.json();
    return newBlob.url;
}


const formSchema = z.object({
  clientId: z.string({ required_error: 'Por favor, selecione um cliente.' }),
  vehicleId: z.string({ required_error: 'Por favor, selecione um veículo.' }),
  serviceType: z.string().min(3, { message: 'O tipo de serviço deve ter pelo menos 3 caracteres.' }),
  date: z.date({ required_error: 'A data do serviço é obrigatória.' }),
  cost: z.coerce.number().min(0, { message: 'O custo não pode ser negativo.' }),
  durationDays: z.coerce.number().int().min(1, { message: 'A duração deve ser de pelo menos 1 dia.' }),
  notes: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
});

type ServiceFormValues = z.infer<typeof formSchema>;

function NewServiceForm() {
  const { user } = useUser()!;
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: searchParams.get('clientId') || '',
      vehicleId: searchParams.get('vehicleId') || '',
      serviceType: searchParams.get('serviceType') || '',
      date: new Date(),
      durationDays: searchParams.get('durationDays') ? Number(searchParams.get('durationDays')) : 180,
      cost: searchParams.get('cost') ? Number(searchParams.get('cost')) : 0,
      notes: searchParams.get('notes') || '',
      imageUrl: null,
    }
  });

  const selectedClientId = form.watch('clientId');

  useEffect(() => {
    async function fetchInitialData() {
        if (!user) return;
        setLoading(true);
        const clientData = await getClients(user.uid);
        setClients(clientData);
        setLoading(false);
    }
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClientId) {
      const selectedClient = clients.find(c => c.id === selectedClientId);
      setVehicles(selectedClient?.vehicles || []);
      // Do not reset vehicleId if it's coming from searchParams
      if (!searchParams.get('vehicleId')) {
         form.setValue('vehicleId', '');
      }
    } else {
      setVehicles([]);
    }
  }, [selectedClientId, clients, form, searchParams]);

  const onClientAdded = (newClient: Client) => {
    setClients(prev => [...prev, newClient].sort((a,b) => a.name.localeCompare(b.name)));
    form.setValue('clientId', newClient.id);
  };
  
  const onVehicleAdded = (newVehicle: Vehicle) => {
    const updatedClients = clients.map(c => {
      if (c.id === selectedClientId) {
        return {...c, vehicles: [...(c.vehicles || []), newVehicle]};
      }
      return c;
    });
    setClients(updatedClients);
    form.setValue('vehicleId', newVehicle.id);
  }

  const handleAddService = async (data: ServiceFormValues) => {
    if (!user) return;

    const { clientId, vehicleId, ...serviceData } = data;
    
    startTransition(async () => {
      try {
        let finalImageUrl = '';
        if (data.imageUrl && data.imageUrl.startsWith('data:image')) {
            finalImageUrl = await uploadImage(data.imageUrl);
        }

        const serviceHistoryCollection = collection(firestore, 'users', user.uid, 'clients', clientId, 'vehicles', vehicleId, 'serviceHistory');
        
        const startDate = new Date(data.date);
        const expirationDate = addDays(startDate, data.durationDays);

        const newServiceData = {
            ...serviceData,
            date: startDate.toISOString(),
            expirationDate: expirationDate.toISOString(),
            imageUrl: finalImageUrl,
            isRenewed: false,
        };
    
        await addDoc(serviceHistoryCollection, newServiceData);
        toast({
          title: "Serviço adicionado!",
          description: "Um novo serviço foi registrado com sucesso."
        });
        router.push(`/clients/${clientId}`);
        router.refresh();
      } catch (error) {
        console.error("Failed to add service record:", error);
        toast({
          variant: "destructive",
          title: "Erro ao adicionar",
          description: "Não foi possível adicionar o novo serviço."
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
          <CardTitle className="font-headline">Adicionar Novo Serviço</CardTitle>
          <CardDescription>
            Registre um novo serviço para um veículo.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddService)} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Cliente</FormLabel>
                            <div className="flex gap-2">
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um cliente" />
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
                         <FormField
                            control={form.control}
                            name="vehicleId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Veículo</FormLabel>
                                <div className="flex gap-2">
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClientId}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={!selectedClientId ? "Selecione um cliente primeiro" : "Selecione um veículo"} />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {vehicles.map(vehicle => (
                                            <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model} ({vehicle.licensePlate})</SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                    <AddVehicleDialog clientId={selectedClientId} onVehicleAdded={onVehicleAdded} isOpen={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen} disabled={!selectedClientId}>
                                        <Button type="button" variant="outline" className="shrink-0" disabled={!selectedClientId}>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Novo
                                        </Button>
                                    </AddVehicleDialog>
                                </div>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="serviceType"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tipo de Serviço</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Polimento Técnico" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Data do Serviço</FormLabel>
                                <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                        )}
                                    >
                                        {field.value ? (
                                        format(field.value, "PPP")
                                        ) : (
                                        <span>Escolha uma data</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                        date > new Date() || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                    />
                                </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="durationDays"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Duração (dias)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="1" placeholder="Ex: 180" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="cost"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Custo (R$)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" placeholder="Ex: 350.00" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Anotações</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Detalhes sobre o serviço, produtos utilizados, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Foto do Serviço</FormLabel>
                            <FormControl>
                                <ImageUpload 
                                    onImageChange={(dataUrl) => form.setValue('imageUrl', dataUrl)}
                                    initialImageUrl={field.value}
                                    isSubmitting={isPending}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => router.push('/services')}>Cancelar</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isPending ? "Salvando..." : 'Salvar Serviço'}
                        </Button>
                    </div>
                </form>
            </Form>
        </CardContent>
      </Card>
  );
}

export default function NewServicePage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Carregando...</div>}>
            <NewServiceForm />
        </Suspense>
    )
}
