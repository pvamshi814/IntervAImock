import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, BrainCircuit, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useToast, Toast } from '../components/ui/Toast';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
      showToast("Password reset email sent! Please check your inbox.", 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 p-10 rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-600 to-blue-500" />
        
        <div className="text-center">
          <Link to="/" className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 mb-6 shadow-lg shadow-indigo-500/20 hover:scale-110 transition-transform">
            <BrainCircuit className="w-8 h-8 text-white" />
          </Link>
          <h2 className="text-3xl font-bold tracking-tight text-white">Reset Password</h2>
          <p className="mt-2 text-sm text-white/50">
            Enter your email to receive a password reset link
          </p>
        </div>

        {submitted ? (
          <div className="mt-8 space-y-6 text-center">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">Check your email</h3>
              <p className="text-white/40">
                We've sent a password reset link to <span className="text-indigo-400 font-medium">{email}</span>.
              </p>
            </div>
            <Link to="/login">
              <Button variant="outline" className="w-full mt-4 bg-white/5 border-white/10 hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleReset}>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 focus:border-indigo-500 transition-colors h-12 rounded-xl"
                required
              />
            </div>

            <Button
              type="submit"
              variant="premium"
              size="xl"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending Link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>

            <div className="text-center">
              <Link to="/login" className="inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </motion.div>
      {toast && <Toast {...toast} onClose={hideToast} />}
    </div>
  );
}
