import React, { useState } from 'react';
import { detectTextDirection, detectLanguage, getDirectionClasses } from '@/lib/language-utils';

const testTexts = [
  { text: "مرحباً بك في مساعد الخدمات الحكومية", expected: "rtl", label: "Arabic Text" },
  { text: "Welcome to Government Services Assistant", expected: "ltr", label: "English Text" },
  { text: "Bonjour et bienvenue", expected: "ltr", label: "French Text" },
  { text: "مرحباً Welcome أهلاً", expected: "rtl", label: "Mixed Arabic-English" },
  { text: "National ID بطاقة الهوية", expected: "rtl", label: "Mixed English-Arabic" },
  { text: "123 ABC تست", expected: "rtl", label: "Numbers + Latin + Arabic" }
];

export default function RTLTestDemo() {
  const [customText, setCustomText] = useState('');
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">
          🧪 RTL/LTR Automatic Detection Test
        </h1>
        
        {/* Custom Text Input */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow">
          <h2 className="text-lg font-semibold mb-4">🔧 Test Your Own Text</h2>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Type any text in Arabic, English, or French..."
            dir={detectTextDirection(customText)}
            className={`w-full p-3 border rounded-lg resize-none ${getDirectionClasses(customText)}`}
            rows={3}
          />
          
          {customText && (
            <div className="mt-3 p-3 bg-gray-50 rounded">
              <p><strong>Detected Direction:</strong> {detectTextDirection(customText)}</p>
              <p><strong>Detected Language:</strong> {detectLanguage(customText)}</p>
              <p><strong>Applied Classes:</strong> {getDirectionClasses(customText)}</p>
            </div>
          )}
        </div>

        {/* Predefined Tests */}
        <div className="bg-white rounded-lg p-4 shadow">
          <h2 className="text-lg font-semibold mb-4">🧪 Predefined Tests</h2>
          
          <div className="space-y-4">
            {testTexts.map((test, index) => {
              const detected = detectTextDirection(test.text);
              const language = detectLanguage(test.text);
              const classes = getDirectionClasses(test.text);
              const isCorrect = detected === test.expected;
              
              return (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-600">{test.label}</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isCorrect ? '✅ Correct' : '❌ Wrong'}
                    </span>
                  </div>
                  
                  <div className={`p-3 border-2 rounded ${
                    detected === 'rtl' ? 'border-r-4 border-r-blue-500' : 'border-l-4 border-l-green-500'
                  }`}>
                    <p className={`${classes}`} dir={detected}>
                      {test.text}
                    </p>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    <p>Expected: {test.expected} | Detected: {detected} | Language: {language}</p>
                    <p>Classes: {classes}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Chat Message Preview */}
        <div className="bg-white rounded-lg p-4 mt-6 shadow">
          <h2 className="text-lg font-semibold mb-4">💬 Chat Message Preview</h2>
          
          <div className="space-y-4">
            {/* Arabic message */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Arabic Message (RTL):</p>
              <div className={`${detectTextDirection("مرحباً! وجدت معلومات مفيدة حول بطاقة الهوية") === 'rtl' ? 'flex-row-reverse' : 'flex-row'} flex gap-3`}>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                  🤖
                </div>
                <div className="bg-white border rounded-2xl px-4 py-3 max-w-sm">
                  <p className={getDirectionClasses("مرحباً! وجدت معلومات مفيدة حول بطاقة الهوية")} 
                     dir={detectTextDirection("مرحباً! وجدت معلومات مفيدة حول بطاقة الهوية")}>
                    مرحباً! وجدت معلومات مفيدة حول بطاقة الهوية
                  </p>
                </div>
              </div>
            </div>
            
            {/* English message */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">English Message (LTR):</p>
              <div className={`${detectTextDirection("Great! I found useful information about National ID") === 'rtl' ? 'flex-row-reverse' : 'flex-row'} flex gap-3`}>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                  🤖
                </div>
                <div className="bg-white border rounded-2xl px-4 py-3 max-w-sm">
                  <p className={getDirectionClasses("Great! I found useful information about National ID")} 
                     dir={detectTextDirection("Great! I found useful information about National ID")}>
                    Great! I found useful information about National ID
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}