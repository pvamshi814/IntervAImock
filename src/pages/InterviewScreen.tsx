import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Loader2,
  MessageSquare,
  Sparkles,
  AlertCircle
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
  
  // Safely extract state — if missing, redirect to setup
  const state = location.state as { 
    domain?: Domain; 
    difficulty?: Difficulty;
    qualification?: Qualification;
    userStatus?: UserStatus;
  } | null;

  const domain = state?.domain ?? 'Frontend';
  const difficulty = state?.difficulty ?? 'Medium';
  const qualification = state?.qualification ?? 'B.Tech';
  const userStatus = state?.userStatus ?? 'Student';

  const { toast, showToast, hideToast } = useToast();
  
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(2400); // 40 mins for 10 questions
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const { isListening, isSpeaking, speak, listen, stopListening, stopSpeaking } = useVoice();
  const answerRef = useRef<HTMLTextAreaElement>(null);

  // Redirect to setup if no state was passed
  useEffect(() => {
    if (!state || !state.domain) {
      navigate('/setup', { replace: true });
    }
  }, [state, navigate]);

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
    setInitError(null);
    try {
      const first = await generateFirstQuestion(domain, difficulty, qualification, userStatus);
      setCurrentQuestion(first);
      setLoading(false);
      setIsQuotaExceeded(false);
    } catch (error: any) {
      if (isQuotaError(error)) {
        handleQuotaError(error);
      } else {
        console.error("Interview init error:", error);
        const errorMsg = error?.message || String(error);
        const isApiKeyMissing = errorMsg.toLowerCase().includes('api key');
        setInitError(
          isApiKeyMissing
            ? "Gemini API key is missing. Please set VITE_GEMINI_API_KEY in your .env file or configure it in AI Studio settings."
            : `Failed to start the interview: ${errorMsg}`
        );
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (state?.domain) {
      init();
    }
  }, [domain, difficulty, qualification, userStatus]);

  // Timer
  useEffect(() => {
    if (loading || submitting) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, submitting]);

  // Auto-speak the question exactly once when it appears.
  // The user can still manually replay or stop it using the single button,
  // and they must manually click the microphone to answer.
  useEffect(() => {
    if (!loading && currentQuestion) {
      // Small delay makes it feel natural after the UI transition
      const timer = setTimeout(() => {
        speak(currentQuestion);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentQuestion, loading, speak]);

  const startListening = useCallback(() => {
    if (isListening) return;
    // Pass the existing answer so it appends instead of overwriting
    listen((text) => {
      setCurrentAnswer(text);
    }, currentAnswer);
  }, [isListening, listen, currentAnswer]);

  const handleNext = useCallback(async () => {
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
    stopListening();
    stopSpeaking();
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
      startListening();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Quota exceeded screen
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

  // Initial loading screen
  if (loading && !currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-24 h-24 border-4 border-indigo-500/20 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            className="absolute inset-2 border-2 border-violet-500/30 rounded-full border-t-transparent"
          />
          <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-500" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Initializing AI Interviewer</h2>
          <p className="text-white/40">Preparing your {domain} interview questions...</p>
          <div className="flex items-center justify-center gap-2 pt-4">
            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">{domain}</Badge>
            <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/20">{difficulty}</Badge>
          </div>
        </div>
      </div>
    );
  }

  // Init error screen — shown when the API call fails (e.g. missing API key)
  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 p-8 text-center">
        <div className="p-6 rounded-full bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="w-12 h-12 text-amber-500" />
        </div>
        <div className="space-y-4 max-w-lg">
          <h2 className="text-3xl font-bold">Interview Could Not Start</h2>
          <p className="text-white/60 text-lg leading-relaxed">
            {initError}
          </p>
          <div className="pt-4 flex flex-col gap-4">
            <Button variant="premium" size="xl" onClick={() => init()} className="w-full">
              <RotateCcw className="w-5 h-5 mr-2" />
              Retry
            </Button>
            <Button variant="outline" size="xl" onClick={() => navigate('/setup')} className="w-full border-white/10 hover:bg-white/5">
              Back to Setup
            </Button>
            <p className="text-xs text-white/30">
              Make sure your Gemini API key is set. Get one from{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                Google AI Studio
              </a>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Submitting / Evaluating screen
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
  const questionNumber = history.length + 1;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Top Status Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/[0.03] border border-white/[0.06] p-4 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
            {domain}
          </Badge>
          <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/20">
            {difficulty}
          </Badge>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            {qualification}
          </Badge>
        </div>
        
        <div className="flex-1 max-w-md w-full px-6">
          <div className="flex justify-between text-xs font-medium text-white/40 mb-1.5">
            <span>Question {questionNumber} of {MAX_QUESTIONS}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 rounded-full"
            />
          </div>
        </div>

        <div className={cn(
          "flex items-center gap-2 font-mono text-sm px-3 py-1.5 rounded-xl",
          timeLeft < 300 ? "bg-red-500/10 text-red-400 border border-red-500/20" : "text-white/50"
        )}>
          <Timer className="w-3.5 h-3.5" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Main Interview Area */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Side: AI Interviewer (3 cols) */}
        <Card className="lg:col-span-3 bg-white/[0.03] border-white/[0.06] flex flex-col min-h-[320px] lg:min-h-[520px] relative overflow-hidden">
          {/* Decorative gradient orbs */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-violet-500/5 rounded-full blur-3xl" />
          
          {/* Loading overlay has been removed to allow direct transition feel 
              The 'Submit' button shows a spinner instead. */}

          {/* AI Avatar & Question */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 text-center space-y-8 relative z-[1]">
            <AIAvatar isSpeaking={isSpeaking} className="scale-110" />
            
            <div className="space-y-4 max-w-lg">
              <div className="flex items-center justify-center gap-2">
                <Badge variant="secondary" className="bg-white/5 border-white/10 text-xs">
                  <Sparkles className="w-3 h-3 mr-1 text-indigo-400" />
                  AI Interviewer
                </Badge>
                <Badge variant="secondary" className="bg-white/5 border-white/10 text-xs">
                  Q{questionNumber}/{MAX_QUESTIONS}
                </Badge>
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
                  transition={{ duration: 0.4 }}
                  className="space-y-2"
                >
                  <p className="text-xl lg:text-2xl font-semibold leading-relaxed text-white/90">
                    "{currentQuestion}"
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Voice controls for question */}
            <div className="flex items-center justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                  } else {
                    speak(currentQuestion);
                  }
                }}
                className={cn(
                  "rounded-full px-6 flex items-center gap-2 transition-all duration-300 shadow-lg text-sm font-medium",
                  isSpeaking 
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20 shadow-rose-500/5 hover:scale-[1.02]" 
                    : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 shadow-indigo-500/5 hover:scale-[1.02]"
                )}
                title={isSpeaking ? "Stop reading" : "Read question"}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    Stop Reading
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    Read Question
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Right Side: Voice Answer (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Voice Input Card */}
          <Card className="bg-white/[0.03] border-white/[0.06] flex-1 flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mic className="w-4 h-4 text-indigo-500" />
                Your Answer
              </CardTitle>
              <CardDescription className="text-xs">
                {isListening ? "Listening... speak your answer clearly" : "Click the mic below to start recording your answer."}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col space-y-4">
              {/* Answer text area */}
              <div className="relative flex-1">
                <textarea
                  ref={answerRef}
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Your voice response will appear here..."
                  disabled={loading}
                  className={cn(
                    "w-full h-full min-h-[240px] p-5 rounded-2xl bg-white/[0.03] border transition-all outline-none resize-none text-base leading-relaxed placeholder:text-white/15",
                    isListening 
                      ? "border-indigo-500/40 ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-500/5" 
                      : "border-white/[0.06] focus:border-indigo-500/30 focus:ring-1 focus:ring-indigo-500/10",
                    loading && "opacity-50 cursor-not-allowed"
                  )}
                />
                
                {/* Listening indicator overlay */}
                {isListening && (
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="flex items-center justify-between bg-black/60 backdrop-blur-md rounded-xl px-4 py-2.5 border border-indigo-500/20">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-0.5 items-end h-5">
                          {[1, 2, 3, 4, 5, 6, 7].map(i => (
                            <motion.div
                              key={i}
                              animate={{ height: [4, 12 + Math.random() * 8, 4] }}
                              transition={{ repeat: Infinity, duration: 0.4 + Math.random() * 0.3, delay: i * 0.05 }}
                              className="w-[3px] bg-indigo-500 rounded-full"
                            />
                          ))}
                        </div>
                        <span className="text-xs font-medium text-indigo-400">Listening...</span>
                      </div>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    </div>
                  </div>
                )}
              </div>

              {/* Voice + Submit buttons */}
              <div className="space-y-3">
                {/* Main Mic Button */}
                <button
                  onClick={toggleMic}
                  disabled={loading}
                  className={cn(
                    "w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-medium text-sm transition-all duration-300",
                    isListening 
                      ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/30 animate-pulse" 
                      : loading
                        ? "bg-white/5 text-white/20 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.01]"
                  )}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-5 h-5" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      Start Voice Answer
                    </>
                  )}
                </button>

                {/* Submit / Next Button */}
                <Button
                  variant="premium"
                  size="xl"
                  onClick={handleNext}
                  disabled={!currentAnswer.trim() || loading}
                  className="w-full rounded-2xl shadow-indigo-500/20 h-12"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {history.length === MAX_QUESTIONS - 1 ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Finish Interview
                        </>
                      ) : (
                        <>
                          Submit & Next
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>

              {/* Utils row */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentAnswer('')}
                  className="text-white/30 hover:text-white text-xs h-8"
                  disabled={!currentAnswer}
                >
                  <RotateCcw className="w-3 h-3 mr-1.5" />
                  Clear
                </Button>
                <p className="text-[10px] text-white/15 italic max-w-[160px] text-right">
                  Speak clearly. You can also type if needed.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Early finish button */}
          {history.length >= 3 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  stopListening();
                  stopSpeaking();
                  finalizeInterview([...history, { question: currentQuestion, answer: currentAnswer || '(No answer provided)' }]);
                }}
                className="w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/10 rounded-2xl h-11 text-sm"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Finish & Evaluate Early
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Answered Questions History Toggle */}
      {history.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors mx-auto"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {showHistory ? 'Hide' : 'Show'} previous answers ({history.length})
          </button>
          
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {history.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 space-y-2"
                    >
                      <div className="flex items-start gap-3">
                        <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px] shrink-0 mt-0.5">
                          Q{index + 1}
                        </Badge>
                        <p className="text-sm text-white/60 leading-relaxed">{item.question}</p>
                      </div>
                      <div className="flex items-start gap-3 pl-1">
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] shrink-0 mt-0.5">
                          A
                        </Badge>
                        <p className="text-sm text-white/40 leading-relaxed">{item.answer || <em className="text-white/20">No answer</em>}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {toast && <Toast {...toast} onClose={hideToast} />}
    </div>
  );
}
