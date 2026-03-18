import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Domain, Difficulty, UserProfile, Qualification, UserStatus } from '../types';
import { cn } from '../utils/cn';
import { 
  GraduationCap,
  UserCircle,
  Code2, 
  Database, 
  Cpu, 
  Smartphone, 
  Cloud, 
  Layout, 
  Settings, 
  ArrowRight,
  CheckCircle2,
  BrainCircuit,
  Loader2
} from 'lucide-react';

const domains: { id: Domain; icon: React.ReactNode; description: string }[] = [
  { id: 'Frontend', icon: <Layout className="w-6 h-6" />, description: "React, Vue, CSS, Web Performance" },
  { id: 'Backend', icon: <Database className="w-6 h-6" />, description: "Node.js, Python, SQL, System Design" },
  { id: 'Fullstack', icon: <Code2 className="w-6 h-6" />, description: "End-to-end development, APIs, DBs" },
  { id: 'AI/ML', icon: <BrainCircuit className="w-6 h-6" />, description: "PyTorch, TensorFlow, LLMs, NLP" },
  { id: 'Data Science', icon: <Cpu className="w-6 h-6" />, description: "Statistics, Pandas, Visualization" },
  { id: 'Mobile', icon: <Smartphone className="w-6 h-6" />, description: "React Native, Swift, Kotlin" },
  { id: 'DevOps', icon: <Cloud className="w-6 h-6" />, description: "Docker, K8s, CI/CD, AWS" },
];

const difficulties: { id: Difficulty; label: string; color: string }[] = [
  { id: 'Easy', label: 'Beginner Friendly', color: 'text-emerald-400' },
  { id: 'Medium', label: 'Standard Interview', color: 'text-amber-400' },
  { id: 'Hard', label: 'Expert Level', color: 'text-rose-400' },
];

const qualifications: Qualification[] = ['B.Tech', 'M.Tech', 'Science', 'Commerce', 'Arts', 'Other'];
const userStatuses: UserStatus[] = ['Student', 'Teacher', 'Professional', 'Job Seeker'];

