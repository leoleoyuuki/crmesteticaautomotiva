'use client';

import { ClientForm } from "@/components/clients/client-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/firebase/auth/use-user";
import { ClientFormData } from "@/lib/types";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/firebase/firebase";
import { useToast } from "@/hooks/use-toast";

export default function NewClientPage() {
  const { user } = useUser()!;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
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
        await addDoc(clientsCollection, newClientData);
        toast({
          title: "Cliente adicionado!",
          description: `${formData.name} foi adicionado à sua lista de clientes.`,
        });
        router.push('/clients');
        router.refresh();
      } catch(error) {
        console.error("Failed to add client:", error);
        toast({
          variant: "destructive",
          title: "Erro ao adicionar cliente",
          description: "Não foi possível salvar o novo cliente."
        });
      }
    });
  }

  return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Adicionar Novo Cliente</CardTitle>
          <CardDescription>Preencha os detalhes abaixo para cadastrar um novo cliente.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm 
            onSave={handleAddClient} 
            isPending={isPending}
            savingText="Salvando..."
          />
        </CardContent>
      </Card>
  );
}
