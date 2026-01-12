import { supabase } from '@/integrations/supabase/client';
import type { AnalysisResult } from '@/lib/mockData';

interface AnalyzeResponse {
  success: boolean;
  error?: string;
  data?: AnalysisResult;
}

export async function analyzeResponseSheet(url: string): Promise<AnalyzeResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-response-sheet', {
      body: { url },
    });

    if (error) {
      console.error('Edge function error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to analyze response sheet' 
      };
    }

    return data as AnalyzeResponse;
  } catch (err) {
    console.error('API error:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'An unexpected error occurred' 
    };
  }
}
