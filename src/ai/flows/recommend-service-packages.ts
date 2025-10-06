'use server';

/**
 * @fileOverview This file defines a Genkit flow for recommending a single, actionable service package.
 *
 * It exports:
 * - `recommendServicePackages`: An async function that takes client history and vehicle data and returns a specific service recommendation, reasoning, and a pre-formatted WhatsApp message.
 * - `RecommendServicePackagesInput`: The input type for the function.
 * - `RecommendServicePackagesOutput`: The output type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendServicePackagesInputSchema = z.object({
  clientHistory: z
    .string()
    .describe(
      'A detailed history of the client, including past services, vehicle information, and preferences.'
    ),
  vehicleData: z
    .string()
    .describe('Data about the vehicle, such as make, model, year, and mileage.'),
});
export type RecommendServicePackagesInput = z.infer<
  typeof RecommendServicePackagesInputSchema
>;

const RecommendServicePackagesOutputSchema = z.object({
  recommendedService: z
    .string()
    .describe('The single, most relevant service to recommend (e.g., "Cristalização de Vidros").'),
  reasoning: z
    .string()
    .describe('A concise explanation for why this specific service is a good recommendation at this moment.'),
  whatsappMessage: z
    .string()
    .describe('A friendly, ready-to-send WhatsApp message for the client offering the recommended service.'),
});
export type RecommendServicePackagesOutput = z.infer<
  typeof RecommendServicePackagesOutputSchema
>;

export async function recommendServicePackages(
  input: RecommendServicePackagesInput
): Promise<RecommendServicePackagesOutput> {
  const {output} = await recommendServicePackagesFlow.generate({
    input: input,
  });
  return output!;
}

const prompt = ai.definePrompt({
  name: 'recommendServicePackagesPrompt',
  input: {schema: RecommendServicePackagesInputSchema},
  output: {schema: RecommendServicePackagesOutputSchema},
  prompt: `You are an expert auto detailing service advisor for a high-end shop.
  Your goal is to increase sales by suggesting relevant services to existing customers.
  
  **IMPORTANT: Your entire response must be in Brazilian Portuguese (pt-BR).**

  Analyze the client's service history and vehicle data to recommend ONE logical next service. This could be a complementary service to what they've had done, or an upgrade.

  - Client History: {{{clientHistory}}}
  - Vehicle Data: {{{vehicleData}}}

  Based on this, provide:
  1.  **recommendedService**: The name of the single service that makes the most sense to offer now.
  2.  **reasoning**: A brief, compelling reason why this is a good idea for the client at this time.
  3.  **whatsappMessage**: A friendly, natural-sounding WhatsApp message to send to the client. Start with "Olá [Nome do Cliente], tudo bem?". Mention their car and the recommended service. You can offer a small, suggestive discount (like 10% or 15%) to encourage them to book.
  `,
});

const recommendServicePackagesFlow = ai.defineFlow(
  {
    name: 'recommendServicePackagesFlow',
    inputSchema: RecommendServicePackagesInputSchema,
    outputSchema: RecommendServicePackagesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
