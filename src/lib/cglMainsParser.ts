
import {
    type AnalysisResult,
    type QuestionData,
    type CandidateInfo,
    type SectionData
} from './mockData';
import { type ExamConfig, type Language } from './examConfig';

// Interfaces from the source app (scorecard-savvy-main)
interface QuestionResult {
    questionNumber: number;
    sectionQuestionNumber: number;
    status: string;
    chosenOption: number | null;
    isCorrect: boolean;
    correctOption: number | null;
    questionImageUrl: string | null;
    optionImages: { optionNumber: number; imageUrl: string | null; isCorrect: boolean; isChosen: boolean }[];
}

interface SectionResult {
    part: string;
    subject: string;
    totalQuestions: number;
    correct: number;
    wrong: number;
    skipped: number;
    marksPerCorrect: number;
    negativePerWrong: number;
    maxMarks: number;
    score: number;
}

interface SavvyCandidateInfo {
    rollNumber: string;
    candidateName: string;
    venueName: string;
    examDate: string;
    examTime: string;
    subject: string;
}

// CGL Mains Config from source app
const CGL_MAINS_SECTIONS = [
    { part: 'A', subject: 'Mathematical Abilities', start: 1, end: 30, marksPerCorrect: 3, negativePerWrong: 1, maxMarks: 90 },
    { part: 'B', subject: 'Reasoning & General Intelligence', start: 31, end: 60, marksPerCorrect: 3, negativePerWrong: 1, maxMarks: 90 },
    { part: 'C', subject: 'English Language & Comprehension', start: 61, end: 105, marksPerCorrect: 3, negativePerWrong: 1, maxMarks: 135 },
    { part: 'D', subject: 'General Awareness', start: 106, end: 130, marksPerCorrect: 3, negativePerWrong: 0.5, maxMarks: 75 },
    { part: 'E', subject: 'Computer Knowledge', start: 131, end: 150, marksPerCorrect: 3, negativePerWrong: 0.5, maxMarks: 60, qualifying: true },
];

