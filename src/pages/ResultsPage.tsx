import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  CheckCircle2, 
  AlertCircle, 
  Lightbulb, 
  ArrowLeft, 
  Download, 
  Share2, 
  RotateCcw,
  BarChart3,
  MessageSquare,
  Target
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { cn } from '../utils/cn';
import { Interview } from '../types';
import { Skeleton, CardSkeleton } from '../components/ui/LoadingSkeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterview = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'interviews', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setInterview({ id: docSnap.id, ...docSnap.data() } as Interview);
        }
      } catch (error) {
        console.error("Error fetching interview results", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInterview();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="text-center py-20 space-y-6">
        <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
        <h2 className="text-3xl font-bold">Interview Not Found</h2>
        <p className="text-white/40">The interview results you're looking for don't exist.</p>
        <Link to="/dashboard">
          <Button variant="premium">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const scoreData = [
    { name: 'Score', value: interview.overallScore },
    { name: 'Remaining', value: 100 - interview.overallScore }
  ];

  const radarData = [
    { subject: 'Technical', A: interview.technicalScore, fullMark: 100 },
    { subject: 'Communication', A: interview.communicationScore, fullMark: 100 },
    { subject: 'Overall', A: interview.overallScore, fullMark: 100 },
    { subject: 'Confidence', A: 85, fullMark: 100 }, // Mock confidence
    { subject: 'Clarity', A: 90, fullMark: 100 }, // Mock clarity
  ];

  const COLORS = ['#6366f1', '#ffffff10'];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <Link to="/dashboard" className="inline-flex items-center text-sm text-white/40 hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold tracking-tight">Interview Performance Report</h1>
          <p className="text-white/50 text-lg">
            {interview.domain} • {interview.difficulty} • {new Date(interview.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10">
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </Button>
          <Button variant="premium">
            <Share2 className="w-4 h-4 mr-2" /> Share Report
          </Button>
        </div>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Score Circle */}
        <Card className="bg-white/5 border-white/10 flex flex-col items-center justify-center p-12 text-center">
          <div className="relative w-64 h-64 mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scoreData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  {scoreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-bold">{interview.overallScore}%</span>
              <span className="text-sm font-medium text-white/40 uppercase tracking-widest">Overall Score</span>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Excellent Performance!</h3>
            <p className="text-white/40">You've shown strong technical knowledge in {interview.domain}.</p>
          </div>
        </Card>

        {/* Radar Analysis */}
        <Card className="bg-white/5 border-white/10 flex flex-col items-center justify-center p-8">
          <CardHeader className="w-full text-center">
            <CardTitle className="text-lg flex items-center justify-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              Skill Breakdown
            </CardTitle>
          </CardHeader>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#ffffff10" />
                <PolarAngleAxis dataKey="subject" stroke="#ffffff40" fontSize={12} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Skills"
                  dataKey="A"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Detailed Stats */}
        <div className="space-y-6">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/50">Technical Score</p>
                  <h3 className="text-2xl font-bold">{interview.technicalScore}%</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-500">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/50">Communication Score</p>
                  <h3 className="text-2xl font-bold">{interview.communicationScore}%</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-white/10 text-white">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/50">Rank</p>
                  <h3 className="text-2xl font-bold">Top 5%</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feedback Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="bg-emerald-500/5 border-emerald-500/10">
          <CardHeader>
            <CardTitle className="text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {interview.feedback.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-rose-500/5 border-rose-500/10">
          <CardHeader>
            <CardTitle className="text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Weaknesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {interview.feedback.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/10">
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {interview.feedback.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-6 pt-8">
        <Link to="/setup">
          <Button variant="premium" size="xl">
            <RotateCcw className="w-5 h-5 mr-2" />
            Retake Interview
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="outline" size="xl" className="bg-white/5 border-white/10 hover:bg-white/10">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
