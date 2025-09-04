export type ExtractedInfo = {
  candidateSkills: string[];
  jobRequirements: string[];
  resumeSummary: string;
  jobSummary: string;
};

export type GeneratedQuestions = {
  questions: string[];
};

export type InterviewData = {
  resumeText: string;
  jobDescription: string;
  info: ExtractedInfo;
  questions: GeneratedQuestions;
  language: string;
  languageName: string;
};

export type FollowUp = {
  followUpQuestion: string;
  evaluation: string;
};

export type InterviewLogEntry = {
  question: string;
  answer: string;
  evaluation: string;
};

export type EvaluationParameter = {
  parameter: string;
  score: number;
  feedback: string;
};

export type FinalFeedback = {
  overallFeedback: string;
  strengths: string[];
  areasForImprovement: string[];
  detailedEvaluations: EvaluationParameter[];
};
