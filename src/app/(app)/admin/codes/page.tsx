'use client';

import { useEffect, useState, useTransition } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getActivationCodes } from '@/lib/data';
import { ActivationCode } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from '@/components/ui/label';
import { Loader2, Copy, Calendar, Clock, User as UserIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';

export default function AdminCodesPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [duration, setDuration] = useState<number>(30);
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [isGenerating, startGenerating] = useTransition();

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (!user || user.uid !== 'wtMBWT7OAoXHj9Hlb6alnfFqK3Q2')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Fetch codes
  useEffect(() => {
    async function fetchCodes() {
      if (!user || user.uid !== 'wtMBWT7OAoXHj9Hlb6alnfFqK3Q2') return;
      const fetchedCodes = await getActivationCodes();
      setCodes(fetchedCodes);
    }
    if (user) {
      fetchCodes();
    }
  }, [user]);

  const handleGenerateCode = async () => {
    if (!user) return;
    
    startGenerating(async () => {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const codesCollection = collection(firestore, 'activationCodes');
      
      const newCodeData = {
          code,
          durationDays: duration,
          createdAt: serverTimestamp(),
          isUsed: false,
          usedBy: null,
          usedAt: null,
      };

      await addDoc(codesCollection, newCodeData);
      
      toast({
        title: "Código Gerado!",
        description: `O código ${code} foi criado com sucesso.`,
      });
      
      const newCodes = await getActivationCodes();
      setCodes(newCodes);
    });
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
        title: "Copiado!",
        description: `O código ${text} foi copiado para a área de transferência.`,
    });
  }

  if (loading || !user || user.uid !== 'wtMBWT7OAoXHj9Hlb6alnfFqK3Q2') {
    return <div className="flex h-screen items-center justify-center">Verificando permissões...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerar Código de Ativação</CardTitle>
          <CardDescription>Selecione a duração e gere um novo código de ativação para um usuário.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <RadioGroup defaultValue="30" onValueChange={(val) => setDuration(Number(val))} className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="30" id="d30" />
              <Label htmlFor="d30">30 dias</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="60" id="d60" />
              <Label htmlFor="d60">60 dias</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="90" id="d90" />
              <Label htmlFor="d90">90 dias</Label>
            </div>
             <div className="flex items-center space-x-2">
              <RadioGroupItem value="365" id="d365" />
              <Label htmlFor="d365">365 dias</Label>
            </div>
          </RadioGroup>
          <Button onClick={handleGenerateCode} disabled={isGenerating}>
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gerar Código
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Códigos Gerados</CardTitle>
          <CardDescription>Lista de todos os códigos de ativação gerados.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile View */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {codes.length > 0 ? (
                codes.map((code) => (
                  <div key={code.id} className="border rounded-lg p-4 space-y-3 bg-card/50">
                     <div className="flex items-center justify-between">
                        <Badge variant={code.isUsed ? 'secondary' : 'default'}>
                            {code.isUsed ? 'Usado' : 'Disponível'}
                        </Badge>
                         <span className="text-sm text-muted-foreground">{code.durationDays} dias</span>
                     </div>
                    <div className="font-mono text-xl font-bold flex items-center justify-between">
                      {code.code}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(code.code)}>
                          <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1 pt-2 border-t border-border/50">
                        <p className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Criado em: {format(new Date(code.createdAt), "dd/MM/yyyy")}</p>
                        {code.isUsed && code.usedBy && (
                             <p className="flex items-center gap-2"><UserIcon className="h-4 w-4" /> Usado por: <span className="font-mono text-xs">{code.usedBy}</span></p>
                        )}
                    </div>
                  </div>
                ))
            ) : (
                 <div className="text-center text-muted-foreground py-10 px-4 border rounded-md">
                    <p>Nenhum código gerado ainda.</p>
                </div>
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado Em</TableHead>
                  <TableHead>Usado Por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.length > 0 ? (
                  codes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-2">
                          {code.code}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(code.code)}>
                              <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{code.durationDays} dias</TableCell>
                      <TableCell>
                        <Badge variant={code.isUsed ? 'secondary' : 'default'}>
                          {code.isUsed ? 'Usado' : 'Disponível'}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(code.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
                      <TableCell className="font-mono text-xs">{code.usedBy || '---'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      Nenhum código gerado ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
