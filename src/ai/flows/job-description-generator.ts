'use server';

/**
 * @fileOverview AI tool to generate a professional job description.
 *
 * - generateJobDescription - A function that handles the job description generation process.
 * - GenerateJobDescriptionInput - The input type for the generateJobDescription function.
 * - GenerateJobDescriptionOutput - The return type for the generateJobDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateJobDescriptionInputSchema = z.object({
  jobTitle: z.string().describe('The title of the job position.'),
  keyResponsibilities: z.array(z.string()).describe('A list of key responsibilities for the role.'),
  requiredSkills: z.array(z.string()).describe('A list of required skills for the role.'),
});
export type GenerateJobDescriptionInput = z.infer<typeof GenerateJobDescriptionInputSchema>;

const GenerateJobDescriptionOutputSchema = z.object({
  generatedDescription: z.string().describe('The full, professionally formatted job description.'),
});
export type GenerateJobDescriptionOutput = z.infer<typeof GenerateJobDescriptionOutputSchema>;

export async function generateJobDescription(input: GenerateJobDescriptionInput): Promise<GenerateJobDescriptionOutput> {
  return generateJobDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateJobDescriptionPrompt',
  input: {schema: GenerateJobDescriptionInputSchema},
  output: {schema: GenerateJobDescriptionOutputSchema},
  prompt: `You are an expert recruitment copywriter. Your task is to generate a complete and professional job description based on the provided details.

The job description should include the following sections:
1.  A brief, engaging introduction to the role.
2.  A "Key Responsibilities" section, formatted as a bulleted list.
3.  A "Required Skills and Qualifications" section, formatted as a bulleted list.
4.  A concluding paragraph about the company culture and what it's like to work there.

Job Title: {{{jobTitle}}}

Key Responsibilities:
{{#each keyResponsibilities}}
- {{{this}}}
{{/each}}

Required Skills:
{{#each requiredSkills}}
- {{{this}}}
{{/each}}

Generate a compelling job description based on these inputs.
`,
});

const generateJobDescriptionFlow = ai.defineFlow(
  {
    name: 'generateJobDescriptionFlow',
    inputSchema: GenerateJobDescriptionInputSchema,
    outputSchema: GenerateJobDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
