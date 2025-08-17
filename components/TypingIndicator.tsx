import React, { useState, useEffect } from 'react';
import { Bot, Search, Database } from 'lucide-react';

const typingStages = [
  { text: "جاري البحث في قاعدة البيانات...", icon: Search, emoji: "🔍" },
  { text: "تحليل النتائج...", icon: Database, emoji: "📊" },
  { text: "إعداد الإجابة...", icon: Bot, emoji: "✍️" },
  { text: "يكتب...", icon: Bot, emoji: "💭" }
];

export default function TypingIndicator() {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage(prev => (prev + 1) % typingStages.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const stage = typingStages[currentStage];
  const IconComponent = stage.icon;

  return (
    <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 text-white rounded-full flex items-center justify-center animate-pulse">
          <IconComponent size={16} />
        </div>
      </div>
      
      <div className="flex-1 max-w-[85%] sm:max-w-[75%] lg:max-w-[70%]">
        <div className="bg-white border border-gray-200 text-gray-900 rounded-2xl px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base">
          <div className="flex items-center gap-2">
            <span className="text-lg animate-bounce">{stage.emoji}</span>
            <span className="text-gray-600">{stage.text}</span>
            <div className="flex gap-1 ml-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}