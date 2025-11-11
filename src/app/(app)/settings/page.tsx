'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/firebase/auth/use-user';
import { auth } from '@/firebase/firebase';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';

const profileSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, { message: "Senha atual é obrigatória."}),
  newPassword: z.string().min(6, { message: "A nova senha deve ter pelo menos 6 caracteres." }),
  confirmPassword: z.string().min(6, { message: "Confirme sua nova senha." }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});


type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isProfilePending, startProfileTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.displayName || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleProfileUpdate = async (data: ProfileFormData) => {
    if (!user) return;
    setError(null);
    
    startProfileTransition(async () => {
      try {
        await updateProfile(user, { displayName: data.name });
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, { name: data.name });

        toast({
          title: "Perfil Atualizado",
          description: "Seu nome foi alterado com sucesso.",
        });
      } catch (e: any) {
        console.error(e);
        setError("Não foi possível atualizar o perfil.");
      }
    });
  }

  const handlePasswordUpdate = async (data: PasswordFormData) => {
    if (!user || !user.email) return;
    setError(null);

    startPasswordTransition(async () => {
      try {
        const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, data.newPassword);

        toast({
          title: "Senha Alterada",
          description: "Sua senha foi atualizada com sucesso.",
        });
        passwordForm.reset();
      } catch (e: any) {
        console.error(e);
        if (e.code === 'auth/wrong-password') {
            setError("A senha atual está incorreta.");
        } else {
            setError("Não foi possível alterar a senha.");
        }
      }
    });
  }


  return (
        <div className="space-y-6">
            <Card>
            <CardHeader>
                <CardTitle className="font-headline">Configurações</CardTitle>
                <CardDescription>Gerencie as configurações da sua conta e da aplicação.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="profile">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="profile">Perfil</TabsTrigger>
                        <TabsTrigger value="password">Segurança</TabsTrigger>
                        <TabsTrigger value="support">Suporte</TabsTrigger>
                    </TabsList>
                    <TabsContent value="profile" className="mt-6">
                      <Card className="border-none shadow-none">
                        <CardHeader>
                          <CardTitle>Nome do Perfil</CardTitle>
                          <CardDescription>Atualize seu nome de exibição.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4 max-w-md">
                              <div className="space-y-2">
                                <Label htmlFor="name">Nome</Label>
                                <Input id="name" {...profileForm.register('name')} />
                                {profileForm.formState.errors.name && <p className="text-sm text-destructive">{profileForm.formState.errors.name.message}</p>}
                              </div>
                              <Button type="submit" disabled={isProfilePending}>
                                {isProfilePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Alterações
                              </Button>
                           </form>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="password">
                      <Card className="border-none shadow-none">
                          <CardHeader>
                            <CardTitle>Alterar Senha</CardTitle>
                            <CardDescription>Para sua segurança, recomendamos usar uma senha forte.</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-4 max-w-md">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Senha Atual</Label>
                                    <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} />
                                    {passwordForm.formState.errors.currentPassword && <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">Nova Senha</Label>
                                    <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} />
                                    {passwordForm.formState.errors.newPassword && <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                                    <Input id="confirmPassword" type="password" {...passwordForm.register('confirmPassword')} />
                                    {passwordForm.formState.errors.confirmPassword && <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>}
                                </div>
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                                <Button type="submit" disabled={isPasswordPending}>
                                    {isPasswordPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Alterar Senha
                                </Button>
                            </form>
                          </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="support">
                       <Card className="border-none shadow-none">
                          <CardHeader>
                            <CardTitle>Suporte Técnico</CardTitle>
                            <CardDescription>Precisa de ajuda ou tem alguma sugestão? Fale conosco.</CardDescription>
                          </CardHeader>
                          <CardContent>
                              <Button asChild>
                                  <a href="https://wa.me/11957211546?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20sistema%20CRM%20AutoEst%C3%A9tica." target="_blank" rel="noopener noreferrer">
                                      <MessageCircle className="mr-2 h-4 w-4" />
                                      Entrar em contato via WhatsApp
                                  </a>
                              </Button>
                          </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </CardContent>
            </Card>
        </div>
  );
}
