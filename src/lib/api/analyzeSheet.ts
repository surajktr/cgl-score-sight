import type { AnalysisResult } from '@/lib/mockData';
import { EXAM_CONFIGS, type ExamType, type Language } from '@/lib/examConfig';
import { analyzeResponseSheetLocal } from '@/lib/localParser';
import { supabase } from '@/integrations/supabase/client';

interface AnalyzeResponse {
  success: boolean;
  error?: string;
  message?: string;
  requiresClientFetch?: boolean;
  data?: AnalysisResult;
}

// Try fetching HTML using a CORS proxy (free tier)
async function fetchHtmlViaProxy(url: string): Promise<string | null> {
  const scheme = url.startsWith('https://') ? 'https://' : 'http://';
  // List of free CORS proxies to try
  const proxies = [
    `https://r.jina.ai/${scheme}${url.replace(/^https?:\/\//, '')}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://thingproxy.freeboard.io/fetch/${url}`,
  ];

  for (const proxyUrl of proxies) {
    try {
      console.log('Trying CORS proxy:', proxyUrl);
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
        },
      });

      if (response.ok) {
        const html = await response.text();
        // Verify we got actual HTML content
        if (html && html.includes('<') && html.length > 500) {
          console.log('CORS proxy fetch successful, length:', html.length);
          return html;
        }
      }
    } catch (err) {
      console.log('CORS proxy failed:', err);
    }
  }

  return null;
}

export async function analyzeResponseSheet(
  url: string,
  examType: ExamType,
  language: Language
): Promise<AnalyzeResponse> {
  try {
    // First, try calling the edge function without HTML (it will try server-side fetch)
    console.log('Attempting analysis via edge function...');
    const { data, error } = await supabase.functions.invoke('analyze-response-sheet', {
      body: { url, examType, language },
    });

    if (error) {
      console.error('Edge function error:', error);
      return {
        success: false,
        error: error.message || 'Failed to analyze response sheet'
      };
    }

    const response = data as AnalyzeResponse;

    // Check if server-side fetch was blocked
    if (response.requiresClientFetch) {
      console.log('Server-side fetch blocked, attempting client-side alternatives...');

      // Try CORS proxy
      const html = await fetchHtmlViaProxy(url);

      if (html) {
        // Use local parser directly to avoid sending large HTML back to server
        console.log('Got HTML via CORS proxy, analyzing locally...');
        const config = EXAM_CONFIGS[examType];
        if (!config) throw new Error('Invalid exam type');

        const result = analyzeResponseSheetLocal(html, url, config, language);
        return {
          success: true,
          data: result
        };
      }

      // If all client-side methods fail, return informative error
      return {
        success: false,
        error: 'The SSC server is blocking automated requests. This is a known limitation with digialm.com URLs. Please try:\n\n1. Open the response sheet URL in your browser\n2. Press Ctrl+A to select all, then Ctrl+C to copy\n3. Use the "Paste HTML" option (coming soon)\n\nAlternatively, try a different response sheet URL format.',
      };
    }

    return response;
  } catch (err) {
    console.error('API error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred'
    };
  }
}
