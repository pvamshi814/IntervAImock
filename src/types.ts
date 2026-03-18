/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Domain = 'Frontend' | 'Backend' | 'Fullstack' | 'AI/ML' | 'Data Science' | 'Mobile' | 'DevOps';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Qualification = 'B.Tech' | 'M.Tech' | 'Science' | 'Commerce' | 'Arts' | 'Other';
export type UserStatus = 'Student' | 'Teacher' | 'Professional' | 'Job Seeker';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  education: string;
  qualification?: Qualification;
  userStatus?: UserStatus;
  domain: Domain;
  experience: 'Fresher' | 'Experienced';
  createdAt: number;
}

export interface Question {
  id: string;
  text: string;
  category: string;
}

export interface Interview {
  id: string;
  userId: string;
  domain: Domain;
  difficulty: Difficulty;
  qualification: Qualification;
  userStatus: UserStatus;
  questions: Question[];
  answers: string[];
  communicationScore: number;
  technicalScore: number;
  overallScore: number;
  feedback: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  createdAt: number;
}

export interface InterviewSession {
  currentQuestionIndex: number;
  answers: string[];
  isRecording: boolean;
  transcript: string;
}
