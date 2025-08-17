import { NextApiRequest, NextApiResponse } from 'next';
import { SessionManager } from '@/lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, limit } = req.query;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Session ID required' });
    }

    // Verify session exists and is active
    const session = await SessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    const limitNum = limit ? parseInt(limit as string, 10) : 50;
    const messages = await SessionManager.getChatHistory(sessionId, limitNum);

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
}