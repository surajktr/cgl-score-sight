import { useState, useRef } from 'react';
import { UrlInputForm } from '@/components/UrlInputForm';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ResultsDashboard } from '@/components/ResultsDashboard';
import { analyzeResponseSheet } from '@/lib/api/analyzeSheet';
import type { AnalysisResult, QuestionData, SectionData } from '@/lib/mockData';
import { EXAM_CONFIGS, type ExamType, type Language } from '@/lib/examConfig';
import { FileText, Shield, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const normalizeCandidateLabel = (value: string) =>
  value
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[:：]/g, '')
    .trim()
    .toLowerCase();

const parseCandidateInfoFromHtml = (html: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Strategy 1: Find the specific candidate info table (User's suggested method)
  // This is more robust as it targets the table containing specific keys
  const tables = doc.querySelectorAll('table');
  for (const table of tables) {
    const rows = table.querySelectorAll('tr');
    const info: Record<string, string> = {};

    // Parse this table
    for (const row of rows) {
      const tds = row.querySelectorAll('td');
      if (tds.length >= 2) {
        const key = (tds[0].textContent || '').replace(/&nbsp;/gi, ' ').trim();
        const value = (tds[1].textContent || '').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
        if (key) {
          // Normalize key for map but keep original for strict checks if needed
          const normKey = key.replace(/[:：]/g, '').toLowerCase();
          info[normKey] = value;
          // Also store strict key for debugging or specific lookups
          info[key] = value;
        }
      }
    }

    // Check if this is the candidate table by looking for essential keys
    if (info['roll number'] || info['candidate name'] || info['roll no']) {
      // Helper to safely get value from map
      const getVal = (...keys: string[]) => {
        for (const k of keys) {
          const norm = k.toLowerCase();
          if (info[norm]) return info[norm];
        }
        return '';
      };

      const splitDateShift = (value: string) => {
        const normalized = value.replace(/\s+/g, ' ').trim();
        if (!normalized) return { date: '', shift: '' };
        const dateMatch = normalized.match(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b|\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4}\b/);
        const shiftMatch = normalized.match(/\b(shift\s*[-:]*\s*\d+|morning|afternoon|evening|forenoon|FN|AN|\d{1,2}:\d{2}\s*(?:AM|PM)\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM))\b/i);
        return {
          date: dateMatch ? dateMatch[0].trim() : '',
          shift: shiftMatch ? shiftMatch[0].replace(/\s+/g, ' ').trim() : ''
        };
      };

      const combinedDateShift = getVal('test date & time', 'exam date & time', 'exam date and time', 'date & shift', 'exam date & shift');
      const derived = splitDateShift(combinedDateShift);

      return {
        rollNumber: getVal('roll number', 'roll no', 'roll no.'),
        name: getVal('candidate name', 'participant name', 'name', 'candidate\'s name'),
        examLevel: getVal('subject', 'exam level', 'post name'),
        testDate: getVal('test date', 'exam date', 'date of exam', 'examination date') || derived.date,
        shift: getVal('test time', 'exam time', 'shift', 'exam timing', 'examination time') || derived.shift,
        centreName: getVal('venue name', 'venue name & address', 'venue address', 'venue', 'center name', 'centre name', 'exam center name', 'test center name', 'test centre name')
      };
    }
  }

  // Fallback: Strategy 2 (Original logic - collecting all KV pairs from all tables)
  // Use this if the specific table wasn't found above
  const kvMap: Record<string, string> = {};
  doc.querySelectorAll('tr').forEach((tr) => {
    const tds = tr.querySelectorAll('td');
    if (tds.length >= 2) {
      const key = normalizeCandidateLabel(tds[0].textContent || '');
      const value = (tds[1].textContent || '').replace(/\s+/g, ' ').trim();
      if (key && value && !kvMap[key]) kvMap[key] = value;
    }
  });

  const get = (...aliases: string[]) => {
    for (const alias of aliases) {
      const normalizedAlias = normalizeCandidateLabel(alias);
      if (kvMap[normalizedAlias]) return kvMap[normalizedAlias];
    }
    for (const alias of aliases) {
      const normalizedAlias = normalizeCandidateLabel(alias);
      for (const [key, value] of Object.entries(kvMap)) {
        if (key.includes(normalizedAlias) || normalizedAlias.includes(key)) return value;
      }
    }
    return '';
  };

  const splitDateShift = (value: string) => {
    const normalized = value.replace(/\s+/g, ' ').trim();
    if (!normalized) return { date: '', shift: '' };
    const dateMatch = normalized.match(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b|\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4}\b/);
    const shiftMatch = normalized.match(/\b(shift\s*[-:]*\s*\d+|morning|afternoon|evening|forenoon|FN|AN)\b/i);
    return {
      date: dateMatch ? dateMatch[0].trim() : '',
      shift: shiftMatch ? shiftMatch[0].replace(/\s+/g, ' ').trim() : '',
    };
  };

  const explicitDate = get('Exam Date', 'Test Date', 'Date of Exam', 'Examination Date');
  const explicitShift = get('Exam Time', 'Test Time', 'Shift', 'Exam Timing', 'Examination Time', 'Exam Shift');
  const combinedDateShift = get('Test Date & Time', 'Exam Date & Time', 'Exam Date and Time', 'Date & Shift', 'Exam Date & Shift');
  const derivedFromCombined = splitDateShift(combinedDateShift);

  return {
    rollNumber: get('Roll Number', 'Roll No', 'Roll No.'),
    name: get('Candidate Name', 'Participant Name', 'Name'),
    examLevel: get('Subject', 'Exam Level', 'Post Name'),
    testDate: explicitDate || derivedFromCombined.date,
    shift: explicitShift || derivedFromCombined.shift,
    centreName: get(
      'Venue Name',
      'Venue Name & Address',
      'Venue Address',
      'Venue',
      'Center Name',
      'Centre Name',
      'Exam Center Name',
      'Exam Centre Name',
      'Test Center Name',
      'Test Centre Name'
    ),
  };
};

