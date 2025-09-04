'use server';

import {
  extractInformation,
} from '@/ai/flows/extract-info-resume-job-description';
import {
  generateInterviewFeedback,
  type GenerateInterviewFeedbackInput,
} from '@/ai/flows/generate-interview-feedback';
import {
  generateTailoredInterviewQuestions,
} from '@/ai/flows/generate-tailored-interview-questions';
import {
  processResponsesAndGenerateFollowUp,
  type ProcessResponsesAndGenerateFollowUpInput,
} from '@/ai/flows/process-responses-generate-follow-up';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import type { InterviewData } from '@/lib/types';

type AnalysisResult = {
  success: boolean;
  data?: InterviewData | null;
  error?: string | null;
};

export async function handleAnalysis(
  _prevState: any,
  formData: FormData
): Promise<AnalysisResult> {
  const resumeText = formData.get('resumeText') as string;
  const jobDescription = formData.get('jobDescription') as string;
  const language = formData.get('language') as string;
  const languageName = formData.get('languageName') as string;

  if (!resumeText || !jobDescription || !language || !languageName) {
    return { success: false, error: 'Resume, Job Description, and Language are required.' };
  }

  try {
    const [info, questions] = await Promise.all([
      extractInformation({
        resumeText: resumeText,
        jobDescriptionText: jobDescription,
      }),
      generateTailoredInterviewQuestions({
        resumeText: resumeText,
        jobDescription: jobDescription,
        language: language,
      }),
    ]);

    return {
      success: true,
      data: { resumeText, jobDescription, info, questions, language, languageName },
    };
  } catch (error) {
    console.error('AI analysis failed:', error);
    return {
      success: false,
      error: 'Failed to analyze documents. Please try again.',
    };
  }
}

export async function getFollowUpQuestion(input: ProcessResponsesAndGenerateFollowUpInput) {
  try {
    const result = await processResponsesAndGenerateFollowUp(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to get follow-up question:', error);
    return { success: false, error: 'Could not generate a follow-up question.' };
  }
}


export async function getFinalFeedback(input: GenerateInterviewFeedbackInput) {
  try {
    const result = await generateInterviewFeedback(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to get final feedback:', error);
    return { success: false, error: 'Could not generate final feedback.' };
  }
}

export async function getSpeechAudio(text: string) {
    try {
        const result = await textToSpeech({ text });
        return { success: true, data: result.audioDataUri };
    } catch (error) {
        console.error('Text-to-speech failed:', error);
        return { success: false, error: 'Failed to generate audio.' };
    }
}
