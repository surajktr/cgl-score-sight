import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CandidateInfo {
  rollNumber: string;
  name: string;
  examLevel: string;
  testDate: string;
  shift: string;
  centreName: string;
}

interface QuestionData {
  questionNumber: number;
  part: string;
  subject: string;
  questionImageUrl: string;
  questionImageUrlHindi?: string;
  questionImageUrlEnglish?: string;
  questionText?: string;
  options: {
    id: string;
    imageUrl: string;
    imageUrlHindi?: string;
    imageUrlEnglish?: string;
    text?: string;
    isSelected: boolean;
    isCorrect: boolean;
  }[];
  status: 'correct' | 'wrong' | 'unattempted' | 'bonus';
  marksAwarded: number;
  isBonus?: boolean;
}

interface SectionData {
  part: string;
  subject: string;
  correct: number;
  wrong: number;
  unattempted: number;
  bonus: number;
  score: number;
  maxMarks: number;
  correctMarks: number;
  negativeMarks: number;
  isQualifying?: boolean;
}

interface SubjectConfig {
  name: string;
  part: string;
  totalQuestions: number;
  maxMarks: number;
  correctMarks: number;
  negativeMarks: number;
  isQualifying?: boolean;
}

interface ExamConfig {
  id: string;
  name: string;
  displayName: string;
  emoji: string;
  subjects: SubjectConfig[];
  totalQuestions: number;
  maxMarks: number;
}

interface AnalysisResult {
  candidate: CandidateInfo;
  examType: string;
  examConfig: ExamConfig;
  language: string;
  totalScore: number;
  maxScore: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  bonusCount: number;
  sections: SectionData[];
  questions: QuestionData[];
}

