import { useState, useRef } from 'react';
import { UrlInputForm } from '@/components/UrlInputForm';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ResultsDashboard } from '@/components/ResultsDashboard';
import { analyzeResponseSheet } from '@/lib/api/analyzeSheet';
import type { AnalysisResult, QuestionData, SectionData } from '@/lib/mockData';
import { EXAM_CONFIGS, type ExamType, type Language } from '@/lib/examConfig';
import { FileText, Shield, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    analysisPromise.current = analyzeResponseSheet(url, examType, language).then(response => {
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
