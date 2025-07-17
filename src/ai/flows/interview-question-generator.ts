'use server';

/**
 * @fileOverview AI tool to generate interview questions based on a job description.
 *
 * - generateInterviewQuestions - A function that handles the question generation process.
 * - GenerateInterviewQuestionsInput - The input type for the generateInterviewQuestions function.
 * - GenerateInterviewQuestionsOutput - The return type for the generateInterviewQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInterviewQuestionsInputSchema = z.object({
  jobDescription: z.string().describe('The full job description for the role.'),
});
export type GenerateInterviewQuestionsInput = z.infer<typeof GenerateInterviewQuestionsInputSchema>;

const QuestionSchema = z.object({
    question: z.string().describe("The interview question."),
    tip: z.string().describe("A brief tip on how to best answer this question.")
});

const GenerateInterviewQuestionsOutputSchema = z.object({
  behavioralQuestions: z.array(QuestionSchema).describe('A list of behavioral interview questions.'),
  technicalQuestions: z.array(QuestionSchema).describe('A list of technical or role-specific questions.'),
});
export type GenerateInterviewQuestionsOutput = z.infer<typeof GenerateInterviewQuestionsOutputSchema>;

export async function generateInterviewQuestions(input: GenerateInterviewQuestionsInput): Promise<GenerateInterviewQuestionsOutput> {
  return generateInterviewQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInterviewQuestionsPrompt',
  input: {schema: GenerateInterviewQuestionsInputSchema},
  output: {schema: GenerateInterviewQuestionsOutputSchema},
  prompt: `You are an expert career coach and interview preparer. Your task is to generate a list of potential interview questions based on the provided job description.

You must generate two types of questions:
1.  **Behavioral Questions**: These should assess soft skills, cultural fit, and situational judgment relevant to the role described.
2.  **Technical Questions**: These should assess the specific hard skills, knowledge, and abilities required for the job.

For each question, also provide a concise, actionable tip on how a candidate should approach answering it.

Job Description:
{{{jobDescription}}}

Generate a helpful list of questions and tips to prepare the candidate for their interview.
`,
});

const generateInterviewQuestionsFlow = ai.defineFlow(
  {
    name: 'generateInterviewQuestionsFlow',
    inputSchema: GenerateInterviewQuestionsInputSchema,
    outputSchema: GenerateInterviewQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
