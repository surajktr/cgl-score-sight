import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, FileText, BarChart3, Download, Code, Link } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EXAM_LIST, type ExamType, type Language } from '@/lib/examConfig';

interface UrlInputFormProps {
  onAnalyze: (url: string, examType: ExamType, language: Language) => void;
  onAnalyzeHtml?: (html: string, examType: ExamType, language: Language) => void;
  isLoading: boolean;
}

export const UrlInputForm = ({
  onAnalyze,
  onAnalyzeHtml,
  isLoading
}: UrlInputFormProps) => {
  const [url, setUrl] = useState('');
  const [html, setHtml] = useState('');
  const [examType, setExamType] = useState<ExamType | ''>('');
  const [language, setLanguage] = useState<Language | ''>('');
  const [inputMode, setInputMode] = useState<'url' | 'html'>('url');

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && examType && language) {
      onAnalyze(url.trim(), examType, language);
    }
  };

  const handleHtmlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (html.trim() && examType && language && onAnalyzeHtml) {
      onAnalyzeHtml(html.trim(), examType, language);
    }
  };

  const isUrlFormValid = url.trim() && examType && language;
  const isHtmlFormValid = html.trim().length > 500 && examType && language && onAnalyzeHtml;

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
      {/* Exam Type & Language Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <Select value={examType} onValueChange={(value) => setExamType(value as ExamType)}>
          <SelectTrigger className="h-12 bg-card border-border/60">
            <SelectValue placeholder="Select Exam Type" />
          </SelectTrigger>
          <SelectContent>
            {EXAM_LIST.map((exam) => (
              <SelectItem key={exam.id} value={exam.id}>
                <span className="flex items-center gap-2">
                  <span>{exam.emoji}</span>
                  <span className="truncate">{exam.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
      </div>

      {/* Input Mode Tabs */}
      <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'url' | 'html')} className="mb-8">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            URL Mode
          </TabsTrigger>
          <TabsTrigger value="html" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Paste HTML
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url">
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste your response sheet URL here..."
                  className="pl-12 h-14 text-base bg-card border-border/60 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || !isUrlFormValid}
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
        </TabsContent>

        <TabsContent value="html">
          <form onSubmit={handleHtmlSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Code className="h-4 w-4" />
                <span>Open the response sheet in your browser, right-click → "View Page Source", copy all and paste here</span>
              </div>
              <Textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                placeholder="<!DOCTYPE html>&#10;<html>&#10;  Paste the full HTML source code of your response sheet here...&#10;</html>"
                className="min-h-[200px] text-sm font-mono bg-card border-border/60 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {html.length > 0 && html.length < 500 && (
                <p className="text-sm text-destructive">
                  HTML content seems too short. Please paste the full page source (Ctrl+A to select all).
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={isLoading || !isHtmlFormValid}
              size="lg"
              className="h-14 px-8 text-base font-semibold shadow-md hover:shadow-lg transition-all w-full"
            >
              {isLoading ? (
                <span className="animate-pulse-subtle">Analyzing...</span>
              ) : (
                'Analyze HTML'
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

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
