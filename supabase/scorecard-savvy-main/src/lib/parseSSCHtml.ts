export interface QuestionResult {
  questionNumber: number;
  sectionQuestionNumber: number; // Q.number within section (e.g. Q.3)
  status: string;
  chosenOption: number | null;
  isCorrect: boolean;
  correctOption: number | null;
  questionImageUrl: string | null;
  optionImages: { optionNumber: number; imageUrl: string | null; isCorrect: boolean; isChosen: boolean }[];
}

export interface SectionResult {
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

export interface CandidateInfo {
  rollNumber: string;
  candidateName: string;
  venueName: string;
  examDate: string;
  examTime: string;
  subject: string;
}

export interface ScorecardData {
  candidateInfo: CandidateInfo | null;
  sections: SectionResult[];
  questions: QuestionResult[];
  totalCorrect: number;
  totalWrong: number;
  totalSkipped: number;
  totalScore: number;
  totalMaxMarks: number;
  qualifyingSection: SectionResult | null;
  baseUrl: string;
}

// SSC CGL Mains 2024 section structure
const CGL_MAINS_SECTIONS = [
  { part: 'A', subject: 'Mathematical Abilities', start: 1, end: 30, marksPerCorrect: 3, negativePerWrong: 1, maxMarks: 90 },
  { part: 'B', subject: 'Reasoning & General Intelligence', start: 31, end: 60, marksPerCorrect: 3, negativePerWrong: 1, maxMarks: 90 },
  { part: 'C', subject: 'English Language & Comprehension', start: 61, end: 105, marksPerCorrect: 3, negativePerWrong: 1, maxMarks: 135 },
  { part: 'D', subject: 'General Awareness', start: 106, end: 130, marksPerCorrect: 3, negativePerWrong: 0.5, maxMarks: 75 },
  { part: 'E', subject: 'Computer Knowledge', start: 131, end: 150, marksPerCorrect: 3, negativePerWrong: 0.5, maxMarks: 60, qualifying: true },
];

export function parseSSCHtml(html: string): ScorecardData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Try to extract base URL from the HTML for resolving relative image paths
  const baseUrl = extractBaseUrl(html);

  const candidateInfo = extractCandidateInfo(doc);
  const questions = extractQuestions(doc, baseUrl);
  return calculateScorecard(questions, baseUrl, candidateInfo);
}

function extractCandidateInfo(doc: Document): CandidateInfo | null {
  // Find the info table - it has rows with Roll Number, Candidate Name, etc.
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

function extractBaseUrl(html: string): string {
  // Try to find base URL from image src attributes
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

function extractQuestions(doc: Document, baseUrl: string): QuestionResult[] {
  const questions: QuestionResult[] = [];
  const questionRows = doc.querySelectorAll('td.rw');
  let sequentialIndex = 0;

  questionRows.forEach((row) => {
    const questionTbl = row.querySelector('table.questionRowTbl');
    const menuTbl = row.querySelector('table.menu-tbl');

    if (!questionTbl || !menuTbl) return;

    sequentialIndex++;

    // Extract section-local question number (e.g. Q.3)
    let sectionQuestionNumber = 0;
    const qNumTd = questionTbl.querySelector('td.bold[valign="top"]');
    if (qNumTd) {
      const match = qNumTd.textContent?.trim().match(/Q\.(\d+)/);
      if (match) sectionQuestionNumber = parseInt(match[1]);
    }

    // Extract question image - it's the img inside the question text td (second row, second td)
    let questionImageUrl: string | null = null;
    const allRows = questionTbl.querySelectorAll('tr');
    // The question image is typically in the second tr, second td
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

    // Extract metadata from menu table
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

    // Extract options with images and correctness
    let correctOption: number | null = null;
    const optionImages: QuestionResult['optionImages'] = [];
    const answerTds = questionTbl.querySelectorAll('td.rightAns, td.wrngAns');
    
    answerTds.forEach((td) => {
      const text = td.textContent?.trim() || '';
      const numMatch = text.match(/^(\d+)\./);
      if (!numMatch) return;

      const optNum = parseInt(numMatch[1]);
      const isRight = td.classList.contains('rightAns');
      if (isRight) correctOption = optNum;

      // Get option image
      const img = td.querySelector('img[name]'); // img with name= are content images, not tick/cross
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

function calculateScorecard(questions: QuestionResult[], baseUrl: string, candidateInfo: CandidateInfo | null): ScorecardData {
  const sections: SectionResult[] = [];
  let qualifyingSection: SectionResult | null = null;

  for (const section of CGL_MAINS_SECTIONS) {
    const sectionQuestions = questions.filter(
      (q) => q.questionNumber >= section.start && q.questionNumber <= section.end
    );

    const correct = sectionQuestions.filter((q) => q.isCorrect).length;
    const answered = sectionQuestions.filter(
      (q) => q.status === 'Answered' || (q.chosenOption !== null && q.chosenOption > 0)
    ).length;
    const wrong = answered - correct;
    const skipped = section.end - section.start + 1 - answered;
    const score = correct * section.marksPerCorrect - wrong * section.negativePerWrong;

    const result: SectionResult = {
      part: section.part,
      subject: section.subject,
      totalQuestions: section.end - section.start + 1,
      correct,
      wrong,
      skipped,
      marksPerCorrect: section.marksPerCorrect,
      negativePerWrong: section.negativePerWrong,
      maxMarks: section.maxMarks,
      score: Math.round(score * 10) / 10,
    };

    if ((section as any).qualifying) {
      qualifyingSection = result;
    } else {
      sections.push(result);
    }
  }

  const totalCorrect = sections.reduce((s, sec) => s + sec.correct, 0);
  const totalWrong = sections.reduce((s, sec) => s + sec.wrong, 0);
  const totalSkipped = sections.reduce((s, sec) => s + sec.skipped, 0);
  const totalScore = Math.round(sections.reduce((s, sec) => s + sec.score, 0) * 10) / 10;
  const totalMaxMarks = sections.reduce((s, sec) => s + sec.maxMarks, 0);

  return {
    candidateInfo,
    sections,
    questions,
    totalCorrect,
    totalWrong,
    totalSkipped,
    totalScore,
    totalMaxMarks,
    qualifyingSection,
    baseUrl,
  };
}

export function getQuestionsForSection(data: ScorecardData, part: string): QuestionResult[] {
  const section = CGL_MAINS_SECTIONS.find((s) => s.part === part);
  if (!section) return [];
  return data.questions.filter(
    (q) => q.questionNumber >= section.start && q.questionNumber <= section.end
  );
}

export { CGL_MAINS_SECTIONS };
