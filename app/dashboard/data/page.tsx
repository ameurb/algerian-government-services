'use client';

import { useState, useRef } from 'react';
import { 
  Download, 
  Upload, 
  FileText, 
  Database,
  CheckCircle,
  AlertCircle,
  Loader2,
  File,
  Table,
  BarChart3
} from 'lucide-react';

interface ExportJob {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  format: 'csv' | 'json' | 'excel';
  table: string;
  recordCount: number;
  fileSize?: string;
  downloadUrl?: string;
  error?: string;
  createdAt: string;
}

interface ImportJob {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  fileName: string;
  format: 'csv' | 'json' | 'excel';
  recordsProcessed: number;
  recordsTotal: number;
  error?: string;
  createdAt: string;
}

export default function DataManagementPage() {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [selectedTable, setSelectedTable] = useState('government_services');
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'excel'>('csv');
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tables = [
    { name: 'government_services', label: 'Government Services', count: 8 },
    { name: 'chat_sessions', label: 'Chat Sessions', count: 0 },
    { name: 'chat_messages', label: 'Chat Messages', count: 0 },
    { name: 'ai_templates', label: 'AI Templates', count: 4 },
    { name: 'service_analytics', label: 'Service Analytics', count: 0 }
  ];

  const formats = [
    { 
      id: 'csv' as const, 
      name: 'CSV', 
      description: 'Comma-separated values, Excel compatible',
      icon: Table,
      color: 'green'
    },
    { 
      id: 'json' as const, 
      name: 'JSON', 
      description: 'JavaScript Object Notation for APIs',
      icon: FileText,
      color: 'blue'
    },
    { 
      id: 'excel' as const, 
      name: 'Excel', 
      description: 'Microsoft Excel spreadsheet format',
      icon: BarChart3,
      color: 'orange'
    }
  ];

  const startExport = async () => {
    setProcessing(true);
    
    try {
      const response = await fetch('/api/dashboard/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTable,
          format: selectedFormat
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Start polling for job status
        pollExportJob(result.jobId);
      } else {
        alert('Export failed: ' + result.error);
      }
    } catch (error) {
      alert('Export failed: ' + error);
    } finally {
      setProcessing(false);
    }
  };

  const pollExportJob = async (jobId: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/dashboard/export-status/${jobId}`);
        const job = await response.json();
        
        setExportJobs(prev => {
          const updated = prev.filter(j => j.id !== jobId);
          return [...updated, job];
        });

        if (job.status === 'completed' || job.status === 'failed' || attempts >= maxAttempts) {
          return;
        }

        attempts++;
        setTimeout(poll, 1000);
      } catch (error) {
        console.error('Polling failed:', error);
      }
    };

    poll();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('table', selectedTable);

    setProcessing(true);

    try {
      const response = await fetch('/api/dashboard/import', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        pollImportJob(result.jobId);
      } else {
        alert('Import failed: ' + result.error);
      }
    } catch (error) {
      alert('Import failed: ' + error);
    } finally {
      setProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const pollImportJob = async (jobId: string) => {
    // Similar polling logic for import jobs
    const poll = async () => {
      try {
        const response = await fetch(`/api/dashboard/import-status/${jobId}`);
        const job = await response.json();
        
        setImportJobs(prev => {
          const updated = prev.filter(j => j.id !== jobId);
          return [...updated, job];
        });

        if (job.status !== 'processing') {
          return;
        }

        setTimeout(poll, 1000);
      } catch (error) {
        console.error('Import polling failed:', error);
      }
    };

    poll();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="w-6 h-6 text-green-600" />
          Data Import/Export
        </h1>
        <p className="text-gray-600">Import and export data in multiple formats (CSV, JSON, Excel)</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'export' as const, name: 'Export Data', icon: Download },
              { id: 'import' as const, name: 'Import Data', icon: Upload }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'export' ? (
            <ExportPanel
              tables={tables}
              formats={formats}
              selectedTable={selectedTable}
              selectedFormat={selectedFormat}
              processing={processing}
              onTableChange={setSelectedTable}
              onFormatChange={setSelectedFormat}
              onExport={startExport}
            />
          ) : (
            <ImportPanel
              tables={tables}
              processing={processing}
              fileInputRef={fileInputRef}
              selectedTable={selectedTable}
              onTableChange={setSelectedTable}
              onFileImport={handleFileImport}
            />
          )}
        </div>
      </div>

      {/* Jobs Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Jobs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-green-500" />
            Export Jobs
          </h3>
          
          <div className="space-y-3">
            {exportJobs.length === 0 ? (
              <p className="text-gray-500 text-sm">No export jobs yet</p>
            ) : (
              exportJobs.map((job) => (
                <ExportJobCard key={job.id} job={job} />
              ))
            )}
          </div>
        </div>

        {/* Import Jobs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-500" />
            Import Jobs
          </h3>
          
          <div className="space-y-3">
            {importJobs.length === 0 ? (
              <p className="text-gray-500 text-sm">No import jobs yet</p>
            ) : (
              importJobs.map((job) => (
                <ImportJobCard key={job.id} job={job} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportPanel({ tables, formats, selectedTable, selectedFormat, processing, onTableChange, onFormatChange, onExport }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Table Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Table
            </label>
            <div className="space-y-2">
              {tables.map((table: any) => (
                <label key={table.name} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="table"
                    value={table.name}
                    checked={selectedTable === table.name}
                    onChange={(e) => onTableChange(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{table.label}</div>
                    <div className="text-sm text-gray-500">{table.count} records</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="space-y-2">
              {formats.map((format: any) => (
                <label key={format.id} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="format"
                    value={format.id}
                    checked={selectedFormat === format.id}
                    onChange={(e) => onFormatChange(e.target.value as any)}
                    className="mr-3"
                  />
                  <format.icon className={`w-5 h-5 mr-3 text-${format.color}-500`} />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{format.name}</div>
                    <div className="text-sm text-gray-500">{format.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onExport}
        disabled={processing}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        {processing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
        {processing ? 'Exporting...' : 'Start Export'}
      </button>
    </div>
  );
}

function ImportPanel({ tables, processing, fileInputRef, selectedTable, onTableChange, onFileImport }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Configuration</h3>
        
        <div className="space-y-4">
          {/* Table Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Table
            </label>
            <select
              value={selectedTable}
              onChange={(e) => onTableChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {tables.map((table: any) => (
                <option key={table.name} value={table.name}>
                  {table.label} ({table.count} records)
                </option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Supports CSV, JSON, and Excel files
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,.xlsx,.xls"
                onChange={onFileImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={processing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <File className="w-4 h-4" />
                Choose File
              </button>
            </div>
          </div>

          {/* Import Options */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Import Guidelines</h4>
                <ul className="mt-1 text-sm text-yellow-700 space-y-1">
                  <li>• Ensure column names match database schema</li>
                  <li>• CSV files should use UTF-8 encoding for Arabic text</li>
                  <li>• JSON files should be arrays of objects</li>
                  <li>• Excel files will use the first worksheet</li>
                  <li>• Existing records with same ID will be updated</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportJobCard({ job }: { job: ExportJob }) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <JobStatusIcon status={job.status} />
          <span className="font-medium text-gray-900">{job.table}</span>
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
            {job.format.toUpperCase()}
          </span>
        </div>
        
        {job.status === 'completed' && job.downloadUrl && (
          <a
            href={job.downloadUrl}
            download
            className="text-blue-600 hover:text-blue-800"
          >
            <Download className="w-4 h-4" />
          </a>
        )}
      </div>
      
      <div className="text-sm text-gray-600">
        {job.recordCount} records • {job.fileSize || 'Processing...'} • {new Date(job.createdAt).toLocaleString()}
      </div>
      
      {job.error && (
        <div className="mt-2 text-sm text-red-600">{job.error}</div>
      )}
    </div>
  );
}

function ImportJobCard({ job }: { job: ImportJob }) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <JobStatusIcon status={job.status} />
        <span className="font-medium text-gray-900">{job.fileName}</span>
        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
          {job.format.toUpperCase()}
        </span>
      </div>
      
      <div className="text-sm text-gray-600">
        {job.recordsProcessed} / {job.recordsTotal} records • {new Date(job.createdAt).toLocaleString()}
      </div>
      
      {job.status === 'processing' && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${(job.recordsProcessed / job.recordsTotal) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {job.error && (
        <div className="mt-2 text-sm text-red-600">{job.error}</div>
      )}
    </div>
  );
}

function JobStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'failed':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case 'processing':
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    default:
      return <div className="w-5 h-5 bg-gray-300 rounded-full" />;
  }
}