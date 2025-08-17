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
  Search
} from 'lucide-react';

interface DashboardStats {
  totalServices: number;
  totalUsers: number;
  totalChats: number;
  apiCalls: number;
  mcpHealth: string;
  dbConnections: number;
}

interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  lastUsed: string;
  isActive: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch statistics from MCP server
      const statsResponse = await fetch('/api/dashboard/stats');
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch API keys
      const keysResponse = await fetch('/api/dashboard/api-keys');
      const keysData = await keysResponse.json();
      setApiKeys(keysData);

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Government Services Management</h2>
                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2">
                  <Plus size={16} />
                  Add New Service
                </button>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-gray-600">Services management interface will be implemented here.</p>
                <p className="text-sm text-gray-500 mt-2">Features: Add, edit, delete services, bulk import, category management</p>
              </div>
            </div>
          )}

          {activeTab === 'api-keys' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">API Keys Management</h2>
                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2">
                  <Plus size={16} />
                  Generate New Key
                </button>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Active API Keys</h3>
                  <p className="text-sm text-gray-600">Manage access to MCP server and APIs</p>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {apiKeys.map((apiKey) => (
                      <div key={apiKey.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{apiKey.name}</p>
                          <p className="text-sm text-gray-500">Last used: {apiKey.lastUsed}</p>
                          <div className="flex gap-2 mt-2">
                            {apiKey.permissions.map((perm) => (
                              <span key={perm} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {perm}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            apiKey.isActive ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <button className="p-2 text-gray-400 hover:text-gray-600">
                            <Edit size={16} />
                          </button>
                          <button className="p-2 text-red-400 hover:text-red-600">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder for other tabs */}
          {activeTab !== 'overview' && activeTab !== 'services' && activeTab !== 'api-keys' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 capitalize">{activeTab.replace('-', ' ')} Management</h2>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-gray-600">This section is under development.</p>
                <p className="text-sm text-gray-500 mt-2">
                  {activeTab === 'mcp-tools' && 'Manage MCP server tools, add new tools, configure tool parameters'}
                  {activeTab === 'templates' && 'Manage response templates, create new templates, organize by category'}
                  {activeTab === 'collections' && 'Database collection management, add/remove collections, data import/export'}
                  {activeTab === 'config' && 'MCP server configuration, environment variables, performance settings'}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}