// Exam configurations
const EXAM_CONFIGS: Record<string, ExamConfig> = {
  SSC_CGL_PRE: {
    id: 'SSC_CGL_PRE', name: 'SSC CGL PRE (Tier-I)', displayName: 'SSC CGL Tier-I', emoji: '🟢',
    subjects: [
      { name: 'General Intelligence & Reasoning', part: 'A', totalQuestions: 25, maxMarks: 50, correctMarks: 2, negativeMarks: 0.50 },
      { name: 'General Awareness', part: 'B', totalQuestions: 25, maxMarks: 50, correctMarks: 2, negativeMarks: 0.50 },
      { name: 'Quantitative Aptitude', part: 'C', totalQuestions: 25, maxMarks: 50, correctMarks: 2, negativeMarks: 0.50 },
      { name: 'English Comprehension', part: 'D', totalQuestions: 25, maxMarks: 50, correctMarks: 2, negativeMarks: 0.50 },
    ], totalQuestions: 100, maxMarks: 200,
  },
  SSC_CGL_MAINS: {
    id: 'SSC_CGL_MAINS', name: 'SSC CGL MAINS (Tier-II)', displayName: 'SSC CGL Tier-II', emoji: '🟢',
    subjects: [
      { name: 'Mathematical Abilities', part: 'A', totalQuestions: 30, maxMarks: 90, correctMarks: 3, negativeMarks: 1 },
      { name: 'Reasoning & General Intelligence', part: 'B', totalQuestions: 30, maxMarks: 90, correctMarks: 3, negativeMarks: 1 },
      { name: 'English Language & Comprehension', part: 'C', totalQuestions: 45, maxMarks: 135, correctMarks: 3, negativeMarks: 1 },
      { name: 'General Awareness', part: 'D', totalQuestions: 25, maxMarks: 75, correctMarks: 3, negativeMarks: 0.50, isQualifying: true },
      { name: 'Computer Knowledge', part: 'E', totalQuestions: 20, maxMarks: 60, correctMarks: 3, negativeMarks: 0.50, isQualifying: true },
    ], totalQuestions: 150, maxMarks: 450,
  },
  SSC_CHSL_PRE: {
    id: 'SSC_CHSL_PRE', name: 'SSC CHSL PRE (Tier-I)', displayName: 'SSC CHSL Tier-I', emoji: '🟣',
    subjects: [
      { name: 'General Intelligence', part: 'A', totalQuestions: 25, maxMarks: 50, correctMarks: 2, negativeMarks: 1 },
      { name: 'English Language', part: 'B', totalQuestions: 25, maxMarks: 50, correctMarks: 2, negativeMarks: 1 },
      { name: 'Quantitative Aptitude', part: 'C', totalQuestions: 25, maxMarks: 50, correctMarks: 2, negativeMarks: 1 },
      { name: 'General Awareness', part: 'D', totalQuestions: 25, maxMarks: 50, correctMarks: 2, negativeMarks: 1 },
    ], totalQuestions: 100, maxMarks: 200,
  },
  SSC_CHSL_MAINS: {
    id: 'SSC_CHSL_MAINS', name: 'SSC CHSL MAINS (Tier-II)', displayName: 'SSC CHSL Tier-II', emoji: '🟣',
    subjects: [
      { name: 'Mathematical Abilities', part: 'A', totalQuestions: 30, maxMarks: 90, correctMarks: 3, negativeMarks: 1 },
      { name: 'Reasoning & General Awareness', part: 'B', totalQuestions: 30, maxMarks: 90, correctMarks: 3, negativeMarks: 1 },
      { name: 'English Language & Comprehension', part: 'C', totalQuestions: 45, maxMarks: 135, correctMarks: 3, negativeMarks: 1 },
      { name: 'Computer Knowledge', part: 'D', totalQuestions: 30, maxMarks: 90, correctMarks: 3, negativeMarks: 1 },
    ], totalQuestions: 135, maxMarks: 405,
  },
  SSC_CPO_PRE: {
    id: 'SSC_CPO_PRE', name: 'SSC CPO PRE (Paper-I)', displayName: 'SSC CPO Paper-I', emoji: '🔵',
    subjects: [
      { name: 'General Intelligence & Reasoning', part: 'A', totalQuestions: 50, maxMarks: 50, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'General Knowledge & Awareness', part: 'B', totalQuestions: 50, maxMarks: 50, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Quantitative Aptitude', part: 'C', totalQuestions: 50, maxMarks: 50, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'English Comprehension', part: 'D', totalQuestions: 50, maxMarks: 50, correctMarks: 1, negativeMarks: 0.25 },
    ], totalQuestions: 200, maxMarks: 200,
  },
  SSC_CPO_MAINS: {
    id: 'SSC_CPO_MAINS', name: 'SSC CPO MAINS (Paper-II)', displayName: 'SSC CPO Paper-II', emoji: '🔵',
    subjects: [
      { name: 'English Language & Comprehension', part: 'A', totalQuestions: 200, maxMarks: 200, correctMarks: 1, negativeMarks: 0.25 },
    ], totalQuestions: 200, maxMarks: 200,
  },
  SSC_MTS: {
    id: 'SSC_MTS', name: 'SSC MTS (CBT)', displayName: 'SSC MTS', emoji: '🟠',
    subjects: [
      { name: 'Numerical & Mathematical Ability', part: 'A', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Reasoning Ability & Problem Solving', part: 'B', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'General Awareness', part: 'C', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'English Language & Comprehension', part: 'D', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.25 },
    ], totalQuestions: 90, maxMarks: 90,
  },
  SSC_GD_CONSTABLE: {
    id: 'SSC_GD_CONSTABLE', name: 'SSC GD Constable (CBT)', displayName: 'SSC GD', emoji: '🟤',
    subjects: [
      { name: 'General Intelligence & Reasoning', part: 'A', totalQuestions: 20, maxMarks: 40, correctMarks: 2, negativeMarks: 0.50 },
      { name: 'General Knowledge & Awareness', part: 'B', totalQuestions: 20, maxMarks: 40, correctMarks: 2, negativeMarks: 0.50 },
      { name: 'Elementary Mathematics', part: 'C', totalQuestions: 20, maxMarks: 40, correctMarks: 2, negativeMarks: 0.50 },
      { name: 'English / Hindi', part: 'D', totalQuestions: 20, maxMarks: 40, correctMarks: 2, negativeMarks: 0.50 },
    ], totalQuestions: 80, maxMarks: 160,
  },
  SSC_STENO: {
    id: 'SSC_STENO', name: 'SSC Stenographer (CBT)', displayName: 'SSC Steno', emoji: '📝',
    subjects: [
      { name: 'General Intelligence & Reasoning', part: 'A', totalQuestions: 50, maxMarks: 50, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'General Awareness', part: 'B', totalQuestions: 50, maxMarks: 50, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'English Language & Comprehension', part: 'C', totalQuestions: 100, maxMarks: 100, correctMarks: 1, negativeMarks: 0.25 },
    ], totalQuestions: 200, maxMarks: 200,
  },
  RRB_NTPC_CBT1: {
    id: 'RRB_NTPC_CBT1', name: 'RRB NTPC CBT-1', displayName: 'RRB NTPC CBT-1', emoji: '🚂',
    subjects: [
      { name: 'Mathematics', part: 'A', totalQuestions: 30, maxMarks: 30, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Intelligence & Reasoning', part: 'B', totalQuestions: 30, maxMarks: 30, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Awareness', part: 'C', totalQuestions: 40, maxMarks: 40, correctMarks: 1, negativeMarks: 0.333 },
    ], totalQuestions: 100, maxMarks: 100,
  },
  RRB_NTPC_CBT2: {
    id: 'RRB_NTPC_CBT2', name: 'RRB NTPC CBT-2', displayName: 'RRB NTPC CBT-2', emoji: '🚂',
    subjects: [
      { name: 'Mathematics', part: 'A', totalQuestions: 35, maxMarks: 35, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Intelligence & Reasoning', part: 'B', totalQuestions: 35, maxMarks: 35, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Awareness', part: 'C', totalQuestions: 50, maxMarks: 50, correctMarks: 1, negativeMarks: 0.333 },
    ], totalQuestions: 120, maxMarks: 120,
  },
  RRB_GROUP_D: {
    id: 'RRB_GROUP_D', name: 'RRB Group D (CBT)', displayName: 'RRB Group D', emoji: '🚃',
    subjects: [
      { name: 'Mathematics', part: 'A', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Intelligence & Reasoning', part: 'B', totalQuestions: 30, maxMarks: 30, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Science', part: 'C', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Awareness & Current Affairs', part: 'D', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.333 },
    ], totalQuestions: 100, maxMarks: 100,
  },
  RRB_JE_CBT1: {
    id: 'RRB_JE_CBT1', name: 'RRB JE CBT-1', displayName: 'RRB JE CBT-1', emoji: '🔧',
    subjects: [
      { name: 'Mathematics', part: 'A', totalQuestions: 30, maxMarks: 30, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Intelligence & Reasoning', part: 'B', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Awareness', part: 'C', totalQuestions: 15, maxMarks: 15, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Science', part: 'D', totalQuestions: 30, maxMarks: 30, correctMarks: 1, negativeMarks: 0.333 },
    ], totalQuestions: 100, maxMarks: 100,
  },
  RRB_ALP_CBT1: {
    id: 'RRB_ALP_CBT1', name: 'RRB ALP CBT-1', displayName: 'RRB ALP CBT-1', emoji: '🚄',
    subjects: [
      { name: 'Mathematics', part: 'A', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Intelligence & Reasoning', part: 'B', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Science', part: 'C', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Awareness & Current Affairs', part: 'D', totalQuestions: 10, maxMarks: 10, correctMarks: 1, negativeMarks: 0.333 },
    ], totalQuestions: 75, maxMarks: 75,
  },
  IB_ACIO: {
    id: 'IB_ACIO', name: 'IB ACIO (Tier-I)', displayName: 'IB ACIO', emoji: '🕵️',
    subjects: [
      { name: 'Current Affairs', part: 'A', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'General Studies', part: 'B', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Quantitative Aptitude', part: 'C', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Logical/Analytical Ability', part: 'D', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'English Language', part: 'E', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.25 },
    ], totalQuestions: 100, maxMarks: 100,
  },
  IB_SA: {
    id: 'IB_SA', name: 'IB Security Assistant (Tier-I)', displayName: 'IB SA', emoji: '🔒',
    subjects: [
      { name: 'General Awareness', part: 'A', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Quantitative Aptitude', part: 'B', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Logical/Analytical Ability', part: 'C', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'English Language', part: 'D', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.25 },
    ], totalQuestions: 100, maxMarks: 100,
  },
  IBPS_PO_PRE: {
    id: 'IBPS_PO_PRE', name: 'IBPS PO Prelims', displayName: 'IBPS PO Pre', emoji: '🏦',
    subjects: [
      { name: 'English Language', part: 'A', totalQuestions: 30, maxMarks: 30, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Quantitative Aptitude', part: 'B', totalQuestions: 35, maxMarks: 35, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Reasoning Ability', part: 'C', totalQuestions: 35, maxMarks: 35, correctMarks: 1, negativeMarks: 0.25 },
    ], totalQuestions: 100, maxMarks: 100,
  },
  IBPS_PO_MAINS: {
    id: 'IBPS_PO_MAINS', name: 'IBPS PO Mains', displayName: 'IBPS PO Mains', emoji: '🏦',
    subjects: [
      { name: 'Reasoning & Computer Aptitude', part: 'A', totalQuestions: 45, maxMarks: 60, correctMarks: 1.33, negativeMarks: 0.25 },
      { name: 'English Language', part: 'B', totalQuestions: 35, maxMarks: 40, correctMarks: 1.14, negativeMarks: 0.25 },
      { name: 'Data Analysis & Interpretation', part: 'C', totalQuestions: 35, maxMarks: 60, correctMarks: 1.71, negativeMarks: 0.25 },
      { name: 'General/Economy/Banking Awareness', part: 'D', totalQuestions: 40, maxMarks: 40, correctMarks: 1, negativeMarks: 0.25 },
    ], totalQuestions: 155, maxMarks: 200,
  },
  IBPS_CLERK_PRE: {
    id: 'IBPS_CLERK_PRE', name: 'IBPS Clerk Prelims', displayName: 'IBPS Clerk Pre', emoji: '🏧',
    subjects: [
      { name: 'English Language', part: 'A', totalQuestions: 30, maxMarks: 30, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Numerical Ability', part: 'B', totalQuestions: 35, maxMarks: 35, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Reasoning Ability', part: 'C', totalQuestions: 35, maxMarks: 35, correctMarks: 1, negativeMarks: 0.25 },
    ], totalQuestions: 100, maxMarks: 100,
  },
  IBPS_CLERK_MAINS: {
    id: 'IBPS_CLERK_MAINS', name: 'IBPS Clerk Mains', displayName: 'IBPS Clerk Mains', emoji: '🏧',
    subjects: [
      { name: 'General/Financial Awareness', part: 'A', totalQuestions: 50, maxMarks: 50, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'General English', part: 'B', totalQuestions: 40, maxMarks: 40, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Reasoning Ability & Computer Aptitude', part: 'C', totalQuestions: 50, maxMarks: 60, correctMarks: 1.2, negativeMarks: 0.25 },
      { name: 'Quantitative Aptitude', part: 'D', totalQuestions: 50, maxMarks: 50, correctMarks: 1, negativeMarks: 0.25 },
    ], totalQuestions: 190, maxMarks: 200,
  },
  SBI_PO_PRE: {
    id: 'SBI_PO_PRE', name: 'SBI PO Prelims', displayName: 'SBI PO Pre', emoji: '💰',
    subjects: [
      { name: 'English Language', part: 'A', totalQuestions: 30, maxMarks: 30, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Quantitative Aptitude', part: 'B', totalQuestions: 35, maxMarks: 35, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Reasoning Ability', part: 'C', totalQuestions: 35, maxMarks: 35, correctMarks: 1, negativeMarks: 0.25 },
    ], totalQuestions: 100, maxMarks: 100,
  },
  SBI_CLERK_PRE: {
    id: 'SBI_CLERK_PRE', name: 'SBI Clerk Prelims', displayName: 'SBI Clerk Pre', emoji: '💳',
    subjects: [
      { name: 'English Language', part: 'A', totalQuestions: 30, maxMarks: 30, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Numerical Ability', part: 'B', totalQuestions: 35, maxMarks: 35, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Reasoning Ability', part: 'C', totalQuestions: 35, maxMarks: 35, correctMarks: 1, negativeMarks: 0.25 },
    ], totalQuestions: 100, maxMarks: 100,
  },
  DELHI_POLICE_CONSTABLE: {
    id: 'DELHI_POLICE_CONSTABLE', name: 'Delhi Police Constable (CBT)', displayName: 'DP Constable', emoji: '🚓',
    subjects: [
      { name: 'General Knowledge & Current Affairs', part: 'A', totalQuestions: 50, maxMarks: 50, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Reasoning Ability', part: 'B', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Numerical Ability', part: 'C', totalQuestions: 15, maxMarks: 15, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Computer Awareness', part: 'D', totalQuestions: 10, maxMarks: 10, correctMarks: 1, negativeMarks: 0.25 },
    ], totalQuestions: 100, maxMarks: 100,
  },
  DELHI_POLICE_HEAD_CONSTABLE: {
    id: 'DELHI_POLICE_HEAD_CONSTABLE', name: 'Delhi Police Head Constable (CBT)', displayName: 'DP Head Constable', emoji: '🚔',
    subjects: [
      { name: 'General Awareness', part: 'A', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Quantitative Aptitude', part: 'B', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Reasoning', part: 'C', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'English Language', part: 'D', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Computer Fundamentals', part: 'E', totalQuestions: 10, maxMarks: 10, correctMarks: 1, negativeMarks: 0.25 },
    ], totalQuestions: 100, maxMarks: 100,
  },
};

// Generate URLs for all parts based on exam config
function generatePartUrls(inputUrl: string, examConfig: ExamConfig): { part: string; url: string; subject: SubjectConfig }[] {
  const parts: { part: string; url: string; subject: SubjectConfig }[] = [];

  const urlParts = inputUrl.split('?');
  const queryString = urlParts[1] || '';
  const basePath = urlParts[0];
  const lastSlashIndex = basePath.lastIndexOf('/');
  const baseDir = basePath.substring(0, lastSlashIndex + 1);

  // Map parts to file names
  const partFileMap: Record<string, string> = {
    'A': 'ViewCandResponse.aspx',
    'B': 'ViewCandResponse2.aspx',
    'C': 'ViewCandResponse3.aspx',
    'D': 'ViewCandResponse4.aspx',
    'E': 'ViewCandResponse5.aspx',
  };

  for (const subject of examConfig.subjects) {
    const file = partFileMap[subject.part];
    if (file) {
      const url = `${baseDir}${file}${queryString ? '?' + queryString : ''}`;
      parts.push({ part: subject.part, url, subject });
    }
  }

  return parts;
}

// Parse candidate info from the HTML
function parseCandidateInfo(html: string): CandidateInfo {
  const getTableValue = (label: string): string => {
    const regex = new RegExp(
      `<td[^>]*>[^<]*${label}[^<]*<\\/td>\\s*<td[^>]*>:?(?:&nbsp;)*\\s*([^<]+)`,
      'i'
    );
    const match = html.match(regex);
    if (match) {
      return match[1].replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    }
    return '';
  };

  return {
    rollNumber: getTableValue('Roll No') || getTableValue('Roll Number') || '',
    name: getTableValue('Candidate Name') || getTableValue('Name') || '',
    examLevel: getTableValue('Exam Level') || '',
    testDate: getTableValue('Test Date') || '',
    shift: getTableValue('Test Time') || getTableValue('Shift') || '',
    centreName: getTableValue('Centre Name') || getTableValue('Center Name') || '',
  };
}

// Parse questions from HTML for a specific part
function parseQuestionsForPart(
  html: string,
  part: string,
  baseUrl: string,
  subject: SubjectConfig,
  questionOffset: number
): QuestionData[] {
  console.log('=== PARSER VERSION 2.0 - Multi-image extraction enabled ===');
  const questions: QuestionData[] = [];

  const urlParts = baseUrl.split('?')[0];
  const lastSlashIndex = urlParts.lastIndexOf('/');
  const baseDir = urlParts.substring(0, lastSlashIndex + 1);

  // Helper function to get both Hindi and English image URLs
  const getLanguageUrls = (imageUrl: string): { hindi?: string; english?: string } => {
    if (!imageUrl) return {};

    // Check if URL contains language suffix (_HI or _EN) - handle query params
    const isHindi = /_HI\.(jpg|jpeg|png|gif)/i.test(imageUrl);
    const isEnglish = /_EN\.(jpg|jpeg|png|gif)/i.test(imageUrl);

    let hindiUrl = imageUrl;
    let englishUrl = imageUrl;

    if (isHindi) {
      // Current URL is Hindi, generate English URL
      englishUrl = imageUrl.replace(/_HI\.(jpg)/i, '_EN.$1')
        .replace(/_HI\.(jpeg)/i, '_EN.$1')
        .replace(/_HI\.(png)/i, '_EN.$1')
        .replace(/_HI\.(gif)/i, '_EN.$1');
    } else if (isEnglish) {
      // Current URL is English, generate Hindi URL
      hindiUrl = imageUrl.replace(/_EN\.(jpg)/i, '_HI.$1')
        .replace(/_EN\.(jpeg)/i, '_HI.$1')
        .replace(/_EN\.(png)/i, '_HI.$1')
        .replace(/_EN\.(gif)/i, '_HI.$1');
    } else {
      // No language suffix detected, try to create both versions
      // Look for pattern like .jpg (with optional query string) and add suffix before extension
      const extensionMatch = imageUrl.match(/\.([a-zA-Z]+)(\?.*)?$/i);
      if (extensionMatch) {
        const ext = extensionMatch[1].toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
          const queryString = extensionMatch[2] || '';
          // Find position of the extension
          const extPosition = imageUrl.lastIndexOf('.' + extensionMatch[1]);
          const basePath = imageUrl.substring(0, extPosition);
          hindiUrl = basePath + '_HI.' + extensionMatch[1] + queryString;
          englishUrl = basePath + '_EN.' + extensionMatch[1] + queryString;
        }
      }
    }

    return { hindi: hindiUrl, english: englishUrl };
  };

  const questionTablePattern = /<table[^>]*>[\s\S]*?Q\.No:\s*&nbsp;(\d+)[\s\S]*?<\/table>/gi;
  let tableMatch;

  while ((tableMatch = questionTablePattern.exec(html)) !== null) {
    const qNum = parseInt(tableMatch[1]);
    const tableContent = tableMatch[0];

    const qImgPattern = /Q\.No:\s*&nbsp;\d+<\/font><\/td><td[^>]*>[\s\S]*?<img[^>]+src\s*=\s*["']([^"']+)["']/i;
    const qImgMatch = tableContent.match(qImgPattern);
    let questionImageUrl = qImgMatch ? qImgMatch[1] : '';

    if (questionImageUrl && !questionImageUrl.startsWith('http')) {
      questionImageUrl = baseDir + questionImageUrl;
    }

    // Get Hindi and English URLs for question image
    const questionLangUrls = getLanguageUrls(questionImageUrl);

    // Ensure we always have valid URLs
    const finalQuestionHindiUrl = questionLangUrls.hindi || questionImageUrl;
    const finalQuestionEnglishUrl = questionLangUrls.english || questionImageUrl;

    const options: QuestionData['options'] = [];
    const optionIds = ['A', 'B', 'C', 'D'];

    const optionRowPattern = /<tr[^>]*(?:bgcolor\s*=\s*["']([^"']+)["'])?[^>]*>([\s\S]*?)<\/tr>/gi;
    let optionMatch;
    let optIdx = 0;
    let foundQuestionRow = false;

    while ((optionMatch = optionRowPattern.exec(tableContent)) !== null && optIdx < 4) {
      const rowBgcolor = (optionMatch[1] || '').toLowerCase();
      const rowContent = optionMatch[2];

      if (rowContent.includes('Q.No:')) {
        foundQuestionRow = true;
        continue;
      }

      if (!foundQuestionRow) continue;

      // Extract ALL images from this option row using exec loop for better compatibility
      const imgRegex = /<img[^>]+src\s*=\s*["']([^"']+)["']/gi;
      const imageUrls: string[] = [];
      let match;

      while ((match = imgRegex.exec(rowContent)) !== null) {
        let imgUrl = match[1];
        if (imgUrl && !imgUrl.startsWith('http')) {
          imgUrl = baseDir + imgUrl;
        }
        imageUrls.push(imgUrl);
      }

      // Debug log to see what we found
      if (imageUrls.length === 0) {
        console.log(`Part ${part}, Q${qNum}, Row ${optIdx}: No images found in row content. Length: ${rowContent.length}`);
      } else {
        console.log(`Part ${part}, Q${qNum}, Row ${optIdx}: Found ${imageUrls.length} images:`, imageUrls);
      }

      // If no images found, skip this row
      if (imageUrls.length === 0) continue;

      // Determine which image is Hindi and which is English
      let hindiUrl = '';
      let englishUrl = '';
      let defaultUrl = imageUrls[0]; // Fallback to first image

      for (const url of imageUrls) {
        if (/_HI\.(jpg|jpeg|png|gif)/i.test(url)) {
          hindiUrl = url;
        } else if (/_EN\.(jpg|jpeg|png|gif)/i.test(url)) {
          englishUrl = url;
        }
      }

      // If we didn't find language-specific URLs, use the default and try getLanguageUrls
      if (!hindiUrl && !englishUrl) {
        const langUrls = getLanguageUrls(defaultUrl);
        hindiUrl = langUrls.hindi || defaultUrl;
        englishUrl = langUrls.english || defaultUrl;
      } else {
        // If we found one but not the other, set the missing one to the default
        if (!hindiUrl) hindiUrl = englishUrl || defaultUrl;
        if (!englishUrl) englishUrl = hindiUrl || defaultUrl;
      }

      let bgcolor = rowBgcolor;
      if (!bgcolor) {
        const tdBgMatch = rowContent.match(/bgcolor\s*=\s*["']([^"']+)["']/i);
        if (tdBgMatch) {
          bgcolor = tdBgMatch[1].toLowerCase();
        }
      }

      const isGreen = bgcolor.includes('green');
      const isRed = bgcolor.includes('red');
      const isYellow = bgcolor.includes('yellow');

      const isCorrect = isGreen || isYellow;
      const isSelected = isGreen || isRed;

      // Debug logging
      console.log(`Part ${part}, Q${qNum}, Option ${optionIds[optIdx]}:`, {
        defaultUrl: defaultUrl,
        hindiUrl: hindiUrl,
        englishUrl: englishUrl,
        allFoundUrls: imageUrls
      });

      options.push({
        id: optionIds[optIdx],
        imageUrl: defaultUrl,
        imageUrlHindi: hindiUrl,
        imageUrlEnglish: englishUrl,
        isSelected,
        isCorrect,
      });

      optIdx++;
    }

    if (options.length >= 2) {
      while (options.length < 4) {
        options.push({
          id: optionIds[options.length],
          imageUrl: '',
          imageUrlHindi: '',
          imageUrlEnglish: '',
          isSelected: false,
          isCorrect: false,
        });
      }

      // Detect bonus question: no option is marked as correct
      const hasCorrectOption = options.some(o => o.isCorrect);
      const isBonus = !hasCorrectOption;
      
      let status: 'correct' | 'wrong' | 'unattempted' | 'bonus' = 'unattempted';
      const hasSelected = options.some(o => o.isSelected);
      const selectedIsCorrect = options.some(o => o.isSelected && o.isCorrect);

      if (isBonus) {
        // Bonus question - all candidates get full marks
        status = 'bonus';
      } else if (!hasSelected) {
        status = 'unattempted';
      } else if (selectedIsCorrect) {
        status = 'correct';
      } else {
        status = 'wrong';
      }

      // Calculate marks based on exam-specific marking scheme
      // Bonus questions get full marks
      const marksAwarded = status === 'bonus'
        ? subject.correctMarks
        : status === 'correct'
          ? subject.correctMarks
          : status === 'wrong'
            ? -subject.negativeMarks
            : 0;

      const actualQuestionNumber = questionOffset + qNum;

      // Debug logging for question
      console.log(`Part ${part}, Q${qNum}:`, {
        original: questionImageUrl,
        hindiUrl: finalQuestionHindiUrl,
        englishUrl: finalQuestionEnglishUrl
      });

      questions.push({
        questionNumber: actualQuestionNumber,
        part,
        subject: subject.name,
        questionImageUrl,
        questionImageUrlHindi: finalQuestionHindiUrl,
        questionImageUrlEnglish: finalQuestionEnglishUrl,
        options,
        status,
        marksAwarded,
        isBonus,
      });

      // Debug: Log final options for this question
      console.log(`FINAL Q${actualQuestionNumber} options:`, options.map(o => ({
        id: o.id,
        hindi: o.imageUrlHindi?.substring(0, 50) + '...',
        english: o.imageUrlEnglish?.substring(0, 50) + '...'
      })));
    }
  }

  return questions;
}
// Helper: strip HTML tags and decode entities, preserve special chars
function stripHtml(html: string): string {
  // First handle superscript/subscript by converting to unicode-like representation
  let text = html
    .replace(/<sup[^>]*>\s*2\s*<\/sup>/gi, '²')
    .replace(/<sup[^>]*>\s*3\s*<\/sup>/gi, '³')
    .replace(/<sup[^>]*>\s*(\d+)\s*<\/sup>/gi, '^$1')
    .replace(/<sub[^>]*>\s*(\d+)\s*<\/sub>/gi, '₍$1₎')
    .replace(/<br\s*\/?>/gi, '\n');
  
  // Strip remaining HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities - comprehensive list
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&minus;/g, '\u2212')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&times;/g, '\u00D7')
    .replace(/&divide;/g, '\u00F7')
    .replace(/&plusmn;/g, '\u00B1')
    .replace(/&le;/g, '\u2264')
    .replace(/&ge;/g, '\u2265')
    .replace(/&ne;/g, '\u2260')
    .replace(/&sup2;/g, '\u00B2')
    .replace(/&sup3;/g, '\u00B3')
    .replace(/&frac12;/g, '\u00BD')
    .replace(/&frac14;/g, '\u00BC')
    .replace(/&frac34;/g, '\u00BE')
    .replace(/&deg;/g, '\u00B0')
    .replace(/&pi;/g, '\u03C0')
    .replace(/&alpha;/g, '\u03B1')
    .replace(/&beta;/g, '\u03B2')
    .replace(/&gamma;/g, '\u03B3')
    .replace(/&delta;/g, '\u03B4')
    .replace(/&theta;/g, '\u03B8')
    .replace(/&sigma;/g, '\u03C3')
    .replace(/&radic;/g, '\u221A')
    .replace(/&infin;/g, '\u221E')
    .replace(/&rarr;/g, '\u2192')
    .replace(/&larr;/g, '\u2190')
    .replace(/&darr;/g, '\u2193')
    .replace(/&uarr;/g, '\u2191')
    .replace(/&bull;/g, '\u2022')
    .replace(/&hellip;/g, '\u2026')
    .replace(/&trade;/g, '\u2122')
    .replace(/&copy;/g, '\u00A9')
    .replace(/&reg;/g, '\u00AE')
    .replace(/&rupee;/g, '\u20B9')
    // Numeric entities
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
  
  return text.replace(/\s+/g, ' ').trim();
}

// Parse the AssessmentQPHTMLMode1 answer key format
function parseAnswerKeyFormat(
  html: string, 
  baseUrl: string, 
  examConfig: ExamConfig
): { questions: QuestionData[]; candidate: CandidateInfo } {
  console.log('=== PARSING AssessmentQPHTMLMode1 FORMAT v3 (text+image support) ===');
  
  const questions: QuestionData[] = [];
  
  // Helper to resolve relative URLs
  // baseUrl here is the directory path of the HTML file (e.g., https://host/path/to/dir/)
  const resolveUrl = (src: string): string => {
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    if (src.startsWith('//')) return 'https:' + src;
    if (src.startsWith('/')) {
      // Absolute path from origin - extract origin from baseUrl
      try {
        const origin = new URL(baseUrl).origin;
        return origin + src;
      } catch {
        return baseUrl + src;
      }
    }
    // Relative path - resolve against the directory of the HTML file
    return baseUrl + src;
  };

  // Find all section labels with their positions in the HTML
  const sectionLabels: { index: number; name: string }[] = [];
  const sectionLblRegex = /<div[^>]*class\s*=\s*["'][^"']*section-lbl[^"']*["'][^>]*>[\s\S]*?<span[^>]*class\s*=\s*["']bold["'][^>]*>([^<]+)<\/span>/gi;
  let sectionMatch;
  while ((sectionMatch = sectionLblRegex.exec(html)) !== null) {
    sectionLabels.push({
      index: sectionMatch.index,
      name: sectionMatch[1].trim()
    });
  }
  console.log('Found', sectionLabels.length, 'section labels:', sectionLabels.map(s => s.name));

  // Map section names to exam config subjects
  // Try matching by name similarity or by order
  const sectionToSubjectIndex: Record<number, number> = {};
  sectionLabels.forEach((section, idx) => {
    // First try Module pattern (Module I, II, III...)
    const moduleMatch = section.name.match(/Module\s+([IV]+)/i);
    if (moduleMatch) {
      const romanToNum: Record<string, number> = { 'I': 0, 'II': 1, 'III': 2, 'IV': 3, 'V': 4 };
      const moduleIdx = romanToNum[moduleMatch[1].toUpperCase()];
      if (moduleIdx !== undefined && moduleIdx < examConfig.subjects.length) {
        sectionToSubjectIndex[idx] = moduleIdx;
        return;
      }
    }
    // Otherwise map by order
    if (idx < examConfig.subjects.length) {
      sectionToSubjectIndex[idx] = idx;
    }
  });

  // Find all question-pnl positions to map them to sections
  const questionPanelPositions: number[] = [];
  const qpnlRegex = /class\s*=\s*["']question-pnl["']/gi;
  let qpnlMatch;
  while ((qpnlMatch = qpnlRegex.exec(html)) !== null) {
    questionPanelPositions.push(qpnlMatch.index);
  }

  // Map each question position to its section
  const getSubjectForPosition = (pos: number): { subject: SubjectConfig; part: string } => {
    let sectionIdx = 0;
    for (let s = sectionLabels.length - 1; s >= 0; s--) {
      if (pos > sectionLabels[s].index) {
        sectionIdx = s;
        break;
      }
    }
    const subjectIdx = sectionToSubjectIndex[sectionIdx] ?? Math.min(sectionIdx, examConfig.subjects.length - 1);
    const subject = examConfig.subjects[subjectIdx];
    return { subject, part: subject.part };
  };

  // Split by question-pnl to get individual questions
  const questionPanels = html.split(/class\s*=\s*["']question-pnl["']/i);
  console.log('Found', questionPanels.length - 1, 'question panels');
  
  let globalQuestionNumber = 0;

  // Process each question panel (skip first element which is before the first question)
  for (let i = 1; i < questionPanels.length; i++) {
    const panelContent = questionPanels[i];
    globalQuestionNumber++;
    
    // Get subject for this question based on its position
    const qPos = questionPanelPositions[i - 1] || 0;
    const { subject: currentSubject, part: currentPart } = getSubjectForPosition(qPos);
    
    // Extract question number (Q.1, Q.2, etc.)
    const qNumMatch = panelContent.match(/Q\.(\d+)/i);
    const displayQNum = qNumMatch ? parseInt(qNumMatch[1]) : globalQuestionNumber;
    
    // Extract question content - look for text in the question row
    // The question text is in a <td class="bold" valign="top"> after the Q.X cell
    let questionText = '';
    let questionImageUrl = '';
    
    // Try to find question text from the bold td after Q.X
    const questionTextMatch = panelContent.match(
      /Q\.\d+<\/td>\s*<td[^>]*class\s*=\s*["']bold["'][^>]*(?:style\s*=\s*["'][^"']*["'])?[^>]*>([\s\S]*?)(?=<\/td>)/i
    );
    if (questionTextMatch) {
      const rawContent = questionTextMatch[1];
      // Check if content has meaningful text (not just images)
      const textContent = stripHtml(rawContent);
      
      // Extract images from the question area
      const qImgMatches = [...rawContent.matchAll(/<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi)];
      for (const match of qImgMatches) {
        const src = match[1];
        if (!src.includes('tick') && !src.includes('cross')) {
          questionImageUrl = resolveUrl(src);
          break;
        }
      }
      
      if (textContent.length > 3) {
        questionText = textContent;
      }
    }
    
    // If no question text found yet, try extracting from general panel content
    if (!questionText && !questionImageUrl) {
      const allImgMatches = [...panelContent.matchAll(/<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi)];
      for (const match of allImgMatches) {
        const src = match[1];
        if (!src.includes('tick') && !src.includes('cross')) {
          questionImageUrl = resolveUrl(src);
          break;
        }
      }
    }
    
    const questionLangUrls = getLanguageUrlsFromImage(questionImageUrl);
    
    // Parse options by looking for answer rows
    const options: QuestionData['options'] = [];
    const optionIds = ['A', 'B', 'C', 'D'];
    
    // Find answer options - they have rightAns or wrngAns class
    const answerRowRegex = /<td[^>]*class\s*=\s*["'](rightAns|wrngAns)["'][^>]*>([\s\S]*?)(?=<\/td>)/gi;
    let answerMatch;
    let optIdx = 0;
    
    while ((answerMatch = answerRowRegex.exec(panelContent)) !== null && optIdx < 4) {
      const rowClass = answerMatch[1];
      const rowContent = answerMatch[2];
      
      const isCorrectAnswer = rowClass === 'rightAns';
      const hasTickMark = rowContent.includes('tick.png');
      
      // Extract option image
      let optionImageUrl = '';
      let optionText = '';
      
      const optImgRegex = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
      let optImgMatch;
      while ((optImgMatch = optImgRegex.exec(rowContent)) !== null) {
        const src = optImgMatch[1];
        if (!src.includes('tick') && !src.includes('cross')) {
          optionImageUrl = resolveUrl(src);
          break;
        }
      }
      
      // Extract text content from option (strip images and clean up)
      const textOnly = stripHtml(rowContent);
      // Remove leading option number like "1. " or "2. "
      const cleanedText = textOnly.replace(/^\d+\.\s*/, '').trim();
      if (cleanedText.length > 0) {
        optionText = cleanedText;
      }
      
      const optionLangUrls = getLanguageUrlsFromImage(optionImageUrl);
      
      options.push({
        id: optionIds[optIdx],
        imageUrl: optionImageUrl,
        imageUrlHindi: optionLangUrls.hindi || optionImageUrl,
        imageUrlEnglish: optionLangUrls.english || optionImageUrl,
        text: optionText || undefined,
        isSelected: hasTickMark,
        isCorrect: isCorrectAnswer,
      });
      
      optIdx++;
    }
    
    // Get chosen option from the menu table
    const chosenMatch = panelContent.match(/Chosen\s+Option\s*:[\s\S]*?<td[^>]*class\s*=\s*["']bold["'][^>]*>\s*([^<\s]+)/i);
    const chosenOption = chosenMatch ? chosenMatch[1].trim() : '';
    
    // Check for bonus question (no correct answer marked)
    const hasCorrectOption = options.some(o => o.isCorrect);
    const isBonus = !hasCorrectOption;
    
    // Determine status
    let status: 'correct' | 'wrong' | 'unattempted' | 'bonus' = 'unattempted';
    let hasSelected = options.some(o => o.isSelected);
    
    if (isBonus) {
      status = 'bonus';
    } else if (chosenOption === '--' || chosenOption === '' || chosenOption.includes('--')) {
      status = 'unattempted';
    } else {
      const chosenNum = parseInt(chosenOption);
      if (!isNaN(chosenNum) && chosenNum >= 1 && chosenNum <= 4) {
        const chosenIdx = chosenNum - 1;
        if (options[chosenIdx]) {
          options[chosenIdx].isSelected = true;
          hasSelected = true;
          status = options[chosenIdx].isCorrect ? 'correct' : 'wrong';
        }
      } else if (hasSelected) {
        const selectedIsCorrect = options.some(o => o.isSelected && o.isCorrect);
        status = selectedIsCorrect ? 'correct' : 'wrong';
      }
    }
    
    // Calculate marks
    const marksAwarded = status === 'bonus'
      ? currentSubject.correctMarks
      : status === 'correct'
        ? currentSubject.correctMarks
        : status === 'wrong'
          ? -currentSubject.negativeMarks
          : 0;
    
    // Ensure we have 4 options
    while (options.length < 4) {
      options.push({
        id: optionIds[options.length],
        imageUrl: '',
        imageUrlHindi: '',
        imageUrlEnglish: '',
        text: undefined,
        isSelected: false,
        isCorrect: false,
      });
    }
    
    questions.push({
      questionNumber: globalQuestionNumber,
      part: currentPart,
      subject: currentSubject.name,
      questionImageUrl,
      questionImageUrlHindi: questionLangUrls.hindi || questionImageUrl,
      questionImageUrlEnglish: questionLangUrls.english || questionImageUrl,
      questionText: questionText || undefined,
      options,
      status,
      marksAwarded,
      isBonus,
    });
    
    console.log(`Q${globalQuestionNumber}: Part ${currentPart}, Subject: ${currentSubject.name}, Chosen: ${chosenOption}, Status: ${status}, HasText: ${!!questionText}`);
  }
  
  // Extract candidate info
  const candidate: CandidateInfo = {
    rollNumber: extractValue(html, 'Roll No') || extractValue(html, 'Roll Number') || '',
    name: extractValue(html, 'Candidate Name') || extractValue(html, 'Name') || '',
    examLevel: examConfig.name,
    testDate: extractValue(html, 'Test Date') || '',
    shift: extractValue(html, 'Test Time') || extractValue(html, 'Shift') || '',
    centreName: extractValue(html, 'Centre Name') || '',
  };
  
  console.log('Total questions parsed:', questions.length);
  
  return { questions, candidate };
}

// Helper to extract value from HTML tables
function extractValue(html: string, label: string): string {
  const regex = new RegExp(label + `[^<]*</td>\\s*<td[^>]*>:?\\s*([^<]+)`, 'i');
  const match = html.match(regex);
  if (match) {
    return match[1].replace(/&nbsp;/g, ' ').trim();
  }
  return '';
}

// Helper to get Hindi/English URLs from an image URL
function getLanguageUrlsFromImage(imageUrl: string): { hindi?: string; english?: string } {
  if (!imageUrl) return {};
  
  // Check for _en or _hi suffix in filename
  const isEnglish = /_en\.(jpg|jpeg|png|gif)/i.test(imageUrl);
  const isHindi = /_hi\.(jpg|jpeg|png|gif)/i.test(imageUrl);
  
  if (isEnglish) {
    return {
      english: imageUrl,
      hindi: imageUrl.replace(/_en\.(jpg|jpeg|png|gif)/i, '_hi.$1'),
    };
  } else if (isHindi) {
    return {
      hindi: imageUrl,
      english: imageUrl.replace(/_hi\.(jpg|jpeg|png|gif)/i, '_en.$1'),
    };
  }
  
  // Default: return the URL as both
  return { hindi: imageUrl, english: imageUrl };
}

// Calculate section-wise breakdown
function calculateSections(questions: QuestionData[], examConfig: ExamConfig): SectionData[] {
  const sections: SectionData[] = [];

  for (const subject of examConfig.subjects) {
    const partQuestions = questions.filter(q => q.part === subject.part);
    const correct = partQuestions.filter(q => q.status === 'correct').length;
    const wrong = partQuestions.filter(q => q.status === 'wrong').length;
    const unattempted = partQuestions.filter(q => q.status === 'unattempted').length;
    const bonus = partQuestions.filter(q => q.status === 'bonus' || q.isBonus).length;
    
    // Score calculation: correct + bonus both get full marks
    const score = (correct + bonus) * subject.correctMarks - wrong * subject.negativeMarks;

    sections.push({
      part: subject.part,
      subject: subject.name,
      correct,
      wrong,
      unattempted,
      bonus,
      score,
      maxMarks: subject.maxMarks,
      correctMarks: subject.correctMarks,
      negativeMarks: subject.negativeMarks,
      isQualifying: subject.isQualifying,
    });
  }

  return sections;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, examType, language, html: providedHtml } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!examType || !EXAM_CONFIGS[examType]) {
      return new Response(
        JSON.stringify({ success: false, error: 'Valid exam type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const examConfig = EXAM_CONFIGS[examType];
    console.log('Analyzing for exam:', examConfig.name, 'Language:', language);
    console.log('HTML provided by client:', providedHtml ? `Yes, ${providedHtml.length} chars` : 'No');

    // Generate URLs for all parts based on exam config
    const partUrls = generatePartUrls(url, examConfig);
    console.log('Fetching parts:', partUrls.map(p => p.part).join(', '));

    let allQuestions: QuestionData[] = [];
    let candidate: CandidateInfo | null = null;

    // Calculate question offsets for each part
    let questionOffset = 0;
    const partOffsets: Record<string, number> = {};
    for (const subject of examConfig.subjects) {
      partOffsets[subject.part] = questionOffset;
      questionOffset += subject.totalQuestions;
    }

    // Check if this is an answer key URL (AssessmentQPHTMLMode1 pattern)
    const isAnswerKeyUrl = url.includes('AssessmentQPHTMLMode1') || url.endsWith('.html');
    
    if (isAnswerKeyUrl) {
      console.log('Detected Answer Key URL format - AssessmentQPHTMLMode1');
      
      // Extract base directory path for resolving relative image paths
      // Get the directory path of the HTML file for resolving relative URLs
      const urlPath = url.split('?')[0];
      const lastSlashIdx = urlPath.lastIndexOf('/');
      const baseDir = urlPath.substring(0, lastSlashIdx + 1);
      
      let html = providedHtml;
      
      // If HTML was not provided by client, try to fetch it server-side
      if (!html) {
        console.log('No HTML provided, attempting server-side fetch...');
        
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
              'Cache-Control': 'max-age=0',
            },
          });

          if (!response.ok) {
            console.error(`Server-side fetch failed: HTTP ${response.status}`);
            // Return special error code to indicate client-side fetch is needed
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: 'FETCH_BLOCKED',
                message: 'The SSC server blocked the request. The page will attempt client-side fetching.',
                requiresClientFetch: true
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          html = await response.text();
          console.log('Server-side fetch successful, HTML length:', html.length);
        } catch (fetchError) {
          console.error('Server-side fetch error:', fetchError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'FETCH_BLOCKED',
              message: 'Unable to fetch the URL. The page will attempt client-side fetching.',
              requiresClientFetch: true
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        console.log('Using client-provided HTML, length:', html.length);
      }
      
      // Parse the AssessmentQPHTMLMode1 format
      const parsedData = parseAnswerKeyFormat(html, baseDir, examConfig);
      
      if (parsedData.questions.length === 0) {
        console.log('No questions found. HTML sample:', html.substring(0, 3000));
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Could not parse questions from this answer key format. The page structure may have changed or the HTML is incomplete.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate sections
      const sections = calculateSections(parsedData.questions, examConfig);

      // Calculate totals
      const correctCount = parsedData.questions.filter(q => q.status === 'correct').length;
      const wrongCount = parsedData.questions.filter(q => q.status === 'wrong').length;
      const unattemptedCount = parsedData.questions.filter(q => q.status === 'unattempted').length;
      const bonusCount = parsedData.questions.filter(q => q.status === 'bonus' || q.isBonus).length;
      const totalScore = sections.reduce((sum, s) => sum + s.score, 0);

      const analysisResult: AnalysisResult = {
        candidate: parsedData.candidate,
        examType,
        examConfig,
        language,
        totalScore,
        maxScore: examConfig.maxMarks,
        totalQuestions: parsedData.questions.length,
        correctCount,
        wrongCount,
        unattemptedCount,
        bonusCount,
        sections,
        questions: parsedData.questions,
      };

      console.log('Answer key analysis complete. Score:', totalScore, '/', examConfig.maxMarks);
      console.log('Questions:', parsedData.questions.length, 'Correct:', correctCount, 'Wrong:', wrongCount, 'Unattempted:', unattemptedCount, 'Bonus:', bonusCount);

      return new Response(
        JSON.stringify({ success: true, data: analysisResult }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all parts in parallel using direct fetch (FREE & UNLIMITED)
    const fetchPromises = partUrls.map(async ({ part, url: partUrl, subject }) => {
      console.log(`Fetching Part ${part}:`, partUrl);

      try {
        // Direct fetch with browser-like headers
        const response = await fetch(partUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5,hi;q=0.3',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0',
          },
        });

        if (!response.ok) {
          console.error(`Failed to fetch Part ${part}: HTTP ${response.status}`);
          return { part, questions: [], html: '' };
        }

        const html = await response.text();
        console.log(`Part ${part} HTML length:`, html.length);

        const questions = parseQuestionsForPart(html, part, partUrl, subject, partOffsets[part]);
        console.log(`Part ${part} questions count:`, questions.length);

        return { part, questions, html };
      } catch (error) {
        console.error(`Error fetching Part ${part}:`, error);
        return { part, questions: [], html: '' };
      }
    });

    const results = await Promise.all(fetchPromises);

    // Collect all questions and candidate info
    for (const result of results) {
      allQuestions = allQuestions.concat(result.questions);

      if (!candidate && result.html) {
        candidate = parseCandidateInfo(result.html);
      }
    }

    // Sort questions by number
    allQuestions.sort((a, b) => a.questionNumber - b.questionNumber);

    console.log('Total questions parsed:', allQuestions.length);

    if (allQuestions.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Could not parse questions from the response sheet. The URL may not be a valid response sheet, or the format may have changed.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use default candidate if parsing failed
    if (!candidate || !candidate.rollNumber) {
      candidate = {
        rollNumber: '',
        name: '',
        examLevel: examConfig.name,
        testDate: '',
        shift: '',
        centreName: '',
      };
    }

    // Calculate sections
    const sections = calculateSections(allQuestions, examConfig);

    // Calculate totals
    const correctCount = allQuestions.filter(q => q.status === 'correct').length;
    const wrongCount = allQuestions.filter(q => q.status === 'wrong').length;
    const unattemptedCount = allQuestions.filter(q => q.status === 'unattempted').length;
    const bonusCount = allQuestions.filter(q => q.status === 'bonus' || q.isBonus).length;
    const totalScore = sections.reduce((sum, s) => sum + s.score, 0);

    const analysisResult: AnalysisResult = {
      candidate,
      examType,
      examConfig,
      language,
      totalScore,
      maxScore: examConfig.maxMarks,
      totalQuestions: allQuestions.length,
      correctCount,
      wrongCount,
      unattemptedCount,
      bonusCount,
      sections,
      questions: allQuestions,
    };

    console.log('Analysis complete. Total score:', totalScore, '/', examConfig.maxMarks, 'Bonus:', bonusCount);

    return new Response(
      JSON.stringify({ success: true, data: analysisResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing response sheet:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
