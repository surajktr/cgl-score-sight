export type ExamCategory = 'SSC' | 'RAILWAY' | 'IB' | 'BANK' | 'POLICE';

export type ExamType =
  | 'SSC_CGL_PRE'
  | 'SSC_CGL_MAINS'
  | 'SSC_CHSL_PRE'
  | 'SSC_CHSL_MAINS'
  | 'SSC_CPO_PRE'
  | 'SSC_CPO_MAINS'
  | 'SSC_MTS'
  | 'SSC_GD_CONSTABLE'
  | 'SSC_STENO'
  | 'RRB_NTPC_CBT1'
  | 'RRB_NTPC_CBT2'
  | 'RRB_GROUP_D'
  | 'RRB_JE_CBT1'
  | 'RRB_ALP_CBT1'
  | 'IB_ACIO'
  | 'IB_SA'
  | 'IBPS_PO_PRE'
  | 'IBPS_PO_MAINS'
  | 'IBPS_CLERK_PRE'
  | 'IBPS_CLERK_MAINS'
  | 'SBI_PO_PRE'
  | 'SBI_CLERK_PRE'
  | 'DELHI_POLICE_CONSTABLE'
  | 'DELHI_POLICE_HEAD_CONSTABLE';

export type Language = 'hindi' | 'english';

export interface SubjectConfig {
  name: string;
  part: string;
  totalQuestions: number;
  maxMarks: number;
  correctMarks: number;
  negativeMarks: number;
  isQualifying?: boolean;
}

export interface ExamConfig {
  id: ExamType;
  name: string;
  displayName: string;
  emoji: string;
  category: ExamCategory;
  subjects: SubjectConfig[];
  totalQuestions: number;
  maxMarks: number;
}

export interface ExamCategoryInfo {
  id: ExamCategory;
  name: string;
  emoji: string;
  description: string;
}

export const EXAM_CATEGORIES: ExamCategoryInfo[] = [
  { id: 'SSC', name: 'SSC Exams', emoji: '🏛️', description: 'Staff Selection Commission' },
  { id: 'RAILWAY', name: 'Railway Exams', emoji: '🚂', description: 'RRB / Indian Railways' },
  { id: 'IB', name: 'Intelligence Bureau', emoji: '🕵️', description: 'IB / Security Agencies' },
  { id: 'BANK', name: 'Bank Exams', emoji: '🏦', description: 'IBPS / SBI / Banking' },
  { id: 'POLICE', name: 'Police Exams', emoji: '🚔', description: 'Delhi Police & Others' },
];

