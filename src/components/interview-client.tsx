'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Mic,
  MicOff,
  Volume2,
  BrainCircuit,
  Loader2,
  Video,
  VideoOff,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Home,
  XSquare,
  ThumbsUp,
  Lightbulb,
  Award,
  BarChart
} from 'lucide-react';
import type { InterviewData, InterviewLogEntry, FinalFeedback } from '@/lib/types';
import { getFollowUpQuestion, getFinalFeedback, getSpeechAudio } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

type Status =
  | 'loading'
  | 'ready'
  | 'speaking'
  | 'listening'
  | 'processing'
  | 'finishing'
  | 'finished'
  | 'error';

export default function InterviewClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<InterviewData | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewLog, setInterviewLog] = useState<InterviewLogEntry[]>([]);
  const [finalFeedback, setFinalFeedback] = useState<FinalFeedback | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const finalTranscriptRef = useRef('');
  
  const processAnswerRef = useRef<(answer: string) => Promise<void>>();

  const cleanupStreams = useCallback(() => {
    if (recognitionRef.current) {
        try {
            recognitionRef.current.stop();
        } catch (e) {
            // Ignore errors if already stopped
        }
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
    }
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current.onended = null;
    }
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
  }, []);
  
  const endInterview = useCallback(() => {
    setStatus('finishing');
    cleanupStreams();
  }, [cleanupStreams]);

  const askQuestion = useCallback(async (text: string) => {
    setStatus('speaking');
    setInterimTranscript('');
    finalTranscriptRef.current = '';

    if (!text) {
        console.warn("askQuestion called with empty text. Ending interview.");
        endInterview();
        return;
    }
    
    if (audioRef.current) {
        audioRef.current.onended = null;
    }

    try {
        const audioResult = await getSpeechAudio(text);
        if (audioResult.success && audioResult.data && audioRef.current) {
            audioRef.current.src = audioResult.data;
            audioRef.current.onended = () => setStatus('listening');
            await audioRef.current.play();
        } else {
            throw new Error('Failed to get audio from API');
        }
    } catch (e) {
        console.error("AI speech failed, falling back to browser TTS:", e);
        const utterance = new SpeechSynthesisUtterance(text);
        if (data?.language) utterance.lang = data.language;
        utterance.onend = () => setStatus('listening');
        utterance.onerror = (event) => {
            console.error("Browser TTS Error:", event.error);
            toast({ variant: 'destructive', title: 'Audio Playback Error', description: 'Could not play audio.' });
            endInterview();
        };
        window.speechSynthesis.speak(utterance);
    }
  }, [data?.language, toast, endInterview]);
  
  const processAnswer = useCallback(async (answer: string) => {
    if (status === 'processing') return;
    setStatus('processing');
    
    const finalAnswer = answer.trim() || "(No answer detected)";
    const currentQuestion = questions[currentQuestionIndex];

    if (!currentQuestion) {
        console.error("Processing answer for a non-existent question.");
        endInterview();
        return;
    }
    
    const result = await getFollowUpQuestion({
      jobDescription: data!.jobDescription,
      resume: data!.resumeText,
      language: data!.language,
      question: currentQuestion,
      answer: finalAnswer,
      previousQuestionsAndAnswers: interviewLog.map(l => ({question: l.question, answer: l.answer})),
    });

    setInterviewLog(prev => [...prev, { question: currentQuestion, answer: finalAnswer, evaluation: result.data?.evaluation || 'N/A' }]);

    if (result.success && result.data?.followUpQuestion) {
      setQuestions(prev => {
        const newQuestions = [...prev];
        newQuestions.splice(currentQuestionIndex + 1, 0, result.data.followUpQuestion);
        return newQuestions;
      });
    }
    
    setCurrentQuestionIndex(prev => prev + 1);
  }, [status, currentQuestionIndex, data, interviewLog, questions, endInterview]);
  
  processAnswerRef.current = processAnswer;

  useEffect(() => {
    const storedData = localStorage.getItem('interviewData');
    if (!storedData) {
      router.replace('/');
      return;
    }
    const parsedData = JSON.parse(storedData) as InterviewData;
    setData(parsedData);
    setQuestions(parsedData.questions.questions);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        variant: 'destructive',
        title: 'Browser Not Supported',
        description: 'Your browser does not support speech recognition. Please use Chrome.',
      });
      setStatus('error');
      return;
    }
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = parsedData.language || 'en-US';
    
    if (!audioRef.current) {
        audioRef.current = new Audio();
    }

    setStatus('ready');
    return () => cleanupStreams();
  }, [router, toast, cleanupStreams]);

  useEffect(() => {
    if (status !== 'ready' || !data || questions.length === 0 ) return;

    const getPermissionsAndStart = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);
        videoStreamRef.current = new MediaStream(stream.getVideoTracks());
        audioStreamRef.current = new MediaStream(stream.getAudioTracks());

        if (videoRef.current) {
          videoRef.current.srcObject = videoStreamRef.current;
        }
        
        askQuestion(questions[0]);

      } catch (error) {
        console.error('Error accessing media devices:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Media Access Denied',
          description: 'Please enable camera and microphone permissions in your browser settings.',
          duration: 10000,
        });
        setStatus('error');
      }
    };

    getPermissionsAndStart();
  }, [status, data, questions, toast, askQuestion]);

  useEffect(() => {
    if(status === 'processing' && data) {
        if (currentQuestionIndex < questions.length) {
            askQuestion(questions[currentQuestionIndex]);
        } else {
            endInterview();
        }
    }
  }, [status, currentQuestionIndex, data, questions, askQuestion, endInterview]);

  useEffect(() => {
    const rec = recognitionRef.current;
    if (!rec) return;

    const handleResult = (event: any) => {
        if (status !== 'listening') return;
        
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        
        let interim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              currentFinal += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
        }
        
        if (currentFinal) {
            finalTranscriptRef.current += currentFinal + ' ';
        }

        setInterimTranscript(interim);
        
        silenceTimeoutRef.current = setTimeout(() => {
            if (status === 'listening') {
              rec.stop();
            }
        }, 2500);
    };

    const handleEnd = () => {
      if (status === 'listening') {
        processAnswerRef.current?.(finalTranscriptRef.current);
      }
    };

    const handleError = (event: any) => {
        if (event.error === 'no-speech' && status === 'listening') {
           processAnswerRef.current?.(finalTranscriptRef.current);
           return;
        }
        
        console.error('Speech recognition error:', event.error, event.message);
        toast({ variant: 'destructive', title: "Speech Recognition Error", description: event.error });
        if(status === 'listening') {
            processAnswerRef.current?.(finalTranscriptRef.current);
        }
    }

    rec.onresult = handleResult;
    rec.onend = handleEnd;
    rec.onerror = handleError;
    
  }, [status, toast]);
  
  useEffect(() => {
      const rec = recognitionRef.current;
      if (!rec || isMuted) return;
      
      if (status === 'listening') {
          finalTranscriptRef.current = '';
          setInterimTranscript('');
          try {
              rec.start();
          } catch(e) {
              // Ignore if already started
          }
      } else {
          try {
              rec.stop();
          } catch(e) {
              // Ignore if already stopped
          }
      }
  }, [status, isMuted])
  
  useEffect(() => {
    if (status === 'finishing' && data && !finalFeedback) {
      const generateReport = async () => {
        const result = await getFinalFeedback({
          jobDescription: data.jobDescription,
          resume: data.resumeText,
          language: data.language,
          interviewLog: interviewLog,
        });
        if (result.success && result.data) {
          setFinalFeedback(result.data);
        } else {
          toast({ variant: 'destructive', title: "Couldn't generate final report." });
        }
        setStatus('finished');
      };
      generateReport();
    }
  }, [status, data, interviewLog, finalFeedback, toast]);


  const toggleCamera = () => {
    if (videoStreamRef.current) {
        videoStreamRef.current.getVideoTracks().forEach(track => {
            track.enabled = !isCameraOn;
        });
        setIsCameraOn(!isCameraOn);
    }
  };

  const toggleMic = () => {
    setIsMuted(prev => {
        const isNowMuted = !prev;
        if(audioStreamRef.current){
            audioStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !isNowMuted;
            })
        }
        if (isNowMuted && recognitionRef.current && status === 'listening') {
            recognitionRef.current.stop();
        }
        return isNowMuted;
    });
  };

  const statusMap: Record<Status, { text: string; icon: React.ReactNode }> = {
    loading: { text: 'Loading...', icon: <Loader2 className="animate-spin" /> },
    ready: { text: 'Getting ready...', icon: <Loader2 className="animate-spin" /> },
    speaking: { text: 'Asking a question...', icon: <Volume2 /> },
    listening: { text: 'Listening...', icon: <Mic /> },
    processing: { text: 'Processing answer...', icon: <BrainCircuit className="animate-pulse" /> },
    finishing: { text: 'Generating your report...', icon: <Loader2 className="animate-spin" /> },
    finished: { text: 'Interview Complete!', icon: <Sparkles /> },
    error: { text: 'An error occurred', icon: <AlertCircle /> },
  };
  
  const displayedTranscript = (finalTranscriptRef.current || (status === 'listening' ? 'Listening...' : '...')) + interimTranscript;

  if (status === 'loading') {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }
  
  if (status === 'error') {
    return (
        <div className="flex h-screen items-center justify-center p-4">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                We couldn't set up the interview. Please check browser permissions and support, then try again.
              </AlertDescription>
              <Button onClick={() => router.push('/')} className="mt-4">Go Home</Button>
            </Alert>
        </div>
    );
  }

  if (status === 'finished' || status === 'finishing') {
    return (
      <div className="container mx-auto p-4 py-8 max-w-4xl">
        <Card className="shadow-lg animate-in fade-in-50">
          <CardHeader className="text-center border-b pb-4">
            <Sparkles className="mx-auto h-12 w-12 text-yellow-400" />
            <CardTitle className="text-3xl font-bold mt-2">Interview Report</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {status === 'finishing' ? (
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                    <p className="text-lg text-muted-foreground">Generating your personalized feedback...</p>
                </div>
            ) : (
            <ScrollArea className="h-[70vh] p-4">
              <div className="space-y-8">
                 {finalFeedback && (
                   <div className='space-y-8'>
                    <section>
                      <h3 className="text-xl font-semibold flex items-center gap-2 mb-3"><Award className='text-primary'/> Overall Feedback</h3>
                      <p className='text-muted-foreground'>{finalFeedback.overallFeedback}</p>
                    </section>
                    
                    <section>
                      <h3 className="text-xl font-semibold flex items-center gap-2 mb-4"><BarChart className='text-primary'/> Detailed Evaluation</h3>
                      <div className="space-y-4">
                        {finalFeedback.detailedEvaluations.map((evalItem, i) => (
                          <div key={i}>
                            <div className="flex justify-between items-center mb-1">
                              <p className="font-medium">{evalItem.parameter}</p>
                              <p className="font-bold text-lg text-primary">{evalItem.score}/10</p>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">{evalItem.feedback}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                    
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <section>
                          <h3 className="text-xl font-semibold flex items-center gap-2 mb-3"><ThumbsUp className='text-green-500'/> Strengths</h3>
                          <ul className='space-y-2 list-disc list-inside text-muted-foreground'>
                            {finalFeedback.strengths.map((strength, i) => (
                               <li key={i}>{strength}</li>
                            ))}
                          </ul>
                        </section>
                         <section>
                          <h3 className="text-xl font-semibold flex items-center gap-2 mb-3"><Lightbulb className='text-yellow-500'/> Areas for Improvement</h3>
                           <ul className='space-y-2 list-disc list-inside text-muted-foreground'>
                            {finalFeedback.areasForImprovement.map((area, i) => (
                               <li key={i}>{area}</li>
                            ))}
                          </ul>
                        </section>
                     </div>
                   </div>
                 )}
                 <div>
                    <h3 className="text-xl font-semibold border-b pb-2 mb-4 mt-8">Interview Log</h3>
                    <div className="space-y-6">
                        {interviewLog.map((log, index) => (
                        <div key={index}>
                            <p className="font-bold text-primary">Q: {log.question}</p>
                            <p className="mt-1 text-muted-foreground pl-4 border-l-2 ml-2">A: {log.answer}</p>
                            <p className="mt-2 text-sm bg-secondary/50 p-2 rounded-md"><strong className='font-semibold text-primary/90'>Evaluation:</strong> {log.evaluation}</p>
                        </div>
                        ))}
                    </div>
                </div>
              </div>
            </ScrollArea>
            )}
            <div className="text-center mt-6">
                <Button onClick={() => { localStorage.removeItem('interviewData'); router.push('/'); }} disabled={status==='finishing'}><Home className="mr-2 h-4 w-4"/> Start New Interview</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="flex items-center justify-between p-4 border-b shrink-0">
        <Link href="/" className="flex items-center space-x-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Mock Interview</span>
        </Link>
        <div className='flex items-center gap-4'>
            <Badge variant={status === 'listening' ? "destructive" : "secondary"} className="flex items-center gap-2 text-lg p-2 transition-colors">
            {statusMap[status].icon}
            <span>{statusMap[status].text}</span>
            </Badge>
            <Button variant="destructive" onClick={endInterview}>
                <XSquare className='mr-2 h-5 w-5' />
                End Interview
            </Button>
        </div>
      </header>

      <div className="flex-1 grid md:grid-cols-2 gap-4 p-4 overflow-y-auto">
        {/* Interviewer Panel */}
        <div className="flex flex-col min-h-0 relative">
        <Card className="flex flex-col min-h-0 flex-1">
          <CardHeader>
            <CardTitle>Interviewer</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center bg-secondary/30 rounded-b-lg p-4">
            <div className="relative w-full max-w-md">
                <Image src="https://picsum.photos/800/450" alt="Interviewer" width={800} height={450} className="rounded-lg shadow-lg aspect-video object-cover" data-ai-hint="professional portrait" priority />
                <div className="absolute inset-0 bg-black/20 rounded-lg"></div>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Candidate Panel */}
         <div className="flex flex-col min-h-0 relative">
        <Card className="flex flex-col min-h-0 flex-1">
          <CardHeader className='flex-row items-center justify-between'>
            <CardTitle>Your View</CardTitle>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={toggleCamera} disabled={!hasCameraPermission}>
                    {isCameraOn ? <Video className="w-5 h-5"/> : <VideoOff className="w-5 h-5"/>}
                </Button>
                 <Button variant="outline" size="icon" onClick={toggleMic} disabled={!hasCameraPermission}>
                    {isMuted ? <MicOff className="w-5 h-5"/> : <Mic className="w-5 h-5"/>}
                </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col bg-secondary/30 rounded-b-lg overflow-hidden p-4">
             <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                <video ref={videoRef} autoPlay muted className="w-full h-full object-cover transform -scale-x-100"></video>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    {(!isCameraOn || !hasCameraPermission) && <VideoOff className="w-12 h-12 text-muted-foreground"/>}
                </div>
             </div>
             { !hasCameraPermission && status !== 'loading' && status !== 'ready' && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please enable camera and microphone access to use this feature.
                  </AlertDescription>
                </Alert>
              )}
             <div className="flex-1 pt-4 flex flex-col min-h-0">
                <h3 className="font-semibold flex items-center gap-2 mb-2"><MessageSquare className="w-5 h-5 text-primary"/> Your Answer</h3>
                <ScrollArea className="flex-1 bg-background p-3 rounded-md border text-sm text-muted-foreground">
                    {displayedTranscript}
                </ScrollArea>
             </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
