import { UploadForm } from '@/components/upload-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BrainCircuit } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-3xl">
        <Card className="shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center items-center gap-2">
              <BrainCircuit className="h-10 w-10 text-primary" />
              <CardTitle className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                Mock Interview
              </CardTitle>
            </div>
            <CardDescription className="text-lg text-muted-foreground">
              Your AI-powered interview coach. Paste your resume and a job
              description to start a tailored mock interview.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
