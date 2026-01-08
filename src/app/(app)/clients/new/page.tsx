'use client';

import { ClientForm } from "@/components/clients/client-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/firebase/auth/use-user";
import { ClientFormData } from "@/lib/types";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { collection, serverTimestamp, runTransaction, doc, increment } from "firebase/firestore";
import { firestore } from "@/firebase/firebase";
import { useToast } from "@/hooks/use-toast";

export default function NewClientPage() {
  const { user } = useUser()!;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleAddClient = async (formData: ClientFormData) => {
    if (!user) return;
    
    startTransition(async () => {
      try {
        await runTransaction(firestore, async (transaction) => {
          const clientsCollection = collection(firestore, 'users', user.uid, 'clients');
          const newClientRef = doc(clientsCollection); // Create a new doc reference with an auto-generated ID

          const newClientData = {
              ...formData,
              createdAt: serverTimestamp(),
          };

          transaction.set(newClientRef, newClientData);

          const summaryRef = doc(firestore, 'users', user.uid, 'summary', 'allTime');
          transaction.update(summaryRef, { 
            totalClients: increment(1) 
          });

          const clientDate = new Date();
          const clientMonthKey = `${clientDate.getFullYear()}-${(clientDate.getMonth() + 1).toString().padStart(2, '0')}`;
          const clientGrowthRef = doc(firestore, 'users', user.uid, 'summary', 'allTime');
          // This part is tricky with transactions. For simplicity, we might need a cloud function
          // or a more complex client-side update (read-then-write) for the array.
          // For now, let's focus on incrementing totals. A migration/re-calc can fix this.
        });
        
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
