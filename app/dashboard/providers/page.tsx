'use client';

import { useState, useEffect } from 'react';
import { AI_PROVIDERS, AIProvider, AIModel, aiProviderManager } from '@/lib/ai-providers';
import { 
  Brain, 
  Check, 
  X, 
  Settings, 
  Zap, 
  DollarSign,
  Clock,
  Star,
  AlertCircle
} from 'lucide-react';

export default function AIProvidersPage() {
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [providerConfig, setProviderConfig] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    updateProviderConfig();
  }, [selectedProvider, selectedModel]);

  const updateProviderConfig = async () => {
    try {
      const response = await fetch('/api/dashboard/provider-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          providerId: selectedProvider, 
          modelId: selectedModel 
        })
      });
      const config = await response.json();
      setProviderConfig(config);
    } catch (error) {
      console.error('Failed to update provider config:', error);
    }
  };

  const testProvider = async () => {
    setTesting(true);
    setTestResults(null);

    try {
      const response = await fetch('/api/dashboard/test-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: selectedProvider,
          modelId: selectedModel,
          testQuery: 'كيف أحصل على بطاقة التعريف؟'
        })
      });
      
      const results = await response.json();
      setTestResults(results);
    } catch (error) {
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Test failed'
      });
    } finally {
      setTesting(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      await fetch('/api/dashboard/save-provider-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: selectedProvider,
          modelId: selectedModel
        })
      });
      
      alert('Configuration saved successfully!');
    } catch (error) {
      alert('Failed to save configuration');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-600" />
          AI Providers
        </h1>
        <p className="text-gray-600">Manage AI models and providers for the government services assistant</p>
      </div>

      {/* Current Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Configuration</h2>
        
        {providerConfig && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-600">Provider</p>
              <p className="text-lg font-bold text-blue-900">{providerConfig.provider}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-600">Model</p>
              <p className="text-lg font-bold text-green-900">{providerConfig.model}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-purple-600">Max Tokens</p>
              <p className="text-lg font-bold text-purple-900">{providerConfig.maxTokens?.toLocaleString()}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-orange-600">Status</p>
              <p className={`text-lg font-bold ${providerConfig.supported ? 'text-green-900' : 'text-red-900'}`}>
                {providerConfig.supported ? 'Ready' : 'Missing API Key'}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={testProvider}
            disabled={testing || !providerConfig?.supported}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            {testing ? 'Testing...' : 'Test Provider'}
          </button>
          
          <button
            onClick={saveConfiguration}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Settings className="w-4 h-4" />
            Save Configuration
          </button>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className={`mt-4 p-4 rounded-lg ${testResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h4 className={`font-medium ${testResults.success ? 'text-green-900' : 'text-red-900'}`}>
              Test Results
            </h4>
            {testResults.success ? (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-green-700">✅ Provider connection successful</p>
                <p className="text-sm text-green-700">Response time: {testResults.responseTime}ms</p>
                <p className="text-sm text-green-700">Tokens used: {testResults.tokensUsed}</p>
                <details className="mt-2">
                  <summary className="text-sm font-medium text-green-800 cursor-pointer">View Response</summary>
                  <pre className="mt-2 text-xs text-green-700 bg-green-100 p-2 rounded overflow-auto max-h-32">
                    {testResults.response}
                  </pre>
                </details>
              </div>
            ) : (
              <p className="mt-2 text-sm text-red-700">❌ {testResults.error}</p>
            )}
          </div>
        )}
      </div>

      {/* Provider Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select AI Provider</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {AI_PROVIDERS.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              selected={selectedProvider === provider.id}
              onSelect={() => {
                setSelectedProvider(provider.id);
                setSelectedModel(provider.models[0].id);
              }}
            />
          ))}
        </div>
      </div>

      {/* Model Selection */}
      {selectedProvider && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Model</h2>
          
          <div className="space-y-3">
            {AI_PROVIDERS.find(p => p.id === selectedProvider)?.models.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                selected={selectedModel === model.id}
                onSelect={() => setSelectedModel(model.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* API Key Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">API Key Configuration</h2>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Environment Variables Required</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Configure the following environment variables in your .env file:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                  <li>• OPENAI_API_KEY - For OpenAI models</li>
                  <li>• ANTHROPIC_API_KEY - For Claude models</li>
                  <li>• GOOGLE_GENERATIVE_AI_API_KEY - For Gemini models</li>
                  <li>• MISTRAL_API_KEY - For Mistral models</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {AI_PROVIDERS.map((provider) => (
              <div key={provider.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{provider.icon}</span>
                  <h4 className="font-medium text-gray-900">{provider.name}</h4>
                </div>
                <div className="flex items-center gap-2">
                  {provider.requiresApiKey ? (
                    <>
                      {getApiKeyStatus(provider.id) ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm ${getApiKeyStatus(provider.id) ? 'text-green-700' : 'text-red-700'}`}>
                        {getApiKeyStatus(provider.id) ? 'API Key Set' : 'API Key Missing'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-blue-700">No API Key Required</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProviderCard({ provider, selected, onSelect }: {
  provider: AIProvider;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        selected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{provider.icon}</span>
        <div>
          <h3 className="font-semibold text-gray-900">{provider.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            {provider.supported ? (
              <div className="flex items-center gap-1 text-green-600">
                <Check className="w-3 h-3" />
                <span className="text-xs">Available</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600">
                <X className="w-3 h-3" />
                <span className="text-xs">API Key Missing</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-600">{provider.description}</p>
      <div className="mt-3 text-xs text-gray-500">
        {provider.models.length} model{provider.models.length !== 1 ? 's' : ''} available
      </div>
    </div>
  );
}

function ModelCard({ model, selected, onSelect }: {
  model: AIModel;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        selected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-gray-900">{model.name}</h4>
            {model.recommended && (
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3">{model.description}</p>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-500">Max Tokens:</span>
              <span className="ml-1 font-medium">{model.maxTokens.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-500">Cost/1K:</span>
              <span className="ml-1 font-medium">${model.costPer1kTokens}</span>
            </div>
          </div>
          
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1">Capabilities:</p>
            <div className="flex flex-wrap gap-1">
              {model.capabilities.map((cap) => (
                <span key={cap} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                  {cap}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getApiKeyStatus(providerId: string): boolean {
  // This would normally check environment variables
  // For demo purposes, we'll simulate based on provider
  switch (providerId) {
    case 'openai':
      return typeof window !== 'undefined' ? true : !!process.env.OPENAI_API_KEY;
    case 'anthropic':
      return typeof window !== 'undefined' ? false : !!process.env.ANTHROPIC_API_KEY;
    case 'google':
      return typeof window !== 'undefined' ? false : !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    case 'mistral':
      return typeof window !== 'undefined' ? false : !!process.env.MISTRAL_API_KEY;
    default:
      return false;
  }
}