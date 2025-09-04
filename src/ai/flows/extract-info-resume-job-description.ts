'use server';
/**
 * @fileOverview Extracts relevant information from a resume and job description.
 *
 * - extractInformation - A function that extracts information from the resume and job description.
 * - ExtractInformationInput - The input type for the extractInformation function.
 * - ExtractInformationOutput - The return type for the extractInformation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractInformationInputSchema = z.object({
  resumeText: z.string().describe('The text content of the resume.'),
  jobDescriptionText: z.string().describe('The text content of the job description.'),
});
export type ExtractInformationInput = z.infer<typeof ExtractInformationInputSchema>;

const ExtractInformationOutputSchema = z.object({
  candidateSkills: z.array(z.string()).describe('Skills extracted from the resume.'),
  jobRequirements: z.array(z.string()).describe('Requirements extracted from the job description.'),
  resumeSummary: z.string().describe('Summary of the resume.'),
  jobSummary: z.string().describe('Summary of the job description.'),
});
export type ExtractInformationOutput = z.infer<typeof ExtractInformationOutputSchema>;

export async function extractInformation(input: ExtractInformationInput): Promise<ExtractInformationOutput> {
  return extractInformationFlow(input);
}

const extractInformationPrompt = ai.definePrompt({
  name: 'extractInformationPrompt',
  input: {schema: ExtractInformationInputSchema},
  output: {schema: ExtractInformationOutputSchema},
  prompt: `You are an expert at extracting information from resumes and job descriptions.

  Extract key skills from the following resume:
  {{resumeText}}

  Extract key requirements from the following job description:
  {{jobDescriptionText}}

  Create a concise summary of the resume, highlighting relevant experience and qualifications.
  Create a concise summary of the job description, highlighting the main responsibilities and requirements.
  `,
});

const extractInformationFlow = ai.defineFlow(
  {
    name: 'extractInformationFlow',
    inputSchema: ExtractInformationInputSchema,
    outputSchema: ExtractInformationOutputSchema,
  },
  async input => {
    const {output} = await extractInformationPrompt(input);
    return output!;
  }
);
