/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Flexible string types — the actual options are defined in InterviewSetup.tsx
export type Domain = string;
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Qualification = string;
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
