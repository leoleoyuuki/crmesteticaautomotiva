'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2 } from 'lucide-react';
import { getServiceRecommendations } from '@/app/actions';
import { Client } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ServiceRecommendationsProps {
  client: Client;
}

export function ServiceRecommendations({ client }: ServiceRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendations(null);
    setReasoning(null);

    const clientHistory = `Cliente desde: ${new Date(client.createdAt).toLocaleDateString('pt-BR')}. Histórico de serviços: ${client.vehicles.map(v => v.serviceHistory.map(s => `${s.serviceType} em ${new Date(s.date).toLocaleDateString('pt-BR')}`).join(', ')).join('; ')}`;
    const vehicleData = client.vehicles.map(v => `${v.make} ${v.model} ${v.year}`).join(', ');

    const result = await getServiceRecommendations({ clientHistory, vehicleData });
    if (result.success && result.data) {
      setRecommendations(result.data.recommendedPackages);
      setReasoning(result.data.reasoning);
    } else {
      setError(result.error || "Ocorreu um erro desconhecido.");
    }
    setIsLoading(false);
  };

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Wand2 className="text-accent" />
                    Recomendações Inteligentes
                </CardTitle>
                <CardDescription>Sugestões de pacotes de serviços baseadas no histórico do cliente.</CardDescription>
            </div>
            <Button onClick={handleFetchRecommendations} disabled={isLoading} variant="secondary" className="bg-primary/10 hover:bg-primary/20">
                {isLoading ? 'Gerando...' : 'Gerar Recomendações'}
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}
        {error && (
            <Alert variant="destructive">
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {recommendations && (
            <div>
                <h4 className="font-semibold mb-2">Pacotes Recomendados:</h4>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{recommendations}</p>
                {reasoning && (
                    <>
                        <h4 className="font-semibold mt-4 mb-2">Justificativa:</h4>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{reasoning}</p>
                    </>
                )}
            </div>
        )}
        {!isLoading && !error && !recommendations && (
            <div className="text-center text-muted-foreground p-4">
                <p>Clique em "Gerar Recomendações" para obter sugestões personalizadas para este cliente.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
