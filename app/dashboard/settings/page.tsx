'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Key,
  Database,
  Zap,
  Globe
} from 'lucide-react';

interface SystemConfig {
  aiProvider: string;
  aiModel: string;
  defaultLanguage: string;
  maxTokens: number;
  temperature: number;
  enableAnalytics: boolean;
  enableDebugMode: boolean;
  cacheEnabled: boolean;
  rateLimitEnabled: boolean;
  maxRequestsPerMinute: number;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<SystemConfig>({
    aiProvider: 'openai',
    aiModel: 'gpt-4o-mini',
    defaultLanguage: 'ar',
    maxTokens: 2000,
    temperature: 0.3,
    enableAnalytics: true,
    enableDebugMode: false,
    cacheEnabled: true,
    rateLimitEnabled: true,
    maxRequestsPerMinute: 60
  });
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    openai: false,
    anthropic: false,
    google: false,
    mistral: false
  });

  useEffect(() => {
    fetchConfig();
    checkApiKeys();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/dashboard/config');
      const data = await response.json();
      setConfig({ ...config, ...data.config });
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  };

  const checkApiKeys = async () => {
    try {
      const response = await fetch('/api/dashboard/api-keys-status');
      const data = await response.json();
      setApiKeys(data.apiKeys || {});
    } catch (error) {
      console.error('Failed to check API keys:', error);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch('/api/dashboard/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert('Failed to save configuration');
      }
    } catch (error) {
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-gray-600" />
          System Settings
        </h1>
        <p className="text-gray-600">Configure AI providers, performance settings, and system behavior</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              AI Configuration
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Provider
                </label>
                <select
                  value={config.aiProvider}
                  onChange={(e) => setConfig({ ...config, aiProvider: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="google">Google (Gemini)</option>
                  <option value="mistral">Mistral AI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Model
                </label>
                <select
                  value={config.aiModel}
                  onChange={(e) => setConfig({ ...config, aiModel: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {config.aiProvider === 'openai' && (
                    <>
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="gpt-4o-mini">GPT-4o Mini</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </>
                  )}
                  {config.aiProvider === 'anthropic' && (
                    <>
                      <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                      <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                    </>
                  )}
                  {config.aiProvider === 'google' && (
                    <>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    </>
                  )}
                  {config.aiProvider === 'mistral' && (
                    <>
                      <option value="mistral-large-latest">Mistral Large</option>
                      <option value="mistral-small-latest">Mistral Small</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={config.maxTokens}
                  onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="100"
                  max="10000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature
                </label>
                <input
                  type="number"
                  value={config.temperature}
                  onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="2"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              System Settings
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Enable Analytics</label>
                  <p className="text-xs text-gray-500">Track user interactions and service usage</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableAnalytics}
                  onChange={(e) => setConfig({ ...config, enableAnalytics: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Debug Mode</label>
                  <p className="text-xs text-gray-500">Enable detailed logging and debugging</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableDebugMode}
                  onChange={(e) => setConfig({ ...config, enableDebugMode: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Cache Enabled</label>
                  <p className="text-xs text-gray-500">Cache responses for better performance</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.cacheEnabled}
                  onChange={(e) => setConfig({ ...config, cacheEnabled: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Rate Limiting</label>
                  <p className="text-xs text-gray-500">Limit requests per minute</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.rateLimitEnabled}
                  onChange={(e) => setConfig({ ...config, rateLimitEnabled: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              {config.rateLimitEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Requests Per Minute
                  </label>
                  <input
                    type="number"
                    value={config.maxRequestsPerMinute}
                    onChange={(e) => setConfig({ ...config, maxRequestsPerMinute: parseInt(e.target.value) })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="1000"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* API Keys Status */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-yellow-500" />
              API Keys Status
            </h2>
            
            <div className="space-y-3">
              {Object.entries(apiKeys).map(([provider, hasKey]) => (
                <div key={provider} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{provider}</p>
                    <p className="text-xs text-gray-500">
                      {provider.toUpperCase()}_API_KEY
                    </p>
                  </div>
                  
                  {hasKey ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Configured</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Missing</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Environment Configuration</h4>
              <p className="text-sm text-blue-700 mb-2">
                Add these environment variables to your .env file:
              </p>
              <div className="space-y-1 text-xs font-mono text-blue-800">
                <div>OPENAI_API_KEY=your_openai_key_here</div>
                <div>ANTHROPIC_API_KEY=your_anthropic_key_here</div>
                <div>GOOGLE_GENERATIVE_AI_API_KEY=your_google_key_here</div>
                <div>MISTRAL_API_KEY=your_mistral_key_here</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            
            <div className="space-y-3">
              <button
                onClick={checkApiKeys}
                className="w-full flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh API Keys Status
              </button>
              
              <button
                onClick={() => window.open('/api/dashboard/stats', '_blank')}
                className="w-full flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
              >
                <Database className="w-4 h-4" />
                View Raw Statistics
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Save Configuration</h3>
            <p className="text-sm text-gray-600">Apply changes to the system</p>
          </div>
          
          <div className="flex items-center gap-3">
            {saved && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Saved!</span>
              </div>
            )}
            
            <button
              onClick={saveConfig}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}