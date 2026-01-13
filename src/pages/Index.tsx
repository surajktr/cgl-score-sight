import { useState, useRef } from 'react';
import { UrlInputForm } from '@/components/UrlInputForm';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ResultsDashboard } from '@/components/ResultsDashboard';
import { analyzeResponseSheet } from '@/lib/api/analyzeSheet';
import type { AnalysisResult } from '@/lib/mockData';
import { FileText, Shield, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
type AppState = 'input' | 'loading' | 'results';
const Index = () => {
  const [appState, setAppState] = useState<AppState>('input');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const analysisPromise = useRef<Promise<void> | null>(null);
  const {
    toast
  } = useToast();
  const handleAnalyze = async (url: string) => {
    console.log('Analyzing URL:', url);
    setIsLoading(true);
    setAppState('loading');

    // Start the API call
    analysisPromise.current = analyzeResponseSheet(url).then(response => {
      if (response.success && response.data) {
        setAnalysisResult(response.data);
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
              SSC CGL Tier-I Analysis Tool
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4 text-primary" />
              <span>PDF Export</span>
            </div>
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