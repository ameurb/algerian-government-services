'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  MessageCircle, 
  Database, 
  Brain,
  Globe,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface DashboardStats {
  totalServices: number;
  totalSessions: number;
  totalMessages: number;
  servicesByCategory: { category: string; count: number }[];
  messagesByLanguage: { language: string; count: number }[];
  recentActivity: any[];
  systemHealth: {
    database: 'healthy' | 'warning' | 'error';
    ai: 'healthy' | 'warning' | 'error';
    streaming: 'healthy' | 'warning' | 'error';
  };
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
        <p className="text-gray-600">Comprehensive statistics and system health monitoring</p>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          System Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HealthCard 
            title="Database" 
            status={stats?.systemHealth.database || 'error'}
            description="SQLite database connection and performance"
          />
          <HealthCard 
            title="AI Services" 
            status={stats?.systemHealth.ai || 'error'}
            description="OpenAI API and query processing"
          />
          <HealthCard 
            title="Streaming" 
            status={stats?.systemHealth.streaming || 'error'}
            description="Real-time response streaming"
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Services"
          value={stats?.totalServices || 0}
          icon={Database}
          color="blue"
          description="Government services in database"
        />
        <MetricCard
          title="Chat Sessions"
          value={stats?.totalSessions || 0}
          icon={Users}
          color="green"
          description="Active user sessions"
        />
        <MetricCard
          title="Messages"
          value={stats?.totalMessages || 0}
          icon={MessageCircle}
          color="purple"
          description="Total messages processed"
        />
        <MetricCard
          title="AI Queries"
          value={stats?.totalMessages ? Math.floor(stats.totalMessages / 2) : 0}
          icon={Brain}
          color="orange"
          description="AI responses generated"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services by Category */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Services by Category
          </h3>
          <div className="space-y-3">
            {stats?.servicesByCategory.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{item.category}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(item.count / (stats?.totalServices || 1)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-8 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Messages by Language */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-500" />
            Messages by Language
          </h3>
          <div className="space-y-3">
            {stats?.messagesByLanguage.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  {item.language === 'ar' && '🇩🇿 العربية'}
                  {item.language === 'en' && '🇬🇧 English'}
                  {item.language === 'fr' && '🇫🇷 Français'}
                  {!['ar', 'en', 'fr'].includes(item.language) && `🌐 ${item.language}`}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${(item.count / (stats?.totalMessages || 1)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-8 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-500" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {stats?.recentActivity.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent activity</p>
          ) : (
            stats?.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.content?.substring(0, 60)}...
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.language} • {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  icon: any;
  color: 'blue' | 'green' | 'purple' | 'orange';
  description: string;
}

function MetricCard({ title, value, icon: Icon, color, description }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-600 bg-blue-50',
    green: 'bg-green-500 text-green-600 bg-green-50',
    purple: 'bg-purple-500 text-purple-600 bg-purple-50',
    orange: 'bg-orange-500 text-orange-600 bg-orange-50'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <div className={`w-12 h-12 ${colorClasses[color].split(' ')[2]} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colorClasses[color].split(' ')[1]}`} />
        </div>
      </div>
    </div>
  );
}

interface HealthCardProps {
  title: string;
  status: 'healthy' | 'warning' | 'error';
  description: string;
}

function HealthCard({ title, status, description }: HealthCardProps) {
  const statusConfig = {
    healthy: { 
      color: 'text-green-600', 
      bg: 'bg-green-50', 
      icon: CheckCircle,
      text: 'Healthy'
    },
    warning: { 
      color: 'text-yellow-600', 
      bg: 'bg-yellow-50', 
      icon: AlertCircle,
      text: 'Warning'
    },
    error: { 
      color: 'text-red-600', 
      bg: 'bg-red-50', 
      icon: AlertCircle,
      text: 'Error'
    }
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className={`p-4 rounded-lg border ${config.bg}`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 ${config.bg} rounded-full flex items-center justify-center`}>
          <StatusIcon className={`w-4 h-4 ${config.color}`} />
        </div>
        <div>
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className={`text-sm font-medium ${config.color}`}>{config.text}</p>
        </div>
      </div>
      <p className="text-xs text-gray-600 mt-2">{description}</p>
    </div>
  );
}