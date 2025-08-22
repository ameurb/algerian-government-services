import { NextApiRequest, NextApiResponse } from 'next';
import { handleMultiDocumentChat } from '@/lib/multi-document-handler';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, sessionId, userId } = req.body;

  if (!message || !sessionId) {
    return res.status(400).json({ error: 'Message and sessionId are required' });
  }

  // Set up Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control, Content-Type',
  });

  try {
    // Send typing start event
    res.write(`data: ${JSON.stringify({
      type: 'typing_start',
      sessionId,
      timestamp: new Date().toISOString()
    })}\n\n`);

    // Stage 1: Database Search
    res.write(`data: ${JSON.stringify({
      type: 'processing_stage',
      stage: 'searching',
      message: 'جاري البحث في قاعدة البيانات...',
      emoji: '🔍',
      progress: 25,
      sessionId
    })}\n\n`);

    // Show progress stages immediately with shorter delays
    setTimeout(() => {
      res.write(`data: ${JSON.stringify({
        type: 'processing_stage',
        stage: 'ai_processing', 
        message: 'استشارة الذكاء الاصطناعي...',
        emoji: '🧠',
        progress: 50,
        sessionId
      })}\n\n`);
    }, 500);

    setTimeout(() => {
      res.write(`data: ${JSON.stringify({
        type: 'processing_stage',
        stage: 'preparing',
        message: 'إعداد الإجابة...',
        emoji: '✍️', 
        progress: 75,
        sessionId
      })}\n\n`);
    }, 1000);

    setTimeout(() => {
      res.write(`data: ${JSON.stringify({
        type: 'processing_stage',
        stage: 'writing',
        message: 'بدء الكتابة...',
        emoji: '💭',
        progress: 90,
        sessionId
      })}\n\n`);
    }, 1500);

    // Get response from multi-document analysis and summary
    const chatResult = await handleMultiDocumentChat(message, sessionId, userId);
    const responseText = chatResult.response;

    // Send writing start
    res.write(`data: ${JSON.stringify({
      type: 'writing_start',
      sessionId,
      totalLength: responseText.length
    })}\n\n`);

    // Stream the response word by word
    const words = responseText.split(' ');
    let currentText = '';

    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? ' ' : '') + words[i];
      
      res.write(`data: ${JSON.stringify({
        type: 'text_chunk',
        text: currentText,
        isComplete: i === words.length - 1,
        progress: (i + 1) / words.length * 100,
        sessionId
      })}\n\n`);

      // Faster typing speed for better UX
      const delay = Math.random() * 80 + 40; // 40-120ms per word
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Send completion
    res.write(`data: ${JSON.stringify({
      type: 'response_complete',
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      role: 'assistant',
      content: responseText,
      timestamp: new Date().toISOString(),
      sessionId,
      metadata: chatResult.metadata
    })}\n\n`);

    res.end();

  } catch (error) {
    console.error('Streaming chat error:', error);
    
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: 'Failed to process message',
      message: error instanceof Error ? error.message : 'Unknown error',
      sessionId
    })}\n\n`);
    
    res.end();
  }
}