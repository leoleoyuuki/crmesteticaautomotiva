'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useTransition } from 'react';
import { CalendarIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ServiceRecordFormData } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';

const formSchema = z.object({
  serviceType: z.string().min(3, { message: 'O tipo de serviço deve ter pelo menos 3 caracteres.' }),
  date: z.date({ required_error: 'A data do serviço é obrigatória.' }),
  cost: z.coerce.number().min(0, { message: 'O custo não pode ser negativo.' }),
  notes: z.string().optional(),
});

// Convert form data to match the expected type
const toServiceRecordFormData = (data: z.infer<typeof formSchema>): ServiceRecordFormData => ({
    ...data,
    date: data.date.toISOString(),
});

interface ServiceFormProps {
  service?: ServiceRecordFormData;
  onSave: (data: ServiceRecordFormData) => Promise<any>;
  savingText?: string;
  cancelHref: string;
}

export function ServiceForm({ service, onSave, savingText = 'Salvando...', cancelHref }: ServiceFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        serviceType: service?.serviceType || '',
        date: service?.date ? new Date(service.date) : new Date(),
        cost: service?.cost || 0,
        notes: service?.notes || ''
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      await onSave(toServiceRecordFormData(values));
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
                <Link href={cancelHref}>Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? savingText : 'Salvar Serviço'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
