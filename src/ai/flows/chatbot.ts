// This is an AI-powered chatbot for answering user questions.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatbotInputSchema = z.object({
  query: z.string().describe('The user query or question.'),
});
export type ChatbotInput = z.infer<typeof ChatbotInputSchema>;

const ChatbotOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user query.'),
});
export type ChatbotOutput = z.infer<typeof ChatbotOutputSchema>;

export async function chatbotAssistance(input: ChatbotInput): Promise<ChatbotOutput> {
  return chatbotAssistanceFlow(input);
}

const chatbotPrompt = ai.definePrompt({
  name: 'chatbotPrompt',
  input: {schema: ChatbotInputSchema},
  output: {schema: ChatbotOutputSchema},
  prompt: `You are a helpful chatbot assistant designed to answer user questions about Yahnu.
  Use the following context to answer the user question.
  Context: Yahnu is a platform for graduates, companies, and schools to connect and find job opportunities.
  Question: {{{query}}}`,
});

const chatbotAssistanceFlow = ai.defineFlow(
  {
    name: 'chatbotAssistanceFlow',
    inputSchema: ChatbotInputSchema,
    outputSchema: ChatbotOutputSchema,
  },
  async input => {
    const {output} = await chatbotPrompt(input);
    return output!;
  }
);
