'use server';

/**
 * @fileOverview AI flow that generates custom charts and data visualizations based on natural language queries.
 *
 * - generateCustomReport - A function that generates custom reports based on user queries.
 * - CustomReportInput - The input type for the generateCustomReport function.
 * - CustomReportOutput - The return type for the generateCustomReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CustomReportInputSchema = z.object({
  query: z.string().describe('Natural language query for generating the custom report.'),
  availableData: z
    .string()
    .optional()
    .describe('Description of available data for generating the report.'),
});
export type CustomReportInput = z.infer<typeof CustomReportInputSchema>;

const CustomReportOutputSchema = z.object({
  report: z.string().describe('The generated custom report in text format.'),
  visualizationData: z
    .string()
    .optional()
    .describe('Data for visualization (e.g., JSON, CSV).'),
});
export type CustomReportOutput = z.infer<typeof CustomReportOutputSchema>;

export async function generateCustomReport(input: CustomReportInput): Promise<CustomReportOutput> {
  return customReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'customReportPrompt',
  input: {schema: CustomReportInputSchema},
  output: {schema: CustomReportOutputSchema},
  prompt: `You are an AI assistant specialized in generating custom reports and data visualizations.

  The user will provide a natural language query, and you should generate a report that answers the query using available data.
  If the user asks for a visualization, provide data that can be used to generate the visualization as well.

  Query: {{{query}}}
  Available Data: {{{availableData}}}
  Report: `,
});

const customReportFlow = ai.defineFlow(
  {
    name: 'customReportFlow',
    inputSchema: CustomReportInputSchema,
    outputSchema: CustomReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
