'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Rocket } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { handleAnalysis } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const languageOptions = [
  { value: 'en-US', label: 'English' },
  { value: 'hi-IN', label: 'Hindi' },
];

export function UploadForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [language, setLanguage] = useState(languageOptions[0].value);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const selectedLanguage = languageOptions.find(l => l.value === language);
    formData.append('language', language);
    formData.append('languageName', selectedLanguage?.label || language);

    const result = await handleAnalysis(null, formData);
    
    setIsLoading(false);

    if (result.success && result.data) {
      localStorage.setItem('interviewData', JSON.stringify(result.data));
      router.push('/prepare');
    } else {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: result.error || 'An unknown error occurred.',
      })
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="resume" className="text-base font-semibold">Paste Your Resume</Label>
          <Textarea
            id="resume"
            name="resumeText"
            placeholder="Paste the full text of your resume here."
            className="min-h-[250px] bg-secondary/50"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="job-description" className="text-base font-semibold">Paste Job Description</Label>
          <Textarea
            id="job-description"
            name="jobDescription"
            placeholder="Paste the job description you are applying for."
            className="min-h-[250px] bg-secondary/50"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            required
          />
        </div>
      </div>

       <div className="space-y-2">
          <Label htmlFor="language" className="text-base font-semibold">Interview Language</Label>
           <Select name="language" value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language" className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>

      <Button
        type="submit"
        className="w-full bg-accent hover:bg-accent/90 text-lg py-6 font-bold"
        disabled={!resumeText || !jobDescription || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Rocket className="mr-2 h-5 w-5" />
            Analyze & Prepare Questions
          </>
        )}
      </Button>
    </form>
  );
}