function extractBaseUrl(html: string): string {
    const match = html.match(/src="(\/per\/g\d+\/pub\/\d+\/touchstone\/)/);
    if (match) {
        return 'https://ssc.digialm.com' + match[1];
    }
    return 'https://ssc.digialm.com';
}

function resolveImageUrl(src: string, baseUrl: string): string {
    if (!src) return '';
    if (src.startsWith('http')) return src;
    if (src.startsWith('/')) return 'https://ssc.digialm.com' + src;
    return baseUrl + src;
}

function extractCandidateInfo(doc: Document): SavvyCandidateInfo | null {
    const tables = doc.querySelectorAll('table');
    for (const table of tables) {
        const rows = table.querySelectorAll('tr');
        const info: Record<string, string> = {};
        for (const row of rows) {
            const tds = row.querySelectorAll('td');
            if (tds.length >= 2) {
                const key = tds[0].textContent?.trim() || '';
                const value = tds[1].textContent?.trim() || '';
                if (key) info[key] = value;
            }
        }
        if (info['Roll Number'] || info['Candidate Name']) {
            return {
                rollNumber: info['Roll Number'] || '',
                candidateName: info['Candidate Name'] || '',
                venueName: info['Venue Name'] || '',
                examDate: info['Exam Date'] || '',
                examTime: info['Exam Time'] || '',
                subject: info['Subject'] || '',
            };
        }
    }
    return null;
}

function extractQuestions(doc: Document, baseUrl: string): QuestionResult[] {
    const questions: QuestionResult[] = [];
    const questionRows = doc.querySelectorAll('td.rw');
    let sequentialIndex = 0;

    questionRows.forEach((row) => {
        const questionTbl = row.querySelector('table.questionRowTbl');
        const menuTbl = row.querySelector('table.menu-tbl');

        if (!questionTbl || !menuTbl) return;

        sequentialIndex++;

        let sectionQuestionNumber = 0;
        const qNumTd = questionTbl.querySelector('td.bold[valign="top"]');
        if (qNumTd) {
            const match = qNumTd.textContent?.trim().match(/Q\.(\d+)/);
            if (match) sectionQuestionNumber = parseInt(match[1]);
        }

        let questionImageUrl: string | null = null;
        const allRows = questionTbl.querySelectorAll('tr');
        for (const tr of allRows) {
            const td = tr.querySelector('td.bold[style*="text-align: left"]');
            if (td) {
                const img = td.querySelector('img');
                if (img) {
                    questionImageUrl = resolveImageUrl(img.getAttribute('src') || '', baseUrl);
                }
                break;
            }
        }

        const menuRows = menuTbl.querySelectorAll('tr');
        let status = '';
        let chosenOption: number | null = null;

        menuRows.forEach((tr) => {
            const tds = tr.querySelectorAll('td');
            if (tds.length >= 2) {
                const label = tds[0].textContent?.trim() || '';
                const value = tds[1].textContent?.trim() || '';

                if (label.includes('Status')) {
                    status = value;
                } else if (label.includes('Chosen Option')) {
                    const num = parseInt(value);
                    if (!isNaN(num) && num > 0) chosenOption = num;
                }
            }
        });

        let correctOption: number | null = null;
        const optionImages: { optionNumber: number; imageUrl: string | null; isCorrect: boolean; isChosen: boolean }[] = [];
        const answerTds = questionTbl.querySelectorAll('td.rightAns, td.wrngAns');

        answerTds.forEach((td) => {
            const text = td.textContent?.trim() || '';
            const numMatch = text.match(/^(\d+)\./);
            if (!numMatch) return;

            const optNum = parseInt(numMatch[1]);
            const isRight = td.classList.contains('rightAns');
            if (isRight) correctOption = optNum;

            const img = td.querySelector('img[name]');
            let imageUrl: string | null = null;
            if (img) {
                imageUrl = resolveImageUrl(img.getAttribute('src') || '', baseUrl);
            }

            optionImages.push({
                optionNumber: optNum,
                imageUrl,
                isCorrect: isRight,
                isChosen: chosenOption === optNum,
            });
        });

        const isCorrect = chosenOption !== null && chosenOption === correctOption;

        /* 
           Note: The original code logic doesn't explicitly push 'Question Text' if present, 
           it mostly relies on images. We'll stick to the original logic as requested.
        */

        questions.push({
            questionNumber: sequentialIndex,
            sectionQuestionNumber,
            status,
            chosenOption,
            isCorrect,
            correctOption,
            questionImageUrl,
            optionImages,
        });
    });

    return questions;
}

// Main parser function
export function parseCGLMainsValues(
    html: string,
    url: string,
    examConfig: ExamConfig,
    language: Language
): AnalysisResult {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const baseUrl = extractBaseUrl(html);

    const candidateInfo = extractCandidateInfo(doc);
    const rawQuestions = extractQuestions(doc, baseUrl);

    // Map Candidate Info
    const candidate: CandidateInfo = {
        rollNumber: candidateInfo?.rollNumber || '',
        name: candidateInfo?.candidateName || '',
        examLevel: candidateInfo?.subject || 'SSC CGL MAINS',
        testDate: candidateInfo?.examDate || '',
        shift: candidateInfo?.examTime || '',
        centreName: candidateInfo?.venueName || '',
    };

    // Map Questions to our App's format
    const mappedQuestions: QuestionData[] = rawQuestions.map(q => {
        // Find section config
        const section = CGL_MAINS_SECTIONS.find(s => q.questionNumber >= s.start && q.questionNumber <= s.end);
        const subjectName = section ? section.subject : 'Unknown';
        const part = section ? section.part : '';

        // Status mapping
        // Source: status string ('Answered', 'Not Answered', etc) + chosenOption
        let status: 'correct' | 'wrong' | 'unattempted' | 'bonus' = 'unattempted';
        let marksAwarded = 0;

        if (q.isCorrect) {
            status = 'correct';
            marksAwarded = section ? section.marksPerCorrect : 3;
        } else if (q.chosenOption !== null && q.chosenOption > 0) {
            status = 'wrong';
            marksAwarded = section ? -section.negativePerWrong : -1;
        } else {
            status = 'unattempted';
            marksAwarded = 0;
        }

        // Map options
        // The source code logic collects optionImages but we need 4 options A, B, C, D
        // Source options are 1-based (optionNumber 1, 2, 3, 4)
        const options = [1, 2, 3, 4].map(idx => {
            const opt = q.optionImages.find(o => o.optionNumber === idx);
            return {
                id: String.fromCharCode(64 + idx), // A, B, C, D
                imageUrl: opt?.imageUrl || '',
                imageUrlHindi: opt?.imageUrl || '',   // Fallback as source doesn't distinguish lang
                imageUrlEnglish: opt?.imageUrl || '', // Fallback
                text: undefined,
                isSelected: q.chosenOption === idx,
                isCorrect: q.correctOption === idx
            };
        });

        return {
            questionNumber: q.questionNumber,
            part,
            subject: subjectName,
            questionImageUrl: q.questionImageUrl || '',
            questionImageUrlHindi: q.questionImageUrl || '',
            questionImageUrlEnglish: q.questionImageUrl || '',
            questionText: undefined, // Source doesn't extract text
            options,
            status,
            marksAwarded,
            isBonus: false // Source logic doesn't explicitly detect bonus
        };
    });

    // Calculate Sections
    const sections: SectionData[] = CGL_MAINS_SECTIONS.map(config => {
        const sectionQuestions = mappedQuestions.filter(q => q.subject === config.subject);
        const correct = sectionQuestions.filter(q => q.status === 'correct').length;
        const wrong = sectionQuestions.filter(q => q.status === 'wrong').length;
        const unattempted = sectionQuestions.filter(q => q.status === 'unattempted').length;
        const bonus = sectionQuestions.filter(q => q.status === 'bonus').length;

        const score = (correct * config.marksPerCorrect) - (wrong * config.negativePerWrong);

        return {
            part: config.part,
            subject: config.subject,
            correct,
            wrong,
            unattempted,
            bonus,
            score,
            maxMarks: config.maxMarks,
            correctMarks: config.marksPerCorrect,
            negativeMarks: config.negativePerWrong,
            isQualifying: (config as any).qualifying || false
        };
    });

    // Calculate Totals
    const totalScore = sections.reduce((sum, s) => s.isQualifying ? sum : sum + s.score, 0);
    const correctCount = sections.reduce((sum, s) => sum + s.correct, 0);
    const wrongCount = sections.reduce((sum, s) => sum + s.wrong, 0);
    const unattemptedCount = sections.reduce((sum, s) => sum + s.unattempted, 0);
    const bonusCount = sections.reduce((sum, s) => sum + s.bonus, 0);

    return {
        candidate,
        examType: 'SSC_CGL_MAINS',
        examConfig, // Passed from caller
        language,
        totalScore,
        maxScore: sections.reduce((sum, s) => sum + s.maxMarks, 0),
        totalQuestions: mappedQuestions.length,
        correctCount,
        wrongCount,
        unattemptedCount,
        bonusCount,
        sections,
        questions: mappedQuestions
    };
}
