import React from 'react';

interface SampleQuestionsProps {
  onQuestionClick: (question: string) => void;
  disabled?: boolean;
}

const sampleQuestions = [
  { ar: "بطاقة التعريف البيومترية", en: "Biometric National ID", emoji: "🆔" },
  { ar: "جواز السفر البيومتري", en: "Biometric Passport", emoji: "✈️" },
  { ar: "رخصة السياقة البيومترية", en: "Biometric Driving License", emoji: "🚗" },
  { ar: "التسجيل في العمل", en: "Employment Registration", emoji: "💼" },
  { ar: "تأسيس شركة عبر الإنترنت", en: "Online Company Registration", emoji: "🏢" },
  { ar: "التصريح الجبائي", en: "Tax Declaration", emoji: "💰" },
  { ar: "شهادة الميلاد عبر الإنترنت", en: "Online Birth Certificate", emoji: "📋" },
  { ar: "السكن الترقوي", en: "Social Housing", emoji: "🏠" }
];

export default function SampleQuestions({ onQuestionClick, disabled = false }: SampleQuestionsProps) {
  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm text-gray-600 font-medium">💡 جرب هذه الأسئلة:</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sampleQuestions.map((item, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(item.ar)}
            disabled={disabled}
            className="flex items-center gap-2 p-3 text-left bg-white hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-300 group"
          >
            <span className="text-lg">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700">
                {item.ar}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {item.en}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}