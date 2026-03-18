import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Difficulty, UserProfile } from '../types';
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
  ArrowRight,
  BrainCircuit,
  Loader2,
  Shield,
  Globe,
  Briefcase,
  Calculator,
  BookOpen,
  Heart,
  Scale,
  Wrench,
  Palette,
  TrendingUp,
  Users,
  Building2,
  FlaskConical,
  Microscope,
  PenTool,
  LineChart,
  ShoppingBag,
  Stethoscope,
  Landmark,
  Gamepad2,
  Network,
  Layers
} from 'lucide-react';

// ─── Qualification definitions ──────────────────────────────────────────────
interface QualificationInfo {
  id: string;
  label: string;
  category: string;
}

const qualificationCategories = [
  {
    name: 'Engineering & Technology',
    items: [
      { id: 'B.Tech / B.E.', label: 'B.Tech / B.E.', category: 'Engineering & Technology' },
      { id: 'M.Tech / M.E.', label: 'M.Tech / M.E.', category: 'Engineering & Technology' },
      { id: 'BCA', label: 'BCA', category: 'Engineering & Technology' },
      { id: 'MCA', label: 'MCA', category: 'Engineering & Technology' },
      { id: 'Diploma (Engineering)', label: 'Diploma (Engg.)', category: 'Engineering & Technology' },
      { id: 'B.Sc (IT/CS)', label: 'B.Sc (IT / CS)', category: 'Engineering & Technology' },
      { id: 'M.Sc (IT/CS)', label: 'M.Sc (IT / CS)', category: 'Engineering & Technology' },
    ]
  },
  {
    name: 'Business & Commerce',
    items: [
      { id: 'B.Com', label: 'B.Com', category: 'Business & Commerce' },
      { id: 'M.Com', label: 'M.Com', category: 'Business & Commerce' },
      { id: 'BBA', label: 'BBA', category: 'Business & Commerce' },
      { id: 'MBA', label: 'MBA', category: 'Business & Commerce' },
      { id: 'CA', label: 'CA', category: 'Business & Commerce' },
      { id: 'CMA', label: 'CMA', category: 'Business & Commerce' },
    ]
  },
  {
    name: 'Science & Research',
    items: [
      { id: 'B.Sc (General)', label: 'B.Sc (General)', category: 'Science & Research' },
      { id: 'M.Sc (General)', label: 'M.Sc (General)', category: 'Science & Research' },
      { id: 'B.Pharm', label: 'B.Pharm', category: 'Science & Research' },
      { id: 'M.Pharm', label: 'M.Pharm', category: 'Science & Research' },
      { id: 'PhD', label: 'PhD / Research', category: 'Science & Research' },
    ]
  },
  {
    name: 'Arts & Humanities',
    items: [
      { id: 'BA', label: 'BA', category: 'Arts & Humanities' },
      { id: 'MA', label: 'MA', category: 'Arts & Humanities' },
      { id: 'B.Ed', label: 'B.Ed', category: 'Arts & Humanities' },
      { id: 'BFA', label: 'BFA (Fine Arts)', category: 'Arts & Humanities' },
    ]
  },
  {
    name: 'Medical & Health',
    items: [
      { id: 'MBBS', label: 'MBBS', category: 'Medical & Health' },
      { id: 'BDS', label: 'BDS', category: 'Medical & Health' },
      { id: 'B.Sc (Nursing)', label: 'B.Sc (Nursing)', category: 'Medical & Health' },
      { id: 'BAMS / BHMS', label: 'BAMS / BHMS', category: 'Medical & Health' },
    ]
  },
  {
    name: 'Law & Others',
    items: [
      { id: 'LLB', label: 'LLB / LLM', category: 'Law & Others' },
      { id: '12th Pass', label: '12th Pass', category: 'Law & Others' },
      { id: '10th Pass', label: '10th Pass', category: 'Law & Others' },
      { id: 'Other', label: 'Other', category: 'Law & Others' },
    ]
  },
];

