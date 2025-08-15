
'use server';

/**
 * @fileOverview This file defines a Genkit flow for summarizing staffing requests using AI.
 *
 * - summarizeRequest - A function that takes request details as input and returns a summarized version.
 * - SummarizeRequestInput - The input type for the summarizeRequest function, defining the structure of request data.
 * - SummarizeRequestOutput - The output type for the summarizeRequest function, representing the summarized request information.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeRequestInputSchema = z.object({
  requestDetails: z.string().describe('Detailed information about the staffing request.'),
});
export type SummarizeRequestInput = z.infer<typeof SummarizeRequestInputSchema>;

const SummarizeRequestOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the staffing request.'),
});
export type SummarizeRequestOutput = z.infer<typeof SummarizeRequestOutputSchema>;

export async function summarizeRequest(input: SummarizeRequestInput): Promise<SummarizeRequestOutput> {
  return summarizeRequestFlow(input);
}

const summarizeRequestPrompt = ai.definePrompt({
  name: 'summarizeRequestPrompt',
  input: {schema: SummarizeRequestInputSchema},
  output: {schema: SummarizeRequestOutputSchema},
  prompt: `You are an expert staffing request summarizer. Please provide a concise and accurate summary of the following request details:\n\nRequest Details: {{{requestDetails}}}`,
});

const summarizeRequestFlow = ai.defineFlow(
  {
    name: 'summarizeRequestFlow',
    inputSchema: SummarizeRequestInputSchema,
    outputSchema: SummarizeRequestOutputSchema,
  },
  async input => {
    const {output} = await summarizeRequestPrompt(input);
    return output!;
  }
);
