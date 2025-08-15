'use server';

/**
 * @fileOverview This file defines a Genkit flow for summarizing insurance claims using AI.
 *
 * - summarizeClaim - A function that takes claim details as input and returns a summarized version.
 * - SummarizeClaimInput - The input type for the summarizeClaim function, defining the structure of claim data.
 * - SummarizeClaimOutput - The output type for the summarizeClaim function, representing the summarized claim information.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeClaimInputSchema = z.object({
  claimDetails: z.string().describe('Detailed information about the insurance claim.'),
});
export type SummarizeClaimInput = z.infer<typeof SummarizeClaimInputSchema>;

const SummarizeClaimOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the insurance claim.'),
});
export type SummarizeClaimOutput = z.infer<typeof SummarizeClaimOutputSchema>;

export async function summarizeClaim(input: SummarizeClaimInput): Promise<SummarizeClaimOutput> {
  return summarizeClaimFlow(input);
}

const summarizeClaimPrompt = ai.definePrompt({
  name: 'summarizeClaimPrompt',
  input: {schema: SummarizeClaimInputSchema},
  output: {schema: SummarizeClaimOutputSchema},
  prompt: `You are an expert insurance claim summarizer. Please provide a concise and accurate summary of the following claim details:\n\nClaim Details: {{{claimDetails}}}`,
});

const summarizeClaimFlow = ai.defineFlow(
  {
    name: 'summarizeClaimFlow',
    inputSchema: SummarizeClaimInputSchema,
    outputSchema: SummarizeClaimOutputSchema,
  },
  async input => {
    const {output} = await summarizeClaimPrompt(input);
    return output!;
  }
);