// ─── Domain definitions (mapped to qualifications) ──────────────────────────
interface DomainInfo {
  id: string;
  icon: React.ReactNode;
  description: string;
}

const domainsByQualification: Record<string, DomainInfo[]> = {
  // Engineering / Tech qualifications
  'B.Tech / B.E.': [
    { id: 'Frontend Development', icon: <Layout className="w-5 h-5" />, description: "React, HTML, CSS, JavaScript" },
    { id: 'Backend Development', icon: <Database className="w-5 h-5" />, description: "Node.js, Python, APIs, SQL" },
    { id: 'Full Stack', icon: <Code2 className="w-5 h-5" />, description: "End-to-end web development" },
    { id: 'AI / Machine Learning', icon: <BrainCircuit className="w-5 h-5" />, description: "ML models, Deep Learning, NLP" },
    { id: 'Data Science', icon: <LineChart className="w-5 h-5" />, description: "Analytics, Statistics, Python" },
    { id: 'Mobile Development', icon: <Smartphone className="w-5 h-5" />, description: "Android, iOS, React Native" },
    { id: 'DevOps / Cloud', icon: <Cloud className="w-5 h-5" />, description: "AWS, Docker, CI/CD, K8s" },
    { id: 'Cybersecurity', icon: <Shield className="w-5 h-5" />, description: "Network Security, Ethical Hacking" },
    { id: 'Embedded Systems', icon: <Cpu className="w-5 h-5" />, description: "IoT, Microcontrollers, RTOS" },
    { id: 'Blockchain', icon: <Network className="w-5 h-5" />, description: "Smart Contracts, Web3, Solidity" },
    { id: 'Game Development', icon: <Gamepad2 className="w-5 h-5" />, description: "Unity, Unreal, Game Design" },
    { id: 'System Design', icon: <Layers className="w-5 h-5" />, description: "Architecture, Scalability, HLD" },
  ],
  'M.Tech / M.E.': [
    { id: 'AI / Machine Learning', icon: <BrainCircuit className="w-5 h-5" />, description: "Advanced ML, Research, DL" },
    { id: 'Data Science', icon: <LineChart className="w-5 h-5" />, description: "Advanced Analytics, Big Data" },
    { id: 'Full Stack', icon: <Code2 className="w-5 h-5" />, description: "End-to-end development" },
    { id: 'System Design', icon: <Layers className="w-5 h-5" />, description: "HLD, LLD, Architecture" },
    { id: 'Cybersecurity', icon: <Shield className="w-5 h-5" />, description: "Security Analysis, Cryptography" },
    { id: 'DevOps / Cloud', icon: <Cloud className="w-5 h-5" />, description: "Cloud Architecture, SRE" },
    { id: 'Embedded Systems', icon: <Cpu className="w-5 h-5" />, description: "VLSI, IoT, Firmware" },
    { id: 'Blockchain', icon: <Network className="w-5 h-5" />, description: "DApps, Smart Contracts" },
    { id: 'Backend Development', icon: <Database className="w-5 h-5" />, description: "Distributed Systems, APIs" },
    { id: 'Frontend Development', icon: <Layout className="w-5 h-5" />, description: "Advanced UI/UX Engineering" },
  ],
  'BCA': [
    { id: 'Frontend Development', icon: <Layout className="w-5 h-5" />, description: "HTML, CSS, JavaScript, React" },
    { id: 'Backend Development', icon: <Database className="w-5 h-5" />, description: "Node.js, PHP, Databases" },
    { id: 'Full Stack', icon: <Code2 className="w-5 h-5" />, description: "Web Development" },
    { id: 'Mobile Development', icon: <Smartphone className="w-5 h-5" />, description: "Android, Flutter, iOS" },
    { id: 'Data Science', icon: <LineChart className="w-5 h-5" />, description: "Python, Analytics" },
    { id: 'Web Design', icon: <Palette className="w-5 h-5" />, description: "UI/UX, Figma, Responsive Design" },
    { id: 'DevOps / Cloud', icon: <Cloud className="w-5 h-5" />, description: "AWS, Azure, Deployment" },
    { id: 'Cybersecurity', icon: <Shield className="w-5 h-5" />, description: "Security Basics, Networking" },
  ],
  'MCA': [
    { id: 'Full Stack', icon: <Code2 className="w-5 h-5" />, description: "Complete Web Development" },
    { id: 'Backend Development', icon: <Database className="w-5 h-5" />, description: "Java, Python, System Design" },
    { id: 'Frontend Development', icon: <Layout className="w-5 h-5" />, description: "React, Angular, UI/UX" },
    { id: 'AI / Machine Learning', icon: <BrainCircuit className="w-5 h-5" />, description: "ML, Deep Learning" },
    { id: 'Data Science', icon: <LineChart className="w-5 h-5" />, description: "Analytics, Visualization" },
    { id: 'Mobile Development', icon: <Smartphone className="w-5 h-5" />, description: "Cross-platform Apps" },
    { id: 'DevOps / Cloud', icon: <Cloud className="w-5 h-5" />, description: "Cloud Services, CI/CD" },
    { id: 'System Design', icon: <Layers className="w-5 h-5" />, description: "Software Architecture" },
    { id: 'Cybersecurity', icon: <Shield className="w-5 h-5" />, description: "App Security, Pen Testing" },
  ],
  'Diploma (Engineering)': [
    { id: 'Frontend Development', icon: <Layout className="w-5 h-5" />, description: "HTML, CSS, JavaScript" },
    { id: 'Backend Development', icon: <Database className="w-5 h-5" />, description: "PHP, Node.js, MySQL" },
    { id: 'Mobile Development', icon: <Smartphone className="w-5 h-5" />, description: "Android, Flutter" },
    { id: 'Networking', icon: <Network className="w-5 h-5" />, description: "Network Admin, Routing" },
    { id: 'Technical Support', icon: <Wrench className="w-5 h-5" />, description: "Hardware, Troubleshooting" },
    { id: 'Web Design', icon: <Palette className="w-5 h-5" />, description: "UI Design, WordPress" },
    { id: 'Mechanical Engineering', icon: <Wrench className="w-5 h-5" />, description: "CAD, Manufacturing" },
    { id: 'Electrical Engineering', icon: <Cpu className="w-5 h-5" />, description: "Circuits, Power Systems" },
  ],
  'B.Sc (IT/CS)': [
    { id: 'Frontend Development', icon: <Layout className="w-5 h-5" />, description: "React, JavaScript, CSS" },
    { id: 'Backend Development', icon: <Database className="w-5 h-5" />, description: "Python, Node.js, SQL" },
    { id: 'Full Stack', icon: <Code2 className="w-5 h-5" />, description: "Web Development" },
    { id: 'Data Science', icon: <LineChart className="w-5 h-5" />, description: "Python, Statistics" },
    { id: 'Mobile Development', icon: <Smartphone className="w-5 h-5" />, description: "Android, iOS" },
    { id: 'Cybersecurity', icon: <Shield className="w-5 h-5" />, description: "Security Fundamentals" },
    { id: 'DevOps / Cloud', icon: <Cloud className="w-5 h-5" />, description: "Cloud, CI/CD" },
  ],
  'M.Sc (IT/CS)': [
    { id: 'AI / Machine Learning', icon: <BrainCircuit className="w-5 h-5" />, description: "ML, NLP, Computer Vision" },
    { id: 'Data Science', icon: <LineChart className="w-5 h-5" />, description: "Advanced Analytics" },
    { id: 'Full Stack', icon: <Code2 className="w-5 h-5" />, description: "Advanced Development" },
    { id: 'System Design', icon: <Layers className="w-5 h-5" />, description: "Architecture, Scalability" },
    { id: 'Cybersecurity', icon: <Shield className="w-5 h-5" />, description: "Advanced Security" },
    { id: 'DevOps / Cloud', icon: <Cloud className="w-5 h-5" />, description: "Cloud Architecture" },
    { id: 'Backend Development', icon: <Database className="w-5 h-5" />, description: "Distributed Systems" },
  ],

  // Commerce / Business qualifications
  'B.Com': [
    { id: 'Accounting', icon: <Calculator className="w-5 h-5" />, description: "Financial Accounting, Tally" },
    { id: 'Finance', icon: <TrendingUp className="w-5 h-5" />, description: "Banking, Investment Basics" },
    { id: 'Taxation', icon: <Landmark className="w-5 h-5" />, description: "GST, Income Tax, TDS" },
    { id: 'Banking', icon: <Building2 className="w-5 h-5" />, description: "Banking Operations, KYC" },
    { id: 'Business Analytics', icon: <LineChart className="w-5 h-5" />, description: "Excel, Data Analysis" },
    { id: 'Auditing', icon: <Shield className="w-5 h-5" />, description: "Internal & External Audit" },
  ],
  'M.Com': [
    { id: 'Advanced Accounting', icon: <Calculator className="w-5 h-5" />, description: "Cost Accounting, IFRS" },
    { id: 'Finance', icon: <TrendingUp className="w-5 h-5" />, description: "Corporate Finance, Valuation" },
    { id: 'Taxation', icon: <Landmark className="w-5 h-5" />, description: "Advanced Tax Planning" },
    { id: 'Banking & Insurance', icon: <Building2 className="w-5 h-5" />, description: "Risk Management, Compliance" },
    { id: 'Business Analytics', icon: <LineChart className="w-5 h-5" />, description: "Advanced Analytics, BI" },
    { id: 'Auditing', icon: <Shield className="w-5 h-5" />, description: "Forensic Audit, Compliance" },
  ],
  'BBA': [
    { id: 'Marketing', icon: <ShoppingBag className="w-5 h-5" />, description: "Digital Marketing, Branding" },
    { id: 'Human Resources', icon: <Users className="w-5 h-5" />, description: "Recruitment, HR Policies" },
    { id: 'Finance', icon: <TrendingUp className="w-5 h-5" />, description: "Financial Management" },
    { id: 'Operations', icon: <Wrench className="w-5 h-5" />, description: "Supply Chain, Logistics" },
    { id: 'Business Analytics', icon: <LineChart className="w-5 h-5" />, description: "Data-driven Decisions" },
    { id: 'Entrepreneurship', icon: <Briefcase className="w-5 h-5" />, description: "Startups, Business Plans" },
  ],
  'MBA': [
    { id: 'Marketing', icon: <ShoppingBag className="w-5 h-5" />, description: "Strategy, Brand Management" },
    { id: 'Finance', icon: <TrendingUp className="w-5 h-5" />, description: "Corp Finance, M&A, Valuation" },
    { id: 'Human Resources', icon: <Users className="w-5 h-5" />, description: "Talent Strategy, OD" },
    { id: 'Operations Management', icon: <Wrench className="w-5 h-5" />, description: "Lean, Six Sigma, SCM" },
    { id: 'Product Management', icon: <Layers className="w-5 h-5" />, description: "Product Strategy, Roadmaps" },
    { id: 'Business Analytics', icon: <LineChart className="w-5 h-5" />, description: "BI, Power BI, Tableau" },
    { id: 'Strategy & Consulting', icon: <Briefcase className="w-5 h-5" />, description: "Business Strategy, Cases" },
    { id: 'Entrepreneurship', icon: <Globe className="w-5 h-5" />, description: "Venture Building, Pitching" },
  ],
  'CA': [
    { id: 'Accounting & Audit', icon: <Calculator className="w-5 h-5" />, description: "Audit, AS, IndAS" },
    { id: 'Taxation', icon: <Landmark className="w-5 h-5" />, description: "Direct & Indirect Tax" },
    { id: 'Finance', icon: <TrendingUp className="w-5 h-5" />, description: "Financial Reporting" },
    { id: 'Corporate Law', icon: <Scale className="w-5 h-5" />, description: "Company Law, Compliance" },
    { id: 'Cost Management', icon: <Calculator className="w-5 h-5" />, description: "Cost Accounting, CMA" },
  ],
  'CMA': [
    { id: 'Cost Accounting', icon: <Calculator className="w-5 h-5" />, description: "Costing, Budgeting" },
    { id: 'Finance', icon: <TrendingUp className="w-5 h-5" />, description: "Financial Management" },
    { id: 'Taxation', icon: <Landmark className="w-5 h-5" />, description: "Tax Compliance" },
    { id: 'Operations', icon: <Wrench className="w-5 h-5" />, description: "Operations Research" },
  ],

  // Science / Research qualifications
  'B.Sc (General)': [
    { id: 'Data Science', icon: <LineChart className="w-5 h-5" />, description: "Python, R, Statistics" },
    { id: 'Lab Research', icon: <Microscope className="w-5 h-5" />, description: "Laboratory Techniques" },
    { id: 'Environmental Science', icon: <Globe className="w-5 h-5" />, description: "Ecology, Sustainability" },
    { id: 'Biotechnology', icon: <FlaskConical className="w-5 h-5" />, description: "Biotech, Genetics" },
    { id: 'Chemistry', icon: <FlaskConical className="w-5 h-5" />, description: "Organic, Inorganic, Physical" },
    { id: 'Physics', icon: <Cpu className="w-5 h-5" />, description: "Mechanics, Quantum, Optics" },
    { id: 'Mathematics', icon: <Calculator className="w-5 h-5" />, description: "Pure & Applied Maths" },
  ],
  'M.Sc (General)': [
    { id: 'Data Science', icon: <LineChart className="w-5 h-5" />, description: "Advanced Analytics, ML" },
    { id: 'Research Methodology', icon: <Microscope className="w-5 h-5" />, description: "Academic Research" },
    { id: 'Biotechnology', icon: <FlaskConical className="w-5 h-5" />, description: "Advanced Biotech" },
    { id: 'Chemistry', icon: <FlaskConical className="w-5 h-5" />, description: "Advanced Chemistry" },
    { id: 'Physics', icon: <Cpu className="w-5 h-5" />, description: "Advanced Physics" },
    { id: 'Mathematics', icon: <Calculator className="w-5 h-5" />, description: "Advanced Mathematics" },
  ],
  'B.Pharm': [
    { id: 'Pharmaceutical Sciences', icon: <FlaskConical className="w-5 h-5" />, description: "Drug Formulation" },
    { id: 'Clinical Research', icon: <Microscope className="w-5 h-5" />, description: "Clinical Trials, GCP" },
    { id: 'Pharmacology', icon: <Stethoscope className="w-5 h-5" />, description: "Drug Action, Dosage" },
    { id: 'Quality Control', icon: <Shield className="w-5 h-5" />, description: "QA/QC, GMP" },
    { id: 'Pharma Sales', icon: <ShoppingBag className="w-5 h-5" />, description: "Medical Reps, Sales" },
  ],
  'M.Pharm': [
    { id: 'Pharmaceutical Research', icon: <Microscope className="w-5 h-5" />, description: "Drug Development" },
    { id: 'Clinical Research', icon: <FlaskConical className="w-5 h-5" />, description: "Advanced Trials" },
    { id: 'Regulatory Affairs', icon: <Shield className="w-5 h-5" />, description: "Drug Regulation, FDA" },
    { id: 'Pharmacology', icon: <Stethoscope className="w-5 h-5" />, description: "Advanced Pharmacology" },
  ],
  'PhD': [
    { id: 'Research & Academia', icon: <Microscope className="w-5 h-5" />, description: "Academic Research" },
    { id: 'AI / Machine Learning', icon: <BrainCircuit className="w-5 h-5" />, description: "ML Research" },
    { id: 'Data Science', icon: <LineChart className="w-5 h-5" />, description: "Research Analytics" },
    { id: 'Teaching', icon: <BookOpen className="w-5 h-5" />, description: "Higher Education" },
  ],

  // Arts / Humanities qualifications
  'BA': [
    { id: 'Content Writing', icon: <PenTool className="w-5 h-5" />, description: "Copywriting, Blogging" },
    { id: 'Journalism', icon: <Globe className="w-5 h-5" />, description: "News, Media, Reporting" },
    { id: 'Public Relations', icon: <Users className="w-5 h-5" />, description: "Corporate Comms, PR" },
    { id: 'Teaching', icon: <BookOpen className="w-5 h-5" />, description: "Education, Tutoring" },
    { id: 'Social Work', icon: <Heart className="w-5 h-5" />, description: "NGO, Community Service" },
    { id: 'Psychology', icon: <BrainCircuit className="w-5 h-5" />, description: "Counseling, Therapy" },
    { id: 'Digital Marketing', icon: <ShoppingBag className="w-5 h-5" />, description: "SEO, Social Media" },
  ],
  'MA': [
    { id: 'Content Strategy', icon: <PenTool className="w-5 h-5" />, description: "Content Marketing" },
    { id: 'Journalism', icon: <Globe className="w-5 h-5" />, description: "Investigative, Digital" },
    { id: 'Psychology', icon: <BrainCircuit className="w-5 h-5" />, description: "Clinical, Counseling" },
    { id: 'Teaching', icon: <BookOpen className="w-5 h-5" />, description: "Higher Education" },
    { id: 'Public Administration', icon: <Building2 className="w-5 h-5" />, description: "Governance, Policy" },
    { id: 'Research', icon: <Microscope className="w-5 h-5" />, description: "Academic Research" },
  ],
  'B.Ed': [
    { id: 'Primary Education', icon: <BookOpen className="w-5 h-5" />, description: "Teaching Young Learners" },
    { id: 'Secondary Education', icon: <GraduationCap className="w-5 h-5" />, description: "High School Teaching" },
    { id: 'Special Education', icon: <Heart className="w-5 h-5" />, description: "Inclusive Education" },
    { id: 'EdTech', icon: <Smartphone className="w-5 h-5" />, description: "Education Technology" },
    { id: 'Curriculum Design', icon: <PenTool className="w-5 h-5" />, description: "Syllabus Planning" },
  ],
  'BFA': [
    { id: 'UI/UX Design', icon: <Palette className="w-5 h-5" />, description: "Figma, Adobe, Prototyping" },
    { id: 'Graphic Design', icon: <Palette className="w-5 h-5" />, description: "Branding, Illustration" },
    { id: 'Animation', icon: <Gamepad2 className="w-5 h-5" />, description: "2D/3D, Motion Graphics" },
    { id: 'Fine Arts', icon: <Palette className="w-5 h-5" />, description: "Painting, Sculpture" },
    { id: 'Photography', icon: <Palette className="w-5 h-5" />, description: "Photo, Video Production" },
  ],

  // Medical / Health qualifications
  'MBBS': [
    { id: 'General Medicine', icon: <Stethoscope className="w-5 h-5" />, description: "Internal Medicine" },
    { id: 'Surgery', icon: <Stethoscope className="w-5 h-5" />, description: "General Surgery" },
    { id: 'Pediatrics', icon: <Heart className="w-5 h-5" />, description: "Child Healthcare" },
    { id: 'Dermatology', icon: <Stethoscope className="w-5 h-5" />, description: "Skin, Hair Conditions" },
    { id: 'Psychiatry', icon: <BrainCircuit className="w-5 h-5" />, description: "Mental Health" },
    { id: 'Orthopedics', icon: <Wrench className="w-5 h-5" />, description: "Bones, Joints, Trauma" },
  ],
  'BDS': [
    { id: 'General Dentistry', icon: <Stethoscope className="w-5 h-5" />, description: "Dental Care" },
    { id: 'Orthodontics', icon: <Stethoscope className="w-5 h-5" />, description: "Braces, Aligners" },
    { id: 'Oral Surgery', icon: <Stethoscope className="w-5 h-5" />, description: "Dental Surgery" },
  ],
  'B.Sc (Nursing)': [
    { id: 'Clinical Nursing', icon: <Heart className="w-5 h-5" />, description: "Patient Care" },
    { id: 'Community Health', icon: <Users className="w-5 h-5" />, description: "Public Health Nursing" },
    { id: 'ICU / Critical Care', icon: <Stethoscope className="w-5 h-5" />, description: "Emergency Nursing" },
  ],
  'BAMS / BHMS': [
    { id: 'Ayurveda / Homeopathy', icon: <FlaskConical className="w-5 h-5" />, description: "Traditional Medicine" },
    { id: 'Clinical Practice', icon: <Stethoscope className="w-5 h-5" />, description: "Patient Diagnosis" },
    { id: 'Panchakarma', icon: <Heart className="w-5 h-5" />, description: "Ayurvedic Therapy" },
  ],

  // Law / Others
  'LLB': [
    { id: 'Corporate Law', icon: <Building2 className="w-5 h-5" />, description: "Company Law, Contracts" },
    { id: 'Criminal Law', icon: <Scale className="w-5 h-5" />, description: "IPC, CrPC, Evidence" },
    { id: 'Civil Law', icon: <Scale className="w-5 h-5" />, description: "Property, Family Law" },
    { id: 'Intellectual Property', icon: <Shield className="w-5 h-5" />, description: "Patents, Trademarks" },
    { id: 'Tax Law', icon: <Landmark className="w-5 h-5" />, description: "Tax Litigation" },
    { id: 'Constitutional Law', icon: <BookOpen className="w-5 h-5" />, description: "Fundamental Rights" },
  ],
  '12th Pass': [
    { id: 'Customer Support', icon: <Users className="w-5 h-5" />, description: "Call Center, Help Desk" },
    { id: 'Data Entry', icon: <Calculator className="w-5 h-5" />, description: "Data Entry, MS Office" },
    { id: 'Sales & Retail', icon: <ShoppingBag className="w-5 h-5" />, description: "Retail, Sales" },
    { id: 'Office Administration', icon: <Building2 className="w-5 h-5" />, description: "Admin, Filing" },
    { id: 'Digital Marketing', icon: <Globe className="w-5 h-5" />, description: "Social Media, SEO" },
    { id: 'Basic Programming', icon: <Code2 className="w-5 h-5" />, description: "HTML, Python Basics" },
  ],
  '10th Pass': [
    { id: 'Customer Support', icon: <Users className="w-5 h-5" />, description: "Phone, Chat Support" },
    { id: 'Data Entry', icon: <Calculator className="w-5 h-5" />, description: "Typing, MS Office" },
    { id: 'Sales & Retail', icon: <ShoppingBag className="w-5 h-5" />, description: "Shop, Store Assistant" },
    { id: 'Office Assistant', icon: <Building2 className="w-5 h-5" />, description: "Office Tasks, Filing" },
  ],
  'Other': [
    { id: 'General Knowledge', icon: <BookOpen className="w-5 h-5" />, description: "Aptitude, GK, Reasoning" },
    { id: 'Communication Skills', icon: <Users className="w-5 h-5" />, description: "English, Soft Skills" },
    { id: 'Digital Marketing', icon: <Globe className="w-5 h-5" />, description: "SEO, Social Media" },
    { id: 'Basic Programming', icon: <Code2 className="w-5 h-5" />, description: "Programming Basics" },
    { id: 'Customer Support', icon: <Users className="w-5 h-5" />, description: "Service, Communication" },
  ],
};

