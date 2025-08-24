'use client';

import { useState } from 'react';
import { 
  Play, 
  Bug, 
  Eye, 
  Clock, 
  Brain,
  Database,
  MessageCircle,
  Search,
  FileText,
  ChevronDown,
  ChevronRight,
  Copy,
  Download
} from 'lucide-react';

interface DebugStep {
  step: number;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  duration?: number;
  data?: any;
  error?: string;
}

interface DebugSession {
  sessionId: string;
  query: string;
  timestamp: string;
  steps: DebugStep[];
  finalResponse?: string;
  totalDuration?: number;
}

export default function QueryDebugger() {
  const [query, setQuery] = useState('');
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugSession, setDebugSession] = useState<DebugSession | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const runDebugSession = async () => {
    if (!query.trim()) return;

    setIsDebugging(true);
    const sessionId = `debug_${Date.now()}`;
    const startTime = Date.now();

    const initialSteps: DebugStep[] = [
      { step: 1, name: 'Input Validation', status: 'pending' },
      { step: 2, name: 'AI Query Analysis', status: 'pending' },
      { step: 3, name: 'Database Search', status: 'pending' },
      { step: 4, name: 'Context Generation', status: 'pending' },
      { step: 5, name: 'AI Response Generation', status: 'pending' },
      { step: 6, name: 'Response Streaming', status: 'pending' }
    ];

    const session: DebugSession = {
      sessionId,
      query,
      timestamp: new Date().toISOString(),
      steps: initialSteps
    };

    setDebugSession(session);

    try {
      // Step 1: Input Validation
      await updateStep(session, 1, 'processing');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
      await updateStep(session, 1, 'completed', { 
        queryLength: query.length,
        hasArabic: /[\u0600-\u06FF]/.test(query),
        hasEnglish: /[a-zA-Z]/.test(query),
        estimatedLanguage: detectLanguage(query)
      });

      // Step 2: AI Query Analysis
      await updateStep(session, 2, 'processing');
      const analysisResponse = await fetch('/api/dashboard/debug-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const analysisData = await analysisResponse.json();
      await updateStep(session, 2, 'completed', analysisData);

      // Step 3: Database Search
      await updateStep(session, 3, 'processing');
      const searchResponse = await fetch('/api/dashboard/debug-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: analysisData.analysis?.searchKeywords || [query] })
      });
      const searchData = await searchResponse.json();
      await updateStep(session, 3, 'completed', searchData);

      // Step 4: Context Generation
      await updateStep(session, 4, 'processing');
      await new Promise(resolve => setTimeout(resolve, 800));
      await updateStep(session, 4, 'completed', {
        contextLength: 2500, // Estimated
        includesServices: searchData.services?.length || 0,
        templateUsed: 'enhanced_government_assistant'
      });

      // Step 5: AI Response Generation
      await updateStep(session, 5, 'processing');
      const responseResponse = await fetch('/api/dashboard/debug-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query,
          analysis: analysisData.analysis,
          services: searchData.services
        })
      });
      const responseData = await responseResponse.json();
      await updateStep(session, 5, 'completed', responseData);

      // Step 6: Response Streaming (simulation)
      await updateStep(session, 6, 'processing');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await updateStep(session, 6, 'completed', {
        streamingChunks: responseData.estimatedChunks || 100,
        streamingDuration: '3.2s',
        finalResponseLength: responseData.responseLength || 1500
      });

      session.finalResponse = responseData.response || 'Debug response generated successfully';
      session.totalDuration = Date.now() - startTime;
      setDebugSession({...session});

    } catch (error) {
      console.error('Debug session error:', error);
      // Mark current step as error
      const currentStep = session.steps.find(s => s.status === 'processing');
      if (currentStep) {
        await updateStep(session, currentStep.step, 'error', null, error instanceof Error ? error.message : 'Unknown error');
      }
    } finally {
      setIsDebugging(false);
    }
  };

  const updateStep = async (session: DebugSession, stepNumber: number, status: string, data?: any, error?: string) => {
    const updatedSteps = session.steps.map(step => 
      step.step === stepNumber 
        ? { ...step, status: status as any, data, error, duration: Date.now() }
        : step
    );
    
    session.steps = updatedSteps;
    setDebugSession({...session});
    
    // Small delay for visual effect
    await new Promise(resolve => setTimeout(resolve, 200));
  };

  const toggleStepExpansion = (stepNumber: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepNumber)) {
      newExpanded.delete(stepNumber);
    } else {
      newExpanded.add(stepNumber);
    }
    setExpandedSteps(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportDebugSession = () => {
    if (!debugSession) return;
    
    const exportData = {
      ...debugSession,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-session-${debugSession.sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bug className="w-6 h-6 text-purple-600" />
          Query Debugger
        </h1>
        <p className="text-gray-600">Debug and visualize the complete query processing pipeline</p>
      </div>

      {/* Query Input */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Query</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="debug-query" className="block text-sm font-medium text-gray-700 mb-2">
              Enter query to debug:
            </label>
            <textarea
              id="debug-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a query like 'كيف أحصل على جواز السفر؟' or 'How to get passport?'"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              dir="auto"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={runDebugSession}
              disabled={!query.trim() || isDebugging}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              {isDebugging ? 'Debugging...' : 'Start Debug Session'}
            </button>
            
            {debugSession && (
              <button
                onClick={exportDebugSession}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Export Session
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Debug Results */}
      {debugSession && (
        <div className="space-y-4">
          {/* Session Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Session Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Session ID</p>
                <p className="text-sm text-gray-900 font-mono">{debugSession.sessionId}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Query</p>
                <p className="text-sm text-gray-900" dir="auto">{debugSession.query}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Total Duration</p>
                <p className="text-sm text-gray-900">
                  {debugSession.totalDuration ? `${debugSession.totalDuration}ms` : 'In progress...'}
                </p>
              </div>
            </div>
          </div>

          {/* Processing Steps */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Steps</h3>
            
            <div className="space-y-3">
              {debugSession.steps.map((step) => (
                <div key={step.step} className="border border-gray-200 rounded-lg">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleStepExpansion(step.step)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <StepStatusIcon status={step.status} />
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Step {step.step}: {step.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {step.status === 'completed' && step.duration && `Completed in ${step.duration}ms`}
                            {step.status === 'processing' && 'Processing...'}
                            {step.status === 'pending' && 'Waiting...'}
                            {step.status === 'error' && `Error: ${step.error}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {step.data && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(JSON.stringify(step.data, null, 2));
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                        {expandedSteps.has(step.step) ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {expandedSteps.has(step.step) && step.data && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <pre className="text-xs text-gray-700 overflow-auto max-h-64 bg-white p-3 rounded border">
                        {JSON.stringify(step.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Final Response */}
          {debugSession.finalResponse && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-500" />
                Final Response
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap" dir="auto">
                  {debugSession.finalResponse}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sample Queries */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sample Debug Queries</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            'كيف أحصل على جواز السفر؟',
            'How to register a business?',
            'Comment obtenir une carte d\'identité?',
            'ما هي متطلبات رخصة السياقة؟',
            'Higher education grants',
            'Services de sécurité sociale'
          ].map((sampleQuery, index) => (
            <button
              key={index}
              onClick={() => setQuery(sampleQuery)}
              className="text-left p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm transition-colors"
              dir="auto"
            >
              {sampleQuery}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
      </div>;
    case 'processing':
      return <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
      </div>;
    case 'error':
      return <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
      </div>;
    default:
      return <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
      </div>;
  }
}

function detectLanguage(text: string): string {
  const arabicCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const englishCount = (text.match(/[a-zA-Z]/g) || []).length;
  const frenchCount = (text.match(/[àâäéèêëïîôùûüÿç]/gi) || []).length;
  
  if (arabicCount > englishCount && arabicCount > frenchCount) return 'Arabic';
  if (frenchCount > englishCount) return 'French';
  if (englishCount > 0) return 'English';
  return 'Mixed';
}