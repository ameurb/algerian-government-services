import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
import { NextApiResponseServerIo, handleChatMessage } from '@/lib/socket';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, sessionId, userId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ error: 'Message and sessionId are required' });
    }

    // Ensure Socket.IO is initialized (should be done by /api/socket)
    if (!res.socket.server.io) {
      console.warn('Socket.IO not initialized, initializing now...');
      const io = new ServerIO(res.socket.server, {
        path: '/api/socket',
        addTrailingSlash: false,
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        }
      });

      io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('join-session', (sessionId: string) => {
          socket.join(sessionId);
          console.log(`Socket ${socket.id} joined session ${sessionId}`);
        });

        socket.on('disconnect', () => {
          console.log('Client disconnected:', socket.id);
        });
      });

      res.socket.server.io = io;
    }

    const io = res.socket.server.io;

    // Emit "typing" indicator
    io.to(sessionId).emit('assistant-typing', { sessionId });

    // Process the message
    const result = await handleChatMessage(message, sessionId, userId);

    // Create response message
    const responseMessage = {
      id: uuidv4(),
      role: 'assistant' as const,
      content: result.response,
      timestamp: new Date(),
      sessionId,
      metadata: result.metadata,
    };

    // Emit the response to all clients in the session
    io.to(sessionId).emit('message', responseMessage);
    io.to(sessionId).emit('assistant-stopped-typing', { sessionId });

    res.status(200).json({ 
      success: true, 
      message: responseMessage 
    });

  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}