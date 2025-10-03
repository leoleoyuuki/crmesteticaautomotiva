'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Wand2 } from 'lucide-react';
import { getServiceRecommendations } from '@/app/actions';
import { Client } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ServiceRecommendationsProps {
  client: Client;
}

type RecommendationData = {
  recommendedService: string;
  reasoning: string;
  whatsappMessage: string;
}

export function ServiceRecommendations({ client }: ServiceRecommendationsProps) {
  const [recommendation, setRecommendation] = useState<RecommendationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendation(null);

    const clientHistory = `Cliente desde: ${new Date(client.createdAt).toLocaleDateString('pt-BR')}. Histórico de serviços: ${client.vehicles.map(v => v.serviceHistory.map(s => `${s.serviceType} em ${new Date(s.date).toLocaleDateString('pt-BR')}`).join(', ')).join('; ')}`;
    const vehicleData = client.vehicles.map(v => `${v.make} ${v.model} ${v.year}`).join(', ');

    // Replace client name placeholder in the generated message
    const result = await getServiceRecommendations({ clientHistory, vehicleData });
    if (result.success && result.data) {
        const messageWithClientName = result.data.whatsappMessage.replace(/\[Nome do Cliente\]/g, client.name.split(' ')[0]);
        setRecommendation({
            ...result.data,
            whatsappMessage: messageWithClientName,
        });
    } else {
      setError(result.error || "Ocorreu um erro desconhecido.");
    }
    setIsLoading(false);
  };
  
  const getWhatsAppLink = (phone: string, message: string) => {
    const formattedPhone = `55${phone.replace(/\D/g, '')}`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  }


  return (
    <Card className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-500/30">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Wand2 className="text-purple-400" />
                    Recomendação Inteligente
                </CardTitle>
                <CardDescription>Use IA para sugerir o próximo serviço e enviar uma oferta personalizada.</CardDescription>
            </div>
            <Button onClick={handleFetchRecommendations} disabled={isLoading || !client.vehicles?.length} variant="secondary">
                {isLoading ? 'Gerando...' : 'Gerar Recomendação'}
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-48 mt-2" />
          </div>
        )}
        {error && (
            <Alert variant="destructive">
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {recommendation && (
            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold text-lg text-purple-300">{recommendation.recommendedService}</h4>
                    <p className="text-sm text-foreground/80">{recommendation.reasoning}</p>
                </div>
                 <Button asChild className="bg-green-100 border-green-300 text-green-800 hover:bg-green-200 hover:text-green-900">
                    <a href={getWhatsAppLink(client.phone, recommendation.whatsappMessage)} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Enviar Oferta via WhatsApp
                    </a>
                </Button>
            </div>
        )}
        {!isLoading && !error && !recommendation && (
            <div className="text-center text-muted-foreground p-4">
                 {client.vehicles?.length > 0
                    ? 'Clique em "Gerar Recomendação" para obter uma sugestão de próximo serviço para este cliente.'
                    : 'Adicione um veículo e um histórico de serviço para gerar recomendações.'
                 }
            </div>
        )}
      </CardContent>
    </Card>
  );
}
