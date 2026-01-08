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
import { doc, getDocs, collection, runTransaction, increment } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { useToast } from '@/hooks/use-toast';

interface DeleteClientButtonProps {
  userId: string;
  clientId: string;
}

export function DeleteClientButton({ userId, clientId }: DeleteClientButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = () => {
    startTransition(async () => {
      if (!firestore) {
        toast({ variant: "destructive", title: "Erro", description: "Ocorreu um erro de conexão." });
        return;
      }
      
      try {
        await runTransaction(firestore, async (transaction) => {
          const clientDocRef = doc(firestore, 'users', userId, 'clients', clientId);
          let servicesToDeleteCount = 0;
          let revenueToDecrement = 0;

          const vehiclesCollection = collection(clientDocRef, 'vehicles');
          const vehiclesSnapshot = await getDocs(vehiclesCollection);
          
          for (const vehicleDoc of vehiclesSnapshot.docs) {
              const serviceHistoryCollection = collection(vehicleDoc.ref, 'serviceHistory');
              const serviceHistorySnapshot = await getDocs(serviceHistoryCollection);
              serviceHistorySnapshot.forEach(serviceDoc => {
                  const serviceData = serviceDoc.data();
                  revenueToDecrement += serviceData.cost || 0;
                  servicesToDeleteCount++;
                  transaction.delete(serviceDoc.ref);
              });
              transaction.delete(vehicleDoc.ref);
          }
          transaction.delete(clientDocRef);

          const summaryRef = doc(firestore, 'users', userId, 'summary', 'allTime');
          transaction.update(summaryRef, {
            totalClients: increment(-1),
            totalServices: increment(-servicesToDeleteCount),
            totalRevenue: increment(-revenueToDecrement)
          });
        });

        toast({
          title: "Cliente excluído!",
          description: "O cliente e todos os seus dados foram removidos.",
        });
        setIsOpen(false);
        router.refresh(); // Refresh the current page
      } catch (error) {
        console.error("Failed to delete client:", error);
        toast({
          variant: "destructive",
          title: "Erro ao excluir",
          description: "Não foi possível excluir o cliente.",
        });
      }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. Isso excluirá permanentemente o cliente e todos os seus dados, incluindo veículos e históricos de serviço.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Excluindo..." : "Sim, excluir cliente"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
