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
  part: 'A' | 'B' | 'C' | 'D';
  subject: string;
  questionImageUrl: string;
  options: {
    id: string;
    imageUrl: string;
    isSelected: boolean;
    isCorrect: boolean;
  }[];
  status: 'correct' | 'wrong' | 'unattempted';
  marksAwarded: number;
}

interface SectionData {
  part: 'A' | 'B' | 'C' | 'D';
  subject: string;
  correct: number;
  wrong: number;
  unattempted: number;
  score: number;
}

interface AnalysisResult {
  candidate: CandidateInfo;
  totalScore: number;
  maxScore: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  sections: SectionData[];
  questions: QuestionData[];
}

const SUBJECTS: Record<'A' | 'B' | 'C' | 'D', string> = {
  A: 'General Intelligence & Reasoning',
  B: 'General Awareness',
  C: 'Quantitative Aptitude',
  D: 'English Comprehension',
};

// Map URL suffix to part
const PART_URL_MAP: Record<string, 'A' | 'B' | 'C' | 'D'> = {
  'ViewCandResponse.aspx': 'A',
  'ViewCandResponse1.aspx': 'B',
  'ViewCandResponse3.aspx': 'C',
  'ViewCandResponse4.aspx': 'D',
};

// Generate URLs for all 4 parts from a given URL
function generatePartUrls(inputUrl: string): { part: 'A' | 'B' | 'C' | 'D'; url: string }[] {
  const parts: { part: 'A' | 'B' | 'C' | 'D'; url: string }[] = [];
  
  // Extract base URL and query params
  const urlParts = inputUrl.split('?');
  const queryString = urlParts[1] || '';
  const basePath = urlParts[0];
  
  // Find the base directory
  const lastSlashIndex = basePath.lastIndexOf('/');
  const baseDir = basePath.substring(0, lastSlashIndex + 1);
  
  // Generate all 4 part URLs
  // Correct URL patterns for all 4 parts
  const partFiles = [
    { file: 'ViewCandResponse.aspx', part: 'A' as const },   // Part A
    { file: 'ViewCandResponse1.aspx', part: 'B' as const },  // Part B  
    { file: 'ViewCandResponse3.aspx', part: 'C' as const },  // Part C
    { file: 'ViewCandResponse4.aspx', part: 'D' as const },  // Part D
  ];
  
  for (const { file, part } of partFiles) {
    const url = `${baseDir}${file}${queryString ? '?' + queryString : ''}`;
    parts.push({ part, url });
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
    examLevel: getTableValue('Exam Level') || 'SSC CGL Tier 1',
    testDate: getTableValue('Test Date') || '',
    shift: getTableValue('Test Time') || getTableValue('Shift') || '',
    centreName: getTableValue('Centre Name') || getTableValue('Center Name') || '',
  };
}

