'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Languages, 
  Globe,
  ExternalLink,
  MessageCircle,
  Sparkles
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: Date;
}

interface StreamingState {
  isLoading: boolean;
  currentMessage: string;
  error: string | null;
}

export default function GovernmentServicesAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('ar');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [streaming, setStreaming] = useState<StreamingState>({
    isLoading: false,
    currentMessage: '',
    error: null
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize with welcome message
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: getWelcomeMessage(language),
      createdAt: new Date()
    }]);
  }, [language]);

  // Show welcome message immediately on load
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: getWelcomeMessage(language),
        createdAt: new Date()
      }]);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming.currentMessage]);

  const streamResponse = async (userMessage: string) => {
    // Add user message immediately
    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: userMessage,
      createdAt: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    
    // Reset streaming state
    setStreaming({
      isLoading: true,
      currentMessage: '',
      error: null
    });

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();
      
      const response = await fetch('/api/enhanced-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].slice(-10), // Keep last 10 messages for context
          sessionId
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              // Streaming completed - add final message
              const assistantMsg: Message = {
                id: `assistant_${Date.now()}`,
                role: 'assistant',
                content: accumulatedText,
                createdAt: new Date()
              };
              
              setMessages(prev => [...prev, assistantMsg]);
              setStreaming({
                isLoading: false,
                currentMessage: '',
                error: null
              });
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              console.log('📡 Received streaming data:', parsed);
              
              // Handle our custom streaming format: {"content": "text"}
              if (parsed.content) {
                accumulatedText += parsed.content;
                console.log('📝 Updated text length:', accumulatedText.length);
                
                // Update streaming message
                setStreaming(prev => ({
                  ...prev,
                  currentMessage: accumulatedText
                }));
              }
              // Handle OpenAI streaming format
              else if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                const newContent = parsed.choices[0].delta.content;
                accumulatedText += newContent;
                
                // Update streaming message
                setStreaming(prev => ({
                  ...prev,
                  currentMessage: accumulatedText
                }));
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming data:', data);
              // Handle raw text streaming
              if (data.trim() && !data.includes('[DONE]')) {
                accumulatedText += data;
                setStreaming(prev => ({
                  ...prev,
                  currentMessage: accumulatedText
                }));
              }
            }
          }
        }
      }
      
    } catch (error: any) {
      console.error('❌ Streaming error:', error);
      
      if (error.name === 'AbortError') {
        console.log('🛑 Request aborted by user');
        return;
      }
      
      setStreaming({
        isLoading: false,
        currentMessage: '',
        error: error.message || 'حدث خطأ في الاتصال'
      });
      
      // Add error message
      const errorMsg: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: getErrorMessage(language, error.message),
        createdAt: new Date()
      };
      
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || streaming.isLoading) return;
    
    await streamResponse(input);
  };

  const handleSampleQuestion = (question: string) => {
    if (streaming.isLoading) return;
    setInput(question);
    streamResponse(question);
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStreaming({
        isLoading: false,
        currentMessage: '',
        error: null
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">🇩🇿</span>
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-xl">
                  {language === 'ar' ? 'مساعد الخدمات الحكومية الذكي' :
                   language === 'fr' ? 'Assistant IA des Services Publics' :
                   'AI Government Services Assistant'}
                </h1>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {language === 'ar' ? 'مدعوم بالذكاء الاصطناعي والتدفق المباشر' :
                   language === 'fr' ? 'Alimenté par IA avec streaming en temps réel' :
                   'AI-powered with real-time streaming'}
                </p>
              </div>
            </div>
            
            <LanguageSelector language={language} onLanguageChange={setLanguage} />
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {/* Conversation Messages */}
          {messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              language={language} 
            />
          ))}
          
          {/* Streaming Message */}
          {streaming.currentMessage && (
            <div className="flex gap-4 justify-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-full flex items-center justify-center shadow-lg">
                  <Bot className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 max-w-[85%]">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm">
                  <div className="markdown-content text-gray-800" dir="auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {streaming.currentMessage}
                    </ReactMarkdown>
                    <span className="inline-block w-0.5 h-5 bg-blue-500 ml-1 typing-indicator"></span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full pulse-dot"></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full pulse-dot"></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full pulse-dot"></div>
                      </div>
                      <span>
                        {language === 'ar' ? 'يكتب...' :
                         language === 'fr' ? 'Écrit...' :
                         'Writing...'}
                      </span>
                    </div>
                    <button
                      onClick={stopGeneration}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      {language === 'ar' ? 'إيقاف' :
                       language === 'fr' ? 'Arrêter' :
                       'Stop'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {streaming.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                <strong>
                  {language === 'ar' ? 'حدث خطأ:' :
                   language === 'fr' ? 'Erreur :' :
                   'Error:'}
                </strong>
              </div>
              <p className="mt-1">{streaming.error}</p>
            </div>
          )}

          {/* Sample Questions */}
          {messages.length === 1 && !streaming.isLoading && (
            <SampleQuestions 
              language={language} 
              onQuestionClick={handleSampleQuestion}
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="border-t border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={getInputPlaceholder(language)}
                className="w-full resize-none border border-gray-300 rounded-2xl px-5 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 shadow-sm transition-all"
                style={{ minHeight: '56px', maxHeight: '140px' }}
                disabled={streaming.isLoading}
                rows={1}
                dir="auto"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </div>
            <button
              type="submit"
              disabled={streaming.isLoading || !input.trim()}
              className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-2xl px-6 py-3 hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              {streaming.isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>

          {streaming.error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {language === 'ar' ? 'حدث خطأ:' :
               language === 'fr' ? 'Une erreur s\'est produite :' :
               'An error occurred:'} {streaming.error}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

const MessageBubble = ({ message, language }: { message: Message; language: string }) => {
  return (
    <div className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.role === 'assistant' && (
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-full flex items-center justify-center shadow-lg">
            <Bot className="w-5 h-5" />
          </div>
        </div>
      )}
      
      <div className={`max-w-[85%] ${
        message.role === 'user' 
          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl rounded-br-md px-5 py-3'
          : 'bg-white border border-gray-200 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm'
      }`}>
        <div className={`leading-relaxed ${
          message.role === 'user' ? 'text-white' : 'text-gray-800'
        }`} dir="auto">
          <div className="markdown-content">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-xl font-bold mb-3 text-blue-800 border-b border-gray-200 pb-2">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-semibold mb-2 text-blue-700">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-medium mb-2 text-blue-600">
                  {children}
                </h3>
              ),
              ul: ({ children }) => (
                <ul className="list-disc ms-5 rtl:ml-0 rtl:mr-5 space-y-1 mb-3 text-gray-700">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal ms-5 rtl:ml-0 rtl:mr-5 space-y-1 mb-3 text-gray-700">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="text-gray-700 leading-relaxed">{children}</li>
              ),
              p: ({ children }) => (
                <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
              ),
              a: ({ href, children }) => (
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                >
                  {children}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-gray-900">{children}</strong>
              ),
              blockquote: ({ children }) => (
                <div className="border-l-4 border-blue-200 bg-blue-50 pl-4 py-2 rounded-r-lg my-3 italic text-gray-600">
                  {children}
                </div>
              ),
              code: ({ children }) => (
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
                  {children}
                </code>
              )
            }}
          >
            {message.content}
          </ReactMarkdown>
          </div>
        </div>
      </div>

      {message.role === 'user' && (
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center shadow-lg">
            <User className="w-5 h-5" />
          </div>
        </div>
      )}
    </div>
  );
};

const LanguageSelector = ({ language, onLanguageChange }: { 
  language: string; 
  onLanguageChange: (lang: string) => void;
}) => {
  const languages = [
    { code: 'ar', name: 'العربية', flag: '🇩🇿' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-sm border border-gray-200">
      <Languages className="w-4 h-4 text-gray-600" />
      <select 
        value={language} 
        onChange={(e) => onLanguageChange(e.target.value)}
        className="border-none bg-transparent text-sm focus:outline-none cursor-pointer text-gray-700 font-medium"
      >
        {languages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

const SampleQuestions = ({ language, onQuestionClick }: { 
  language: string; 
  onQuestionClick: (question: string) => void;
}) => {
  const questionSets = {
    ar: [
      'كيف يمكنني الحصول على جواز السفر؟',
      'ما هي متطلبات بطاقة التعريف الوطنية؟',
      'كيف أسجل شركة جديدة في الجزائر؟',
      'طلب منحة التعليم العالي',
      'خدمات الحالة المدنية المتاحة',
      'إجراءات الحصول على رخصة السياقة'
    ],
    en: [
      'How can I get a passport?',
      'What are the national ID card requirements?',
      'How do I register a new business in Algeria?',
      'Higher education grant application',
      'Available civil status services',
      'Driving license application procedures'
    ],
    fr: [
      'Comment puis-je obtenir un passeport ?',
      'Quelles sont les exigences pour la carte d\'identité nationale ?',
      'Comment enregistrer une nouvelle entreprise en Algérie ?',
      'Demande de bourse d\'études supérieures',
      'Services d\'état civil disponibles',
      'Procédures de demande de permis de conduire'
    ]
  };

  const questions = questionSets[language as keyof typeof questionSets] || questionSets.ar;

  return (
    <div className="bg-white/80 rounded-xl p-6 border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center flex items-center justify-center gap-2">
        <MessageCircle className="w-5 h-5 text-blue-600" />
        {language === 'ar' ? 'أسئلة شائعة - جرب النقر على إحداها:' :
         language === 'fr' ? 'Questions fréquentes - cliquez pour essayer :' :
         'Common questions - click to try:'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question)}
            className="text-left p-4 bg-gradient-to-r from-blue-50 to-green-50 hover:from-blue-100 hover:to-green-100 border border-gray-200 rounded-lg transition-all hover:shadow-md hover:scale-105 hover:border-blue-300 group"
            dir="auto"
          >
            <div className="font-medium text-gray-800 group-hover:text-blue-800 transition-colors">
              {question}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Helper functions
function getWelcomeMessage(language: string): string {
  const messages = {
    ar: `# مرحباً! 👋

أنا **مساعدك الذكي للخدمات الحكومية الجزائرية** مدعوم بأحدث تقنيات الذكاء الاصطناعي! 🇩🇿

## ✨ **المميزات الجديدة:**

- 🧠 **ذكاء اصطناعي متطور** لفهم أفضل لاستفساراتك
- 🌊 **استجابة فورية** مع التدفق المباشر للإجابات
- 📋 **إرشادات مفصلة** خطوة بخطوة
- 🌐 **دعم متعدد اللغات** (عربي، إنجليزي، فرنسي)
- 📊 **معلومات شاملة** عن الرسوم والمواعيد
- 🔗 **روابط مباشرة** للخدمات الرقمية

**اسأل عن أي خدمة حكومية وسأعطيك معلومات دقيقة ومحدثة!** 

*جرب النقر على أحد الأسئلة أدناه أو اكتب سؤالك* ⬇️`,

    en: `# Welcome! 👋

I'm your **Intelligent Algerian Government Services Assistant** powered by advanced AI technology! 🇩🇿

## ✨ **New Features:**

- 🧠 **Advanced AI** for better understanding of your queries
- 🌊 **Real-time streaming** responses
- 📋 **Detailed step-by-step** guidance
- 🌐 **Multilingual support** (Arabic, English, French)
- 📊 **Comprehensive information** about fees and timelines
- 🔗 **Direct links** to digital services

**Ask me about any government service and I'll give you accurate, up-to-date information!**

*Try clicking on one of the questions below or type your own* ⬇️`,

    fr: `# Bienvenue ! 👋

Je suis votre **Assistant Intelligent des Services Publics Algériens** alimenté par une technologie IA avancée ! 🇩🇿

## ✨ **Nouvelles fonctionnalités :**

- 🧠 **IA avancée** pour une meilleure compréhension de vos requêtes
- 🌊 **Réponses en streaming** en temps réel
- 📋 **Conseils détaillés** étape par étape
- 🌐 **Support multilingue** (Arabe, Anglais, Français)
- 📊 **Informations complètes** sur les frais et délais
- 🔗 **Liens directs** vers les services numériques

**Demandez-moi à propos de tout service gouvernemental et je vous donnerai des informations précises et à jour !**

*Essayez de cliquer sur l'une des questions ci-dessous ou tapez la vôtre* ⬇️`
  };

  return messages[language as keyof typeof messages] || messages.ar;
}

function getInputPlaceholder(language: string): string {
  const placeholders = {
    ar: 'اسأل عن أي خدمة حكومية... مثل "كيف أحصل على جواز السفر؟"',
    en: 'Ask about any government service... like "How do I get a passport?"',
    fr: 'Demandez à propos de tout service public... comme "Comment obtenir un passeport ?"'
  };
  
  return placeholders[language as keyof typeof placeholders] || placeholders.ar;
}

function getErrorMessage(language: string, error: string): string {
  const baseMessages = {
    ar: 'عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.',
    en: 'Sorry, an error occurred while processing your request. Please try again.',
    fr: 'Désolé, une erreur s\'est produite lors du traitement de votre demande. Veuillez réessayer.'
  };
  
  const message = baseMessages[language as keyof typeof baseMessages] || baseMessages.ar;
  return `${message}\n\n**تفاصيل الخطأ:** ${error}`;
}