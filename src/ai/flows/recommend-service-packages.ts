'use server';

/**
 * @fileOverview This file defines a Genkit flow for recommending service packages based on client history and vehicle data.
 *
 * It exports:
 * - `recommendServicePackages`: An async function that takes client history and vehicle data as input and returns a recommendation for service packages.
 * - `RecommendServicePackagesInput`: The input type for the `recommendServicePackages` function.
 * - `RecommendServicePackagesOutput`: The output type for the `recommendServicePackages` function.
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
  recommendedPackages: z
    .string()
    .describe('A list of recommended service packages tailored to the client and vehicle.'),
  reasoning: z
    .string()

    .describe('The AI reasoning behind the recommended packages.'),
});
export type RecommendServicePackagesOutput = z.infer<
  typeof RecommendServicePackagesOutputSchema
>;

export async function recommendServicePackages(
  input: RecommendServicePackagesInput
): Promise<RecommendServicePackagesOutput> {
  return recommendServicePackagesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendServicePackagesPrompt',
  input: {schema: RecommendServicePackagesInputSchema},
  output: {schema: RecommendServicePackagesOutputSchema},
  prompt: `You are an expert service package recommender for auto detailing services.

  Based on the client history and vehicle data provided, recommend service packages that would be most beneficial to the client.
  Explain your reasoning for each recommendation.

  Client History: {{{clientHistory}}}
  Vehicle Data: {{{vehicleData}}}
  \n  Format your response as a list of recommended packages with a brief explanation for each.
  `,
});

const recommendServicePackagesFlow = ai.defineFlow(
  {
    name: 'recommendServicePackagesFlow',
    inputSchema: RecommendServicePackagesInputSchema,
    outputSchema: RecommendServicePackagesOutputSchema,
  },
  async input => {
    const {output} = await prompt.generate({input});
    return output!;
  }
);
