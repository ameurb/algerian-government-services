'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Loader2, Search, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface ServiceResult {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  category: string;
  fee?: string;
  duration?: string;
  isOnline: boolean;
  requirements?: string[];
  bawabticUrl?: string;
}

interface AISearchResult {
  analysis: {
    intent: string;
    serviceType: string;
    keywords: string[];
    language: 'ar' | 'en' | 'both';
    category?: string;
  };
  services: ServiceResult[];
  recommendations: {
    summary: string;
    recommendations: string[];
    nextSteps: string[];
    warnings?: string[];
  };
  metadata: {
    queryTime: number;
    servicesFound: number;
    model: string;
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  searchResult?: AISearchResult;
}

const SampleQuestions = ({ onQuestionClick }: { onQuestionClick: (question: string) => void }) => {
  const questions = [
    { ar: 'كيف يمكنني الحصول على جواز السفر؟', en: 'How to get a passport?' },
    { ar: 'ما هي متطلبات بطاقة التعريف الوطنية؟', en: 'National ID requirements?' },
    { ar: 'كيف أسجل شركة جديدة؟', en: 'How to register a company?' },
    { ar: 'طلب منحة التعليم العالي', en: 'Higher education grants' },
    { ar: 'خدمات الحالة المدنية', en: 'Civil status services' },
    { ar: 'إجراءات رخصة السياقة', en: 'Driving license procedures' }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mt-4">
      {questions.map((q, index) => (
        <button
          key={index}
          onClick={() => onQuestionClick(q.ar)}
          className="text-left p-3 bg-white/80 hover:bg-white border border-gray-200 rounded-lg text-sm transition-all hover:shadow-md hover:scale-105"
        >
          <div className="font-medium text-gray-800 mb-1">{q.ar}</div>
          <div className="text-xs text-gray-500">{q.en}</div>
        </button>
      ))}
    </div>
  );
};

const ServiceCard = ({ service }: { service: ServiceResult }) => {
  return (
    <div className="bg-white/90 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1" dir="auto">{service.name}</h3>
          {service.nameEn && (
            <p className="text-sm text-gray-600">{service.nameEn}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {service.isOnline && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              متاح أونلاين
            </span>
          )}
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            service.category === 'CIVIL_STATUS' ? 'bg-blue-100 text-blue-800' :
            service.category === 'ADMINISTRATION' ? 'bg-purple-100 text-purple-800' :
            service.category === 'BUSINESS' ? 'bg-orange-100 text-orange-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {service.category}
          </span>
        </div>
      </div>
      
      <p className="text-sm text-gray-700 mb-3 line-clamp-2" dir="auto">
        {service.description}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          {service.fee && (
            <span className="flex items-center gap-1">
              💰 {service.fee}
            </span>
          )}
          {service.duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {service.duration}
            </span>
          )}
        </div>
        {service.bawabticUrl && (
          <a 
            href={service.bawabticUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            🌐 الرابط الرسمي
          </a>
        )}
      </div>
    </div>
  );
};

export default function SimpleEnhancedChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'مرحباً! 👋 أنا مساعدك الذكي المحدث للخدمات الحكومية الجزائرية! 🇩🇿\n\n✨ **الميزات الجديدة:**\n- 🧠 ذكاء اصطناعي محسّن لنتائج أكثر دقة\n- 🔍 تحليل متطور للاستعلامات\n- 📊 توصيات مخصصة\n\nاسأل بالعربية أو الإنجليزية عن أي خدمة حكومية!',
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<AISearchResult | null>(null);
  const [showSampleQuestions, setShowSampleQuestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, searchResult]);

