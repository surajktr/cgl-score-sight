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
  options: {
    id: string;
    imageUrl: string;
    imageUrlHindi?: string;
    imageUrlEnglish?: string;
    isSelected: boolean;
    isCorrect: boolean;
  }[];
  status: 'correct' | 'wrong' | 'unattempted';
  marksAwarded: number;
}

interface SectionData {
  part: string;
  subject: string;
  correct: number;
  wrong: number;
  unattempted: number;
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
  sections: SectionData[];
  questions: QuestionData[];
}

// Exam configurations
const EXAM_CONFIGS: Record<string, ExamConfig> = {
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

      let status: 'correct' | 'wrong' | 'unattempted' = 'unattempted';
      const hasSelected = options.some(o => o.isSelected);
      const selectedIsCorrect = options.some(o => o.isSelected && o.isCorrect);

      if (!hasSelected) {
        status = 'unattempted';
      } else if (selectedIsCorrect) {
        status = 'correct';
      } else {
        status = 'wrong';
      }

      // Calculate marks based on exam-specific marking scheme
      const marksAwarded = status === 'correct'
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
// Calculate section-wise breakdown
function calculateSections(questions: QuestionData[], examConfig: ExamConfig): SectionData[] {
  const sections: SectionData[] = [];

  for (const subject of examConfig.subjects) {
    const partQuestions = questions.filter(q => q.part === subject.part);
    const correct = partQuestions.filter(q => q.status === 'correct').length;
    const wrong = partQuestions.filter(q => q.status === 'wrong').length;
    const unattempted = partQuestions.filter(q => q.status === 'unattempted').length;
    const score = correct * subject.correctMarks - wrong * subject.negativeMarks;

    sections.push({
      part: subject.part,
      subject: subject.name,
      correct,
      wrong,
      unattempted,
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
    const { url, examType, language } = await req.json();

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
      sections,
      questions: allQuestions,
    };

    console.log('Analysis complete. Total score:', totalScore, '/', examConfig.maxMarks);

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
