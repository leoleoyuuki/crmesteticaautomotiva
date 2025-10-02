'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getExpirationPrediction } from '@/app/actions';
import { Client, Vehicle, ServiceRecord } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '../ui/dialog';
import { Sparkles, Bot, CalendarClock, Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface ExpirationPredictionProps {
    client: Client;
    vehicle: Vehicle;
    service: ServiceRecord;
}

export function ExpirationPrediction({ client, vehicle, service }: ExpirationPredictionProps) {
    const [prediction, setPrediction] = useState<string | null>(null);
    const [reasoning, setReasoning] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const handleFetchPrediction = async () => {
        setIsLoading(true);
        setError(null);
        setPrediction(null);
        setReasoning(null);

        const serviceHistory = vehicle.serviceHistory.map(s => `${s.serviceType} em ${s.date}`).join(', ');
        const vehicleUsage = "Uso moderado, 15.000 km por ano."; // Exemplo de uso
        const lastServiceDate = service.date;
        const serviceType = service.serviceType;
    
        const result = await getExpirationPrediction({ serviceHistory, vehicleUsage, lastServiceDate, serviceType });
        if (result.success && result.data) {
          setPrediction(result.data.predictedExpirationDate);
          setReasoning(result.data.reasoning);
        } else {
          setError(result.error || "Ocorreu um erro desconhecido.");
        }
        setIsLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleFetchPrediction}>
                    <Sparkles className="h-4 w-4 text-accent" />
                    <span className="sr-only">Prever Vencimento</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="font-headline flex items-center gap-2"><Bot className="text-primary"/> Previsão de Vencimento com IA</DialogTitle>
                    <DialogDescription>
                        Previsão para o serviço de <strong>{service.serviceType}</strong> no veículo <strong>{vehicle.make} {vehicle.model}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-muted-foreground">Analisando dados e gerando previsão...</p>
                        </div>
                    )}
                    {error && (
                        <Alert variant="destructive">
                            <AlertTitle>Erro na Previsão</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {prediction && (
                        <div className="space-y-4">
                            <div className="text-center p-6 bg-secondary rounded-lg">
                                <p className="text-sm text-muted-foreground">Data de Vencimento Prevista</p>
                                <p className="text-3xl font-bold font-headline text-primary flex items-center justify-center gap-2">
                                    <CalendarClock className="h-7 w-7"/>
                                    {new Date(prediction).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Justificativa da IA:</h4>
                                <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-md border">{reasoning}</p>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Fechar
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
