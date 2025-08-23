# 🇩🇿 Enhanced AI Government Services Assistant

An **advanced AI-powered assistant** for Algerian government services with **real-time streaming**, **SQLite database**, and **multilingual support** (Arabic, English, French).

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![SQLite](https://img.shields.io/badge/SQLite-Database-blue.svg)
![AI](https://img.shields.io/badge/AI-Powered-green.svg)
![Streaming](https://img.shields.io/badge/Streaming-Real--time-red.svg)

## 🌟 Features

### 🧠 **Advanced AI System**
- **AI-powered query analysis** with intent detection
- **Automatic language detection** (Arabic, English, French)
- **Real-time streaming responses** with markdown formatting
- **Human-like comprehensive guidance** with step-by-step instructions

### 🗄️ **SQLite Database**
- **Local file-based database** for fast performance
- **Comprehensive government services** data
- **Multilingual content** with full translations
- **Advanced search indexing** for accurate results

### 🌊 **Real-time Streaming**
- **Character-by-character streaming** for instant responses
- **Professional markdown formatting** in real-time
- **Enhanced user experience** with typing indicators
- **Vercel AI SDK integration** for optimal performance

### 🌐 **Multilingual Support**
- **Arabic (العربية)** - Primary language with RTL support
- **English** - Administrative terminology and procedures
- **French (Français)** - Administrative French for legal context

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API key
- TypeScript knowledge (optional)

### Installation
```bash
# Clone repository
git clone https://github.com/ameurb/algerian-government-services.git
cd algerian-government-services

# Install dependencies  
npm install

# Configure environment
cp .env.example .env
# Add your OPENAI_API_KEY to .env

# Generate Prisma client and create database
npx prisma generate
npx prisma db push

# Seed database with government services
npx tsx prisma/sqlite-seed.ts

# Start development server
npm run dev
```

## 📡 Streaming API Usage in Node.js

### Basic Streaming Request

```javascript
import fetch from 'node-fetch';

async function streamGovernmentServices(userQuery) {
  const response = await fetch('https://dzservices.findapply.com/api/enhanced-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: userQuery }
      ],
      sessionId: `session_${Date.now()}`
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulatedText = '';

  while (true) {
    const { done, value } = await reader.read();
    
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\\n').filter(line => line.trim());
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        
        if (data === '[DONE]') {
          console.log('\\n✅ Streaming completed!');
          console.log('\\n📄 Full Response:');
          console.log(accumulatedText);
          return accumulatedText;
        }
        
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            accumulatedText += parsed.content;
            process.stdout.write(parsed.content); // Real-time display
          }
        } catch (parseError) {
          console.warn('Failed to parse:', data);
        }
      }
    }
  }
}

// Usage Examples
await streamGovernmentServices('كيف أحصل على جواز السفر؟');
await streamGovernmentServices('How to get a national ID?');
await streamGovernmentServices('Comment enregistrer une entreprise ?');
```

### Advanced Streaming with Session Management

```javascript
class AlgerianServicesClient {
  constructor(apiKey = null) {
    this.baseUrl = 'https://dzservices.findapply.com';
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.conversationHistory = [];
  }

  async streamChat(userMessage, onChunk = null, onComplete = null) {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    });

    const response = await fetch(`${this.baseUrl}/api/enhanced-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: this.conversationHistory,
        sessionId: this.sessionId
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              // Add assistant response to history
              this.conversationHistory.push({
                role: 'assistant',
                content: fullResponse,
                timestamp: new Date()
              });
              
              if (onComplete) onComplete(fullResponse);
              return fullResponse;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullResponse += parsed.content;
                if (onChunk) onChunk(parsed.content, fullResponse);
              }
            } catch (error) {
              console.warn('Parse error:', error);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullResponse;
  }

  // Get conversation history
  getHistory() {
    return this.conversationHistory;
  }

  // Clear conversation
  clearHistory() {
    this.conversationHistory = [];
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Usage Example
const client = new AlgerianServicesClient();

// Stream with real-time callback
await client.streamChat(
  'كيف أسجل شركة جديدة؟',
  (chunk, fullText) => {
    // Called for each streaming chunk
    console.log('📝 New chunk:', chunk);
  },
  (finalResponse) => {
    // Called when streaming completes
    console.log('✅ Final response length:', finalResponse.length);
  }
);

// Continue conversation with context
await client.streamChat('ما هي الوثائق المطلوبة؟');

console.log('📚 Conversation history:', client.getHistory());
```

### Express.js Integration

```javascript
import express from 'express';
import { AlgerianServicesClient } from './algerian-services-client.js';

const app = express();
app.use(express.json());

const client = new AlgerianServicesClient();

// Streaming endpoint
app.post('/api/stream-chat', async (req, res) => {
  const { message, sessionId } = req.body;
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  try {
    await client.streamChat(
      message,
      (chunk) => {
        // Forward chunk to client
        res.write(`data: ${JSON.stringify({ content: chunk })}\\n\\n`);
      },
      (finalResponse) => {
        res.write('data: [DONE]\\n\\n');
        res.end();
      }
    );
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\\n\\n`);
    res.end();
  }
});

app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
```

### TypeScript Integration

```typescript
interface StreamingResponse {
  content?: string;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    servicesFound?: number;
    language?: string;
  };
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

class AlgerianServicesAPI {
  private baseUrl: string;
  private sessionId: string;
  private history: ConversationMessage[];

  constructor(baseUrl = 'https://dzservices.findapply.com') {
    this.baseUrl = baseUrl;
    this.sessionId = this.generateSessionId();
    this.history = [];
  }

  async *streamResponse(userQuery: string): AsyncIterable<string> {
    this.history.push({
      role: 'user',
      content: userQuery,
      timestamp: new Date()
    });

    const response = await fetch(`${this.baseUrl}/api/enhanced-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: this.history,
        sessionId: this.sessionId
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = '';

    if (!reader) throw new Error('Response body not readable');

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              this.history.push({
                role: 'assistant',
                content: accumulatedText,
                timestamp: new Date()
              });
              return;
            }
            
            try {
              const parsed: StreamingResponse = JSON.parse(data);
              if (parsed.content) {
                accumulatedText += parsed.content;
                yield parsed.content;
              }
            } catch (error) {
              console.warn('Parse error:', error);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConversationHistory(): ConversationMessage[] {
    return [...this.history];
  }
}

// TypeScript Usage
const api = new AlgerianServicesAPI();

console.log('🤖 Starting AI conversation...');
for await (const chunk of api.streamResponse('كيف أحصل على جواز السفر؟')) {
  process.stdout.write(chunk);
}

console.log('\\n📚 Conversation history:', api.getConversationHistory());
```

### React.js Frontend Integration

```tsx
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

function useStreamingChat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStream, setCurrentStream] = useState('');

  const streamMessage = async (userMessage: string) => {
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsStreaming(true);
    setCurrentStream('');

    try {
      const response = await fetch('/api/enhanced-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
          sessionId: 'react_session'
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setMessages(prev => [...prev, { role: 'assistant', content: accumulated }]);
              setIsStreaming(false);
              setCurrentStream('');
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulated += parsed.content;
                setCurrentStream(accumulated);
              }
            } catch (error) {
              console.warn('Parse error:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      setIsStreaming(false);
    }
  };

  return { messages, isStreaming, currentStream, streamMessage };
}

// React Component
export default function ChatInterface() {
  const { messages, isStreaming, currentStream, streamMessage } = useStreamingChat();

  return (
    <div className="chat-container">
      {messages.map((msg, i) => (
        <div key={i} className={`message ${msg.role}`}>
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
      ))}
      
      {isStreaming && currentStream && (
        <div className="streaming-message">
          <ReactMarkdown>{currentStream}</ReactMarkdown>
          <span className="typing-cursor">|</span>
        </div>
      )}
      
      <ChatInput onSend={streamMessage} disabled={isStreaming} />
    </div>
  );
}
```

## 🏗️ Architecture

```
Frontend (React/Next.js)  ←→  Streaming API  ←→  AI Analysis  ←→  SQLite Database
     │                           │                    │                 │
   User Input              Enhanced Chat          OpenAI GPT-4     Government Services
   Markdown UI            /api/enhanced-chat      Query Analysis        Local DB
   Real-time UX           Streaming Response      Intent Detection      Fast Search
```

### 🔧 **System Components:**

1. **Frontend Application**
   - Real-time streaming UI with markdown parsing
   - Multilingual interface (Arabic/English/French)
   - Professional government services styling

2. **AI-Powered Backend**
   - Vercel AI SDK for advanced query processing
   - Automatic language detection and intent analysis
   - Comprehensive response generation with templates

3. **SQLite Database**
   - Local government services database
   - Optimized for fast search and retrieval
   - Multilingual content with proper indexing

## 📊 Available Services

### **Civil Status Services** (الحالة المدنية)
- 🛂 **Passport Services** (خدمات جواز السفر)
  - New passport application / طلب جواز سفر جديد  
  - Passport renewal / تجديد جواز السفر
  - Passport tracking / متابعة طلب جواز السفر

- 🆔 **Identity Documents** (وثائق الهوية)
  - National ID card / بطاقة التعريف الوطنية
  - Birth certificates / شهادات الميلاد
  - Marriage certificates / شهادات الزواج

### **Business Services** (خدمات الأعمال)
- 🏢 **Company Registration** (تسجيل الشركات)
- 📄 **Commercial Licenses** (الرخص التجارية)
- 💼 **Trade Register** (السجل التجاري)

### **Education Services** (خدمات التعليم)
- 🎓 **Higher Education Grants** (منح التعليم العالي)
- 📚 **University Services** (الخدمات الجامعية)

### **Transportation Services** (خدمات النقل)
- 🚗 **Driving License** (رخصة السياقة)
- 🚙 **Vehicle Registration** (تسجيل المركبات)

## 🧪 Testing the Streaming API

### Simple Test Script
```bash
# Test with Arabic query
curl -X POST https://dzservices.findapply.com/api/enhanced-chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [{"role": "user", "content": "كيف أحصل على جواز السفر؟"}],
    "sessionId": "test_session"
  }'

# Test with English query  
curl -X POST https://dzservices.findapply.com/api/enhanced-chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [{"role": "user", "content": "How to get a passport?"}],
    "sessionId": "test_session"
  }'

# Test with French query
curl -X POST https://dzservices.findapply.com/api/enhanced-chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [{"role": "user", "content": "Comment obtenir un passeport ?"}],
    "sessionId": "test_session"
  }'
