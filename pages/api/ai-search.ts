import { NextApiRequest, NextApiResponse } from 'next';
import { aiSearchEngine } from '@/lib/ai-search-engine';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔍 AI Search API called:', {
    method: req.method,
    hasBody: !!req.body,
    timestamp: new Date().toISOString()
  });

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, limit = 8, stream = false } = req.body;
    
    console.log('📝 Request details:', {
      query: query || 'NO QUERY PROVIDED',
      limit,
      stream,
      queryLength: query?.length,
      queryType: typeof query
    });

    if (!query) {
      console.log('❌ No query provided in request body');
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log('🚀 Starting AI search for:', query.substring(0, 50) + '...');
    
    // Check environment variables
    console.log('🔧 Environment check:', {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasDatabase: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV
    });

    // Return regular JSON response
    const result = await aiSearchEngine.search(query, limit);
    
    console.log('✅ AI Search completed successfully:', {
      servicesFound: result.services?.length || 0,
      analysisIntent: result.analysis?.intent,
      analysisCategory: result.analysis?.category,
      hasRecommendations: !!result.recommendations
    });
    
    return res.status(200).json({
      requestId: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      query,
      ...result
    });
  } catch (error) {
    console.error('❌ AI Search API error - Full details:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type',
      timestamp: new Date().toISOString()
    });
    
    // Log specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        console.error('🔑 API Key issue detected:', error.message);
      } else if (error.message.includes('database') || error.message.includes('prisma')) {
        console.error('🗄️ Database issue detected:', error.message);
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        console.error('🌐 Network issue detected:', error.message);
      }
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}