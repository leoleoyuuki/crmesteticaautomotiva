'use server';

import { predictServiceExpiration, PredictServiceExpirationInput } from '@/ai/flows/predict-service-expiration';
import { recommendServicePackages, RecommendServicePackagesInput } from '@/ai/flows/recommend-service-packages';

export async function getServiceRecommendations(input: RecommendServicePackagesInput) {
    try {
        const result = await recommendServicePackages(input);
        return { success: true, data: result };
    } catch (error) {
        console.error('Error in getServiceRecommendations:', error);
        return { success: false, error: "Falha ao obter recomendações. Verifique o console do servidor para mais detalhes." };
    }
}

export async function getExpirationPrediction(input: PredictServiceExpirationInput) {
    try {
        const result = await predictServiceExpiration(input);
        return { success: true, data: result };
    } catch (error) {
        console.error('Error in getExpirationPrediction:', error);
        return { success: false, error: "Falha ao prever a data de vencimento. Verifique o console do servidor para mais detalhes." };
    }
}
