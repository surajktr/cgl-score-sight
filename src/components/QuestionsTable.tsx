import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { QuestionCard } from './QuestionCard';
import type { AnalysisResult, QuestionData } from '@/lib/mockData';
import { FileText, Filter, Download, Loader2, BookOpen, Gamepad2, Languages } from 'lucide-react';
import { useHtmlGenerator, type HtmlMode } from '@/hooks/useHtmlGenerator';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DownloadLanguageDialog, type DownloadLanguage } from './DownloadLanguageDialog';

export type DisplayLanguage = 'english' | 'hindi';

interface QuestionsTableProps {
  questions: QuestionData[];
  result?: AnalysisResult;
  displayLanguage?: DisplayLanguage;
  onLanguageChange?: (lang: DisplayLanguage) => void;
}

type StatusFilter = 'all' | 'correct' | 'wrong' | 'unattempted' | 'bonus';
type DownloadType = 'html-normal' | 'html-quiz';

export const QuestionsTable = ({ questions, result, displayLanguage = 'hindi', onLanguageChange }: QuestionsTableProps) => {
  const [partFilter, setPartFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const { generateHtml, isGenerating: isGeneratingHtml } = useHtmlGenerator();
  const { toast } = useToast();
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
  const [pendingDownloadType, setPendingDownloadType] = useState<DownloadType>('html-normal');
  // Get unique parts from questions
  const availableParts = [...new Set(questions.map(q => q.part))].sort();

  const filteredQuestions = questions.filter((q) => {
    const partMatch = partFilter === 'all' || q.part === partFilter;
    const statusMatch = statusFilter === 'all' || q.status === statusFilter ||
      (statusFilter === 'bonus' && q.isBonus);
    return partMatch && statusMatch;
  });

  const getStatusCount = (status: StatusFilter, part?: string) => {
    return questions.filter((q) => {
      const partMatch = !part || part === 'all' || q.part === part;
      const statusMatch = status === 'all' || q.status === status ||
        (status === 'bonus' && q.isBonus);
      return partMatch && statusMatch;
    }).length;
  };

  const hasBonusQuestions = questions.some(q => q.status === 'bonus' || q.isBonus); const handleDownloadClick = (type: DownloadType) => {
    if (!result) return;
    setPendingDownloadType(type);
    setLanguageDialogOpen(true);
  };

  const handleDownloadConfirm = async (downloadLanguage: DownloadLanguage) => {
    if (!result) return;

    try {
      const mode: HtmlMode = pendingDownloadType === 'html-quiz' ? 'quiz' : 'normal';
      await generateHtml(result, mode, downloadLanguage);
      toast({
        title: mode === 'quiz' ? "Quiz Downloaded" : "Answer Key Downloaded",
        description: mode === 'quiz'
          ? "Interactive quiz file has been downloaded."
          : "Complete answer key has been downloaded.",
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate file. Please try again.",
        variant: "destructive",
      });
    }
  };
  // Get subject name for a part
  const getPartLabel = (part: string) => {
    if (result?.examConfig?.subjects) {
      const subject = result.examConfig.subjects.find(s => s.part === part);
      if (subject) {
        const shortName = subject.name.length > 15
          ? subject.name.substring(0, 15) + '...'
          : subject.name;
        return `${part}: ${shortName}`;
      }
    }
    return `Part ${part}`;
  };

  const toggleDisplayLanguage = () => {
    const newLang = displayLanguage === 'english' ? 'hindi' : 'english';
    onLanguageChange?.(newLang);
  };

  return (
    <div className="card-elevated p-4 sm:p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Question Analysis
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDisplayLanguage}
            className="gap-1.5 text-xs h-7"
          >
            <Languages className="h-3.5 w-3.5" />
            {displayLanguage === 'english' ? 'EN' : 'हिं'}
          </Button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="text-sm border border-border rounded-lg px-2 sm:px-3 py-1.5 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All ({getStatusCount('all', partFilter)})</option>
              <option value="correct">Correct ({getStatusCount('correct', partFilter)})</option>
              <option value="wrong">Wrong ({getStatusCount('wrong', partFilter)})</option>
              <option value="unattempted">Skipped ({getStatusCount('unattempted', partFilter)})</option>
              {hasBonusQuestions && (
                <option value="bonus">Bonus ({getStatusCount('bonus', partFilter)})</option>
              )}
            </select>
          </div>

          {result && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isGeneratingHtml}
                  className="gap-2"
                >
                  {isGeneratingHtml ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => handleDownloadClick('html-normal')} className="gap-2 cursor-pointer">
                  <BookOpen className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Normal Mode</div>
                    <div className="text-xs text-muted-foreground">With answers visible</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadClick('html-quiz')} className="gap-2 cursor-pointer">
                  <Gamepad2 className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Quiz Mode</div>
                    <div className="text-xs text-muted-foreground">Interactive practice</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <DownloadLanguageDialog
        open={languageDialogOpen}
        onOpenChange={setLanguageDialogOpen}
        onConfirm={handleDownloadConfirm}
        mode={pendingDownloadType === 'html-quiz' ? 'quiz' : 'normal'}
      />
      <Tabs value={partFilter} onValueChange={setPartFilter}>
        <TabsList className="w-full justify-start mb-6 bg-muted/50 p-1 h-auto flex-wrap gap-1">
          <TabsTrigger
            value="all"
            className="px-3 py-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            All
            <span className="ml-1 text-xs opacity-70">({questions.length})</span>
          </TabsTrigger>
          {availableParts.map((part) => (
            <TabsTrigger
              key={part}
              value={part}
              className="px-3 py-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <span className="sm:hidden">{part}</span>
              <span className="hidden sm:inline">{getPartLabel(part)}</span>
              <span className="ml-1 text-xs opacity-70">
                ({questions.filter(q => q.part === part).length})
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
            <div className="divide-y divide-border">
              {filteredQuestions.map((question) => (
                <QuestionCard
                  key={question.questionNumber}
                  question={question}
                  displayLanguage={displayLanguage}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
