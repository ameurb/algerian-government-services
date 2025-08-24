'use client';

import { useState, useEffect } from 'react';
import { 
  Database, 
  Table, 
  Eye, 
  Search, 
  Filter,
  MoreVertical,
  Edit3,
  Trash2,
  Plus,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';

interface TableInfo {
  name: string;
  count: number;
  columns: ColumnInfo[];
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
}

interface DatabaseRecord {
  [key: string]: any;
}

export default function DatabasePage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<DatabaseRecord[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  const pageSize = 20;

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData();
    }
  }, [selectedTable, currentPage, searchTerm]);

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/dashboard/database-tables');
      const data = await response.json();
      setTables(data.tables || []);
      
      if (data.tables && data.tables.length > 0) {
        setSelectedTable(data.tables[0].name);
      }
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async () => {
    if (!selectedTable) return;
    
    setTableLoading(true);
    try {
      const response = await fetch('/api/dashboard/database-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTable,
          page: currentPage,
          pageSize,
          search: searchTerm
        })
      });
      
      const data = await response.json();
      setTableData(data.records || []);
      setTotalPages(Math.ceil((data.total || 0) / pageSize));
      
      // Set default visible columns
      if (data.records && data.records.length > 0) {
        const columns = Object.keys(data.records[0]);
        setVisibleColumns(columns.slice(0, 6)); // Show first 6 columns by default
      }
    } catch (error) {
      console.error('Failed to fetch table data:', error);
    } finally {
      setTableLoading(false);
    }
  };

  const toggleColumn = (columnName: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnName)
        ? prev.filter(col => col !== columnName)
        : [...prev, columnName]
    );
  };

  const exportTableData = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch('/api/dashboard/export-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTable,
          format,
          search: searchTerm
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedTable}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">
      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-600" />
          Database Explorer
        </h1>
        <p className="text-gray-600">Visualize and manage SQLite database collections</p>
      </div>

      {/* Database Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tables.map((table) => (
          <div
            key={table.name}
            onClick={() => setSelectedTable(table.name)}
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              selectedTable === table.name
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <Table className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">{table.name}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">{table.count} records</p>
            <p className="text-xs text-gray-500">{table.columns.length} columns</p>
          </div>
        ))}
      </div>

      {/* Table Data Viewer */}
      {selectedTable && (
        <div className="bg-white rounded-lg shadow">
          {/* Table Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Table className="w-5 h-5" />
                {selectedTable}
              </h2>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => exportTableData('csv')}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                <button
                  onClick={() => exportTableData('json')}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Download className="w-4 h-4" />
                  JSON
                </button>
                <button
                  onClick={fetchTableData}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search records..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="relative">
                <select
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    const allColumns = tables.find(t => t.name === selectedTable)?.columns.map(c => c.name) || [];
                    if (e.target.value === 'all') {
                      setVisibleColumns(allColumns);
                    } else if (e.target.value === 'essential') {
                      setVisibleColumns(allColumns.slice(0, 4));
                    }
                  }}
                >
                  <option value="essential">Essential Columns</option>
                  <option value="all">All Columns</option>
                </select>
              </div>
            </div>
          </div>

          {/* Column Selector */}
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Visible Columns:</p>
            <div className="flex flex-wrap gap-2">
              {tables.find(t => t.name === selectedTable)?.columns.map((column) => (
                <button
                  key={column.name}
                  onClick={() => toggleColumn(column.name)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    visibleColumns.includes(column.name)
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  {column.name}
                  {column.primaryKey && <span className="ml-1">🔑</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Table Data */}
          <div className="overflow-x-auto">
            {tableLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {visibleColumns.map((column) => (
                      <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {column}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableData.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {visibleColumns.map((column) => (
                        <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="max-w-xs overflow-hidden text-ellipsis" dir="auto">
                            {formatCellValue(record[column])}
                          </div>
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatCellValue(value: any): string {
  if (value === null || value === undefined) {
    return '—';
  }
  
  if (typeof value === 'boolean') {
    return value ? '✓' : '✗';
  }
  
  if (typeof value === 'string' && value.length > 100) {
    return value.substring(0, 100) + '...';
  }
  
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  
  return String(value);
}