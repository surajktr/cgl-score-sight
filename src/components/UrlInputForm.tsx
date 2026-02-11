import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, FileText, BarChart3, Download } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EXAM_CATEGORIES, getExamsByCategory, type ExamType, type ExamCategory, type Language } from '@/lib/examConfig';

interface UrlInputFormProps {
  onAnalyze: (url: string, examType: ExamType, language: Language) => void;
  isLoading: boolean;
}

export const UrlInputForm = ({
  onAnalyze,
  isLoading
}: UrlInputFormProps) => {
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<ExamCategory | ''>('');
  const [examType, setExamType] = useState<ExamType | ''>('');
  const [language, setLanguage] = useState<Language | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && examType && language) {
      onAnalyze(url.trim(), examType, language);
    }
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value as ExamCategory);
    setExamType(''); // Reset exam when category changes
  };

  const categoryExams = category ? getExamsByCategory(category) : [];
  const isFormValid = url.trim() && examType && language;

  const features = [{
    icon: FileText,
    title: 'Extract Data',
    description: 'Automatically extract all question and answer data from your response sheet'
  }, {
    icon: BarChart3,
    title: 'Detailed Analytics',
    description: 'Get section-wise breakdown with accuracy and attempt rate analysis'
  }, {
    icon: Download,
    title: 'Download PDF',
    description: 'Generate a comprehensive PDF report with all questions and answers'
  }];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        {/* Category & Exam Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="h-12 bg-card border-border/60">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {EXAM_CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <span className="flex items-center gap-2">
                    <span>{cat.emoji}</span>
                    <span className="truncate">{cat.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={examType} 
            onValueChange={(value) => setExamType(value as ExamType)}
            disabled={!category}
          >
            <SelectTrigger className="h-12 bg-card border-border/60">
              <SelectValue placeholder={category ? "Select Exam" : "Select category first"} />
            </SelectTrigger>
            <SelectContent>
              {categoryExams.map((exam) => (
                <SelectItem key={exam.id} value={exam.id}>
                  <span className="flex items-center gap-2">
                    <span>{exam.emoji}</span>
                    <span className="truncate">{exam.displayName}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Language Selection */}
        <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
          <SelectTrigger className="h-12 bg-card border-border/60">
            <SelectValue placeholder="Select Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hindi">
              <span className="flex items-center gap-2">
                <span>🇮🇳</span>
                <span>Hindi / हिंदी</span>
              </span>
            </SelectItem>
            <SelectItem value="english">
              <span className="flex items-center gap-2">
                <span>🇬🇧</span>
                <span>English</span>
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* URL Input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste your response sheet URL here..."
              className="pl-12 h-14 text-base bg-card border-border/60 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !isFormValid}
            size="lg"
            className="h-14 px-8 text-base font-semibold shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
          >
            {isLoading ? (
              <span className="animate-pulse-subtle">Analyzing...</span>
            ) : (
              'Analyze'
            )}
          </Button>
        </div>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="stat-card flex items-start gap-3 hover:shadow-md transition-shadow"
          >
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <feature.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
