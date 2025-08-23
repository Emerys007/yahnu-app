'use server';
/**
 * @fileOverview This file defines a Genkit flow for converting natural language instructions into Yahnu code.
 *
 * - naturalLanguageToCode - A function that takes natural language input and returns generated Yahnu code.
 * - NaturalLanguageToCodeInput - The input type for the naturalLanguageToCode function.
 * - NaturalLanguageToCodeOutput - The return type for the naturalLanguageToCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NaturalLanguageToCodeInputSchema = z.object({
  naturalLanguage: z.string().describe('The natural language instructions to convert to Yahnu code.'),
});
export type NaturalLanguageToCodeInput = z.infer<typeof NaturalLanguageToCodeInputSchema>;

const NaturalLanguageToCodeOutputSchema = z.object({
  yahnuCode: z.string().describe('The generated Yahnu code corresponding to the natural language input.'),
});
export type NaturalLanguageToCodeOutput = z.infer<typeof NaturalLanguageToCodeOutputSchema>;

export async function naturalLanguageToCode(input: NaturalLanguageToCodeInput): Promise<NaturalLanguageToCodeOutput> {
  return naturalLanguageToCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'naturalLanguageToCodePrompt',
  input: {schema: NaturalLanguageToCodeInputSchema},
  output: {schema: NaturalLanguageToCodeOutputSchema},
  prompt: `You are an AI expert in converting natural language instructions into Yahnu code.

  Given the following natural language instructions, generate the corresponding Yahnu code.

  Natural Language Instructions: {{{naturalLanguage}}}

  Yahnu Code:`,
});

const naturalLanguageToCodeFlow = ai.defineFlow(
  {
    name: 'naturalLanguageToCodeFlow',
    inputSchema: NaturalLanguageToCodeInputSchema,
    outputSchema: NaturalLanguageToCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
