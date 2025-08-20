import React, { useState, KeyboardEvent } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { detectTextDirection, getDirectionClasses } from '@/lib/language-utils';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "اكتب سؤالك هنا..." 
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  // Detect text direction for current input
  const inputDirection = detectTextDirection(message);
  const inputClasses = getDirectionClasses(message);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceInput = () => {
    // Voice input functionality can be implemented here
    setIsListening(!isListening);
    
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'ar-DZ';
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.start();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
      <div className="flex-1 relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          dir={inputDirection}
          className={`w-full resize-none border border-gray-300 rounded-2xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 shadow-sm ${inputClasses} ${
            inputDirection === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'
          }`}
          style={{ minHeight: '53px', maxHeight: '132px' }}
        />
        
        <button
          type="button"
          onClick={handleVoiceInput}
          disabled={disabled}
          className={`absolute ${inputDirection === 'rtl' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 p-1.5 rounded-full transition-all ${
            isListening 
              ? 'bg-red-500 text-white shadow-md' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          } disabled:opacity-50`}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
      </div>
      
      <button
        type="submit"
        disabled={!message.trim() || disabled}
        className="bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-2xl px-4 sm:px-6 py-3 hover:from-blue-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
      >
        <Send size={18} />
      </button>
    </form>
  );
}