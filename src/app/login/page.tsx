'use client';

import { useState } from 'react';
import { auth, firestore } from '@/firebase/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;


export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const handleSignIn = async ({ email, password }: LoginFormData) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The layout will now handle redirection based on activation status
      router.push('/dashboard');
    } catch (error: any) {
      setError(getFirebaseErrorMessage(error.code));
    } finally {
        setLoading(false);
    }
  };

  const handleSignUp = async ({ name, email, password }: SignupFormData) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update the user's profile display name in Auth
      await updateProfile(user, { displayName: name });
      
      // Create user profile document in Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, {
        name: name,
        email: email,
        isActivated: false,
        activatedUntil: null,
      });

      // Redirect to activation page after successful signup and document creation
      router.push('/activate');

    } catch (error: any) {
        console.error("Signup Error:", error);
        setError(getFirebaseErrorMessage(error.code));
    } finally {
        setLoading(false);
    }
  };

  const getFirebaseErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'O formato do e-mail é inválido.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'E-mail ou senha incorretos.';
      case 'auth/email-already-in-use':
        return 'Este e-mail já está em uso por outra conta.';
      case 'auth/weak-password':
        return 'A senha é muito fraca. Tente uma mais forte.';
      default:
        return 'Ocorreu um erro. Por favor, tente novamente.';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
        <Tabs defaultValue="login" className="w-full max-w-md">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-headline">Bem-vindo de volta!</CardTitle>
                        <CardDescription>Faça login para continuar gerenciando sua estética automotiva.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={loginForm.handleSubmit(handleSignIn)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="login-email">Email</Label>
                            <Input id="login-email" type="email" placeholder="seu@email.com" {...loginForm.register('email')} />
                            {loginForm.formState.errors.email && <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="login-password">Senha</Label>
                            <Input id="login-password" type="password" {...loginForm.register('password')} />
                            {loginForm.formState.errors.password && <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>}
                        </div>
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Entrar
                        </Button>
                        </form>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="signup">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-headline">Crie sua Conta</CardTitle>
                        <CardDescription>Comece a gerenciar seus clientes de forma inteligente.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    <form onSubmit={signupForm.handleSubmit(handleSignUp)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="signup-name">Seu Nome</Label>
                            <Input id="signup-name" type="text" placeholder="João da Silva" {...signupForm.register('name')} />
                            {signupForm.formState.errors.name && <p className="text-sm text-destructive">{signupForm.formState.errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-email">Email</Label>
                            <Input id="signup-email" type="email" placeholder="seu@email.com" {...signupForm.register('email')} />
                            {signupForm.formState.errors.email && <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-password">Senha</Label>
                            <Input id="signup-password" type="password" {...signupForm.register('password')} />
                            {signupForm.formState.errors.password && <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>}
                        </div>
                        {error && (
                             <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Criar Conta
                        </Button>
                        </form>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
