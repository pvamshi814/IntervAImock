import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  GraduationCap, 
  Briefcase, 
  Target, 
  Save, 
  LogOut, 
  Camera,
  CheckCircle2,
  BrainCircuit
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { cn } from '../utils/cn';
import { UserProfile } from '../types';
import { useToast, Toast } from '../components/ui/Toast';
import { Skeleton } from '../components/ui/LoadingSkeleton';

const domains = [
  'Frontend Development', 'Backend Development', 'Full Stack', 'AI / Machine Learning', 
  'Data Science', 'Mobile Development', 'DevOps / Cloud', 'Cybersecurity', 
  'Accounting', 'Finance', 'Marketing', 'Human Resources', 'Product Management',
  'Teaching', 'Content Writing', 'General Medicine', 'Corporate Law', 'Other'
];

export function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } catch (error) {
        console.error("Error fetching profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !profile) return;

    setSaving(true);
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, {
        name: profile.name,
        education: profile.education,
        domain: profile.domain,
        experience: profile.experience
      });
      showToast("Profile updated successfully!", "success");
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-12 w-64" />
        <Card className="bg-white/5 border-white/10 p-12 flex flex-col items-center space-y-6">
          <Skeleton className="w-32 h-32 rounded-full" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-white/50 text-lg">Manage your personal information and interview preferences.</p>
        </div>
        <Button 
          variant="ghost" 
          onClick={() => auth.signOut().then(() => navigate('/login'))}
          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Summary */}
        <div className="space-y-6">
          <Card className="bg-white/5 border-white/10 text-center p-8">
            <div className="relative w-32 h-32 mx-auto mb-6 group">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 animate-pulse blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative w-full h-full rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center overflow-hidden">
                <User className="w-16 h-16 text-white/20" />
                <button className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
            <h3 className="text-2xl font-bold">{profile?.name}</h3>
            <p className="text-white/40 text-sm mb-6">{profile?.email}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="success">{profile?.domain}</Badge>
              <Badge variant="outline" className="bg-white/5 border-white/10">{profile?.experience}</Badge>
            </div>
          </Card>

          <Card className="bg-indigo-600/10 border-indigo-500/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                Interview Focus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-white/60 leading-relaxed">
                Your current focus is on <span className="text-white font-medium">{profile?.domain}</span> roles. 
                Our AI will prioritize questions related to this domain during your mock interviews.
              </p>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                <BrainCircuit className="w-5 h-5 text-indigo-400" />
                <span className="text-xs text-white/40">AI-optimized questions enabled</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Edit Form */}
        <Card className="lg:col-span-2 bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your details to get more accurate interview questions.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/60 flex items-center gap-2">
                    <User className="w-4 h-4" /> Full Name
                  </label>
                  <Input 
                    value={profile?.name || ''} 
                    onChange={(e) => setProfile(p => p ? { ...p, name: e.target.value } : null)}
                    className="bg-white/5 border-white/10 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/60 flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Email Address
                  </label>
                  <Input 
                    value={profile?.email || ''} 
                    disabled
                    className="bg-white/5 border-white/10 opacity-50 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/60 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" /> Education
                  </label>
                  <Input 
                    value={profile?.education || ''} 
                    onChange={(e) => setProfile(p => p ? { ...p, education: e.target.value } : null)}
                    placeholder="e.g. B.Tech in Computer Science"
                    className="bg-white/5 border-white/10 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/60 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Experience Level
                  </label>
                  <select
                    value={profile?.experience || 'Fresher'}
                    onChange={(e) => setProfile(p => p ? { ...p, experience: e.target.value as any } : null)}
                    className="w-full h-10 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Fresher" className="bg-black">Fresher</option>
                    <option value="Experienced" className="bg-black">Experienced</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-white/60">Target Domain</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {domains.map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => setProfile(p => p ? { ...p, domain } : null)}
                      className={cn(
                        "px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                        profile?.domain === domain 
                          ? "bg-indigo-500/10 border-indigo-500 text-indigo-400" 
                          : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                      )}
                    >
                      {domain}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <Button 
                  type="submit" 
                  variant="premium" 
                  size="lg" 
                  disabled={saving}
                  className="min-w-[160px]"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      {toast && <Toast {...toast} onClose={hideToast} />}
    </div>
  );
}
