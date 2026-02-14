import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CandidateInfoCard } from './CandidateInfoCard';
import { ScoreSummaryCard } from './ScoreSummaryCard';
import { SectionBreakdown } from './SectionBreakdown';
import { QuestionsTable, type DisplayLanguage } from './QuestionsTable';
import { Download, ArrowLeft, Loader2 } from 'lucide-react';
import type { AnalysisResult } from '@/lib/mockData';
import { useHtmlGenerator } from '@/hooks/useHtmlGenerator';
import { useToast } from '@/hooks/use-toast';

interface ResultsDashboardProps {
  result: AnalysisResult;
  onBack: () => void;
}

export const ResultsDashboard = ({ result, onBack }: ResultsDashboardProps) => {
  const { generateHtml, isGenerating } = useHtmlGenerator();
  const { toast } = useToast();
  const [displayLanguage, setDisplayLanguage] = useState<DisplayLanguage>('english');

  const handleDownloadHtml = async () => {
    try {
      await generateHtml(result, 'response-sheet', displayLanguage);
      toast({
        title: 'Response Sheet Downloaded',
        description: 'Your HTML response sheet has been downloaded successfully.',
      });
    } catch (error) {
      console.error('HTML generation failed:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to generate HTML response sheet. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">New Analysis</span>
              </Button>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-foreground">Analysis Results</h1>
                <p className="text-xs text-muted-foreground">{result.candidate.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleDownloadHtml}
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Download Response Sheet</span>
                <span className="sm:hidden">Download</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Top Row - Candidate Info & Score Summary */}
          <div className="grid lg:grid-cols-2 gap-6">
            <CandidateInfoCard candidate={result.candidate} />
            <ScoreSummaryCard 
              totalScore={result.totalScore}
              maxScore={result.maxScore}
              correctCount={result.correctCount}
              wrongCount={result.wrongCount}
              unattemptedCount={result.unattemptedCount}
              bonusCount={result.bonusCount || 0}
              examConfig={result.examConfig}
            />
          </div>

          {/* Section Breakdown */}
          <SectionBreakdown sections={result.sections} maxScore={result.maxScore} />

          {/* Questions Table */}
          <QuestionsTable 
            questions={result.questions} 
            result={result} 
            displayLanguage={displayLanguage}
            onLanguageChange={setDisplayLanguage}
          />
        </div>
      </main>
    </div>
  );
};