// Parse questions from HTML for a specific part
function parseQuestionsForPart(html: string, part: 'A' | 'B' | 'C' | 'D', baseUrl: string): QuestionData[] {
  const questions: QuestionData[] = [];
  
  // Extract base URL for resolving relative image paths
  const urlParts = baseUrl.split('?')[0];
  const lastSlashIndex = urlParts.lastIndexOf('/');
  const baseDir = urlParts.substring(0, lastSlashIndex + 1);
  
  // Find all question tables
  const questionTablePattern = /<table[^>]*>[\s\S]*?Q\.No:\s*&nbsp;(\d+)[\s\S]*?<\/table>/gi;
  let tableMatch;
  
  while ((tableMatch = questionTablePattern.exec(html)) !== null) {
    const qNum = parseInt(tableMatch[1]);
    const tableContent = tableMatch[0];
    
    // Find question image
    const qImgPattern = /Q\.No:\s*&nbsp;\d+<\/font><\/td><td[^>]*>[\s\S]*?<img[^>]+src\s*=\s*["']([^"']+)["']/i;
    const qImgMatch = tableContent.match(qImgPattern);
    let questionImageUrl = qImgMatch ? qImgMatch[1] : '';
    
    // Make image URL absolute
    if (questionImageUrl && !questionImageUrl.startsWith('http')) {
      questionImageUrl = baseDir + questionImageUrl;
    }
    
    // Parse options
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
      
      const imgMatch = rowContent.match(/<img[^>]+src\s*=\s*["']([^"']+)["']/i);
      if (!imgMatch) continue;
      
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
      
      let optionImageUrl = imgMatch[1];
      if (optionImageUrl && !optionImageUrl.startsWith('http')) {
        optionImageUrl = baseDir + optionImageUrl;
      }
      
      options.push({
        id: optionIds[optIdx],
        imageUrl: optionImageUrl,
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
      
      const marksAwarded = status === 'correct' ? 2 : status === 'wrong' ? -0.5 : 0;
      
      // Calculate the actual question number based on part (25 questions per part)
      const partOffset = { A: 0, B: 25, C: 50, D: 75 };
      const actualQuestionNumber = partOffset[part] + qNum;
      
      questions.push({
        questionNumber: actualQuestionNumber,
        part,
        subject: SUBJECTS[part],
        questionImageUrl,
        options,
        status,
        marksAwarded,
      });
    }
  }
  
  return questions;
}

// Calculate section-wise breakdown
function calculateSections(questions: QuestionData[]): SectionData[] {
  const sectionMap = new Map<'A' | 'B' | 'C' | 'D', SectionData>();
  
  const parts: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  parts.forEach(part => {
    sectionMap.set(part, {
      part,
      subject: SUBJECTS[part],
      correct: 0,
      wrong: 0,
      unattempted: 0,
      score: 0,
    });
  });
  
  questions.forEach(q => {
    const section = sectionMap.get(q.part)!;
    if (q.status === 'correct') {
      section.correct++;
      section.score += 2;
    } else if (q.status === 'wrong') {
      section.wrong++;
      section.score -= 0.5;
    } else {
      section.unattempted++;
    }
  });
  
  return Array.from(sectionMap.values());
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured. Please enable the Firecrawl connector in Settings.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate URLs for all 4 parts
    const partUrls = generatePartUrls(url);
    console.log('Fetching all 4 parts:', partUrls.map(p => p.part).join(', '));

    let allQuestions: QuestionData[] = [];
    let candidate: CandidateInfo | null = null;

    // Fetch all parts in parallel
    const fetchPromises = partUrls.map(async ({ part, url: partUrl }) => {
      console.log(`Scraping Part ${part}:`, partUrl);
      
      try {
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: partUrl,
            formats: ['html', 'rawHtml'],
            waitFor: 3000,
          }),
        });

        const scrapeData = await scrapeResponse.json();

        if (!scrapeResponse.ok || !scrapeData.success) {
          console.error(`Failed to scrape Part ${part}:`, scrapeData.error);
          return { part, questions: [], html: '' };
        }

        const html = scrapeData.data?.html || scrapeData.data?.rawHtml || '';
        console.log(`Part ${part} HTML length:`, html.length);

        const questions = parseQuestionsForPart(html, part, partUrl);
        console.log(`Part ${part} questions count:`, questions.length);

        return { part, questions, html };
      } catch (error) {
        console.error(`Error scraping Part ${part}:`, error);
        return { part, questions: [], html: '' };
      }
    });

    const results = await Promise.all(fetchPromises);

    // Collect all questions and candidate info
    for (const result of results) {
      allQuestions = allQuestions.concat(result.questions);
      
      // Parse candidate info from the first successful part
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
          error: 'Could not parse questions from the response sheet. The URL may not be a valid SSC CGL response sheet, or the format may have changed.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use default candidate if parsing failed
    if (!candidate || !candidate.rollNumber) {
      candidate = {
        rollNumber: '',
        name: '',
        examLevel: 'SSC CGL Tier 1',
        testDate: '',
        shift: '',
        centreName: '',
      };
    }

    // Calculate sections
    const sections = calculateSections(allQuestions);
    
    // Calculate totals
    const correctCount = allQuestions.filter(q => q.status === 'correct').length;
    const wrongCount = allQuestions.filter(q => q.status === 'wrong').length;
    const unattemptedCount = allQuestions.filter(q => q.status === 'unattempted').length;
    const totalScore = correctCount * 2 - wrongCount * 0.5;
    
    const analysisResult: AnalysisResult = {
      candidate,
      totalScore,
      maxScore: allQuestions.length * 2,
      totalQuestions: allQuestions.length,
      correctCount,
      wrongCount,
      unattemptedCount,
      sections,
      questions: allQuestions,
    };

    console.log('Analysis complete. Total score:', totalScore, '/', allQuestions.length * 2);

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
