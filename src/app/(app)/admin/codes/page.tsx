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
import { Loader2, Copy } from 'lucide-react';
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

  const [duration, setDuration] = useState<number>(3);
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
          durationMonths: duration,
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
        <CardContent className="flex flex-col md:flex-row items-center gap-6">
          <RadioGroup defaultValue="3" onValueChange={(val) => setDuration(Number(val))} className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3" id="r1" />
              <Label htmlFor="r1">3 Meses</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="6" id="r2" />
              <Label htmlFor="r2">6 Meses</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="12" id="r3" />
              <Label htmlFor="r3">12 Meses</Label>
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
                    <TableCell>{code.durationMonths} meses</TableCell>
                    <TableCell>
                      <Badge variant={code.isUsed ? 'secondary' : 'default'}>
                        {code.isUsed ? 'Usado' : 'Disponível'}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(code.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
                    <TableCell>{code.usedBy || '---'}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}
