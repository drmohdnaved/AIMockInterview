'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating final feedback
 * at the end of a mock interview.
 *
 * - generateInterviewFeedback - Generates a final report with feedback and suggestions.
 * - GenerateInterviewFeedbackInput - The input type for the generateInterviewFeedback function.
 * - GenerateInterviewFeedbackOutput - The return type for the generateInterviewFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInterviewFeedbackInputSchema = z.object({
  jobDescription: z.string().describe('The job description for the role.'),
  resume: z.string().describe("The candidate's resume text."),
  language: z.string().describe('The language of the interview (e.g., "en-US", "hi-IN").'),
  interviewLog: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
        evaluation: z.string(),
      })
    )
    .describe(
      'The full log of the interview, including questions, answers, and individual evaluations.'
    ),
});

export type GenerateInterviewFeedbackInput = z.infer<
  typeof GenerateInterviewFeedbackInputSchema
>;

const EvaluationParameterSchema = z.object({
  parameter: z.string().describe('The name of the evaluation parameter.'),
  score: z.number().describe('A score from 1 to 10 for this parameter.'),
  feedback: z.string().describe('Specific feedback for this parameter.'),
});

const GenerateInterviewFeedbackOutputSchema = z.object({
  overallFeedback: z
    .string()
    .describe(
      "A summary of the candidate's overall performance in the interview, in the specified language."
    ),
  strengths: z
    .array(z.string())
    .describe(
      "A list of the candidate's key strengths, based on their answers, in the specified language. If there are none, return an array with a single string: 'No specific strengths were identified.'"
    ),
  areasForImprovement: z
    .array(z.string())
    .describe(
      'A list of areas where the candidate can improve, in the specified language. If there are none, return an array with a single string: "No specific areas for improvement were identified."'
    ),
  detailedEvaluations: z
    .array(EvaluationParameterSchema)
    .describe(
      'An array of detailed evaluations for each key parameter.'
    ),
});

export type GenerateInterviewFeedbackOutput = z.infer<
  typeof GenerateInterviewFeedbackOutputSchema
>;

export async function generateInterviewFeedback(
  input: GenerateInterviewFeedbackInput
): Promise<GenerateInterviewFeedbackOutput> {
  return generateInterviewFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInterviewFeedbackPrompt',
  input: {schema: GenerateInterviewFeedbackInputSchema},
  output: {schema: GenerateInterviewFeedbackOutputSchema},
  prompt: `You are an AI-powered interview coach. Your task is to provide a final, comprehensive report on a candidate's mock interview performance. Your entire response must be in the specified language: {{language}}.

  IMPORTANT: Your analysis and feedback must be based **exclusively** on the Interview Transcript and Evaluations provided below. Do NOT use the Job Description or Resume to generate this final report. The feedback should reflect only what happened during the interview itself.

  Interview Transcript and Evaluations:
  {{#each interviewLog}}
  Question: {{this.question}}
  Answer: {{this.answer}}
  Evaluation: {{this.evaluation}}
  ---
  {{/each}}

  Based *only* on the interview transcript, provide the following in {{language}}:
  1.  A concise paragraph of overall feedback on the performance.
  2.  A list of the candidate's key strengths. If none are apparent, explicitly state that.
  3.  A list of the most important areas for improvement. If none are apparent, explicitly state that.
  4.  A detailed evaluation for each of the following 6 parameters, derived from the interview log. For each parameter, provide a score from 1 to 10 and specific, constructive feedback based on the answers given.
      - Clarity & Conciseness
      - Relevance to Role
      - STAR Method Usage
      - Impact & Results
      - Problem-Solving Skills
      - Overall Communication
  `,
});

const generateInterviewFeedbackFlow = ai.defineFlow(
  {
    name: 'generateInterviewFeedbackFlow',
    inputSchema: GenerateInterviewFeedbackInputSchema,
    outputSchema: GenerateInterviewFeedbackOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
