import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CandidateInfoCard } from './CandidateInfoCard';
import { ScoreSummaryCard } from './ScoreSummaryCard';
import { SectionBreakdown } from './SectionBreakdown';
import { QuestionsTable } from './QuestionsTable';
import { Download, ArrowLeft, Printer, Loader2 } from 'lucide-react';
import type { AnalysisResult } from '@/lib/mockData';
import { generateAnalysisPDF } from '@/lib/pdfGenerator';
import { useToast } from '@/hooks/use-toast';

interface ResultsDashboardProps {
  result: AnalysisResult;
  onBack: () => void;
}

export const ResultsDashboard = ({ result, onBack }: ResultsDashboardProps) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { toast } = useToast();

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await generateAnalysisPDF(result);
      toast({
        title: "PDF Downloaded",
        description: "Your analysis report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "PDF Generation Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
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
                variant="outline" 
                size="sm" 
                onClick={() => window.print()}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Print</span>
              </Button>
              <Button 
                size="sm" 
                onClick={handleDownloadPdf}
                className="gap-2"
                disabled={isGeneratingPdf}
              >
                {isGeneratingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
                </span>
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
            />
          </div>

          {/* Section Breakdown */}
          <SectionBreakdown sections={result.sections} />

          {/* Questions Table */}
          <QuestionsTable questions={result.questions} />
        </div>
      </main>
    </div>
  );
};
