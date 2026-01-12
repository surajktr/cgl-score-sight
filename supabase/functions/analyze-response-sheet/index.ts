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

// Parse candidate info from the HTML
function parseCandidateInfo(html: string): CandidateInfo {
  const getTableValue = (label: string): string => {
    const regex = new RegExp(`<td[^>]*>\\s*${label}\\s*<\\/td>\\s*<td[^>]*>([^<]+)<\\/td>`, 'i');
    const match = html.match(regex);
    return match ? match[1].trim() : '';
  };

  return {
    rollNumber: getTableValue('Roll Number') || getTableValue('Registration Number') || '',
    name: getTableValue('Candidate Name') || getTableValue('Name') || '',
    examLevel: getTableValue('Exam Name') || getTableValue('Exam Level') || 'Tier-I',
    testDate: getTableValue('Test Date') || getTableValue('Exam Date') || '',
    shift: getTableValue('Shift') || getTableValue('Batch') || '',
    centreName: getTableValue('Centre Name') || getTableValue('Test Centre') || '',
  };
}

// Parse questions from HTML - SSC uses bgcolor attributes to indicate status
function parseQuestions(html: string): QuestionData[] {
  const questions: QuestionData[] = [];
  
  // Find all question blocks - SSC format uses table rows with question data
  // Looking for patterns like: Q.1, Q.2, etc. with option tables
  
  // Match question sections - each question has a number and options
  const questionPattern = /Q\.?\s*(\d+)\s*[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/gi;
  let match;
  
  while ((match = questionPattern.exec(html)) !== null) {
    const qNum = parseInt(match[1]);
    const tableContent = match[2];
    
    // Determine part based on question number (25 questions per part)
    const partIndex = Math.floor((qNum - 1) / 25);
    const parts: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const part = parts[Math.min(partIndex, 3)];
    
    // Parse options - look for bgcolor attributes to determine status
    // Green/correct: bgcolor containing "green" or specific hex codes
    // Red/wrong: bgcolor containing "red" 
    // Selected: bgcolor or different styling
    
    const options: QuestionData['options'] = [];
    const optionIds = ['A', 'B', 'C', 'D'];
    
    // Find option cells - they typically have images
    const optionPattern = /<td[^>]*(?:bgcolor\s*=\s*["']([^"']+)["'])?[^>]*>[\s\S]*?<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>[\s\S]*?<\/td>/gi;
    let optionMatch;
    let optIdx = 0;
    
    while ((optionMatch = optionPattern.exec(tableContent)) !== null && optIdx < 4) {
      const bgcolor = (optionMatch[1] || '').toLowerCase();
      const imgSrc = optionMatch[2];
      
      // Determine if this option is selected or correct based on bgcolor
      // Common SSC patterns:
      // Green = correct answer
      // Red = wrong selected answer
      // Light blue/highlighted = selected
      const isCorrect = bgcolor.includes('green') || bgcolor.includes('#90ee90') || bgcolor.includes('#00ff00');
      const isSelected = isCorrect || bgcolor.includes('red') || bgcolor.includes('#ff') || bgcolor.includes('lightblue') || bgcolor.includes('#add8e6');
      
      options.push({
        id: optionIds[optIdx],
        imageUrl: imgSrc,
        isSelected,
        isCorrect,
      });
      
      optIdx++;
    }
    
    // If we didn't find enough options, try alternative parsing
    if (options.length < 4) {
      // Alternative: look for img tags with option identifiers
      const altOptionPattern = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
      let altMatch;
      options.length = 0;
      optIdx = 0;
      
      while ((altMatch = altOptionPattern.exec(tableContent)) !== null && optIdx < 4) {
        options.push({
          id: optionIds[optIdx],
          imageUrl: altMatch[1],
          isSelected: false,
          isCorrect: false,
        });
        optIdx++;
      }
    }
    
    // Determine question status
    let status: 'correct' | 'wrong' | 'unattempted' = 'unattempted';
    const hasSelected = options.some(o => o.isSelected);
    const selectedCorrect = options.some(o => o.isSelected && o.isCorrect);
    
    if (!hasSelected) {
      status = 'unattempted';
    } else if (selectedCorrect) {
      status = 'correct';
    } else {
      status = 'wrong';
    }
    
    // Calculate marks (SSC CGL: +2 for correct, -0.5 for wrong)
    const marksAwarded = status === 'correct' ? 2 : status === 'wrong' ? -0.5 : 0;
    
    // Find question image
    const qImgPattern = new RegExp(`Q\\.?\\s*${qNum}[\\s\\S]*?<img[^>]+src\\s*=\\s*["']([^"']+)["']`, 'i');
    const qImgMatch = html.match(qImgPattern);
    const questionImageUrl = qImgMatch ? qImgMatch[1] : '';
    
    questions.push({
      questionNumber: qNum,
      part,
      subject: SUBJECTS[part],
      questionImageUrl,
      options,
      status,
      marksAwarded,
    });
  }
  
  // Sort by question number
  questions.sort((a, b) => a.questionNumber - b.questionNumber);
  
  return questions;
}

// Alternative parsing method using rawHtml patterns
function parseQuestionsAlternative(html: string): QuestionData[] {
  const questions: QuestionData[] = [];
  
  // Look for answer key table patterns
  // Format: Question No | Your Answer | Correct Answer
  const answerKeyPattern = /(\d+)\s*\|\s*([A-D]|-)\s*\|\s*([A-D])/gi;
  let match;
  
  while ((match = answerKeyPattern.exec(html)) !== null) {
    const qNum = parseInt(match[1]);
    const yourAnswer = match[2].toUpperCase();
    const correctAnswer = match[3].toUpperCase();
    
    const partIndex = Math.floor((qNum - 1) / 25);
    const parts: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const part = parts[Math.min(partIndex, 3)];
    
    const optionIds = ['A', 'B', 'C', 'D'];
    const options = optionIds.map(id => ({
      id,
      imageUrl: '',
      isSelected: id === yourAnswer,
      isCorrect: id === correctAnswer,
    }));
    
    let status: 'correct' | 'wrong' | 'unattempted';
    if (yourAnswer === '-' || yourAnswer === '') {
      status = 'unattempted';
    } else if (yourAnswer === correctAnswer) {
      status = 'correct';
    } else {
      status = 'wrong';
    }
    
    const marksAwarded = status === 'correct' ? 2 : status === 'wrong' ? -0.5 : 0;
    
    questions.push({
      questionNumber: qNum,
      part,
      subject: SUBJECTS[part],
      questionImageUrl: '',
      options,
      status,
      marksAwarded,
    });
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

    console.log('Scraping URL:', url);

    // Scrape the response sheet URL using Firecrawl
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['html', 'rawHtml'],
        waitFor: 3000, // Wait for dynamic content
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error('Firecrawl API error:', scrapeData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: scrapeData.error || 'Failed to scrape the response sheet. Please check the URL and try again.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = scrapeData.data?.html || scrapeData.data?.rawHtml || '';
    
    if (!html) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not extract content from the URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('HTML content length:', html.length);

    // Parse candidate info
    const candidate = parseCandidateInfo(html);
    
    // Parse questions - try primary method first, then alternative
    let questions = parseQuestions(html);
    
    if (questions.length === 0) {
      console.log('Trying alternative parsing method...');
      questions = parseQuestionsAlternative(html);
    }
    
    console.log('Parsed questions count:', questions.length);

    if (questions.length === 0) {
      // Return a helpful error if we couldn't parse any questions
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not parse questions from the response sheet. The URL may not be a valid SSC CGL response sheet, or the format may have changed.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate sections
    const sections = calculateSections(questions);
    
    // Calculate totals
    const correctCount = questions.filter(q => q.status === 'correct').length;
    const wrongCount = questions.filter(q => q.status === 'wrong').length;
    const unattemptedCount = questions.filter(q => q.status === 'unattempted').length;
    const totalScore = correctCount * 2 - wrongCount * 0.5;
    
    const result: AnalysisResult = {
      candidate,
      totalScore,
      maxScore: questions.length * 2,
      totalQuestions: questions.length,
      correctCount,
      wrongCount,
      unattemptedCount,
      sections,
      questions,
    };

    console.log('Analysis complete. Total score:', totalScore);

    return new Response(
      JSON.stringify({ success: true, data: result }),
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
