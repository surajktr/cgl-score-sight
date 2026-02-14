import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { parseSSCHtml } from '@/lib/parseSSCHtml';
import type { ScorecardData } from '@/lib/parseSSCHtml';
import QuestionDetail from '@/components/QuestionDetail';
import Scorecard from '@/components/Scorecard';
import { Loader2, FileText, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [url, setUrl] = useState('');
  const [htmlInput, setHtmlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const { toast } = useToast();

  const handleFetchUrl = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-ssc-html', {
        body: { url: url.trim() },
      });

      if (error || !data?.success) {
        toast({ title: 'Error', description: data?.error || error?.message || 'Failed to fetch', variant: 'destructive' });
        return;
      }

      const result = parseSSCHtml(data.html);
      setScorecard(result);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleParseHtml = () => {
    if (!htmlInput.trim()) return;
    try {
      const result = parseSSCHtml(htmlInput);
      setScorecard(result);
    } catch (err: any) {
      toast({ title: 'Parse Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-primary text-primary-foreground py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-2">SSC CGL Mains Scorecard</h1>
          <p className="text-primary-foreground/70 text-lg">
            Paste your answer key URL or HTML to get instant section-wise analysis
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <div className="bg-card rounded-xl border border-border shadow-lg p-6">
          <Tabs defaultValue="url" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="url" className="gap-2">
                <Link className="w-4 h-4" /> Paste URL
              </TabsTrigger>
              <TabsTrigger value="html" className="gap-2">
                <FileText className="w-4 h-4" /> Paste HTML
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url">
              <div className="flex gap-3">
                <Input
                  placeholder="https://ssc.digialm.com/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleFetchUrl} disabled={loading || !url.trim()}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Analyze
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="html">
              <Textarea
                placeholder="Paste the full HTML source of your SSC answer key page..."
                value={htmlInput}
                onChange={(e) => setHtmlInput(e.target.value)}
                rows={6}
                className="mb-3"
              />
              <Button onClick={handleParseHtml} disabled={!htmlInput.trim()}>
                Analyze HTML
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Scorecard */}
      {scorecard && (
        <div className="max-w-4xl mx-auto px-4 py-10">
          <Scorecard data={scorecard} />
          <QuestionDetail data={scorecard} />
        </div>
      )}
    </div>
  );
};

export default Index;
