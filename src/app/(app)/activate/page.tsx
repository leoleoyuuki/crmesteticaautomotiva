'use client';

import { useState, useTransition, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MessageCircle } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { auth, firestore } from '@/firebase/firebase';
import { Separator } from '@/components/ui/separator';
import { collection, query, where, getDocs, doc, writeBatch, updateDoc } from 'firebase/firestore';
import { addMonths } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';

const formSchema = z.object({
  code: z.string().min(6, { message: 'O código deve ter 6 caracteres.' }).max(6, { message: 'O código deve ter 6 caracteres.' }),
});

type FormData = z.infer<typeof formSchema>;

function ActivatePageContent() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { code: '' },
  });

  const handleActivation = async ({ code }: FormData) => {
    if (!user) {
      setError('Você precisa estar logado para ativar sua conta.');
      return;
    }
    setError(null);

    startTransition(async () => {
      if (!firestore) {
        setError('Firestore não inicializado.');
        return;
      }
      
      const codesCollection = collection(firestore, 'activationCodes');
      const q = query(codesCollection, where('code', '==', code.toUpperCase()));

      try {
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError('Código de ativação inválido.');
          return;
        }

        const codeDoc = querySnapshot.docs[0];
        const codeData = codeDoc.data();

        if (codeData.isUsed) {
          setError('Este código já foi utilizado.');
          return;
        }

        const userDocRef = doc(firestore, 'users', user.uid);
        const now = new Date();
        const activatedUntil = addMonths(now, codeData.durationMonths);

        const batch = writeBatch(firestore);

        batch.update(codeDoc.ref, {
          isUsed: true,
          usedBy: user.uid,
          usedAt: now, // Using client date
        });

        batch.update(userDocRef, {
          isActivated: true,
          activatedUntil: activatedUntil,
        });

        await batch.commit();

        router.push('/dashboard');
        router.refresh(); 

      } catch (e: any) {
        console.error("Activation Error: ", e);
        setError(e.message || 'Falha ao ativar a conta. Verifique o console para mais detalhes.');
      }
    });
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            {isExpired ? (
              <>
                <CardTitle className="text-3xl font-headline">Sua Ativação Expirou</CardTitle>
                <CardDescription>Insira um novo código para reativar seu acesso ou solicite um novo.</CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-3xl font-headline">Ativar sua Conta</CardTitle>
                <CardDescription>Insira o código de ativação que você recebeu para começar a usar o sistema.</CardDescription>
              </>
            )}
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={form.handleSubmit(handleActivation)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código de Ativação</Label>
              <Input
                id="code"
                placeholder="ABCDEF"
                {...form.register('code')}
                className="text-center text-lg tracking-widest uppercase"
              />
              {form.formState.errors.code && <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>}
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isExpired ? 'Reativar Conta' : 'Ativar Conta'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-4">
            <Separator />
            <div className="text-center text-sm text-muted-foreground">
                <p>{isExpired ? "Precisa de um novo código?" : "Não possui um código de ativação?"}</p>
                <Button variant="link" asChild className="text-primary">
                    <a href="https://wa.me/11957211546?text=Ol%C3%A1%2C%20gostaria%20de%20adquirir%20um%20novo%20c%C3%B3digo%20de%20ativa%C3%A7%C3%A3o." target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Solicitar um código
                    </a>
                </Button>
            </div>
           <Button variant="link" className="w-full text-muted-foreground" onClick={handleLogout}>
            Sair da conta
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Carregando...</div>}>
      <ActivatePageContent />
    </Suspense>
  )
}