const fetchCandidateInfoFromHtmlUrl = async (url: string) => {
  const proxyUrls = [
    `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://thingproxy.freeboard.io/fetch/${url}`,
  ];

  for (const proxyUrl of proxyUrls) {
    try {
      const res = await fetch(proxyUrl, { method: 'GET', headers: { Accept: 'text/html' } });
      if (!res.ok) continue;
      const html = await res.text();
      if (!html || html.length < 300) continue;
      const parsed = parseCandidateInfoFromHtml(html);
      if (parsed.rollNumber || parsed.name || parsed.centreName) {
        return parsed;
      }
    } catch {
      // try next proxy
    }
  }

  return null;
};

// Fix CGL Mains subject distribution: reassign questions by sequential order
// SSC answer keys reset Q.1-Q.30 per section, so we use order of appearance
function fixCglMainsSubjectDistribution(data: AnalysisResult): AnalysisResult {
  if (data.examType !== 'SSC_CGL_MAINS') return data;

  const config = EXAM_CONFIGS.SSC_CGL_MAINS;
  if (!config) return data;

  // Build ranges from config: [{start:1,end:30,subject}, {start:31,end:60,subject}, ...]
  const ranges: { start: number; end: number; subject: typeof config.subjects[0] }[] = [];
  let offset = 0;
  for (const subject of config.subjects) {
    ranges.push({ start: offset + 1, end: offset + subject.totalQuestions, subject });
    offset += subject.totalQuestions;
  }

  // Sort questions by their current questionNumber (order of appearance)
  const sortedQuestions = [...data.questions].sort((a, b) => a.questionNumber - b.questionNumber);

  // Reassign sequential numbers and subjects
  const fixedQuestions: QuestionData[] = sortedQuestions.map((q, idx) => {
    const seqNum = idx + 1;
    const range = ranges.find(r => seqNum >= r.start && seqNum <= r.end) || ranges[ranges.length - 1];
    const isCorrect = q.status === 'correct';
    const isWrong = q.status === 'wrong';
    const isBonus = q.status === 'bonus';
    const marksAwarded = isBonus ? range.subject.correctMarks
      : isCorrect ? range.subject.correctMarks
        : isWrong ? -range.subject.negativeMarks
          : 0;

    return {
      ...q,
      questionNumber: seqNum,
      part: range.subject.part,
      subject: range.subject.name,
      marksAwarded,
    };
  });

  // Recalculate sections from fixed questions
  const sections: SectionData[] = config.subjects.map(subject => {
    const subjectQuestions = fixedQuestions.filter(q => q.subject === subject.name);
    const correct = subjectQuestions.filter(q => q.status === 'correct').length;
    const wrong = subjectQuestions.filter(q => q.status === 'wrong').length;
    const unattempted = subjectQuestions.filter(q => q.status === 'unattempted').length;
    const bonus = subjectQuestions.filter(q => q.status === 'bonus').length;
    const score = (correct * subject.correctMarks) - (wrong * subject.negativeMarks) + (bonus * subject.correctMarks);

    return {
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
    };
  });

  const totalScore = sections.reduce((sum, s) => s.isQualifying ? sum : sum + s.score, 0);

  return {
    ...data,
    examConfig: config,
    maxScore: config.maxMarks,
    totalQuestions: fixedQuestions.length,
    correctCount: fixedQuestions.filter(q => q.status === 'correct').length,
    wrongCount: fixedQuestions.filter(q => q.status === 'wrong').length,
    unattemptedCount: fixedQuestions.filter(q => q.status === 'unattempted').length,
    bonusCount: fixedQuestions.filter(q => q.status === 'bonus').length,
    totalScore,
    sections,
    questions: fixedQuestions,
  };
}

