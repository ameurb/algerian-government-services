'use client';

import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import SampleQuestions from './SampleQuestions';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sessionId: string;
  metadata?: any;
  isStreaming?: boolean;
}

interface ProcessingStage {
  stage: string;
  message: string;
  emoji: string;
  progress: number;
}

export default function StreamingChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string>('');
  const [processingStage, setProcessingStage] = useState<ProcessingStage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add welcome message
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'مرحباً! 👋 أنا مساعدك الذكي للخدمات الحكومية الجزائرية! 🇩🇿\n\nيمكنك سؤالي بالعربية أو الإنجليزية عن أي خدمة حكومية. جرب النقر على أحد الأسئلة أدناه! 😊',
      timestamp: new Date(),
      sessionId,
      metadata: { showSampleQuestions: true }
    }]);
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamingMessage, processingStage]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
      sessionId,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    setCurrentStreamingMessage('');
    setProcessingStage(null);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          sessionId,
          userId: null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start streaming');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'typing_start':
                  console.log('🔄 Typing started');
                  break;
                  
                case 'processing_stage':
                  setProcessingStage({
                    stage: data.stage,
                    message: data.message,
                    emoji: data.emoji,
                    progress: data.progress
                  });
                  break;
                  
                case 'writing_start':
                  setProcessingStage(null);
                  setCurrentStreamingMessage('');
                  break;
                  
                case 'text_chunk':
                  setCurrentStreamingMessage(data.text);
                  break;
                  
                case 'response_complete':
                  setIsProcessing(false);
                  setProcessingStage(null);
                  setCurrentStreamingMessage('');
                  
                  // Add final message
                  setMessages(prev => [...prev, {
                    id: data.messageId,
                    role: 'assistant',
                    content: data.content,
                    timestamp: new Date(data.timestamp),
                    sessionId: data.sessionId,
                    metadata: data.metadata
                  }]);
                  break;
                  
                case 'error':
                  setIsProcessing(false);
                  setProcessingStage(null);
                  setCurrentStreamingMessage('');
                  
                  setMessages(prev => [...prev, {
                    id: uuidv4(),
                    role: 'assistant',
                    content: 'عذراً، حدث خطأ في معالجة رسالتك. يرجى المحاولة مرة أخرى.',
                    timestamp: new Date(),
                    sessionId,
                  }]);
                  break;
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', line);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      setIsProcessing(false);
      setProcessingStage(null);
      
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
        timestamp: new Date(),
        sessionId,
      }]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 p-3 sm:p-4 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 max-w-4xl mx-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg sm:text-xl">🇩🇿</span>
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900 text-lg sm:text-xl">مساعد الخدمات الحكومية</h1>
            <p className="text-xs sm:text-sm text-gray-600">AI Assistant - Streaming Mode</p>
          </div>
          <div className="text-xs text-green-600 font-medium">
            🌊 Streaming Enabled
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
          
          {/* Enhanced Processing Stage Indicator */}
          {(processingStage || isProcessing) && (
            <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full flex items-center justify-center animate-pulse shadow-lg">
                  <span className="text-lg">{processingStage?.emoji || '🤖'}</span>
                </div>
              </div>
              <div className="flex-1 max-w-[85%] sm:max-w-[75%] lg:max-w-[70%]">
                <div className="bg-white border border-gray-200 text-gray-900 rounded-2xl px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-700 font-medium">
                      {processingStage?.message || 'جاري المعالجة...'}
                    </span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                  
                  {processingStage && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>المرحلة: {processingStage.stage}</span>
                        <span>{Math.round(processingStage.progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${processingStage.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Streaming Text Display */}
          {currentStreamingMessage && (
            <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-lg">✍️</span>
                </div>
              </div>
              <div className="flex-1 max-w-[85%] sm:max-w-[75%] lg:max-w-[70%]">
                <div className="bg-white border border-gray-200 text-gray-900 rounded-2xl px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base shadow-sm">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap leading-relaxed text-gray-800" dir="auto">
                        {currentStreamingMessage}
                        <span className="inline-block w-0.5 h-5 bg-blue-500 ml-1 animate-pulse"></span>
                      </p>
                    </div>
                    <div className="text-xs text-green-600 font-medium animate-pulse">
                      يكتب...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white/90 backdrop-blur-sm p-3 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            disabled={isProcessing}
            placeholder="اسأل بالعربية أو الإنجليزية: مثل 'بطاقة الهوية' أو 'National ID'..."
          />
        </div>
      </div>
    </div>
  );
}