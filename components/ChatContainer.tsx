'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import SampleQuestions from './SampleQuestions';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sessionId: string;
  metadata?: any;
}

export default function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize socket connection to the correct port
    const socketInstance = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3002', {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      forceNew: true,
    });

    socketInstance.on('connect', () => {
      console.log('Connected to socket');
      socketInstance.emit('join-session', sessionId);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socketInstance.on('message', (message: Message) => {
      console.log('Received message:', message);
      setMessages(prev => [...prev, message]);
    });

    socketInstance.on('assistant-typing', () => {
      console.log('Assistant is typing...');
      setIsTyping(true);
    });

    socketInstance.on('assistant-stopped-typing', () => {
      console.log('Assistant stopped typing');
      setIsTyping(false);
    });

    setSocket(socketInstance);

    // Add welcome message
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'مرحباً! 👋 أنا مساعدك الذكي للخدمات الحكومية الجزائرية! 🇩🇿\n\nيمكنك سؤالي بالعربية أو الإنجليزية عن أي خدمة حكومية. جرب النقر على أحد الأسئلة أدناه! 😊',
      timestamp: new Date(),
      sessionId,
      metadata: { showSampleQuestions: true }
    }]);

    return () => {
      socketInstance.close();
    };
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
      sessionId,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true); // Show typing indicator

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          sessionId,
          userId: null, // Can be added when user authentication is implemented
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Always add the response message directly (fallback approach)
      const responseData = await response.json();
      if (responseData.success && responseData.message) {
        console.log('Adding response message directly');
        setMessages(prev => [...prev, {
          ...responseData.message,
          timestamp: new Date(responseData.message.timestamp)
        }]);
        setIsTyping(false); // Stop typing indicator
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false); // Stop typing indicator on error
      
      // Add error message
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: 'عذراً، حدث خطأ في إرسال رسالتك. يرجى المحاولة مرة أخرى.',
        timestamp: new Date(),
        sessionId,
      }]);
    }
  };

  return (
    <div className="flex flex-col h-svh bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 p-3 sm:p-4 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 max-w-4xl mx-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg sm:text-xl">🇩🇿</span>
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900 text-lg sm:text-xl">مساعد الخدمات الحكومية</h1>
            <p className="text-xs sm:text-sm text-gray-600">AI Assistant for Algerian Government Services</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <div className="max-w-4xl mx-auto space-y-1">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
              onQuestionClick={handleSendMessage}
              metadata={message.metadata}
            />
          ))}
          
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white/90 backdrop-blur-sm p-3 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            disabled={isTyping}
            placeholder="اسأل بالعربية أو الإنجليزية: مثل 'بطاقة الهوية' أو 'National ID'..."
          />
        </div>
      </div>
    </div>
  );
}