export const EXAM_CONFIGS: Record<ExamType, ExamConfig> = {
  // ===== SSC EXAMS =====
  SSC_CGL_PRE: {
    id: 'SSC_CGL_PRE',
    name: 'SSC CGL PRE (Tier-I)',
    displayName: 'SSC CGL Tier-I',
    emoji: '🟢',
    category: 'SSC',
    subjects: [
      { name: 'General Intelligence & Reasoning', part: 'A', totalQuestions: 25, maxMarks: 50, correctMarks: 2, negativeMarks: 0.50 },
      { name: 'General Awareness', part: 'B', totalQuestions: 25, maxMarks: 50, correctMarks: 2, negativeMarks: 0.50 },
      { name: 'Quantitative Aptitude', part: 'C', totalQuestions: 25, maxMarks: 50, correctMarks: 2, negativeMarks: 0.50 },
      { name: 'English Comprehension', part: 'D', totalQuestions: 25, maxMarks: 50, correctMarks: 2, negativeMarks: 0.50 },
    ],
    totalQuestions: 100,
    maxMarks: 200,
  },
  SSC_CGL_MAINS: {
    id: 'SSC_CGL_MAINS',
    name: 'SSC CGL MAINS (Tier-II)',
    displayName: 'SSC CGL Tier-II',
    emoji: '🟢',
    category: 'SSC',
    subjects: [
      { name: 'Mathematical Abilities', part: 'A', totalQuestions: 30, maxMarks: 90, correctMarks: 3, negativeMarks: 1 },
      { name: 'Reasoning & General Intelligence', part: 'B', totalQuestions: 30, maxMarks: 90, correctMarks: 3, negativeMarks: 1 },
      { name: 'English Language & Comprehension', part: 'C', totalQuestions: 45, maxMarks: 135, correctMarks: 3, negativeMarks: 1 },
      { name: 'General Awareness', part: 'D', totalQuestions: 25, maxMarks: 75, correctMarks: 3, negativeMarks: 0.50 },
      { name: 'Computer Knowledge', part: 'E', totalQuestions: 20, maxMarks: 60, correctMarks: 3, negativeMarks: 0.50, isQualifying: true },
    ],
    totalQuestions: 150,
    maxMarks: 450,
  },
  SSC_CHSL_PRE: {
    id: 'SSC_CHSL_PRE',
    name: 'SSC CHSL PRE (Tier-I)',
    displayName: 'SSC CHSL Tier-I',
    emoji: '🟣',
    category: 'SSC',
    subjects: [
      { name: 'General Intelligence', part: 'A', totalQuestions: 25, maxMarks: 50, correctMarks: 2, negativeMarks: 1 },
      { name: 'English Language', part: 'B', totalQuestions: 25, maxMarks: 50, correctMarks: 2, negativeMarks: 1 },
      { name: 'Quantitative Aptitude', part: 'C', totalQuestions: 25, maxMarks: 50, correctMarks: 2, negativeMarks: 1 },
      { name: 'General Awareness', part: 'D', totalQuestions: 25, maxMarks: 50, correctMarks: 2, negativeMarks: 1 },
    ],
    totalQuestions: 100,
    maxMarks: 200,
  },
  SSC_CHSL_MAINS: {
    id: 'SSC_CHSL_MAINS',
    name: 'SSC CHSL MAINS (Tier-II)',
    displayName: 'SSC CHSL Tier-II',
    emoji: '🟣',
    category: 'SSC',
    subjects: [
      { name: 'Mathematical Abilities', part: 'A', totalQuestions: 30, maxMarks: 90, correctMarks: 3, negativeMarks: 1 },
      { name: 'Reasoning & General Awareness', part: 'B', totalQuestions: 30, maxMarks: 90, correctMarks: 3, negativeMarks: 1 },
      { name: 'English Language & Comprehension', part: 'C', totalQuestions: 45, maxMarks: 135, correctMarks: 3, negativeMarks: 1 },
      { name: 'Computer Knowledge', part: 'D', totalQuestions: 30, maxMarks: 90, correctMarks: 3, negativeMarks: 1 },
    ],
    totalQuestions: 135,
    maxMarks: 405,
  },
  SSC_CPO_PRE: {
    id: 'SSC_CPO_PRE',
    name: 'SSC CPO PRE (Paper-I)',
    displayName: 'SSC CPO Paper-I',
    emoji: '🔵',
    category: 'SSC',
    subjects: [
      { name: 'General Intelligence & Reasoning', part: 'A', totalQuestions: 50, maxMarks: 50, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'General Knowledge & Awareness', part: 'B', totalQuestions: 50, maxMarks: 50, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Quantitative Aptitude', part: 'C', totalQuestions: 50, maxMarks: 50, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'English Comprehension', part: 'D', totalQuestions: 50, maxMarks: 50, correctMarks: 1, negativeMarks: 0.25 },
    ],
    totalQuestions: 200,
    maxMarks: 200,
  },
  SSC_CPO_MAINS: {
    id: 'SSC_CPO_MAINS',
    name: 'SSC CPO MAINS (Paper-II)',
    displayName: 'SSC CPO Paper-II',
    emoji: '🔵',
    category: 'SSC',
    subjects: [
      { name: 'English Language & Comprehension', part: 'A', totalQuestions: 200, maxMarks: 200, correctMarks: 1, negativeMarks: 0.25 },
    ],
    totalQuestions: 200,
    maxMarks: 200,
  },
  SSC_MTS: {
    id: 'SSC_MTS',
    name: 'SSC MTS (CBT)',
    displayName: 'SSC MTS',
    emoji: '🟠',
    category: 'SSC',
    subjects: [
      { name: 'Numerical & Mathematical Ability', part: 'A', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Reasoning Ability & Problem Solving', part: 'B', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'General Awareness', part: 'C', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'English Language & Comprehension', part: 'D', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.25 },
    ],
    totalQuestions: 90,
    maxMarks: 90,
  },
  SSC_GD_CONSTABLE: {
    id: 'SSC_GD_CONSTABLE',
    name: 'SSC GD Constable (CBT)',
    displayName: 'SSC GD',
    emoji: '🟤',
    category: 'SSC',
    subjects: [
      { name: 'General Intelligence & Reasoning', part: 'A', totalQuestions: 20, maxMarks: 40, correctMarks: 2, negativeMarks: 0.50 },
      { name: 'General Knowledge & Awareness', part: 'B', totalQuestions: 20, maxMarks: 40, correctMarks: 2, negativeMarks: 0.50 },
      { name: 'Elementary Mathematics', part: 'C', totalQuestions: 20, maxMarks: 40, correctMarks: 2, negativeMarks: 0.50 },
      { name: 'English / Hindi', part: 'D', totalQuestions: 20, maxMarks: 40, correctMarks: 2, negativeMarks: 0.50 },
    ],
    totalQuestions: 80,
    maxMarks: 160,
  },
  SSC_STENO: {
    id: 'SSC_STENO',
    name: 'SSC Stenographer (CBT)',
    displayName: 'SSC Steno',
    emoji: '📝',
    category: 'SSC',
    subjects: [
      { name: 'General Intelligence & Reasoning', part: 'A', totalQuestions: 50, maxMarks: 50, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'General Awareness', part: 'B', totalQuestions: 50, maxMarks: 50, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'English Language & Comprehension', part: 'C', totalQuestions: 100, maxMarks: 100, correctMarks: 1, negativeMarks: 0.25 },
    ],
    totalQuestions: 200,
    maxMarks: 200,
  },

  // ===== RAILWAY EXAMS =====
  RRB_NTPC_CBT1: {
    id: 'RRB_NTPC_CBT1',
    name: 'RRB NTPC CBT-1',
    displayName: 'RRB NTPC CBT-1',
    emoji: '🚂',
    category: 'RAILWAY',
    subjects: [
      { name: 'Mathematics', part: 'A', totalQuestions: 30, maxMarks: 30, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Intelligence & Reasoning', part: 'B', totalQuestions: 30, maxMarks: 30, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Awareness', part: 'C', totalQuestions: 40, maxMarks: 40, correctMarks: 1, negativeMarks: 0.333 },
    ],
    totalQuestions: 100,
    maxMarks: 100,
  },
  RRB_NTPC_CBT2: {
    id: 'RRB_NTPC_CBT2',
    name: 'RRB NTPC CBT-2',
    displayName: 'RRB NTPC CBT-2',
    emoji: '🚂',
    category: 'RAILWAY',
    subjects: [
      { name: 'Mathematics', part: 'A', totalQuestions: 35, maxMarks: 35, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Intelligence & Reasoning', part: 'B', totalQuestions: 35, maxMarks: 35, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Awareness', part: 'C', totalQuestions: 50, maxMarks: 50, correctMarks: 1, negativeMarks: 0.333 },
    ],
    totalQuestions: 120,
    maxMarks: 120,
  },
  RRB_GROUP_D: {
    id: 'RRB_GROUP_D',
    name: 'RRB Group D (CBT)',
    displayName: 'RRB Group D',
    emoji: '🚃',
    category: 'RAILWAY',
    subjects: [
      { name: 'Mathematics', part: 'A', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Intelligence & Reasoning', part: 'B', totalQuestions: 30, maxMarks: 30, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Science', part: 'C', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Awareness & Current Affairs', part: 'D', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.333 },
    ],
    totalQuestions: 100,
    maxMarks: 100,
  },
  RRB_JE_CBT1: {
    id: 'RRB_JE_CBT1',
    name: 'RRB JE CBT-1',
    displayName: 'RRB JE CBT-1',
    emoji: '🔧',
    category: 'RAILWAY',
    subjects: [
      { name: 'Mathematics', part: 'A', totalQuestions: 30, maxMarks: 30, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Intelligence & Reasoning', part: 'B', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Awareness', part: 'C', totalQuestions: 15, maxMarks: 15, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Science', part: 'D', totalQuestions: 30, maxMarks: 30, correctMarks: 1, negativeMarks: 0.333 },
    ],
    totalQuestions: 100,
    maxMarks: 100,
  },
  RRB_ALP_CBT1: {
    id: 'RRB_ALP_CBT1',
    name: 'RRB ALP CBT-1',
    displayName: 'RRB ALP CBT-1',
    emoji: '🚄',
    category: 'RAILWAY',
    subjects: [
      { name: 'Mathematics', part: 'A', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Intelligence & Reasoning', part: 'B', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Science', part: 'C', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.333 },
      { name: 'General Awareness & Current Affairs', part: 'D', totalQuestions: 10, maxMarks: 10, correctMarks: 1, negativeMarks: 0.333 },
    ],
    totalQuestions: 75,
    maxMarks: 75,
  },

  // ===== IB EXAMS =====
  IB_ACIO: {
    id: 'IB_ACIO',
    name: 'IB ACIO (Tier-I)',
    displayName: 'IB ACIO',
    emoji: '🕵️',
    category: 'IB',
    subjects: [
      { name: 'Current Affairs', part: 'A', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'General Studies', part: 'B', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Quantitative Aptitude', part: 'C', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Logical/Analytical Ability', part: 'D', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'English Language', part: 'E', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.25 },
    ],
    totalQuestions: 100,
    maxMarks: 100,
  },
  IB_SA: {
    id: 'IB_SA',
    name: 'IB Security Assistant (Tier-I)',
    displayName: 'IB SA',
    emoji: '🔒',
    category: 'IB',
    subjects: [
      { name: 'General Awareness', part: 'A', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Quantitative Aptitude', part: 'B', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Logical/Analytical Ability', part: 'C', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'English Language', part: 'D', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.25 },
    ],
    totalQuestions: 100,
    maxMarks: 100,
  },

  // ===== BANK EXAMS =====
  IBPS_PO_PRE: {
    id: 'IBPS_PO_PRE',
    name: 'IBPS PO Prelims',
    displayName: 'IBPS PO Pre',
    emoji: '🏦',
    category: 'BANK',
    subjects: [
      { name: 'English Language', part: 'A', totalQuestions: 30, maxMarks: 30, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Quantitative Aptitude', part: 'B', totalQuestions: 35, maxMarks: 35, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Reasoning Ability', part: 'C', totalQuestions: 35, maxMarks: 35, correctMarks: 1, negativeMarks: 0.25 },
    ],
    totalQuestions: 100,
    maxMarks: 100,
  },
  IBPS_PO_MAINS: {
    id: 'IBPS_PO_MAINS',
    name: 'IBPS PO Mains',
    displayName: 'IBPS PO Mains',
    emoji: '🏦',
    category: 'BANK',
    subjects: [
      { name: 'Reasoning & Computer Aptitude', part: 'A', totalQuestions: 45, maxMarks: 60, correctMarks: 1.33, negativeMarks: 0.25 },
      { name: 'English Language', part: 'B', totalQuestions: 35, maxMarks: 40, correctMarks: 1.14, negativeMarks: 0.25 },
      { name: 'Data Analysis & Interpretation', part: 'C', totalQuestions: 35, maxMarks: 60, correctMarks: 1.71, negativeMarks: 0.25 },
      { name: 'General/Economy/Banking Awareness', part: 'D', totalQuestions: 40, maxMarks: 40, correctMarks: 1, negativeMarks: 0.25 },
    ],
    totalQuestions: 155,
    maxMarks: 200,
  },
  IBPS_CLERK_PRE: {
    id: 'IBPS_CLERK_PRE',
    name: 'IBPS Clerk Prelims',
    displayName: 'IBPS Clerk Pre',
    emoji: '🏧',
    category: 'BANK',
    subjects: [
      { name: 'English Language', part: 'A', totalQuestions: 30, maxMarks: 30, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Numerical Ability', part: 'B', totalQuestions: 35, maxMarks: 35, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Reasoning Ability', part: 'C', totalQuestions: 35, maxMarks: 35, correctMarks: 1, negativeMarks: 0.25 },
    ],
    totalQuestions: 100,
    maxMarks: 100,
  },
  IBPS_CLERK_MAINS: {
    id: 'IBPS_CLERK_MAINS',
    name: 'IBPS Clerk Mains',
    displayName: 'IBPS Clerk Mains',
    emoji: '🏧',
    category: 'BANK',
    subjects: [
      { name: 'General/Financial Awareness', part: 'A', totalQuestions: 50, maxMarks: 50, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'General English', part: 'B', totalQuestions: 40, maxMarks: 40, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Reasoning Ability & Computer Aptitude', part: 'C', totalQuestions: 50, maxMarks: 60, correctMarks: 1.2, negativeMarks: 0.25 },
      { name: 'Quantitative Aptitude', part: 'D', totalQuestions: 50, maxMarks: 50, correctMarks: 1, negativeMarks: 0.25 },
    ],
    totalQuestions: 190,
    maxMarks: 200,
  },
  SBI_PO_PRE: {
    id: 'SBI_PO_PRE',
    name: 'SBI PO Prelims',
    displayName: 'SBI PO Pre',
    emoji: '💰',
    category: 'BANK',
    subjects: [
      { name: 'English Language', part: 'A', totalQuestions: 30, maxMarks: 30, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Quantitative Aptitude', part: 'B', totalQuestions: 35, maxMarks: 35, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Reasoning Ability', part: 'C', totalQuestions: 35, maxMarks: 35, correctMarks: 1, negativeMarks: 0.25 },
    ],
    totalQuestions: 100,
    maxMarks: 100,
  },
  SBI_CLERK_PRE: {
    id: 'SBI_CLERK_PRE',
    name: 'SBI Clerk Prelims',
    displayName: 'SBI Clerk Pre',
    emoji: '💳',
    category: 'BANK',
    subjects: [
      { name: 'English Language', part: 'A', totalQuestions: 30, maxMarks: 30, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Numerical Ability', part: 'B', totalQuestions: 35, maxMarks: 35, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Reasoning Ability', part: 'C', totalQuestions: 35, maxMarks: 35, correctMarks: 1, negativeMarks: 0.25 },
    ],
    totalQuestions: 100,
    maxMarks: 100,
  },

  // ===== POLICE EXAMS =====
  DELHI_POLICE_CONSTABLE: {
    id: 'DELHI_POLICE_CONSTABLE',
    name: 'Delhi Police Constable (CBT)',
    displayName: 'DP Constable',
    emoji: '🚓',
    category: 'POLICE',
    subjects: [
      { name: 'General Knowledge & Current Affairs', part: 'A', totalQuestions: 50, maxMarks: 50, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Reasoning Ability', part: 'B', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Numerical Ability', part: 'C', totalQuestions: 15, maxMarks: 15, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Computer Awareness', part: 'D', totalQuestions: 10, maxMarks: 10, correctMarks: 1, negativeMarks: 0.25 },
    ],
    totalQuestions: 100,
    maxMarks: 100,
  },
  DELHI_POLICE_HEAD_CONSTABLE: {
    id: 'DELHI_POLICE_HEAD_CONSTABLE',
    name: 'Delhi Police Head Constable (CBT)',
    displayName: 'DP Head Constable',
    emoji: '🚔',
    category: 'POLICE',
    subjects: [
      { name: 'General Awareness', part: 'A', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Quantitative Aptitude', part: 'B', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Reasoning', part: 'C', totalQuestions: 25, maxMarks: 25, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'English Language', part: 'D', totalQuestions: 20, maxMarks: 20, correctMarks: 1, negativeMarks: 0.25 },
      { name: 'Computer Fundamentals', part: 'E', totalQuestions: 10, maxMarks: 10, correctMarks: 1, negativeMarks: 0.25 },
    ],
    totalQuestions: 100,
    maxMarks: 100,
  },
};

export const EXAM_LIST = Object.values(EXAM_CONFIGS);

export function getExamsByCategory(category: ExamCategory): ExamConfig[] {
  return EXAM_LIST.filter(exam => exam.category === category);
}

export function getExamConfig(examType: ExamType): ExamConfig {
  return EXAM_CONFIGS[examType];
}

export function getSubjectByPart(examType: ExamType, part: string): SubjectConfig | undefined {
  return EXAM_CONFIGS[examType].subjects.find(s => s.part === part);
}

export function calculateScore(
  examType: ExamType,
  part: string,
  correct: number,
  wrong: number
): number {
  const subject = getSubjectByPart(examType, part);
  if (!subject) return 0;
  return correct * subject.correctMarks - wrong * subject.negativeMarks;
}
