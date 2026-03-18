import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BrainCircuit, Mic, Trophy, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function Home() {
  const user = auth.currentUser;

  const features = [
    {
      icon: <BrainCircuit className="w-6 h-6 text-indigo-400" />,
      title: "AI-Powered Questions",
      description: "Get domain-specific questions tailored to your experience level and target role."
    },
    {
      icon: <Mic className="w-6 h-6 text-violet-400" />,
      title: "Real-time Voice Interaction",
      description: "Practice with a natural, conversational AI that listens and speaks like a real interviewer."
    },
    {
      icon: <Zap className="w-6 h-6 text-blue-400" />,
      title: "Instant Evaluation",
      description: "Receive immediate feedback on your technical accuracy and communication skills."
    },
    {
      icon: <Trophy className="w-6 h-6 text-emerald-400" />,
      title: "Performance Analytics",
      description: "Track your progress over time with detailed charts and personalized suggestions."
    }
  ];

  return (
    <div className="space-y-32">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-indigo-300 mb-8"
          >
            <Zap className="w-4 h-4" />
            <span>Next-Gen Interview Preparation</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-6xl md:text-8xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40"
          >
            Master Your Next <br />
            <span className="text-indigo-500">Tech Interview</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            IntervAI uses advanced artificial intelligence to simulate realistic mock interviews, 
            providing you with the confidence and feedback you need to land your dream job.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {user ? (
              <Link to="/dashboard">
                <Button variant="premium" size="xl" className="group">
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/signup">
                  <Button variant="premium" size="xl" className="group">
                    Start Free Mock Interview
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="xl" className="bg-white/5 border-white/10 hover:bg-white/10">
                    View Demo
                  </Button>
                </Link>
              </>
            )}
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 blur-[120px] rounded-full -z-10" />
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors group"
            >
              <div className="p-3 rounded-2xl bg-white/5 w-fit mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">{feature.title}</h3>
              <p className="text-white/50 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold mb-12">Why choose IntervAI?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            "10,000+ Questions Database",
            "Real-time Voice Analysis",
            "Industry Standard Evaluation",
            "Personalized Learning Path",
            "Detailed Performance Reports",
            "24/7 AI Interviewer Availability"
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
              <span className="text-white/80 font-medium">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="relative p-12 md:p-24 rounded-[40px] overflow-hidden bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-white/10 text-center">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
          <h2 className="text-4xl md:text-5xl font-bold mb-8 relative z-10">Ready to ace your next interview?</h2>
          <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto relative z-10">
            Join thousands of developers who have improved their interview skills with IntervAI.
          </p>
          <Link to={user ? "/dashboard" : "/signup"} className="relative z-10">
            <Button variant="premium" size="xl">
              {user ? "Go to Dashboard" : "Get Started Now"}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