export function InterviewSetup() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [selectedQualification, setSelectedQualification] = useState<Qualification | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profile = docSnap.data() as UserProfile;
          if (profile.domain) setSelectedDomain(profile.domain);
          if (profile.qualification) setSelectedQualification(profile.qualification);
          if (profile.userStatus) setSelectedStatus(profile.userStatus);
        }
      } catch (error) {
        console.error("Error fetching profile for setup", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleStart = () => {
    if (selectedDomain && selectedDifficulty && selectedQualification && selectedStatus) {
      navigate('/interview', { 
        state: { 
          domain: selectedDomain, 
          difficulty: selectedDifficulty,
          qualification: selectedQualification,
          userStatus: selectedStatus
        } 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const steps = [
    { title: 'Qualification', description: 'What is your educational background?' },
    { title: 'Status', description: 'What is your current professional status?' },
    { title: 'Domain', description: 'Which field are you interviewing for?' },
    { title: 'Difficulty', description: 'Choose the interview intensity' },
    { title: 'Ready', description: 'Initialize your AI Interviewer' },
  ];

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      {/* Progress Header */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          {steps.map((_, index) => (
            <div 
              key={index}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                index === currentStep ? "w-8 bg-indigo-500" : 
                index < currentStep ? "w-4 bg-indigo-500/40" : "w-4 bg-white/10"
              )}
            />
          ))}
        </div>
        
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-4xl font-bold tracking-tight">{steps[currentStep].title}</h1>
          <p className="text-white/50 text-lg">{steps[currentStep].description}</p>
        </motion.div>
      </div>

      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 0: Qualification */}
            {currentStep === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {qualifications.map((q) => (
                  <Button
                    key={q}
                    variant={selectedQualification === q ? "premium" : "outline"}
                    onClick={() => {
                      setSelectedQualification(q);
                      setTimeout(nextStep, 300);
                    }}
                    className={cn(
                      "justify-start h-20 px-8 rounded-2xl border-white/10 text-lg",
                      selectedQualification === q ? "shadow-indigo-500/20" : "bg-white/5 text-white/60 hover:bg-white/10"
                    )}
                  >
                    <GraduationCap className="w-6 h-6 mr-4 opacity-50" />
                    {q}
                  </Button>
                ))}
              </div>
            )}

            {/* Step 1: Status */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userStatuses.map((s) => (
                  <Button
                    key={s}
                    variant={selectedStatus === s ? "premium" : "outline"}
                    onClick={() => {
                      setSelectedStatus(s);
                      setTimeout(nextStep, 300);
                    }}
                    className={cn(
                      "justify-start h-20 px-8 rounded-2xl border-white/10 text-lg",
                      selectedStatus === s ? "shadow-indigo-500/20" : "bg-white/5 text-white/60 hover:bg-white/10"
                    )}
                  >
                    <UserCircle className="w-6 h-6 mr-4 opacity-50" />
                    {s}
                  </Button>
                ))}
              </div>
            )}

            {/* Step 2: Domain */}
            {currentStep === 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {domains.map((domain) => (
                  <Card
                    key={domain.id}
                    onClick={() => {
                      setSelectedDomain(domain.id);
                      setTimeout(nextStep, 300);
                    }}
                    className={cn(
                      "cursor-pointer transition-all duration-300 group hover:scale-[1.02] rounded-2xl",
                      selectedDomain === domain.id 
                        ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10" 
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-xl transition-colors",
                          selectedDomain === domain.id ? "bg-indigo-500 text-white" : "bg-white/5 text-white/40 group-hover:text-white"
                        )}>
                          {domain.icon}
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-lg">{domain.id}</h3>
                          <p className="text-sm text-white/40 leading-snug">{domain.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Step 3: Difficulty */}
            {currentStep === 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {difficulties.map((diff) => (
                  <Card
                    key={diff.id}
                    onClick={() => {
                      setSelectedDifficulty(diff.id);
                      setTimeout(nextStep, 300);
                    }}
                    className={cn(
                      "cursor-pointer transition-all duration-300 group hover:scale-[1.02] rounded-2xl",
                      selectedDifficulty === diff.id 
                        ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10" 
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    <CardContent className="p-10 text-center space-y-4">
                      <h3 className={cn("text-3xl font-bold", diff.color)}>{diff.id}</h3>
                      <p className="text-sm text-white/40">{diff.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Step 4: Finalize */}
            {currentStep === 4 && (
              <div className="max-w-md mx-auto space-y-8">
                <Card className="bg-white/5 border-white/10 rounded-3xl overflow-hidden">
                  <div className="p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-white/40">Qualification</span>
                        <span className="font-medium">{selectedQualification}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-white/40">Status</span>
                        <span className="font-medium">{selectedStatus}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-white/40">Domain</span>
                        <span className="font-medium">{selectedDomain}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-white/40">Difficulty</span>
                        <span className={cn("font-medium", difficulties.find(d => d.id === selectedDifficulty)?.color)}>
                          {selectedDifficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>

                <Button
                  variant="premium"
                  size="xl"
                  onClick={handleStart}
                  className="w-full group shadow-indigo-500/20 h-16 text-lg rounded-2xl"
                >
                  Initialize AI Interviewer
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center pt-8 border-t border-white/5">
        <Button
          variant="ghost"
          onClick={prevStep}
          disabled={currentStep === 0}
          className="text-white/40 hover:text-white disabled:opacity-0"
        >
          Back
        </Button>
        
        <div className="text-sm text-white/20 font-medium uppercase tracking-widest">
          Step {currentStep + 1} of {steps.length}
        </div>

        {/* Hidden spacer for flex alignment if no next button is needed yet */}
        <div className="w-[80px]" />
      </div>
    </div>
  );
}
