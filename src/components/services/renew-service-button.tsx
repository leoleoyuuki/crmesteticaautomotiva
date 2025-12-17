'use client';

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
import { firestore } from "@/firebase/firebase";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition, useState, ReactNode } from "react";

type RenewalService = {
  clientId: string;
  vehicleId: string;
  serviceId: string;
  serviceType: string;
  notes?: string;
  cost: number;
  durationDays: number;
  isRenewed?: boolean;
};

interface RenewServiceButtonProps {
    service: RenewalService;
    userId: string;
    children: ReactNode;
    asChild?: boolean;
}

export function RenewServiceButton({ service, userId, children, asChild }: RenewServiceButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleRenew = () => {
    startTransition(async () => {
      try {
        const serviceRef = doc(firestore, 'users', userId, 'clients', service.clientId, 'vehicles', service.vehicleId, 'serviceHistory', service.serviceId);
        await updateDoc(serviceRef, { isRenewed: true });

        toast({
          title: "Serviço marcado como renovado!",
          description: "Agora, crie o novo registro de serviço com os dados preenchidos.",
        });

        const queryParams = new URLSearchParams({
            clientId: service.clientId,
            vehicleId: service.vehicleId,
            serviceType: service.serviceType,
            cost: service.cost.toString(),
            durationDays: service.durationDays.toString(),
            notes: service.notes || '',
        });

        router.push(`/services/new?${queryParams.toString()}`);
        router.refresh();
        setIsOpen(false);
      } catch (error) {
        console.error("Failed to mark service as renewed:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível marcar o serviço como renovado.",
        });
      }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Renovar Serviço?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso marcará o serviço atual como 'Renovado' e te levará para uma nova página para registrar o novo serviço com os dados já preenchidos. Deseja continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleRenew} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Processando..." : "Sim, Renovar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
