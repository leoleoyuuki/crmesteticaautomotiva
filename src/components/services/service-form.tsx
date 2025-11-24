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
import { CalendarIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ServiceRecord, ServiceRecordFormData } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { ImageUpload } from './image-upload';

const formSchema = z.object({
  serviceType: z.string().min(3, { message: 'O tipo de serviço deve ter pelo menos 3 caracteres.' }),
  date: z.date({ required_error: 'A data do serviço é obrigatória.' }),
  cost: z.coerce.number().min(0, { message: 'O custo não pode ser negativo.' }),
  durationMonths: z.coerce.number().int().min(1, { message: 'A duração deve ser de pelo menos 1 mês.' }),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Convert form data to match the expected type
const toServiceRecordFormData = (data: FormValues): ServiceRecordFormData => ({
    ...data,
    date: data.date.toISOString(),
});

interface ServiceFormProps {
  service?: ServiceRecord;
  onSave: (data: ServiceRecordFormData) => Promise<any>;
  savingText?: string;
  cancelHref: string;
  isPending: boolean;
}

export function ServiceForm({ service, onSave, isPending, savingText = 'Salvando...', cancelHref }: ServiceFormProps) {

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        serviceType: service?.serviceType || '',
        date: service?.date ? new Date(service.date) : new Date(),
        cost: service?.cost || 0,
        durationMonths: service?.durationMonths || 6,
        notes: service?.notes || '',
        imageUrl: service?.imageUrl || '',
    },
  });

  async function onSubmit(values: FormValues) {
      await onSave(toServiceRecordFormData(values));
  }
  
  const handleImageUpload = (url: string) => {
    form.setValue('imageUrl', url);
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
                            format(field.value, "PPP", { })
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
                name="durationMonths"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Duração (meses)</FormLabel>
                    <FormControl>
                        <Input type="number" step="1" placeholder="Ex: 6" {...field} />
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
                    onUploadSuccess={handleImageUpload}
                    initialImageUrl={field.value}
                 />
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