type AppState = 'input' | 'loading' | 'results';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('input');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const analysisPromise = useRef<Promise<void> | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async (url: string, examType: ExamType, language: Language) => {
    console.log('Analyzing URL:', url, 'Exam:', examType, 'Language:', language);
    setIsLoading(true);
    setAppState('loading');

    // Start the API call
    analysisPromise.current = analyzeResponseSheet(url, examType, language).then(async response => {
      if (response.success && response.data) {
        // Fix CGL Mains: reassign questions to correct subjects by sequential order
        // and recalculate all sections/scores with correct local config
        const fixedData = fixCglMainsSubjectDistribution(response.data);

        // For non-CGL-Mains exams, still override with local config
        if (fixedData.examType !== 'SSC_CGL_MAINS') {
          const localConfig = EXAM_CONFIGS[examType];
          if (localConfig) {
            fixedData.examConfig = localConfig;
            fixedData.maxScore = localConfig.maxMarks;
            for (const section of fixedData.sections) {
              const localSubject = localConfig.subjects.find(s => s.part === section.part);
              if (localSubject) {
                section.isQualifying = localSubject.isQualifying;
              } else {
                section.isQualifying = false;
              }
            }
            fixedData.totalScore = fixedData.sections.reduce(
              (sum, s) => s.isQualifying ? sum : sum + s.score, 0
            );
          }
        }
        const hasMissingCandidateInfo =
          !fixedData.candidate.rollNumber ||
          !fixedData.candidate.name ||
          !fixedData.candidate.examLevel ||
          !fixedData.candidate.centreName ||
          !fixedData.candidate.testDate ||
          !fixedData.candidate.shift;
        if (hasMissingCandidateInfo) {
          const candidateFromHtml = await fetchCandidateInfoFromHtmlUrl(url);
          if (candidateFromHtml) {
            fixedData.candidate = {
              ...fixedData.candidate,
              rollNumber: fixedData.candidate.rollNumber || candidateFromHtml.rollNumber,
              name: fixedData.candidate.name || candidateFromHtml.name,
              examLevel: fixedData.candidate.examLevel || candidateFromHtml.examLevel,
              testDate: fixedData.candidate.testDate || candidateFromHtml.testDate,
              shift: fixedData.candidate.shift || candidateFromHtml.shift,
              centreName: fixedData.candidate.centreName || candidateFromHtml.centreName,
            };
          }
        }

        setAnalysisResult(fixedData);
      } else {
        toast({
          title: "Analysis Failed",
          description: response.error || "Failed to analyze the response sheet",
          variant: "destructive"
        });
        setAppState('input');
      }
      setIsLoading(false);
    }).catch(error => {
      console.error('Analysis error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      setAppState('input');
      setIsLoading(false);
    });
  };
  const handleLoadingComplete = () => {
    // Wait for analysis to complete if still running
    if (analysisPromise.current) {
      analysisPromise.current.then(() => {
        if (analysisResult) {
          setAppState('results');
        }
      });
    } else if (analysisResult) {
      setAppState('results');
    }
  };
  const handleBack = () => {
    setAppState('input');
  };
  if (appState === 'loading') {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }
  if (appState === 'results' && analysisResult) {
    return <ResultsDashboard result={analysisResult} onBack={handleBack} />;
  }
  return <div className="min-h-screen bg-background">
    {/* Hero Section */}
    <div className="relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

      <div className="relative container max-w-5xl mx-auto px-4 pt-16 pb-24">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <FileText className="h-4 w-4" />
            SSC Response Sheet Analyzer
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Analyze Your
            <span className="block bg-clip-text text-transparent" style={{
              backgroundImage: 'var(--gradient-hero)'
            }}>
              Response Sheet
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Get detailed score analysis, section-wise breakdown, and question-level insights
            from your SSC CGL response sheet in seconds.
          </p>
        </div>

        {/* URL Input Form */}
        <UrlInputForm onAnalyze={handleAnalyze} isLoading={isLoading} />

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center gap-6 mt-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-correct" />
            <span>Secure & Private</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4 text-right-answer" />
            <span>Instant Analysis</span>
          </div>
          {/* PDF Export indicator removed */}
        </div>
      </div>
    </div>

    {/* How It Works Section */}
    <div className="bg-muted/30 border-y border-border">

    </div>

    {/* Footer */}
    <footer className="border-t border-border bg-card">

    </footer>
  </div>;
};
export default Index;
