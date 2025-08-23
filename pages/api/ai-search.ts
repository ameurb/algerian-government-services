import { NextApiRequest, NextApiResponse } from 'next';
import { aiSearchEngine } from '@/lib/ai-search-engine';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, limit = 8, stream = false } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Return regular JSON response
    const result = await aiSearchEngine.search(query, limit);
    
    return res.status(200).json({
      requestId: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      query,
      ...result
    });
  } catch (error) {
    console.error('AI Search API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}