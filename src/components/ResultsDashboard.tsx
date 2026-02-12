import { useState } from 'react';
import { CandidateInfoCard } from './CandidateInfoCard';
import { ScoreSummaryCard } from './ScoreSummaryCard';
import { SectionBreakdown } from './SectionBreakdown';
import { QuestionsTable, type DisplayLanguage } from './QuestionsTable';
import type { AnalysisResult } from '@/lib/mockData';

interface ResultsDashboardProps {
  result: AnalysisResult;
  onBack: () => void;
}

export const ResultsDashboard = ({ result, onBack }: ResultsDashboardProps) => {
  const [displayLanguage, setDisplayLanguage] = useState<DisplayLanguage>('hindi');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-lg font-bold text-foreground">Analysis Results</h1>
                <p className="text-xs text-muted-foreground">{result.candidate.name}</p>
              </div>
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
