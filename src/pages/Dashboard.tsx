import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Play, 
  TrendingUp, 
  Award, 
  Clock, 
  ChevronRight, 
  BrainCircuit,
  Target,
  BarChart3
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { cn } from '../utils/cn';
import { Interview, UserProfile } from '../types';
import { Skeleton, CardSkeleton } from '../components/ui/LoadingSkeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentInterviews, setRecentInterviews] = useState<Interview[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    avgScore: 0,
    bestScore: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;

      try {
        // Fetch User Profile
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setProfile(userDocSnap.data() as UserProfile);
        }

        // Fetch Recent Interviews
        let interviewDocs;
        try {
          const q = query(
            collection(db, 'interviews'),
            where('userId', '==', auth.currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(5)
          );
          interviewDocs = await getDocs(q);
        } catch (error: any) {
          // Fallback if index is not yet created
          if (error.message?.includes('index')) {
            console.warn("Firestore index not found. Falling back to client-side sort.");
            const fallbackQ = query(
              collection(db, 'interviews'),
              where('userId', '==', auth.currentUser.uid),
              limit(20)
            );
            interviewDocs = await getDocs(fallbackQ);
          } else {
            throw error;
          }
        }

        let interviews = interviewDocs.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interview));
        
        // Sort client-side if we had to use the fallback
        if (interviews.length > 0 && interviews[0].createdAt < (interviews[interviews.length - 1]?.createdAt || 0)) {
           interviews = interviews.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
        } else if (interviewDocs.metadata.fromCache || !interviewDocs.query.toString().includes('orderBy')) {
           // Ensure it's sorted if we suspect it's not
           interviews = interviews.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
        }

        setRecentInterviews(interviews);

        // Calculate Stats
        if (interviews.length > 0) {
          const total = interviews.length;
          const avg = interviews.reduce((acc, curr) => acc + curr.overallScore, 0) / total;
          const best = Math.max(...interviews.map(i => i.overallScore));
          setStats({ total, avgScore: Math.round(avg), bestScore: best });
        }
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartData = [...recentInterviews].reverse().map(i => ({
    date: new Date(i.createdAt).toLocaleDateString(),
    score: i.overallScore
  }));

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-12 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome back, <span className="text-indigo-500">{profile?.name || 'User'}</span>!
          </h1>
          <p className="text-white/50 text-lg">
            Ready to sharpen your <span className="text-white font-medium">{profile?.domain || 'Tech'}</span> skills today?
          </p>
        </div>
        <Link to="/setup">
          <Button variant="premium" size="xl" className="shadow-indigo-500/20">
            <Play className="w-5 h-5 mr-2 fill-current" />
            Start New Interview
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/50">Total Interviews</p>
                <h3 className="text-2xl font-bold">{stats.total}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-500">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/50">Average Score</p>
                <h3 className="text-2xl font-bold">{stats.avgScore}%</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/50">Best Performance</p>
                <h3 className="text-2xl font-bold">{stats.bestScore}%</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress Chart */}
        <Card className="lg:col-span-2 bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Performance Progress
            </CardTitle>
            <CardDescription>Your interview scores over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#ffffff40" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#ffffff40" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0A0A0A', 
                      borderColor: '#ffffff10',
                      borderRadius: '12px',
                      color: '#fff'
                    }}
                    itemStyle={{ color: '#6366f1' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4">
                <BarChart3 className="w-12 h-12" />
                <p>No interview data yet. Start your first session!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentInterviews.length > 0 ? (
              recentInterviews.map((interview) => (
                <Link 
                  key={interview.id} 
                  to={`/results/${interview.id}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{interview.domain}</p>
                    <p className="text-xs text-white/40">{new Date(interview.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={interview.overallScore >= 70 ? 'success' : 'warning'}>
                      {interview.overallScore}%
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-white/30">
                <p className="text-sm">No recent activity</p>
              </div>
            )}
            <Link to="/history">
              <Button variant="ghost" className="w-full mt-4 text-white/50 hover:text-white">
                View All History
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Path */}
      <Card className="bg-gradient-to-r from-indigo-600/10 to-violet-600/10 border-white/10">
        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="p-4 rounded-3xl bg-white/10 backdrop-blur-xl">
              <BrainCircuit className="w-10 h-10 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">Ready for a challenge?</h3>
              <p className="text-white/60">Try a <span className="text-white font-medium">Hard</span> difficulty interview to push your limits.</p>
            </div>
          </div>
          <Link to="/setup">
            <Button variant="premium" size="lg">
              Challenge Yourself
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
