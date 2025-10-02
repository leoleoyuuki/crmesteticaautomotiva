'use client';

import { ClientForm } from "@/components/clients/client-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addClient } from "@/app/actions";
import { useUser } from "@/firebase/auth/use-user";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppLayout } from "@/components/layout/app-layout";


export default function NewClientPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  if (loading || !user) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  // A função de Server Action é vinculada com o ID do usuário.
  const addClientWithUser = addClient.bind(null, user.uid);

  return (
    <AppLayout>
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
    </AppLayout>
  );
}
