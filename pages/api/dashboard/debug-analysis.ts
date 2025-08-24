import { NextApiRequest, NextApiResponse } from 'next';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const QueryAnalysisSchema = z.object({
  preferredLanguage: z.enum(['ar', 'en', 'fr']).describe('User\'s preferred language detected from their query'),
  intent: z.enum(['information', 'procedure', 'requirements', 'documents', 'location', 'timeline', 'cost', 'status', 'help']).describe('User\'s primary intent'),
  urgency: z.enum(['low', 'normal', 'high']).describe('Urgency level of the request'),
  serviceType: z.string().describe('Type of government service the user is asking about'),
  specificNeeds: z.array(z.string()).describe('Specific needs or questions the user has'),
  searchKeywords: z.array(z.string()).describe('Keywords to search in the database'),
  category: z.string().describe('Most likely service category'),
  responseFormat: z.enum(['detailed', 'summary', 'step_by_step', 'quick_answer']).describe('Best response format for this query')
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;
    const startTime = Date.now();

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Perform AI analysis
    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: QueryAnalysisSchema,
      prompt: `Analyze this user query about Algerian government services:

"${query}"

Determine:
1. The user's preferred language (Arabic, English, or French) based on the text
2. Their primary intent (what they want to achieve)
3. The urgency level of their request
4. The type of government service they need
5. Their specific needs and questions
6. Keywords to search for relevant services
7. The most likely service category
8. The best response format for their query

Consider Algerian administrative context and common citizen needs.`
    });

    const processingTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      analysis: result.object,
      metadata: {
        processingTime,
        model: 'gpt-4o-mini',
        tokensUsed: result.usage?.totalTokens || 0,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}