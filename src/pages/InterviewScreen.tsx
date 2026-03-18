import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  ArrowRight, 
  BrainCircuit,
  Timer,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { AIAvatar } from '../components/ui/Avatar';
import { useVoice } from '../hooks/useVoice';
import { generateFirstQuestion, generateNextQuestion, evaluateInterview } from '../services/gemini';
import { cn } from '../utils/cn';
import { Domain, Difficulty, Qualification, UserStatus } from '../types';
import { auth, db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useToast, Toast } from '../components/ui/Toast';

const MAX_QUESTIONS = 10;

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export function InterviewScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { domain, difficulty, qualification, userStatus } = location.state as { 
    domain: Domain; 
    difficulty: Difficulty;
    qualification: Qualification;
    userStatus: UserStatus;
  };
  const { toast, showToast, hideToast } = useToast();
  
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(2400); // 40 mins for 10 questions
  const [isAutoSpeak, setIsAutoSpeak] = useState(true);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  const { isListening, isSpeaking, speak, listen, stopListening, stopSpeaking } = useVoice();

  const isQuotaError = useCallback((error: any) => {
    if (!error) return false;
    const errorStr = typeof error === 'string' ? error.toLowerCase() : JSON.stringify(error).toLowerCase();
    return (
      error.code === 429 ||
      error.status === 'RESOURCE_EXHAUSTED' ||
      (error.error && (error.error.code === 429 || error.error.status === 'RESOURCE_EXHAUSTED')) ||
      errorStr.includes('quota') ||
      errorStr.includes('rate limit') ||
      errorStr.includes('429') ||
      errorStr.includes('resource_exhausted')
    );
  }, []);

  const handleQuotaError = useCallback(async (error: any) => {
    console.error("Handling Quota Error:", error);
    setIsQuotaExceeded(true);
    showToast("Gemini API quota exceeded. Please select your own API key to continue.", "error");
  }, [showToast]);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setIsQuotaExceeded(false);
      // Retry the last action
      if (!currentQuestion) {
        init();
      } else if (loading) {
        handleNext();
      } else if (submitting) {
        finalizeInterview(history);
      }
    }
  };

  // Initialize Interview
  const init = async () => {
    setLoading(true);
    try {
      const first = await generateFirstQuestion(domain, difficulty, qualification, userStatus);
      setCurrentQuestion(first);
      setLoading(false);
      setIsQuotaExceeded(false);
    } catch (error: any) {
      if (isQuotaError(error)) {
        handleQuotaError(error);
      } else {
        showToast("Failed to start interview. Please try again.", "error");
        navigate('/setup');
      }
    }
  };

  useEffect(() => {
    init();
  }, [domain, difficulty, qualification, userStatus]);

  // Timer
  useEffect(() => {
    if (loading || submitting) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, submitting]);

  // Speak question when it changes
  useEffect(() => {
    if (!loading && currentQuestion && isAutoSpeak) {
      // Small delay to ensure UI is ready and voice doesn't clip
      const timer = setTimeout(() => {
        speak(currentQuestion);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentQuestion, loading, isAutoSpeak, speak]);

  const handleNext = useCallback(async () => {
    // If we're retrying after a quota error, we don't want to add to history again
    // if we already added it in the previous attempt.
    // However, the previous attempt cleared currentAnswer, so we need to be careful.
    
    // Let's check if the last item in history is already this question
    const isRetry = history.length > 0 && history[history.length - 1].question === currentQuestion;
    
    let newHistory = history;
    if (!isRetry) {
      newHistory = [...history, { question: currentQuestion, answer: currentAnswer }];
      setHistory(newHistory);
      setCurrentAnswer('');
    }
    
    stopSpeaking();
    stopListening();

    if (newHistory.length < MAX_QUESTIONS) {
      setLoading(true);
      try {
        const next = await generateNextQuestion(domain, difficulty, qualification, userStatus, newHistory);
        setCurrentQuestion(next);
        setLoading(false);
        setIsQuotaExceeded(false);
      } catch (error: any) {
        if (isQuotaError(error)) {
          handleQuotaError(error);
        } else {
          showToast("Failed to generate next question. Ending interview.", "info");
          // Proceed to evaluation if generation fails
          await finalizeInterview(newHistory);
        }
      }
    } else {
      await finalizeInterview(newHistory);
    }
  }, [currentQuestion, currentAnswer, history, domain, difficulty, qualification, userStatus, navigate, showToast, stopSpeaking, stopListening, handleQuotaError, isQuotaError]);

  const finalizeInterview = async (finalHistory: { question: string; answer: string }[]) => {
    if (!auth.currentUser) {
      showToast("You must be logged in to save results.", "error");
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      const evaluation = await evaluateInterview(domain, difficulty, qualification, userStatus, finalHistory);
      const interviewData = {
        userId: auth.currentUser.uid,
        domain,
        difficulty,
        qualification,
        userStatus,
        questions: finalHistory.map(h => ({ text: h.question })),
        answers: finalHistory.map(h => h.answer),
        ...evaluation,
        createdAt: Date.now()
      };
      const docRef = await addDoc(collection(db, 'interviews'), interviewData);
      navigate(`/results/${docRef.id}`);
      setIsQuotaExceeded(false);
    } catch (error: any) {
      if (isQuotaError(error)) {
        handleQuotaError(error);
        setSubmitting(false);
      } else {
        showToast("Failed to evaluate interview. Please try again.", "error");
        setSubmitting(false);
      }
    }
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      listen((text) => {
        setCurrentAnswer(prev => prev + ' ' + text);
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isQuotaExceeded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 p-8 text-center">
        <div className="p-6 rounded-full bg-red-500/10 border border-red-500/20">
          <BrainCircuit className="w-12 h-12 text-red-500" />
        </div>
        <div className="space-y-4 max-w-md">
          <h2 className="text-3xl font-bold">API Quota Exceeded</h2>
          <p className="text-white/60 text-lg leading-relaxed">
            The Gemini API has reached its limit. To continue, please provide your own API key in the <strong>Settings</strong> menu of the AI Studio Build environment.
          </p>
          <div className="pt-4 flex flex-col gap-4">
            <Button variant="premium" size="xl" onClick={handleSelectKey} className="w-full">
              Select API Key
            </Button>
            <Button variant="outline" size="xl" onClick={() => {
              setIsQuotaExceeded(false);
              if (!currentQuestion) {
                init();
              } else if (loading) {
                handleNext();
              } else if (submitting) {
                finalizeInterview(history);
              }
            }} className="w-full border-white/10 hover:bg-white/5">
              Retry Last Action
            </Button>
            <p className="text-xs text-white/30">
              You can get a key from the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Google AI Studio</a>.
            </p>
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-white/40">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-24 h-24 border-4 border-indigo-500/20 rounded-full"
          />
          <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-500" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Initializing AI Interviewer</h2>
          <p className="text-white/40">Preparing your first question...</p>
        </div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-indigo-500/20 rounded-full animate-pulse" />
          <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
          <CheckCircle2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-500" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Analyzing Your Performance</h2>
          <p className="text-white/40">Gemini AI is evaluating your technical and communication skills...</p>
        </div>
      </div>
    );
  }

  const progress = ((history.length) / MAX_QUESTIONS) * 100;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
            {domain}
          </Badge>
          <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/20">
            {difficulty}
          </Badge>
        </div>
        
        <div className="flex-1 max-w-md w-full px-8">
          <div className="flex justify-between text-xs font-medium text-white/40 mb-2">
            <span>Question {history.length + 1} of {MAX_QUESTIONS}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 text-white/60 font-mono">
          <Timer className="w-4 h-4" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: AI Interviewer */}
        <Card className="bg-white/5 border-white/10 flex flex-col items-center justify-center p-12 text-center space-y-8 min-h-[500px] relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
          )}
          
          <AIAvatar isSpeaking={isSpeaking} className="scale-125" />
          
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-indigo-400 font-medium animate-pulse"
            >
              <BrainCircuit className="w-4 h-4" />
              AI is thinking...
            </motion.div>
          )}

          <div className="space-y-4 max-w-md">
            <Badge variant="secondary" className="bg-white/5 border-white/10">AI Interviewer</Badge>
            <AnimatePresence mode="wait">
              <motion.h2
                key={currentQuestion}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-2xl font-bold leading-relaxed"
              >
                "{currentQuestion}"
              </motion.h2>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => speak(currentQuestion)}
              className="rounded-full bg-white/5 border-white/10"
            >
              <Volume2 className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsAutoSpeak(!isAutoSpeak)}
              className={cn(
                "rounded-full transition-colors",
                isAutoSpeak ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-500" : "bg-white/5 border-white/10 text-white/40"
              )}
            >
              {isAutoSpeak ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
          </div>
        </Card>

        {/* Right Side: User Input */}
        <div className="space-y-6">
          <Card className="bg-white/5 border-white/10 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mic className="w-4 h-4 text-indigo-500" />
                Your Answer
              </CardTitle>
              <CardDescription>Speak or type your response below</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-6">
              <div className="relative flex-1">
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Start speaking or type your answer here..."
                  className="w-full h-full min-h-[300px] p-6 rounded-2xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none resize-none text-lg leading-relaxed placeholder:text-white/20"
                />
                
                {isListening && (
                  <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/40 to-transparent rounded-b-2xl">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <motion.div
                            key={i}
                            animate={{ height: [8, 24, 8] }}
                            transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                            className="w-1 bg-indigo-500 rounded-full"
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-indigo-400">Listening...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <Button
                  variant={isListening ? "destructive" : "outline"}
                  size="xl"
                  onClick={toggleMic}
                  className={cn(
                    "flex-1 rounded-2xl border-white/10",
                    !isListening && "bg-white/5 hover:bg-white/10",
                    isListening && "animate-pulse"
                  )}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-5 h-5 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 mr-2" />
                      Answer with Voice
                    </>
                  )}
                </Button>
                
                <Button
                  variant="premium"
                  size="xl"
                  onClick={handleNext}
                  disabled={!currentAnswer.trim() || loading}
                  className="px-12 rounded-2xl shadow-indigo-500/20"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (history.length === MAX_QUESTIONS - 1 ? "Finish" : "Next")}
                  {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
                </Button>
              </div>

              {history.length >= 3 && !loading && (
                <div className="pt-4">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => finalizeInterview([...history, { question: currentQuestion, answer: currentAnswer }])}
                    className="w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-2xl"
                  >
                    Finish & Evaluate Early
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentAnswer('')}
              className="text-white/40 hover:text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear Answer
            </Button>
            <p className="text-xs text-white/20 italic">
              Tip: Be clear and concise in your technical explanations.
            </p>
          </div>
        </div>
      </div>
      {toast && <Toast {...toast} onClose={hideToast} />}
    </div>
  );
}
