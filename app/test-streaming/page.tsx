'use client';

import { useState } from 'react';

export default function TestStreaming() {
  const [messages, setMessages] = useState<string[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [stage, setStage] = useState('');
  const [progress, setProgress] = useState(0);

  const testStreaming = async () => {
    setIsStreaming(true);
    setCurrentMessage('');
    setMessages(prev => [...prev, 'User: National ID']);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'National ID',
          sessionId: 'test-stream-' + Date.now()
        })
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'processing_stage':
                  setStage(`${data.emoji} ${data.message}`);
                  setProgress(data.progress);
                  setMessages(prev => [...prev, `Stage: ${data.message} (${Math.round(data.progress)}%)`]);
                  break;
                  
                case 'text_chunk':
                  setCurrentMessage(data.text);
                  break;
                  
                case 'response_complete':
                  setMessages(prev => [...prev, `Assistant: ${data.content}`]);
                  setCurrentMessage('');
                  setIsStreaming(false);
                  setStage('');
                  setProgress(0);
                  break;
              }
            } catch (e) {
              console.warn('Parse error:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      setMessages(prev => [...prev, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      setIsStreaming(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 Streaming Test Page</h1>
      
      <button 
        onClick={testStreaming}
        disabled={isStreaming}
        style={{
          padding: '12px 24px',
          backgroundColor: isStreaming ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: isStreaming ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {isStreaming ? 'Streaming...' : 'Test Streaming'}
      </button>

      {stage && (
        <div style={{
          padding: '15px',
          backgroundColor: '#e3f2fd',
          border: '1px solid #2196f3',
          borderRadius: '8px',
          marginBottom: '15px'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>{stage}</strong>
          </div>
          <div style={{
            width: '100%',
            backgroundColor: '#e0e0e0',
            borderRadius: '10px',
            height: '10px'
          }}>
            <div style={{
              width: `${progress}%`,
              backgroundColor: '#2196f3',
              height: '10px',
              borderRadius: '10px',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12px', marginTop: '5px' }}>
            {Math.round(progress)}%
          </div>
        </div>
      )}

      {currentMessage && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '8px',
          marginBottom: '15px'
        }}>
          <strong>🔄 Writing:</strong>
          <div style={{ marginTop: '10px', whiteSpace: 'pre-wrap' }}>
            {currentMessage}
            <span style={{
              display: 'inline-block',
              width: '2px',
              height: '20px',
              backgroundColor: '#007bff',
              marginLeft: '2px',
              animation: 'blink 1s infinite'
            }}></span>
          </div>
        </div>
      )}

      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '15px',
        maxHeight: '400px',
        overflowY: 'scroll',
        backgroundColor: 'white'
      }}>
        <h3>📋 Streaming Log:</h3>
        {messages.map((msg, index) => (
          <div key={index} style={{
            padding: '8px',
            borderBottom: '1px solid #eee',
            whiteSpace: 'pre-wrap'
          }}>
            {msg}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}