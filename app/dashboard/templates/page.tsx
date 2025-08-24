'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Eye,
  Copy,
  Download,
  Upload,
  Globe
} from 'lucide-react';

interface Template {
  id: number;
  name: string;
  description?: string;
  template: string;
  language: string;
  category?: string;
  variablesStr?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/dashboard/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (template: Partial<Template>) => {
    try {
      const url = template.id ? `/api/dashboard/templates/${template.id}` : '/api/dashboard/templates';
      const method = template.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });

      if (response.ok) {
        await fetchTemplates();
        setEditingTemplate(null);
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  const deleteTemplate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/dashboard/templates/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchTemplates();
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const exportTemplate = (template: Template) => {
    const exportData = {
      name: template.name,
      description: template.description,
      template: template.template,
      language: template.language,
      category: template.category,
      variables: template.variablesStr ? JSON.parse(template.variablesStr) : {},
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${template.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const newTemplate: Partial<Template> = {
    name: '',
    description: '',
    template: '',
    language: 'multilingual',
    category: '',
    isActive: true
  };

  if (loading) {
    return <div className="flex justify-center p-8">
      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            AI Templates
          </h1>
          <p className="text-gray-600">Manage AI response templates and prompts</p>
        </div>
        
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Templates ({templates.length})</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {templates.map((template) => (
            <TemplateRow
              key={template.id}
              template={template}
              onEdit={() => setEditingTemplate(template)}
              onPreview={() => setPreviewTemplate(template)}
              onDelete={() => deleteTemplate(template.id)}
              onExport={() => exportTemplate(template)}
            />
          ))}
          
          {templates.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No templates found. Create your first template to get started.
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(isCreating || editingTemplate) && (
        <TemplateEditor
          template={editingTemplate || newTemplate}
          onSave={saveTemplate}
          onCancel={() => {
            setIsCreating(false);
            setEditingTemplate(null);
          }}
        />
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
}

function TemplateRow({ template, onEdit, onPreview, onDelete, onExport }: {
  template: Template;
  onEdit: () => void;
  onPreview: () => void;
  onDelete: () => void;
  onExport: () => void;
}) {
  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-medium text-gray-900">{template.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              template.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {template.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {template.language}
            </span>
            {template.category && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                {template.category}
              </span>
            )}
          </div>
          
          {template.description && (
            <p className="text-sm text-gray-600 mb-2">{template.description}</p>
          )}
          
          <div className="text-xs text-gray-500">
            Created: {new Date(template.createdAt).toLocaleDateString()} • 
            Updated: {new Date(template.updatedAt).toLocaleDateString()} • 
            Length: {template.template.length} characters
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onPreview}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onExport}
            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplateEditor({ template, onSave, onCancel }: {
  template: Partial<Template>;
  onSave: (template: Partial<Template>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(template);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {template.id ? 'Edit Template' : 'Create New Template'}
          </h3>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., passport_service_template"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                <option value="system">System</option>
                <option value="passport">Passport</option>
                <option value="id_card">ID Card</option>
                <option value="business">Business</option>
                <option value="education">Education</option>
                <option value="health">Health</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Brief description of this template's purpose"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={formData.language || 'multilingual'}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="multilingual">Multilingual</option>
              <option value="ar">Arabic</option>
              <option value="en">English</option>
              <option value="fr">French</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Content (Markdown)
            </label>
            <textarea
              value={formData.template || ''}
              onChange={(e) => setFormData({ ...formData, template: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              rows={15}
              placeholder="Enter your template content in markdown format..."
            />
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplatePreview({ template, onClose }: {
  template: Template;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Template Preview: {template.name}</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 max-h-96 overflow-y-auto">
              {template.template}
            </pre>
          </div>
          
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Language:</span>
              <span className="ml-2">{template.language}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Category:</span>
              <span className="ml-2">{template.category || 'None'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Length:</span>
              <span className="ml-2">{template.template.length} chars</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Status:</span>
              <span className={`ml-2 ${template.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                {template.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}