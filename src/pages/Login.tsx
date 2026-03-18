import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Github, Chrome, ArrowRight, BrainCircuit } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useToast, Toast } from '../components/ui/Toast';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/unauthorized-domain') {
        showToast("Unauthorized Domain: Please add this domain to Firebase Console Authentication settings.", 'error');
      } else {
        showToast(error.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/unauthorized-domain') {
        showToast("Unauthorized Domain: Please add this domain to Firebase Console Authentication settings.", 'error');
      } else {
        showToast(error.message, 'error');
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 p-10 rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden"
      >
        {/* Decorative Gradient */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-600 to-blue-500" />
        
        <div className="text-center">
          <Link to="/" className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 mb-6 shadow-lg shadow-indigo-500/20 hover:scale-110 transition-transform">
            <BrainCircuit className="w-8 h-8 text-white" />
          </Link>
          <h2 className="text-3xl font-bold tracking-tight text-white">Welcome Back</h2>
          <p className="mt-2 text-sm text-white/50">
            Sign in to continue your interview preparation
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleEmailLogin}>
          <div className="space-y-4">
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
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 focus:border-indigo-500 transition-colors h-12 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-white/10 bg-white/5 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-white/50">
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <Link to="/forgot-password" title="Reset your password" id="forgot-password-link" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="premium"
            size="xl"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </form>

        <div className="mt-8 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-[#0a0a0a] text-white/30 rounded-full border border-white/5">Or continue with</span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handleGoogleLogin}
            className="bg-white/5 border-white/10 hover:bg-white/10 rounded-xl group transition-all"
          >
            <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="bg-white/5 border-white/10 hover:bg-white/10 rounded-xl"
          >
            <Github className="w-5 h-5 mr-2" />
            Github
          </Button>
        </div>

        <p className="mt-8 text-center text-sm text-white/50">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
            Sign up for free
          </Link>
        </p>
      </motion.div>
      {toast && <Toast {...toast} onClose={hideToast} />}
    </div>
  );
}
