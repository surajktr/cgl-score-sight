import type { ExamType, Language, ExamConfig } from './examConfig';

export interface CandidateInfo {
  rollNumber: string;
  name: string;
  examLevel: string;
  testDate: string;
  shift: string;
  centreName: string;
}

export interface QuestionData {
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

export interface SectionData {
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

export interface AnalysisResult {
  candidate: CandidateInfo;
  examType: ExamType;
  examConfig: ExamConfig;
  language: Language;
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

import { EXAM_CONFIGS } from './examConfig';

// Mock data for demonstration
export const mockAnalysisResult: AnalysisResult = {
  candidate: {
    rollNumber: "2024123456789",
    name: "RAHUL SHARMA",
    examLevel: "Tier-I (Graduate Level)",
    testDate: "14/09/2024",
    shift: "Shift-I (9:00 AM - 10:00 AM)",
    centreName: "Delhi Public School, Mathura Road, New Delhi",
  },
  examType: 'SSC_CGL_PRE',
  examConfig: EXAM_CONFIGS.SSC_CGL_PRE,
  language: 'hindi',
  totalScore: 142.5,
  maxScore: 200,
  totalQuestions: 100,
  correctCount: 76,
  wrongCount: 13,
  unattemptedCount: 11,
  bonusCount: 0,
  sections: [
    { part: 'A', subject: 'General Intelligence & Reasoning', correct: 21, wrong: 2, unattempted: 2, bonus: 0, score: 41, maxMarks: 50, correctMarks: 2, negativeMarks: 0.5 },
    { part: 'B', subject: 'General Awareness', correct: 18, wrong: 4, unattempted: 3, bonus: 0, score: 34, maxMarks: 50, correctMarks: 2, negativeMarks: 0.5 },
    { part: 'C', subject: 'Quantitative Aptitude', correct: 19, wrong: 4, unattempted: 2, bonus: 0, score: 36, maxMarks: 50, correctMarks: 2, negativeMarks: 0.5 },
    { part: 'D', subject: 'English Comprehension', correct: 18, wrong: 3, unattempted: 4, bonus: 0, score: 34.5, maxMarks: 50, correctMarks: 2, negativeMarks: 0.5 },
  ],
  questions: generateMockQuestions(),
};

function generateMockQuestions(): QuestionData[] {
  const subjects: Record<'A' | 'B' | 'C' | 'D', string> = {
    A: 'General Intelligence & Reasoning',
    B: 'General Awareness',
    C: 'Quantitative Aptitude',
    D: 'English Comprehension',
  };

  const questions: QuestionData[] = [];
  const parts: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

  parts.forEach((part, partIndex) => {
    for (let i = 1; i <= 25; i++) {
      const questionNumber = partIndex * 25 + i;
      const randomStatus = Math.random();
      let status: 'correct' | 'wrong' | 'unattempted';
      let marksAwarded: number;

      if (randomStatus < 0.76) {
        status = 'correct';
        marksAwarded = 2;
      } else if (randomStatus < 0.89) {
        status = 'wrong';
        marksAwarded = -0.5;
      } else {
        status = 'unattempted';
        marksAwarded = 0;
      }

      const correctOptionIndex = Math.floor(Math.random() * 4);
      const selectedOptionIndex = status === 'unattempted' ? -1 : 
        status === 'correct' ? correctOptionIndex : 
        (correctOptionIndex + 1 + Math.floor(Math.random() * 3)) % 4;

      questions.push({
        questionNumber,
        part,
        subject: subjects[part],
        questionImageUrl: `https://picsum.photos/seed/q${questionNumber}/600/200`,
        options: ['A', 'B', 'C', 'D'].map((optionId, idx) => ({
          id: optionId,
          imageUrl: `https://picsum.photos/seed/q${questionNumber}o${idx}/150/60`,
          isSelected: idx === selectedOptionIndex,
          isCorrect: idx === correctOptionIndex,
        })),
        status,
        marksAwarded,
      });
    }
  });

  return questions;
}

export function getMockData(examType: ExamType, language: Language): AnalysisResult {
  return mockAnalysisResult;
}
