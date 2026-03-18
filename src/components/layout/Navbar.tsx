import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, LayoutDashboard, History, Settings, BrainCircuit } from 'lucide-react';
import { Button } from '../ui/Button';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

export function Navbar() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl group-hover:scale-110 transition-transform">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              IntervAI
            </span>
          </Link>

          {user && (
            <div className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <Link to="/history" className="text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-2">
                <History className="w-4 h-4" /> History
              </Link>
              <Link to="/profile" className="text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-2">
                <User className="w-4 h-4" /> Profile
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-white/70 hover:text-white">
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </div>
          )}

          {!user && (
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">Login</Button>
              </Link>
              <Link to="/signup">
                <Button variant="premium" size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
