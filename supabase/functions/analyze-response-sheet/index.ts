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

// Parse candidate info from the HTML - SSC format uses ":&nbsp;&nbsp;&nbsp;" prefix
function parseCandidateInfo(html: string): CandidateInfo {
  const getTableValue = (label: string): string => {
    // Match pattern: <td>Label</td><td>:&nbsp;&nbsp;&nbsp;Value</td>
    const regex = new RegExp(
      `<td[^>]*>[^<]*${label}[^<]*<\\/td>\\s*<td[^>]*>:?(?:&nbsp;)*\\s*([^<]+)`,
      'i'
    );
    const match = html.match(regex);
    if (match) {
      // Clean up the value - remove &nbsp; and extra whitespace
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

// Parse questions from HTML - SSC uses bgcolor attributes on TR/TD elements
function parseQuestions(html: string): QuestionData[] {
  const questions: QuestionData[] = [];
  
  // Find all question tables - each question is in its own table with Q.No: X format
  // Pattern: table containing "Q.No: X" followed by option rows
  const questionTablePattern = /<table[^>]*>[\s\S]*?Q\.No:\s*&nbsp;(\d+)[\s\S]*?<\/table>/gi;
  let tableMatch;
  
  while ((tableMatch = questionTablePattern.exec(html)) !== null) {
    const qNum = parseInt(tableMatch[1]);
    const tableContent = tableMatch[0];
    
    // Determine part based on question number (25 questions per part)
    const partIndex = Math.floor((qNum - 1) / 25);
    const parts: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const part = parts[Math.min(partIndex, 3)];
    
    // Find question image (first img in the question row)
    const qImgPattern = /Q\.No:\s*&nbsp;\d+<\/font><\/td><td[^>]*>[\s\S]*?<img[^>]+src\s*=\s*["']([^"']+)["']/i;
    const qImgMatch = tableContent.match(qImgPattern);
    const questionImageUrl = qImgMatch ? qImgMatch[1] : '';
    
    // Parse options - each option is in a <tr> with possible bgcolor
    // Look for rows containing option images (after the question row)
    const options: QuestionData['options'] = [];
    const optionIds = ['A', 'B', 'C', 'D'];
    
    // Pattern to match option rows: <tr ...bgcolor="color"...> or <tr>...<td...bgcolor="color">
    // containing an image
    const optionRowPattern = /<tr[^>]*(?:bgcolor\s*=\s*["']([^"']+)["'])?[^>]*>([\s\S]*?)<\/tr>/gi;
    let optionMatch;
    let optIdx = 0;
    let foundQuestionRow = false;
    
    while ((optionMatch = optionRowPattern.exec(tableContent)) !== null && optIdx < 4) {
      const rowBgcolor = (optionMatch[1] || '').toLowerCase();
      const rowContent = optionMatch[2];
      
      // Skip the question row (contains Q.No:)
      if (rowContent.includes('Q.No:')) {
        foundQuestionRow = true;
        continue;
      }
      
      // Only process rows after the question row
      if (!foundQuestionRow) continue;
      
      // Check if this row contains an option image
      const imgMatch = rowContent.match(/<img[^>]+src\s*=\s*["']([^"']+)["']/i);
      if (!imgMatch) continue;
      
      // Check for bgcolor in the row or in any td within the row
      let bgcolor = rowBgcolor;
      if (!bgcolor) {
        const tdBgMatch = rowContent.match(/bgcolor\s*=\s*["']([^"']+)["']/i);
        if (tdBgMatch) {
          bgcolor = tdBgMatch[1].toLowerCase();
        }
      }
      
      // Determine status based on bgcolor:
      // green = correct answer selected by candidate (correct)
      // red = wrong answer selected by candidate
      // yellow = correct answer (shown when candidate selected wrong)
      const isGreen = bgcolor.includes('green');
      const isRed = bgcolor.includes('red');
      const isYellow = bgcolor.includes('yellow');
      
      // isCorrect = this option is the correct answer
      const isCorrect = isGreen || isYellow;
      // isSelected = candidate selected this option
      const isSelected = isGreen || isRed;
      
      options.push({
        id: optionIds[optIdx],
        imageUrl: imgMatch[1],
        isSelected,
        isCorrect,
      });
      
      optIdx++;
    }
    
    // If we found at least some options, add the question
    if (options.length >= 2) {
      // Pad to 4 options if needed
      while (options.length < 4) {
        options.push({
          id: optionIds[options.length],
          imageUrl: '',
          isSelected: false,
          isCorrect: false,
        });
      }
      
      // Determine question status
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
      
      // Calculate marks (SSC CGL: +2 for correct, -0.5 for wrong)
      const marksAwarded = status === 'correct' ? 2 : status === 'wrong' ? -0.5 : 0;
      
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

    // Scrape the response sheet URL using Firecrawl with actions to click all 4 parts
    // The SSC CGL response sheet has 4 tabs (Part A, B, C, D) that need to be clicked
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['html', 'rawHtml'],
        waitFor: 2000, // Initial wait for page load
        actions: [
          // Click Part A (usually already visible, but click to ensure)
          { type: 'click', selector: 'input[value*="PART-A"], input[value*="Part-A"], input[value*="PART A"], a:contains("PART-A"), button:contains("PART-A")' },
          { type: 'wait', milliseconds: 1500 },
          // Click Part B
          { type: 'click', selector: 'input[value*="PART-B"], input[value*="Part-B"], input[value*="PART B"], a:contains("PART-B"), button:contains("PART-B")' },
          { type: 'wait', milliseconds: 1500 },
          // Click Part C
          { type: 'click', selector: 'input[value*="PART-C"], input[value*="Part-C"], input[value*="PART C"], a:contains("PART-C"), button:contains("PART-C")' },
          { type: 'wait', milliseconds: 1500 },
          // Click Part D
          { type: 'click', selector: 'input[value*="PART-D"], input[value*="Part-D"], input[value*="PART D"], a:contains("PART-D"), button:contains("PART-D")' },
          { type: 'wait', milliseconds: 1500 },
        ],
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