```

### Expected Response Format
```
data: {"content":"#"}
data: {"content":" 🎯"}  
data: {"content":" Direct"}
data: {"content":" Answer"}
data: {"content":"\\n\\n"}
data: {"content":"To"}
data: {"content":" apply"}
data: {"content":" for"}
data: {"content":" an"}
data: {"content":" Algerian"}
data: {"content":" passport"}
data: {"content":"..."}
data: [DONE]
```

## 🌐 Production Deployment

The application is deployed and available at:
- **🤖 Main Application**: https://dzservices.findapply.com
- **📡 Streaming API**: https://dzservices.findapply.com/api/enhanced-chat
- **🔧 Alternative API**: https://dzservices.findapply.com/api/chat-stream

### Features in Production:
- ✅ **Real-time AI streaming** with markdown formatting
- ✅ **SQLite database** with comprehensive government services
- ✅ **Multilingual support** with automatic language detection
- ✅ **Professional UI** with enhanced user experience
- ✅ **Error handling** and graceful fallbacks

## 📞 API Support

### Error Handling
The API returns structured errors:
```json
{
  "error": "Internal server error",
  "message": "Specific error description",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Rate Limiting
- **Production**: 60 requests per minute per IP
- **Development**: No limits

### Response Times
- **Average**: 2-8 seconds for complete response
- **Streaming**: Immediate start, character-by-character delivery
- **Database**: < 100ms query response time

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**🎉 Built with ❤️ for the Algerian community** 🇩🇿

*Empowering citizens with intelligent AI-powered access to government services through advanced streaming technology.*