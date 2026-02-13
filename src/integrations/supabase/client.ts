// Mock Supabase client for development
// This allows the app to work without Supabase configuration

export const supabase = {
  functions: {
    invoke: async (functionName: string, options: any) => {
      // Return mock error that can be handled by the analyzeSheet logic
      return {
        data: {
          success: false,
          error: 'Local mode - please use mock data functionality',
          requiresClientFetch: true
        },
        error: null
      };
    }
  }
};
