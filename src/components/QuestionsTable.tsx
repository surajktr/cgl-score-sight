import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuestionCard } from './QuestionCard';
import type { QuestionData } from '@/lib/mockData';
import { FileText, Filter } from 'lucide-react';

interface QuestionsTableProps {
  questions: QuestionData[];
}

type FilterType = 'all' | 'A' | 'B' | 'C' | 'D';
type StatusFilter = 'all' | 'correct' | 'wrong' | 'unattempted';

const partLabels: Record<string, string> = {
  all: 'All Questions',
  A: 'Part A - Reasoning',
  B: 'Part B - GK',
  C: 'Part C - Maths',
  D: 'Part D - English',
};

export const QuestionsTable = ({ questions }: QuestionsTableProps) => {
  const [partFilter, setPartFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredQuestions = questions.filter((q) => {
    const partMatch = partFilter === 'all' || q.part === partFilter;
    const statusMatch = statusFilter === 'all' || q.status === statusFilter;
    return partMatch && statusMatch;
  });

  const getStatusCount = (status: StatusFilter, part?: FilterType) => {
    return questions.filter((q) => {
      const partMatch = !part || part === 'all' || q.part === part;
      const statusMatch = status === 'all' || q.status === status;
      return partMatch && statusMatch;
    }).length;
  };

  return (
    <div className="card-elevated p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Question Analysis
        </h2>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All Status ({getStatusCount('all', partFilter)})</option>
            <option value="correct">Correct ({getStatusCount('correct', partFilter)})</option>
            <option value="wrong">Wrong ({getStatusCount('wrong', partFilter)})</option>
            <option value="unattempted">Skipped ({getStatusCount('unattempted', partFilter)})</option>
          </select>
        </div>
      </div>

      <Tabs value={partFilter} onValueChange={(v) => setPartFilter(v as FilterType)}>
        <TabsList className="w-full justify-start mb-6 bg-muted/50 p-1 h-auto flex-wrap">
          {(['all', 'A', 'B', 'C', 'D'] as FilterType[]).map((part) => (
            <TabsTrigger 
              key={part} 
              value={part}
              className="flex-1 sm:flex-none px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {part === 'all' ? 'All' : `Part ${part}`}
              <span className="ml-2 text-xs opacity-70">
                ({questions.filter(q => part === 'all' || q.part === part).length})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={partFilter} className="mt-0">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No questions match the selected filters</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredQuestions.map((question) => (
                <QuestionCard key={question.questionNumber} question={question} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
