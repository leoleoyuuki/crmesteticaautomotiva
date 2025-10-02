import { ClientForm } from "@/components/clients/client-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addClient } from "@/app/actions";

export default function NewClientPage() {

  async function handleAddClient(data: any) {
    'use server';
    return await addClient(data);
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
          savingText="Salvando..."
        />
      </CardContent>
    </Card>
  );
}
