'use server';

/**
 * @fileOverview An AI agent for predicting service expiration dates.
 *
 * - predictServiceExpiration - A function that predicts service expiration dates.
 * - PredictServiceExpirationInput - The input type for the predictServiceExpiration function.
 * - PredictServiceExpirationOutput - The return type for the predictServiceExpiration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictServiceExpirationInputSchema = z.object({
  serviceHistory: z
    .string()
    .describe('A detailed history of services performed for the vehicle.'),
  vehicleUsage: z.string().describe('Information about the vehicle usage patterns.'),
  lastServiceDate: z.string().describe('The date of the last service performed.'),
  serviceType: z.string().describe('The type of service performed.'),
});
export type PredictServiceExpirationInput = z.infer<
  typeof PredictServiceExpirationInputSchema
>;

const PredictServiceExpirationOutputSchema = z.object({
  predictedExpirationDate: z
    .string()
    .describe('The predicted expiration date of the service.'),
  reasoning: z
    .string()
    .describe('The reasoning behind the predicted expiration date.'),
});
export type PredictServiceExpirationOutput = z.infer<
  typeof PredictServiceExpirationOutputSchema
>;

export async function predictServiceExpiration(
  input: PredictServiceExpirationInput
): Promise<PredictServiceExpirationOutput> {
  return predictServiceExpirationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictServiceExpirationPrompt',
  input: {schema: PredictServiceExpirationInputSchema},
  output: {schema: PredictServiceExpirationOutputSchema},
  prompt: `You are an expert in predicting service expiration dates for vehicles.

  Based on the service history, vehicle usage, last service date, and service type, predict the expiration date of the service and provide a brief reasoning for your prediction.

  Service History: {{{serviceHistory}}}
  Vehicle Usage: {{{vehicleUsage}}}
  Last Service Date: {{{lastServiceDate}}}
  Service Type: {{{serviceType}}}

  Please provide the predicted expiration date in ISO 8601 format (YYYY-MM-DD).
  `,
});

const predictServiceExpirationFlow = ai.defineFlow(
  {
    name: 'predictServiceExpirationFlow',
    inputSchema: PredictServiceExpirationInputSchema,
    outputSchema: PredictServiceExpirationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
