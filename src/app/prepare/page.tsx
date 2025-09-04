'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BrainCircuit, FileText, Briefcase, Loader2, Languages } from 'lucide-react';
import type { InterviewData } from '@/lib/types';

export default function PreparePage() {
  const router = useRouter();
  const [data, setData] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedData = localStorage.getItem('interviewData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setData(parsedData);
      } catch (error) {
        console.error("Failed to parse interview data", error);
        router.replace('/');
      }
    } else {
      router.replace('/');
    }
    setLoading(false);
  }, [router]);

  if (loading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 lg:p-12 bg-background">
      <Card className="w-full max-w-3xl shadow-2xl animate-in fade-in-50 duration-500">
        <CardHeader>
          <div className="flex items-center gap-4">
             <BrainCircuit className="h-10 w-10 text-primary" />
             <div>
                <CardTitle className="text-3xl font-bold">You're All Set!</CardTitle>
                <CardDescription className="text-lg">
                    Your personalized interview is ready.
                </CardDescription>
             </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center bg-secondary/50 p-3 rounded-lg">
            <p className="text-muted-foreground">
              We've analyzed your resume and the job description to tailor the questions for you.
            </p>
             <Badge variant="outline" className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                {data.languageName || data.language}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="font-semibold text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Your Profile</h3>
              <p className="text-sm text-muted-foreground italic line-clamp-3">{data.info.resumeSummary}</p>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Key Skills Identified:</h4>
                <div className="flex flex-wrap gap-2">
                  {data.info.candidateSkills.slice(0, 5).map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                </div>
              </div>
            </div>
            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="font-semibold text-lg flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" />The Role</h3>
              <p className="text-sm text-muted-foreground italic line-clamp-3">{data.info.jobSummary}</p>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Key Requirements:</h4>
                <div className="flex flex-wrap gap-2">
                  {data.info.jobRequirements.slice(0, 5).map(req => <Badge key={req} variant="secondary">{req}</Badge>)}
                </div>
              </div>
            </div>
          </div>
           <p className="text-center text-muted-foreground pt-4">Your interview will consist of {data.questions.questions.length} tailored questions, with potential follow-ups.</p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => router.push('/interview')}
            className="w-full bg-accent hover:bg-accent/90 text-lg py-6 font-bold"
          >
            Start Interview <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
