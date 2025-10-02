'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { VehicleFormData } from '@/lib/types';

const formSchema = z.object({
  make: z.string().min(2, { message: 'A marca deve ter pelo menos 2 caracteres.' }),
  model: z.string().min(1, { message: 'O modelo é obrigatório.' }),
  year: z.coerce.number().min(1900, { message: 'Ano inválido.' }).max(new Date().getFullYear() + 1, { message: 'Ano inválido.' }),
  licensePlate: z.string().min(7, { message: 'A placa deve ter 7 caracteres.' }).max(7, { message: 'A placa deve ter 7 caracteres.' }),
});

interface VehicleFormProps {
  vehicle?: VehicleFormData;
  onSave: (data: VehicleFormData) => Promise<any>;
  savingText?: string;
  cancelHref: string;
}

export function VehicleForm({ vehicle, onSave, savingText = 'Salvando...', cancelHref }: VehicleFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: vehicle || {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      licensePlate: '',
    },
  });

  async function onSubmit(values: VehicleFormData) {
    startTransition(async () => {
      await onSave(values);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                    <Input placeholder="Ex: ABC1D23" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
                <Link href={cancelHref}>Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? savingText : 'Salvar Veículo'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
