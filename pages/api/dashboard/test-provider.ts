import { NextApiRequest, NextApiResponse } from 'next';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { mistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { providerId, modelId, testQuery } = req.body;

    if (!providerId || !modelId) {
      return res.status(400).json({ error: 'Provider ID and model ID are required' });
    }

    const startTime = Date.now();

    // Get the appropriate model
    let model;
    switch (providerId) {
      case 'openai':
        model = openai(modelId);
        break;
      case 'anthropic':
        model = anthropic(modelId);
        break;
      case 'google':
        model = google(modelId);
        break;
      case 'mistral':
        model = mistral(modelId);
        break;
      default:
        return res.status(400).json({ error: 'Invalid provider ID' });
    }

    // Test the model with a simple query
    const result = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant for Algerian government services. Respond briefly to test connectivity.'
        },
        {
          role: 'user',
          content: testQuery || 'How can I help with government services?'
        }
      ],
    });

    const responseTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      providerId,
      modelId,
      response: result.text,
      responseTime,
      tokensUsed: result.usage?.totalTokens || 0,
      testQuery: testQuery || 'Default test query',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Provider test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      providerId: req.body.providerId,
      modelId: req.body.modelId
    });
  }
}