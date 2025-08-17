import { NextApiRequest, NextApiResponse } from 'next';

interface Template {
  id: string;
  name: string;
  description: string;
  category: 'response' | 'service' | 'email' | 'sms' | 'document';
  language: 'ar' | 'en' | 'fr' | 'multi';
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

// Demo templates for Algerian government services
let templates: Template[] = [
  {
    id: '1',
    name: 'Service Not Found - Arabic',
    description: 'Response template when no services are found',
    category: 'response',
    language: 'ar',
    content: 'عذراً، لم أتمكن من العثور على خدمات متعلقة بـ "{query}". يرجى تجربة كلمات مفتاحية أخرى أو التواصل مع خدمة العملاء للمساعدة.',
    variables: ['query'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T10:30:00Z',
    usageCount: 234
  },
  {
    id: '2',
    name: 'Service Not Found - English',
    description: 'Response template when no services are found (English)',
    category: 'response',
    language: 'en',
    content: 'Sorry, I couldn\'t find any services related to "{query}". Please try different keywords or contact customer service for assistance.',
    variables: ['query'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T10:30:00Z',
    usageCount: 156
  },
  {
    id: '3',
    name: 'Service Requirements Template',
    description: 'Standard template for displaying service requirements',
    category: 'service',
    language: 'multi',
    content: `للحصول على {serviceName}، تحتاج إلى:

المتطلبات:
{requirements}

الرسوم: {fee}
المدة المتوقعة: {duration}

للمزيد من المعلومات: {contactInfo}`,
    variables: ['serviceName', 'requirements', 'fee', 'duration', 'contactInfo'],
    isActive: true,
    createdAt: '2025-01-05T00:00:00Z',
    updatedAt: '2025-01-15T09:15:00Z',
    usageCount: 892
  },
  {
    id: '4',
    name: 'Welcome Message Template',
    description: 'Welcome message for new chat sessions',
    category: 'response',
    language: 'ar',
    content: 'مرحباً! 👋 أنا مساعدك الذكي للخدمات الحكومية الجزائرية! 🇩🇿\n\nيمكنك سؤالي بالعربية أو الإنجليزية عن أي خدمة حكومية.\n\nما الذي تبحث عنه؟ 😊',
    variables: [],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T12:00:00Z',
    usageCount: 1500
  },
  {
    id: '5',
    name: 'Email Notification Template',
    description: 'Email template for service application notifications',
    category: 'email',
    language: 'ar',
    content: `عزيزي/عزيزتي {userName}،

تم تلقي طلبك للحصول على خدمة {serviceName} بنجاح.

رقم الطلب: {applicationId}
تاريخ التقديم: {submitDate}
الحالة: {status}

سيتم إشعارك عند تحديث حالة طلبك.

مع تحيات فريق الخدمات الحكومية`,
    variables: ['userName', 'serviceName', 'applicationId', 'submitDate', 'status'],
    isActive: true,
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2025-01-15T14:20:00Z',
    usageCount: 89
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  switch (req.method) {
    case 'GET':
      return await getTemplates(req, res);
      
    case 'POST':
      return await createTemplate(req, res);
      
    case 'PUT':
      return await updateTemplate(req, res);
      
    case 'DELETE':
      return await deleteTemplate(req, res);
      
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getTemplates(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { category, language } = req.query;
    
    let filteredTemplates = templates;
    
    if (category && typeof category === 'string') {
      filteredTemplates = filteredTemplates.filter(template => template.category === category);
    }
    
    if (language && typeof language === 'string') {
      filteredTemplates = filteredTemplates.filter(template => 
        template.language === language || template.language === 'multi'
      );
    }
    
    res.status(200).json({
      templates: filteredTemplates,
      categories: ['response', 'service', 'email', 'sms', 'document'],
      languages: ['ar', 'en', 'fr', 'multi'],
      total: filteredTemplates.length
    });
    
  } catch (error) {
    console.error('Templates fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function createTemplate(req: NextApiRequest, res: NextApiResponse) {
  const { name, description, category, language, content, variables } = req.body;
  
  if (!name || !description || !category || !language || !content) {
    return res.status(400).json({ 
      error: 'Name, description, category, language, and content are required' 
    });
  }
  
  const newTemplate: Template = {
    id: Date.now().toString(),
    name,
    description,
    category,
    language,
    content,
    variables: variables || [],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0
  };
  
  templates.push(newTemplate);
  
  res.status(201).json({
    message: 'Template created successfully',
    template: newTemplate
  });
}

async function updateTemplate(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const updates = req.body;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Template ID is required' });
  }
  
  const templateIndex = templates.findIndex(template => template.id === id);
  
  if (templateIndex === -1) {
    return res.status(404).json({ error: 'Template not found' });
  }
  
  templates[templateIndex] = {
    ...templates[templateIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  res.status(200).json({
    message: 'Template updated successfully',
    template: templates[templateIndex]
  });
}

async function deleteTemplate(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Template ID is required' });
  }
  
  const originalLength = templates.length;
  templates = templates.filter(template => template.id !== id);
  
  if (templates.length === originalLength) {
    return res.status(404).json({ error: 'Template not found' });
  }
  
  res.status(200).json({ message: 'Template deleted successfully' });
}