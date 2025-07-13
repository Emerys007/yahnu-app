'use server';

/**
 * @fileOverview AI tool to create relevant skills assessments for companies, covering both "Basic Fit" and "Cognitive Aptitude" tests.
 *
 * - generateAssessment - A function that handles the assessment generation process.
 * - GenerateAssessmentInput - The input type for the generateAssessment function.
 * - GenerateAssessmentOutput - The return type for the generateAssessment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAssessmentInputSchema = z.object({
  jobDescription: z.string().describe('The description of the job.'),
  companyValues: z.string().describe('The core values of the company.'),
  basicFitQuestions: z.number().describe('The number of basic fit questions to generate.'),
  cognitiveAptitudeQuestions: z.number().describe('The number of cognitive aptitude questions to generate.'),
});
export type GenerateAssessmentInput = z.infer<typeof GenerateAssessmentInputSchema>;

const GenerateAssessmentOutputSchema = z.object({
  basicFitAssessment: z.array(z.string()).describe('The generated basic fit assessment questions.'),
  cognitiveAptitudeAssessment: z
    .array(z.string())
    .describe('The generated cognitive aptitude assessment questions.'),
});
export type GenerateAssessmentOutput = z.infer<typeof GenerateAssessmentOutputSchema>;

export async function generateAssessment(input: GenerateAssessmentInput): Promise<GenerateAssessmentOutput> {
  return generateAssessmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAssessmentPrompt',
  input: {schema: GenerateAssessmentInputSchema},
  output: {schema: GenerateAssessmentOutputSchema},
  prompt: `You are an AI-powered assessment generator that helps companies evaluate candidates efficiently.

You will generate skills assessments covering both "Basic Fit" and "Cognitive Aptitude" tests, appropriate to the job description and company values.

Job Description: {{{jobDescription}}}
Company Values: {{{companyValues}}}

Number of Basic Fit Questions: {{{basicFitQuestions}}}
Number of Cognitive Aptitude Questions: {{{cognitiveAptitudeQuestions}}}

Generate both basic fit and cognitive aptitude questions, returning them as separate arrays.

Ensure that the basic fit questions assess the candidate's alignment with the company values and the cognitive aptitude questions test their problem-solving and critical-thinking skills.

Format the output as a JSON object with "basicFitAssessment" and "cognitiveAptitudeAssessment" keys, each containing an array of strings representing the generated questions.
`,
});

const generateAssessmentFlow = ai.defineFlow(
  {
    name: 'generateAssessmentFlow',
    inputSchema: GenerateAssessmentInputSchema,
    outputSchema: GenerateAssessmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
