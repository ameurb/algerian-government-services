import React, { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';

interface StreamingMessageProps {
  content: string;
  onComplete?: () => void;
}

export default function StreamingMessage({ content, onComplete }: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(prev => prev + content[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 20); // Typing speed: 50ms per character

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, content, onComplete]);

  return (
    <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 text-white rounded-full flex items-center justify-center">
          <Bot size={16} />
        </div>
      </div>
      
      <div className="flex-1 max-w-[85%] sm:max-w-[75%] lg:max-w-[70%]">
        <div className="bg-white border border-gray-200 text-gray-900 rounded-2xl px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base">
          <p className="whitespace-pre-wrap leading-relaxed">
            {displayedContent}
            {currentIndex < content.length && (
              <span className="inline-block w-2 h-5 bg-gray-400 ml-1 animate-pulse"></span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}