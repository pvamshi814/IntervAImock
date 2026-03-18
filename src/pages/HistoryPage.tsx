import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  History, 
  Search, 
  Filter, 
  ChevronRight, 
  Calendar, 
  Trophy, 
  Target,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { cn } from '../utils/cn';
import { Interview } from '../types';
import { Skeleton } from '../components/ui/LoadingSkeleton';

export function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!auth.currentUser) return;
      try {
        let history: Interview[] = [];
        try {
          // Try with orderBy first (requires index)
          const q = query(
            collection(db, 'interviews'),
            where('userId', '==', auth.currentUser.uid),
            orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          history = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interview));
        } catch (error: any) {
          // Fallback to client-side sort if index is missing
          if (error.message?.includes('index') || error.code === 'failed-precondition') {
            console.warn("Firestore index missing. Falling back to client-side sorting.");
            const fallbackQ = query(
              collection(db, 'interviews'),
              where('userId', '==', auth.currentUser.uid)
            );
            const querySnapshot = await getDocs(fallbackQ);
            history = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interview));
            history.sort((a, b) => b.createdAt - a.createdAt);
          } else {
            throw error;
          }
        }
        setInterviews(history);
      } catch (error) {
        console.error("Error fetching interview history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredInterviews = interviews.filter(i => 
    i.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <Link to="/dashboard" className="inline-flex items-center text-sm text-white/40 hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold tracking-tight">Interview History</h1>
          <p className="text-white/50 text-lg">Review your past performances and track your growth.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input 
              placeholder="Search by domain..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10"
            />
          </div>
          <Button variant="outline" size="icon" className="bg-white/5 border-white/10">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {filteredInterviews.length > 0 ? (
          filteredInterviews.map((interview, index) => (
            <motion.div
              key={interview.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/results/${interview.id}`}>
                <Card className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-indigo-500/30 transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-6 w-full md:w-auto">
                        <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
                          <History className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold">{interview.domain}</h3>
                          <div className="flex items-center gap-4 text-sm text-white/40">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(interview.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(interview.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full md:w-auto gap-8">
                        <div className="flex items-center gap-8">
                          <div className="text-center">
                            <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1 font-bold">Difficulty</p>
                            <Badge variant="outline" className="bg-white/5 border-white/10">{interview.difficulty}</Badge>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1 font-bold">Score</p>
                            <div className="flex items-center gap-2">
                              <Trophy className={cn(
                                "w-4 h-4",
                                interview.overallScore >= 80 ? "text-amber-400" : 
                                interview.overallScore >= 60 ? "text-slate-400" : "text-amber-700"
                              )} />
                              <span className="text-xl font-bold">{interview.overallScore}%</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 space-y-6 bg-white/5 border border-white/10 rounded-3xl">
            <div className="p-6 rounded-full bg-white/5 w-fit mx-auto">
              <Target className="w-12 h-12 text-white/20" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">No interviews found</h3>
              <p className="text-white/40">Start your first interview to see your history here.</p>
            </div>
            <Link to="/setup">
              <Button variant="premium">Start Interview</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
