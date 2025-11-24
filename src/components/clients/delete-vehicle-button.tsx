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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { deleteDoc, doc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { useToast } from '@/hooks/use-toast';

interface DeleteVehicleButtonProps {
  userId: string;
  clientId: string;
  vehicleId: string;
  onSelect: (e: Event) => void;
}

export function DeleteVehicleButton({ userId, clientId, vehicleId, onSelect }: DeleteVehicleButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = () => {
    startTransition(async () => {
      const vehicleDocRef = doc(firestore, 'users', userId, 'clients', clientId, 'vehicles', vehicleId);
      const batch = writeBatch(firestore);

      try {
        const serviceHistoryCollection = collection(vehicleDocRef, 'serviceHistory');
        const serviceHistorySnapshot = await getDocs(serviceHistoryCollection);
        serviceHistorySnapshot.forEach(doc => batch.delete(doc.ref));
        batch.delete(vehicleDocRef);
        
        await batch.commit();

        toast({
          title: "Veículo excluído",
          description: "O veículo e seu histórico foram removidos.",
        });
        router.refresh();
      } catch (error) {
        console.error("Failed to delete vehicle:", error);
        toast({
          variant: "destructive",
          title: "Erro ao excluir",
          description: "Não foi possível remover o veículo.",
        });
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem onSelect={onSelect} className="text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center">
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir Veículo
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. Isso excluirá permanentemente o veículo e seu histórico de serviços.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Excluindo..." : "Sim, excluir veículo"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
