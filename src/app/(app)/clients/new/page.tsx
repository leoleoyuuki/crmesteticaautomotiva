'use client';

import { ClientForm } from "@/components/clients/client-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addClient } from "@/app/actions";
import { useUser } from "@/firebase/auth/use-user";

export default function NewClientPage() {
  const { user } = useUser()!;

  // A função de Server Action é vinculada com o ID do usuário.
  const addClientWithUser = addClient.bind(null, user.uid);

  return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Adicionar Novo Cliente</CardTitle>
          <CardDescription>Preencha os detalhes abaixo para cadastrar um novo cliente.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm 
            onSave={addClientWithUser} 
            savingText="Salvando..."
          />
        </CardContent>
      </Card>
  );
}
