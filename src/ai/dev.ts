import { config } from 'dotenv';
config();

import '@/ai/flows/process-responses-generate-follow-up.ts';
import '@/ai/flows/extract-info-resume-job-description.ts';
import '@/ai/flows/generate-tailored-interview-questions.ts';
import '@/ai/flows/generate-interview-feedback.ts';
import '@/ai/flows/text-to-speech.ts';