  const performAISearch = async (query: string): Promise<AISearchResult | null> => {
    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 8 })
      });

      if (response.ok) {
        const result: AISearchResult = await response.json();
        return result;
      }
    } catch (error) {
      console.error('AI Search failed:', error);
    }
    return null;
  };

  const generateAIResponse = async (query: string, searchResult: AISearchResult): Promise<string> => {
    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: query }
          ]
        })
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let result = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            result += decoder.decode(value);
          }
        }

        // Extract text from streaming response
        const lines = result.split('\n');
        let text = '';
        for (const line of lines) {
          if (line.startsWith('0:"')) {
            const match = line.match(/0:"(.+)"/);
            if (match) text += match[1];
          }
        }
        
        return text || 'تم إيجاد نتائج البحث المطلوبة.';
      }
    } catch (error) {
      console.error('AI Chat failed:', error);
    }
    
    return 'تم العثور على الخدمات المطابقة لاستعلامك.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowSampleQuestions(false);
    setSearchResult(null);

    try {
      // Perform AI search
      const aiSearchResult = await performAISearch(input);
      if (aiSearchResult) {
        setSearchResult(aiSearchResult);
        
        // Generate AI response
        const aiResponse = await generateAIResponse(input, aiSearchResult);
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date(),
          searchResult: aiSearchResult
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Fallback response
        const fallbackMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'عذراً، لم أتمكن من العثور على خدمات مطابقة لاستعلامك. يرجى المحاولة بكلمات مختلفة.',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, fallbackMessage]);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'عذراً، حدث خطأ في معالجة استعلامك. يرجى المحاولة مرة أخرى.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionClick = (question: string) => {
    setInput(question);
    setShowSampleQuestions(false);
    // Auto submit
    setTimeout(() => {
      const form = document.querySelector('form');
      form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }, 100);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Enhanced Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">🇩🇿</span>
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900 text-xl">مساعد الخدمات الحكومية المحدث</h1>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <span className="flex items-center gap-1">
                🧠 AI-Powered
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1">
                🔍 Enhanced Search
              </span>
            </p>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">معالجة ذكية...</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}>
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-lg">🤖</span>
                  </div>
                </div>
              )}
              
              <div className={`max-w-[80%] ${
                message.role === 'user' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl rounded-br-md px-4 py-3'
                  : 'bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm'
              }`}>
                <div className={`text-sm leading-relaxed ${
                  message.role === 'user' ? 'text-white' : 'text-gray-800'
                }`} dir="auto">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-lg">👤</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* AI Search Results */}
          {searchResult && (
            <div className="bg-white/90 border border-gray-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900">نتائج البحث المحسّنة بالذكاء الاصطناعي</h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {searchResult.services.length} خدمة
                </span>
              </div>

              {/* Services Grid */}
              {searchResult.services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {searchResult.services.slice(0, 6).map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>لم يتم العثور على خدمات مطابقة لاستعلامك</p>
                </div>
              )}

              {/* AI Recommendations */}
              {searchResult.recommendations && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    🎯 توصيات ذكية
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-700 leading-relaxed" dir="auto">
                        {searchResult.recommendations.summary}
                      </p>
                    </div>
                    
                    {searchResult.recommendations.nextSteps && searchResult.recommendations.nextSteps.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-800 mb-2">الخطوات التالية:</h5>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          {searchResult.recommendations.nextSteps.map((step, index) => (
                            <li key={index} dir="auto">{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sample Questions */}
          {showSampleQuestions && messages.length === 1 && (
            <div className="max-w-4xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                جرب هذه الأسئلة:
              </h3>
              <SampleQuestions onQuestionClick={handleQuestionClick} />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Enhanced Input */}
      <div className="border-t border-gray-200 bg-white/95 backdrop-blur-sm p-4">
        <div className="max-w-6xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اسأل بالعربية أو الإنجليزية: مثل 'كيف أحصل على جواز السفر؟'"
                className="w-full resize-none border border-gray-300 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 shadow-sm"
                style={{ minHeight: '56px', maxHeight: '140px' }}
                disabled={isLoading}
                rows={1}
                dir="auto"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-2xl px-6 py-3 hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}