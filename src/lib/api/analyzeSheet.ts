import type { AnalysisResult } from '@/lib/mockData';
import type { ExamType, Language } from '@/lib/examConfig';
import { getMockData } from '@/lib/mockData';

interface AnalyzeResponse {
  success: boolean;
  error?: string;
  message?: string;
  data?: AnalysisResult;
}

export async function analyzeResponseSheet(
  url: string, 
  examType: ExamType, 
  language: Language
): Promise<AnalyzeResponse> {
  try {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return mock data based on exam type
    const mockData = getMockData(examType, language);
    
    return {
      success: true,
      data: mockData
    };
  } catch (err) {
    console.error('API error:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'An unexpected error occurred' 
    };
  }
}
