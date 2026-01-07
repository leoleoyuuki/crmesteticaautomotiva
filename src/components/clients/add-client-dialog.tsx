'use client';

import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { ClientForm } from './client-form';
import { Client, ClientFormData } from '@/lib/types';
import { useUser } from '@/firebase/auth/use-user';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { useToast } from '@/hooks/use-toast';

interface AddClientDialogProps {
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClientAdded: (newClient: Client) => void;
}

export function AddClientDialog({ children, isOpen, onOpenChange, onClientAdded }: AddClientDialogProps) {
  const { user } = useUser()!;
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleAddClient = async (formData: ClientFormData) => {
    if (!user) return;

    const clientsCollection = collection(firestore, 'users', user.uid, 'clients');
    const newClientData = {
      ...formData,
      createdAt: serverTimestamp(),
    };

    startTransition(async () => {
      try {
        const docRef = await addDoc(clientsCollection, newClientData);
        toast({
          title: "Cliente adicionado!",
          description: `${formData.name} foi adicionado à sua lista.`,
        });

        // Callback to update parent component's state
        onClientAdded({ 
          ...formData,
          id: docRef.id,
          createdAt: new Date().toISOString(), // Use client-side date for immediate UI update
          vehicles: [] 
        });

        onOpenChange(false); // Close dialog on success
      } catch(error) {
        console.error("Failed to add client:", error);
        toast({
          variant: "destructive",
          title: "Erro ao adicionar cliente",
          description: "Não foi possível salvar o novo cliente."
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
          <DialogDescription>
            Preencha os detalhes abaixo para cadastrar um novo cliente rapidamente.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
           <ClientForm 
             onSave={handleAddClient} 
             isPending={isPending}
             savingText="Salvando..."
             onCancel={() => onOpenChange(false)}
           />
        </div>
      </DialogContent>
    </Dialog>
  );
}
