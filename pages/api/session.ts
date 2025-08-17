import { NextApiRequest, NextApiResponse } from 'next';
import { SessionManager } from '@/lib/session';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Create new session
    try {
      const { deviceId, userAgent } = req.body;
      const ipAddress = req.headers['x-forwarded-for'] as string || 
                       req.headers['x-real-ip'] as string || 
                       req.connection.remoteAddress;

      const session = await SessionManager.createSession(
        deviceId || uuidv4(),
        userAgent,
        ipAddress
      );

      res.status(200).json({ sessionId: session.sessionId });
    } catch (error) {
      console.error('Session creation error:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  } else if (req.method === 'GET') {
    // Get session info
    try {
      const { sessionId } = req.query;
      
      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ error: 'Session ID required' });
      }

      const session = await SessionManager.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found or expired' });
      }

      // Update last active
      await SessionManager.updateLastActive(sessionId);

      res.status(200).json({ 
        sessionId: session.sessionId,
        isActive: session.isActive,
        createdAt: session.createdAt,
        lastActive: session.lastActive,
      });
    } catch (error) {
      console.error('Session get error:', error);
      res.status(500).json({ error: 'Failed to get session' });
    }
  } else if (req.method === 'DELETE') {
    // Deactivate session
    try {
      const { sessionId } = req.query;
      
      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ error: 'Session ID required' });
      }

      await SessionManager.deactivateSession(sessionId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Session delete error:', error);
      res.status(500).json({ error: 'Failed to delete session' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}