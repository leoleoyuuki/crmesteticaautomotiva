'use client';

import { useState, useTransition } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { doc, runTransaction, increment, getDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { useToast } from '@/hooks/use-toast';

interface DeleteServiceButtonProps {
  userId: string;
  clientId: string;
  vehicleId: string;
  serviceId: string;
}

export function DeleteServiceButton({ userId, clientId, vehicleId, serviceId }: DeleteServiceButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = () => {
    startTransition(async () => {
      const serviceDocRef = doc(firestore, 'users', userId, 'clients', clientId, 'vehicles', vehicleId, 'serviceHistory', serviceId);
      
      try {
        await runTransaction(firestore, async (transaction) => {
          const serviceDoc = await transaction.get(serviceDocRef);
          if (!serviceDoc.exists()) {
            throw new Error("Serviço não encontrado!");
          }

          const costToDecrement = serviceDoc.data().cost || 0;
          
          transaction.delete(serviceDocRef);
          
          const summaryRef = doc(firestore, 'users', userId, 'summary', 'allTime');
          transaction.update(summaryRef, {
            totalServices: increment(-1),
            totalRevenue: increment(-costToDecrement)
          });
          
           // Update monthly revenue
           const serviceDate = new Date(serviceDoc.data().date);
           const serviceMonthKey = `${serviceDate.getFullYear()}-${(serviceDate.getMonth() + 1).toString().padStart(2, '0')}`;
           const monthlyRevenueRef = doc(firestore, 'users', userId, 'monthlyRevenues', serviceMonthKey);
           transaction.update(monthlyRevenueRef, {
               revenue: increment(-costToDecrement)
           });
        });

        toast({
          title: "Serviço excluído",
          description: "O registro de serviço foi removido."
        });
        router.refresh();
      } catch (error) {
        console.error("Failed to delete service record:", error);
        toast({
          variant: "destructive",
          title: "Erro ao excluir",
          description: "Não foi possível remover o serviço."
        });
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir registro de serviço?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. Isso excluirá permanentemente este registro do histórico de serviços.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Excluindo..." : "Sim, excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
