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
              <a href="#" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                Forgot password?
              </a>
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
            <span className="px-4 bg-transparent text-white/30 backdrop-blur-xl">Or continue with</span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handleGoogleLogin}
            className="bg-white/5 border-white/10 hover:bg-white/10 rounded-xl"
          >
            <Chrome className="w-5 h-5 mr-2" />
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
