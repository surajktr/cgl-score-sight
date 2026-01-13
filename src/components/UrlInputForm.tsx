import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, FileText, BarChart3, Download, AlertCircle } from 'lucide-react';
interface UrlInputFormProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}
export const UrlInputForm = ({
  onAnalyze,
  isLoading
}: UrlInputFormProps) => {
  const [url, setUrl] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url.trim());
    }
  };
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
  return <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative mb-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste your SSC CGL response sheet URL here..." className="pl-12 h-14 text-base bg-card border-border/60 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" required />
          </div>
          <Button type="submit" disabled={isLoading || !url.trim()} size="lg" className="h-14 px-8 text-base font-semibold shadow-md hover:shadow-lg transition-all">
            {isLoading ? <>
                <span className="animate-pulse-subtle">Analyzing...</span>
              </> : 'Analyze'}
          </Button>
        </div>
      </form>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {features.map(feature => <div key={feature.title} className="stat-card flex items-start gap-3 hover:shadow-md transition-shadow">
            <div className="p-2 rounded-lg bg-primary/10">
              <feature.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          </div>)}
      </div>

      
    </div>;
};