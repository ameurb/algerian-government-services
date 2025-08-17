'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Server, 
  Settings, 
  BarChart, 
  Key, 
  FileText, 
  Users, 
  Activity,
  Plus,
  Trash2,
  Edit,
  Search,
  Shield
} from 'lucide-react';

interface DashboardStats {
  totalServices: number;
  totalUsers: number;
  totalChats: number;
  apiCalls: number;
  mcpHealth: string;
  dbConnections: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    console.log('🔄 Fetching dashboard data...');
    
    try {
      // Fetch statistics from dashboard API
      const response = await fetch('/api/dashboard/stats');
      console.log('📊 Stats response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Stats data received:', Object.keys(data));
        setStats(data);
        setLoading(false);
      } else {
        console.error('❌ Failed to fetch stats, status:', response.status);
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Dashboard fetch error:', error);
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart },
    { id: 'services', name: 'Services', icon: Database },
    { id: 'mcp-tools', name: 'MCP Tools', icon: Server },
    { id: 'api-keys', name: 'API Keys', icon: Key },
    { id: 'templates', name: 'Templates', icon: FileText },
    { id: 'collections', name: 'Collections', icon: Database },
    { id: 'config', name: 'Configuration', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Dashboard...</p>
          <p className="text-xs text-gray-500 mt-2">Fetching system statistics...</p>
        </div>
      </div>
    );
  }

  // Add error state
  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">⚠️</span>
          </div>
          <p className="text-gray-900 font-medium">Dashboard Error</p>
          <p className="text-gray-600">Failed to load dashboard data</p>
          <button 
            onClick={() => { setLoading(true); fetchDashboardData(); }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">🇩🇿</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Algerian Services Dashboard</h1>
              <p className="text-sm text-gray-600">api.findapply.com Admin Panel</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="/"
              className="px-4 py-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to Chat
            </a>
            <div className={`px-3 py-1 rounded-full text-sm ${
              stats?.mcpHealth === 'healthy' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {stats?.mcpHealth === 'healthy' ? '🟢 Online' : '🔴 Offline'}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Government Services</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.totalServices || 0}</p>
                    </div>
                    <Database className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Users</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                    </div>
                    <Users className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Chats</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.totalChats || 0}</p>
                    </div>
                    <Activity className="w-8 h-8 text-purple-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">API Calls Today</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.apiCalls || 0}</p>
                    </div>
                    <BarChart className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => setActiveTab('services')}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-blue-500" />
                    <span>Add New Service</span>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('mcp-tools')}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-5 h-5 text-green-500" />
                    <span>Configure MCP Tools</span>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('api-keys')}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Key className="w-5 h-5 text-purple-500" />
                    <span>Manage API Keys</span>
                  </button>
                </div>
              </div>

              {/* System Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Database</p>
                    <p className="font-medium">MongoDB Atlas</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">MCP Server</p>
                    <p className="font-medium">Port 8080 - {stats?.mcpHealth || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Domain</p>
                    <p className="font-medium">api.findapply.com</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Environment</p>
                    <p className="font-medium">Production</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other tabs placeholder */}
          {activeTab !== 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 capitalize">
                {activeTab.replace('-', ' ')} Management
              </h2>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')} Management
                  </h3>
                  <p className="text-gray-600 mb-4">
                    This section will allow you to manage {activeTab.replace('-', ' ')}.
                  </p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-sm text-blue-800">
                      <strong>Coming Soon:</strong> 
                      {activeTab === 'services' && ' Add, edit, delete government services, bulk import, category management'}
                      {activeTab === 'mcp-tools' && ' Configure MCP tools, add custom tools, manage parameters'}
                      {activeTab === 'api-keys' && ' Generate API keys, set permissions, monitor usage'}
                      {activeTab === 'templates' && ' Create response templates, manage translations, organize by category'}
                      {activeTab === 'collections' && ' Database management, collection operations, data import/export'}
                      {activeTab === 'config' && ' System configuration, environment variables, performance tuning'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}