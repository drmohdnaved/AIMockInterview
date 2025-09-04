'use server';

/**
 * @fileOverview Generates tailored interview questions based on a resume and job description.
 *
 * - generateTailoredInterviewQuestions - A function that generates interview questions.
 * - GenerateTailoredInterviewQuestionsInput - The input type for the generateTailoredInterviewQuestions function.
 * - GenerateTailoredInterviewQuestionsOutput - The return type for the generateTailoredInterviewQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTailoredInterviewQuestionsInputSchema = z.object({
  resumeText: z.string().describe('The text content of the resume.'),
  jobDescription: z.string().describe('The job description.'),
  language: z.string().describe('The language for the interview questions (e.g., "en-US", "hi-IN").'),
});
export type GenerateTailoredInterviewQuestionsInput =
  z.infer<typeof GenerateTailoredInterviewQuestionsInputSchema>;

const GenerateTailoredInterviewQuestionsOutputSchema = z.object({
  questions: z.array(z.string()).describe('An array of tailored interview questions.'),
});
export type GenerateTailoredInterviewQuestionsOutput =
  z.infer<typeof GenerateTailoredInterviewQuestionsOutputSchema>;

export async function generateTailoredInterviewQuestions(
  input: GenerateTailoredInterviewQuestionsInput
): Promise<GenerateTailoredInterviewQuestionsOutput> {
  return generateTailoredInterviewQuestionsFlow(input);
}

const questionGenerationPrompt = ai.definePrompt({
  name: 'questionGenerationPrompt',
  input: {schema: GenerateTailoredInterviewQuestionsInputSchema},
  output: {schema: GenerateTailoredInterviewQuestionsOutputSchema},
  prompt: `You are an expert interview question generator. Given a resume and a job description, you will generate a list of approximately 10 interview questions tailored to the candidate's experience and the job requirements.

The questions must be in the following language: {{language}}.

Resume:
{{resumeText}}

Job Description:
{{jobDescription}}

Questions:
`,
});

const generateTailoredInterviewQuestionsFlow = ai.defineFlow(
  {
    name: 'generateTailoredInterviewQuestionsFlow',
    inputSchema: GenerateTailoredInterviewQuestionsInputSchema,
    outputSchema: GenerateTailoredInterviewQuestionsOutputSchema,
  },
  async input => {
    const {output} = await questionGenerationPrompt(input);
    return output!;
  }
);
