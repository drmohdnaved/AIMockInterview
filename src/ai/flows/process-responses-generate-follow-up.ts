'use server';

/**
 * @fileOverview This file defines a Genkit flow for processing candidate responses
 * and generating relevant follow-up questions during a mock interview.
 *
 * - processResponsesAndGenerateFollowUp - Processes candidate responses and generates follow-up questions.
 * - ProcessResponsesAndGenerateFollowUpInput - The input type for the processResponsesAndGenerateFollowUp function.
 * - ProcessResponsesAndGenerateFollowUpOutput - The return type for the processResponsesAndGenerateFollowUp function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessResponsesAndGenerateFollowUpInputSchema = z.object({
  jobDescription: z.string().describe('The job description for the role.'),
  resume: z.string().describe("The candidate's resume text."),
  language: z.string().describe('The language of the interview (e.g., "en-US", "hi-IN").'),
  question: z.string().describe('The current interview question asked.'),
  answer: z.string().describe('The candidate\'s answer to the current question.'),
  previousQuestionsAndAnswers: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ).optional().describe('The list of previous questions and answers in the interview.'),
});

export type ProcessResponsesAndGenerateFollowUpInput = z.infer<typeof ProcessResponsesAndGenerateFollowUpInputSchema>;

const ProcessResponsesAndGenerateFollowUpOutputSchema = z.object({
  followUpQuestion: z.string().describe('A relevant follow-up question to ask the candidate, or an empty string if no follow-up is needed. This question should be in the specified interview language.'),
  evaluation: z.string().describe('An evaluation of the candidate\'s answer, in the specified interview language.'),
});

export type ProcessResponsesAndGenerateFollowUpOutput = z.infer<typeof ProcessResponsesAndGenerateFollowUpOutputSchema>;

export async function processResponsesAndGenerateFollowUp(
  input: ProcessResponsesAndGenerateFollowUpInput
): Promise<ProcessResponsesAndGenerateFollowUpOutput> {
  return processResponsesAndGenerateFollowUpFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processResponsesAndGenerateFollowUpPrompt',
  input: {schema: ProcessResponsesAndGenerateFollowUpInputSchema},
  output: {schema: ProcessResponsesAndGenerateFollowUpOutputSchema},
  prompt: `You are an AI-powered interview assistant. Your role is to analyze a candidate's response to an interview question, provide a brief evaluation, and generate a relevant follow-up question if necessary. All of your output (evaluation and follow-up question) must be in the specified language: {{language}}.

  Here is the job description:
  {{jobDescription}}

  Here is the candidate's resume:
  {{resume}}

  Current Question: {{question}}
  Candidate's Answer: {{answer}}

  Previous Questions and Answers:
  {{#each previousQuestionsAndAnswers}}
  Question: {{this.question}}
  Answer: {{this.answer}}
  {{/each}}

  Evaluate the candidate's answer to the current question based on Clarity, Relevance to the role, and use of the STAR method. Based on the answer, generate a relevant follow-up question. If the answer is satisfactory and no follow-up is needed, set followUpQuestion to an empty string.

  Ensure the follow-up question is specific, relevant to the job description and resume, and aims to explore the candidate's skills and experience in more depth. Also provide a brief evaluation of the answer provided by the candidate. Your entire response must be in {{language}}.
  `, 
});

const processResponsesAndGenerateFollowUpFlow = ai.defineFlow(
  {
    name: 'processResponsesAndGenerateFollowUpFlow',
    inputSchema: ProcessResponsesAndGenerateFollowUpInputSchema,
    outputSchema: ProcessResponsesAndGenerateFollowUpOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
