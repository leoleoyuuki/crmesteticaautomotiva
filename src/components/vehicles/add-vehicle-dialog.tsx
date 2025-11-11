'use client';

import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { VehicleForm } from './vehicle-form';
import { Vehicle, VehicleFormData } from '@/lib/types';
import { useUser } from '@/firebase/auth/use-user';
import { addDoc, collection } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { useToast } from '@/hooks/use-toast';

interface AddVehicleDialogProps {
  children: React.ReactNode;
  clientId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onVehicleAdded: (newVehicle: Vehicle) => void;
  disabled?: boolean;
}

export function AddVehicleDialog({ children, clientId, isOpen, onOpenChange, onVehicleAdded, disabled }: AddVehicleDialogProps) {
  const { user } = useUser()!;
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleAddVehicle = async (formData: VehicleFormData) => {
    if (!user || !clientId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Cliente não selecionado."
      });
      return;
    };

    const vehiclesCollection = collection(firestore, 'users', user.uid, 'clients', clientId, 'vehicles');
    
    startTransition(async () => {
        try {
            const docRef = await addDoc(vehiclesCollection, formData);
            toast({
                title: "Veículo adicionado!",
                description: "O novo veículo foi salvo com sucesso."
            });
             onVehicleAdded({ 
              ...formData,
              id: docRef.id,
              serviceHistory: [] 
            });
            onOpenChange(false);
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild disabled={disabled}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Veículo</DialogTitle>
          <DialogDescription>
            Cadastre um novo veículo para o cliente selecionado.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
           <VehicleForm 
             onSave={handleAddVehicle} 
             isPending={isPending}
             savingText="Adicionando..."
             cancelHref="" // Href is not used, dialog will be closed
             onCancel={() => onOpenChange(false)}
           />
        </div>
      </DialogContent>
    </Dialog>
  );
}
