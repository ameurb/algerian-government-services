'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
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

export default function EnhancedStreamingChat() {
  const [searchResults, setSearchResults] = useState<AISearchResult | null>(null);
  const [isAISearching, setIsAISearching] = useState(false);
  const [showSampleQuestions, setShowSampleQuestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/ai-chat',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: 'مرحباً! 👋 أنا مساعدك الذكي المحدث للخدمات الحكومية الجزائرية! 🇩🇿\n\n✨ **الميزات الجديدة:**\n- 🧠 ذكاء اصطناعي محسّن لنتائج أكثر دقة\n- 🌊 استجابة فورية مع التدفق المباشر\n- 🔍 تحليل متطور للاستعلامات\n- 📊 توصيات مخصصة\n\nاسأل بالعربية أو الإنجليزية عن أي خدمة حكومية!'
      }
    ],
    onFinish: async (message) => {
      // Enhanced AI search when user sends a message
      if (message.role === 'user') {
        await performAISearch(message.content);
      }
    }
  });

  const performAISearch = async (query: string) => {
    setIsAISearching(true);
    setShowSampleQuestions(false);
    
    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 8 })
      });

      if (response.ok) {
        const result: AISearchResult = await response.json();
        setSearchResults(result);
      }
    } catch (error) {
      console.error('AI Search failed:', error);
    } finally {
      setIsAISearching(false);
    }
  };

  const handleQuestionClick = (question: string) => {
    handleInputChange({ target: { value: question } } as any);
    setShowSampleQuestions(false);
    // Trigger the chat
    handleSubmit({ preventDefault: () => {} } as any);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, searchResults]);

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
                🌊 Real-time Streaming
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1">
                🔍 Enhanced Search
              </span>
            </p>
          </div>
          {(isLoading || isAISearching) && (
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
          {searchResults && (
            <div className="bg-white/90 border border-gray-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900">نتائج البحث المحسّنة بالذكاء الاصطناعي</h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {searchResults.services.length} خدمة
                </span>
              </div>

              {/* Analysis Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">القصد:</span>
                    <p className="text-gray-600 capitalize">{searchResults.analysis.intent}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">نوع الخدمة:</span>
                    <p className="text-gray-600">{searchResults.analysis.serviceType}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">الفئة:</span>
                    <p className="text-gray-600">{searchResults.analysis.category || 'عام'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">اللغة:</span>
                    <p className="text-gray-600">{searchResults.analysis.language === 'ar' ? 'عربية' : searchResults.analysis.language === 'en' ? 'إنجليزية' : 'مختلطة'}</p>
                  </div>
                </div>
              </div>

              {/* Services Grid */}
              {searchResults.services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {searchResults.services.slice(0, 6).map((service) => (
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
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  🎯 توصيات ذكية
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-700 leading-relaxed" dir="auto">
                      {searchResults.recommendations.summary}
                    </p>
                  </div>
                  
                  {searchResults.recommendations.nextSteps.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">الخطوات التالية:</h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {searchResults.recommendations.nextSteps.map((step, index) => (
                          <li key={index} dir="auto">{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {searchResults.recommendations.warnings && searchResults.recommendations.warnings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <h5 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                        ⚠️ تنبيهات مهمة
                      </h5>
                      <ul className="space-y-1 text-sm text-yellow-700">
                        {searchResults.recommendations.warnings.map((warning, index) => (
                          <li key={index} dir="auto">• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
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
                onChange={handleInputChange}
                placeholder="اسأل بالعربية أو الإنجليزية: مثل 'كيف أحصل على جواز السفر؟'"
                className="w-full resize-none border border-gray-300 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 shadow-sm"
                style={{ minHeight: '56px', maxHeight: '140px' }}
                disabled={isLoading || isAISearching}
                rows={1}
                dir="auto"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || isAISearching || !input.trim()}
              className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-2xl px-6 py-3 hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              {(isLoading || isAISearching) ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              حدث خطأ: {error.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}