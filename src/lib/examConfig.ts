export type ExamType = 
  | 'SSC_CGL_PRE'
  | 'SSC_CGL_MAINS'
  | 'SSC_CHSL_PRE'
  | 'SSC_CHSL_MAINS'
  | 'SSC_CPO_PRE'
  | 'SSC_CPO_MAINS'
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
  subjects: SubjectConfig[];
  totalQuestions: number;
  maxMarks: number;
}

export const EXAM_CONFIGS: Record<ExamType, ExamConfig> = {
  SSC_CGL_PRE: {
    id: 'SSC_CGL_PRE',
    name: 'SSC CGL PRE (Tier-I)',
    displayName: 'SSC CGL Tier-I',
    emoji: '🟢',
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
    subjects: [
      { name: 'Mathematical Abilities', part: 'A', totalQuestions: 30, maxMarks: 90, correctMarks: 3, negativeMarks: 1 },
      { name: 'Reasoning & General Intelligence', part: 'B', totalQuestions: 30, maxMarks: 90, correctMarks: 3, negativeMarks: 1 },
      { name: 'English Language & Comprehension', part: 'C', totalQuestions: 45, maxMarks: 135, correctMarks: 3, negativeMarks: 1 },
      { name: 'General Awareness', part: 'D', totalQuestions: 25, maxMarks: 75, correctMarks: 3, negativeMarks: 0.50, isQualifying: true },
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
    subjects: [
      { name: 'English Language & Comprehension', part: 'A', totalQuestions: 200, maxMarks: 200, correctMarks: 1, negativeMarks: 0.25 },
    ],
    totalQuestions: 200,
    maxMarks: 200,
  },
  DELHI_POLICE_CONSTABLE: {
    id: 'DELHI_POLICE_CONSTABLE',
    name: 'Delhi Police Constable (CBT)',
    displayName: 'DP Constable',
    emoji: '🚓',
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
