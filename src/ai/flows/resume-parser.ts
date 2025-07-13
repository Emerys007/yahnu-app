// 'use server'
'use server';

/**
 * @fileOverview Parses a resume and extracts information to pre-fill a user profile.
 *
 * - parseResume - A function that handles the resume parsing process.
 * - ParseResumeInput - The input type for the parseResume function.
 * - ParseResumeOutput - The return type for the parseResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseResumeInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "A resume file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ParseResumeInput = z.infer<typeof ParseResumeInputSchema>;

const ParseResumeOutputSchema = z.object({
  name: z.string().describe('The full name of the resume owner.'),
  email: z.string().email().describe('The email address of the resume owner.'),
  phone: z.string().describe('The phone number of the resume owner.'),
  experience: z
    .array(z.string())
    .describe('A list of work experiences from the resume.'),
  education: z
    .array(z.string())
    .describe('A list of educational experiences from the resume.'),
  skills: z.array(z.string()).describe('A list of skills from the resume.'),
});
export type ParseResumeOutput = z.infer<typeof ParseResumeOutputSchema>;

export async function parseResume(input: ParseResumeInput): Promise<ParseResumeOutput> {
  return parseResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseResumePrompt',
  input: {schema: ParseResumeInputSchema},
  output: {schema: ParseResumeOutputSchema},
  prompt: `You are an expert resume parser. You will extract the following information from the resume: name, email, phone, experience, education, and skills.

  Here is the resume:
  {{resumeDataUri}}`,
});

const parseResumeFlow = ai.defineFlow(
  {
    name: 'parseResumeFlow',
    inputSchema: ParseResumeInputSchema,
    outputSchema: ParseResumeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
