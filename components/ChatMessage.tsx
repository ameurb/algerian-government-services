import React from 'react';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SampleQuestions from './SampleQuestions';
import { detectTextDirection, getDirectionClasses, getChatAlignment } from '@/lib/language-utils';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  onQuestionClick?: (question: string) => void;
  metadata?: {
    servicesFound?: number;
    showSampleQuestions?: boolean;
    services?: Array<{
      id: string;
      name: string;
      nameEn?: string;
      category: string;
      isOnline: boolean;
    }>;
  };
}

export default function ChatMessage({ role, content, timestamp, onQuestionClick, metadata }: ChatMessageProps) {
  const isUser = role === 'user';
  const textDirection = detectTextDirection(content);
  const directionClasses = getDirectionClasses(content);
  const chatAlignment = getChatAlignment(content, isUser);
  
  // Handle clickable suggestions
  const handleClickableSuggestion = (suggestion: string) => {
    if (onQuestionClick) {
      onQuestionClick(suggestion);
    }
  };
  
  // Custom markdown components
  const markdownComponents = {
    // Handle clickable suggestions
    p: ({ children, ...props }: any) => {
      const childString = String(children);
      if (childString.includes('<clickable>')) {
        const parts = childString.split(/(<clickable>.*?<\/clickable>)/g);
        return (
          <p {...props}>
            {parts.map((part, index) => {
              if (part.startsWith('<clickable>') && part.endsWith('</clickable>')) {
                const suggestion = part.replace(/<\/?clickable>/g, '');
                return (
                  <button
                    key={index}
                    onClick={() => handleClickableSuggestion(suggestion)}
                    className="inline-block bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm mx-1 my-1 transition-colors cursor-pointer"
                  >
                    {suggestion}
                  </button>
                );
              }
              return part;
            })}
          </p>
        );
      }
      return <p {...props}>{children}</p>;
    },
    // Style headers
    h2: ({ children, ...props }: any) => (
      <h2 {...props} className="text-xl font-bold text-gray-900 mb-3 mt-4">
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 {...props} className="text-lg font-semibold text-gray-800 mb-2 mt-3">
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: any) => (
      <h4 {...props} className="text-md font-medium text-gray-700 mb-2 mt-2">
        {children}
      </h4>
    ),
    // Style lists
    ul: ({ children, ...props }: any) => (
      <ul {...props} className="list-disc list-inside mb-3 space-y-1">
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol {...props} className="list-decimal list-inside mb-3 space-y-1">
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li {...props} className="text-gray-700">
        {children}
      </li>
    ),
    // Style links
    a: ({ children, href, ...props }: any) => (
      <a 
        {...props} 
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline"
      >
        {children}
      </a>
    ),
    // Style horizontal rules
    hr: ({ ...props }: any) => (
      <hr {...props} className="border-gray-300 my-4" />
    ),
    // Style strong text
    strong: ({ children, ...props }: any) => (
      <strong {...props} className="font-semibold text-gray-900">
        {children}
      </strong>
    )
  };
  
  return (
    <div className={`flex gap-2 sm:gap-3 mb-4 sm:mb-6 ${chatAlignment}`}>
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-green-500 text-white'
        }`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>
      </div>
      
      <div className="flex-1 max-w-[85%] sm:max-w-[75%] lg:max-w-[70%]">
        <div className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-white border border-gray-200 text-gray-900'
        } ${textDirection === 'rtl' ? 'ml-auto' : 'mr-auto'}`}>
          {isUser ? (
            <p className={`whitespace-pre-wrap leading-relaxed ${directionClasses}`} 
               dir={textDirection}>
              {content}
            </p>
          ) : (
            <div className={`markdown-content leading-relaxed ${directionClasses}`} 
                 dir={textDirection}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        
        {metadata && metadata.services && metadata.services.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 px-2">
              وُجدت {metadata.servicesFound} خدمة:
            </p>
            <div className="space-y-1">
              {metadata.services.slice(0, 3).map((service) => (
                <div 
                  key={service.id} 
                  className="bg-white border border-gray-200 rounded-lg p-3 text-sm hover:bg-gray-50 cursor-pointer"
                >
                  <div className="font-medium text-gray-900">
                    {service.name}
                  </div>
                  {service.nameEn && (
                    <div className="text-gray-600 text-xs">
                      {service.nameEn}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                      {service.category}
                    </span>
                    {service.isOnline && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">
                        متاح أونلاين
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sample Questions for Welcome Message */}
        {metadata?.showSampleQuestions && onQuestionClick && (
          <SampleQuestions 
            onQuestionClick={onQuestionClick}
            disabled={false}
          />
        )}
        
        <div className="text-xs text-gray-400 px-2">
          {(() => {
            try {
              const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
              return date.toLocaleTimeString('ar-DZ', { 
                hour: '2-digit', 
                minute: '2-digit' 
              });
            } catch (error) {
              console.error('Timestamp error:', error, 'Timestamp:', timestamp);
              return new Date().toLocaleTimeString('ar-DZ', { 
                hour: '2-digit', 
                minute: '2-digit' 
              });
            }
          })()}
        </div>
      </div>
    </div>
  );
}