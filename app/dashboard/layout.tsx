import { ReactNode } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  Database, 
  Search, 
  Settings, 
  FileText, 
  Download, 
  Upload,
  Brain,
  Home,
  Bug,
  Eye
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: BarChart3, description: 'System statistics and overview' },
  { name: 'Query Debugger', href: '/dashboard/debugger', icon: Bug, description: 'Debug and visualize queries' },
  { name: 'AI Providers', href: '/dashboard/providers', icon: Brain, description: 'Manage AI models and providers' },
  { name: 'Templates', href: '/dashboard/templates', icon: FileText, description: 'Manage AI response templates' },
  { name: 'Database', href: '/dashboard/database', icon: Database, description: 'Visualize SQLite database' },
  { name: 'Import/Export', href: '/dashboard/data', icon: Download, description: 'Data import and export tools' },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, description: 'System configuration' }
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🇩🇿</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Government Services Dashboard
                  </h1>
                  <p className="text-xs text-gray-500">AI-Powered Administration</p>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Home className="w-4 h-4" />
                Back to App
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen border-r border-gray-200">
          <div className="p-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Dashboard
            </h2>
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <item.icon className="flex-shrink-0 w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-500" />
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500 group-hover:text-blue-600">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}