const difficulties: { id: Difficulty; label: string; color: string; description: string }[] = [
  { id: 'Easy', label: 'Beginner Friendly', color: 'text-emerald-400', description: 'Simple, understandable questions' },
  { id: 'Medium', label: 'Standard Interview', color: 'text-amber-400', description: 'Industry-standard difficulty' },
  { id: 'Hard', label: 'Expert Level', color: 'text-rose-400', description: 'Challenging, deep questions' },
];

const userStatuses: { id: string; label: string }[] = [
  { id: 'Student', label: 'Student' },
  { id: 'Teacher', label: 'Teacher' },
  { id: 'Professional', label: 'Working Professional' },
  { id: 'Job Seeker', label: 'Job Seeker' },
];

export function InterviewSetup() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedQualification, setSelectedQualification] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
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

  // Reset domain when qualification changes (domains depend on qualification)
  useEffect(() => {
    setSelectedDomain(null);
  }, [selectedQualification]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const availableDomains = selectedQualification ? (domainsByQualification[selectedQualification] || domainsByQualification['Other']) : [];

  const steps = [
    { title: 'Qualification', description: 'Select your educational background' },
    { title: 'Status', description: 'What is your current professional status?' },
    { title: 'Domain', description: 'Choose a field for your interview' },
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
              <div className="space-y-6">
                {qualificationCategories.map((category) => (
                  <div key={category.name} className="space-y-3">
                    <h3 className="text-sm font-semibold text-white/30 uppercase tracking-wider px-1">
                      {category.name}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {category.items.map((q) => (
                        <Button
                          key={q.id}
                          variant={selectedQualification === q.id ? "premium" : "outline"}
                          onClick={() => {
                            setSelectedQualification(q.id);
                            setTimeout(nextStep, 300);
                          }}
                          className={cn(
                            "justify-center h-14 px-4 rounded-2xl border-white/10 text-sm font-medium",
                            selectedQualification === q.id ? "shadow-indigo-500/20" : "bg-white/5 text-white/60 hover:bg-white/10"
                          )}
                        >
                          {q.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 1: Status */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                {userStatuses.map((s) => (
                  <Button
                    key={s.id}
                    variant={selectedStatus === s.id ? "premium" : "outline"}
                    onClick={() => {
                      setSelectedStatus(s.id);
                      setTimeout(nextStep, 300);
                    }}
                    className={cn(
                      "justify-start h-20 px-8 rounded-2xl border-white/10 text-lg",
                      selectedStatus === s.id ? "shadow-indigo-500/20" : "bg-white/5 text-white/60 hover:bg-white/10"
                    )}
                  >
                    <UserCircle className="w-6 h-6 mr-4 opacity-50" />
                    {s.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Step 2: Domain (filtered by qualification) */}
            {currentStep === 2 && (
              <div className="space-y-3">
                {selectedQualification && (
                  <p className="text-sm text-white/30 text-center mb-4">
                    Showing domains relevant to <span className="text-indigo-400 font-medium">{selectedQualification}</span>
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availableDomains.map((domain) => (
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
                      <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "p-2.5 rounded-xl transition-colors",
                            selectedDomain === domain.id ? "bg-indigo-500 text-white" : "bg-white/5 text-white/40 group-hover:text-white"
                          )}>
                            {domain.icon}
                          </div>
                          <div className="space-y-0.5">
                            <h3 className="font-bold text-base">{domain.id}</h3>
                            <p className="text-xs text-white/40 leading-snug">{domain.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Difficulty */}
            {currentStep === 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
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
                    <CardContent className="p-10 text-center space-y-3">
                      <h3 className={cn("text-3xl font-bold", diff.color)}>{diff.id}</h3>
                      <p className="text-sm text-white/40">{diff.label}</p>
                      <p className="text-xs text-white/20">{diff.description}</p>
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

        <div className="w-[80px]" />
      </div>
    </div>
  );
}
