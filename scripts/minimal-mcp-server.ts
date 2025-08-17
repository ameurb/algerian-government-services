#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Chat Agent for natural language processing
class MinimalChatAgent {
  // Simple intent detection
  private detectIntent(message: string, language: 'ar' | 'en' = 'ar') {
    const query = message.toLowerCase();
    
    // Statistics patterns
    const statsPatterns = {
      ar: ['احصائيات', 'إحصائيات', 'عدد', 'كم', 'تقرير', 'اعرض الإحصائيات'],
      en: ['stats', 'statistics', 'count', 'how many', 'report', 'show statistics']
    };
    
    // Check for stats intent
    if (statsPatterns[language].some(pattern => query.includes(pattern))) {
      return { type: 'stats' };
    }
    
    // Extract keywords for search
    const keywords = {
      ar: {
        'جواز': 'CIVIL_STATUS',
        'بطاقة': 'CIVIL_STATUS', 
        'هوية': 'CIVIL_STATUS',
        'عمل': 'EMPLOYMENT',
        'وظيفة': 'EMPLOYMENT',
        'توظيف': 'EMPLOYMENT',
        'تجارة': 'BUSINESS',
        'شركة': 'BUSINESS',
        'تعليم': 'EDUCATION',
        'سكن': 'HOUSING',
        'نقل': 'TRANSPORTATION',
        'رخصة': 'CIVIL_STATUS',
        'قيادة': 'TRANSPORTATION'
      },
      en: {
        'passport': 'CIVIL_STATUS',
        'id': 'CIVIL_STATUS',
        'employment': 'EMPLOYMENT',
        'job': 'EMPLOYMENT',
        'business': 'BUSINESS',
        'education': 'EDUCATION',
        'housing': 'HOUSING',
        'transport': 'TRANSPORTATION',
        'driving': 'TRANSPORTATION'
      }
    };
    
    // Find category
    let category: string | null = null;
    for (const [keyword, cat] of Object.entries(keywords[language])) {
      if (query.includes(keyword)) {
        category = cat;
        break;
      }
    }
    
    return { type: 'search', query: message, category };
  }
  
  // Generate human response
  private generateResponse(intent: any, data: any, language: 'ar' | 'en' = 'ar'): string {
    if (intent.type === 'stats') {
      if (language === 'ar') {
        let response = `📊 إحصائيات البوابة الحكومية:\n\n`;
        response += `• إجمالي الخدمات: ${data.total}\n`;
        response += `• الخدمات المتاحة أونلاين: ${data.online}\n`;
        response += `• الخدمات النشطة: ${data.active}\n\n`;
        response += `🏛️ التوزيع حسب الفئات:\n`;
        data.byCategory.forEach((cat: any) => {
          const categoryNames: any = {
            'CIVIL_STATUS': 'الحالة المدنية',
            'EMPLOYMENT': 'التشغيل والعمل', 
            'BUSINESS': 'التجارة والأعمال',
            'EDUCATION': 'التعليم',
            'HOUSING': 'السكن',
            'TRANSPORTATION': 'النقل',
            'SOCIAL_SECURITY': 'الضمان الاجتماعي',
            'TECHNOLOGY': 'التكنولوجيا'
          };
          response += `• ${categoryNames[cat.category] || cat.category}: ${cat._count.id} خدمة\n`;
        });
        return response;
      } else {
        let response = `📊 Government Portal Statistics:\n\n`;
        response += `• Total Services: ${data.total}\n`;
        response += `• Online Services: ${data.online}\n`;
        response += `• Active Services: ${data.active}\n\n`;
        response += `🏛️ By Category:\n`;
        data.byCategory.forEach((cat: any) => {
          response += `• ${cat.category}: ${cat._count.id} services\n`;
        });
        return response;
      }
    }
    
    if (intent.type === 'search') {
      const services = data || [];
      
      if (services.length === 0) {
        return language === 'ar' 
          ? `لم أجد خدمات تطابق "${intent.query}". جرب: جواز السفر، بطاقة التعريف، خدمات العمل`
          : `No services found for "${intent.query}". Try: passport, ID card, employment services`;
      }
      
      if (language === 'ar') {
        let response = `وجدت ${services.length} خدمة:\n\n`;
        services.forEach((service: any, index: number) => {
          response += `${index + 1}. ${service.name}\n`;
          response += `   📂 ${service.category}\n`;
          response += `   ${service.isOnline ? '🌐 متاح أونلاين' : '🏢 مكتب فقط'}\n\n`;
        });
        return response;
      } else {
        let response = `Found ${services.length} service(s):\n\n`;
        services.forEach((service: any, index: number) => {
          response += `${index + 1}. ${service.nameEn || service.name}\n`;
          response += `   📂 ${service.category}\n`;
          response += `   ${service.isOnline ? '🌐 Online' : '🏢 Office Only'}\n\n`;
        });
        return response;
      }
    }
    
    return language === 'ar' 
      ? 'يمكنك البحث عن الخدمات أو طلب الإحصائيات'
      : 'You can search for services or request statistics';
  }
  
  // Main chat function
  async chat(message: string, language: 'ar' | 'en' = 'ar'): Promise<string> {
    try {
      const intent = this.detectIntent(message, language);
      let data;
      
      if (intent.type === 'stats') {
        const total = await prisma.governmentService.count();
        const online = await prisma.governmentService.count({ where: { isOnline: true } });
        const active = await prisma.governmentService.count({ where: { isActive: true } });
        const byCategory = await prisma.governmentService.groupBy({
          by: ['category'],
          _count: { id: true },
          where: { isActive: true }
        });
        data = { total, online, active, byCategory };
      } else {
        const conditions: any = { isActive: true };
        
        if (intent.category) {
          conditions.category = intent.category;
        }
        
        if (intent.query) {
          const keywords = intent.query.split(/\s+/).filter((word: string) => word.length > 2);
          conditions.OR = [];
          keywords.forEach((keyword: string) => {
            conditions.OR.push(
              { name: { contains: keyword, mode: 'insensitive' } },
              { nameEn: { contains: keyword, mode: 'insensitive' } },
              { description: { contains: keyword, mode: 'insensitive' } },
              { descriptionEn: { contains: keyword, mode: 'insensitive' } }
            );
          });
        }
        
        data = await prisma.governmentService.findMany({
          where: conditions,
          take: 10,
          orderBy: { createdAt: 'desc' }
        });
      }
      
      return this.generateResponse(intent, data, language);
    } catch (error) {
      console.error('Chat error:', error);
      return language === 'ar' 
        ? 'عذراً، حدث خطأ أثناء معالجة طلبك'
        : 'Sorry, an error occurred while processing your request';
    }
  }
}

// Initialize chat agent
const chatAgent = new MinimalChatAgent();

// Create MCP server
const server = new Server(
  {
    name: 'algerian-services-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// Input validation schemas
const SearchSchema = z.object({
  query: z.string().describe('Search query in Arabic or English'),
  category: z.string().optional().describe('Service category filter'),
  limit: z.number().default(10).describe('Maximum number of results'),
  language: z.enum(['ar', 'en']).default('ar').describe('Response language')
});

const ChatSchema = z.object({
  message: z.string().describe('Natural language message in Arabic or English'),
  language: z.enum(['ar', 'en']).default('ar').describe('Response language')
});

const StatsSchema = z.object({
  language: z.enum(['ar', 'en']).default('ar').describe('Response language')
});

const ServiceByIdSchema = z.object({
  id: z.string().describe('Service ID'),
  language: z.enum(['ar', 'en']).default('ar').describe('Response language')
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'chat_assistant',
        description: 'Natural language chat interface for government services',
        inputSchema: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Natural language message in Arabic or English' },
            language: { type: 'string', enum: ['ar', 'en'], default: 'ar', description: 'Response language' }
          },
          required: ['message']
        },
      },
      {
        name: 'search_services',
        description: 'Search for Algerian government services',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query in Arabic or English' },
            category: { type: 'string', description: 'Service category filter' },
            limit: { type: 'number', default: 10, description: 'Maximum number of results' },
            language: { type: 'string', enum: ['ar', 'en'], default: 'ar', description: 'Response language' }
          },
          required: ['query']
        },
      },
      {
        name: 'get_service_by_id',
        description: 'Get detailed information about a specific service',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Service ID' },
            language: { type: 'string', enum: ['ar', 'en'], default: 'ar', description: 'Response language' }
          },
          required: ['id']
        },
      },
      {
        name: 'get_statistics',
        description: 'Get database statistics and overview',
        inputSchema: {
          type: 'object',
          properties: {
            language: { type: 'string', enum: ['ar', 'en'], default: 'ar', description: 'Response language' }
          }
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'chat_assistant': {
        const { message, language } = ChatSchema.parse(args);
        const response = await chatAgent.chat(message, language);
        return {
          content: [
            {
              type: 'text',
              text: response,
            },
          ],
        };
      }

      case 'search_services': {
        const { query, category, limit, language } = SearchSchema.parse(args);
        
        const conditions: any = { isActive: true };
        
        if (category) {
          conditions.category = category;
        }
        
        if (query) {
          const keywords = query.split(/\s+/).filter(word => word.length > 2);
          conditions.OR = [];
          keywords.forEach(keyword => {
            conditions.OR.push(
              { name: { contains: keyword, mode: 'insensitive' } },
              { nameEn: { contains: keyword, mode: 'insensitive' } },
              { description: { contains: keyword, mode: 'insensitive' } },
              { descriptionEn: { contains: keyword, mode: 'insensitive' } }
            );
          });
        }

        const services = await prisma.governmentService.findMany({
          where: conditions,
          take: limit,
          orderBy: { createdAt: 'desc' }
        });

        const responseText = language === 'ar' 
          ? `وجدت ${services.length} خدمة تطابق البحث`
          : `Found ${services.length} matching services`;

        return {
          content: [
            {
              type: 'text',
              text: `${responseText}:\n\n${services.map((service, index) => 
                `${index + 1}. ${language === 'ar' ? service.name : (service.nameEn || service.name)}\n` +
                `   📂 ${service.category}\n` +
                `   ${service.isOnline ? (language === 'ar' ? '🌐 متاح أونلاين' : '🌐 Online') : (language === 'ar' ? '🏢 مكتب فقط' : '🏢 Office Only')}`
              ).join('\n\n')}`,
            },
          ],
        };
      }

      case 'get_service_by_id': {
        const { id, language } = ServiceByIdSchema.parse(args);
        
        const service = await prisma.governmentService.findUnique({
          where: { id }
        });

        if (!service) {
          return {
            content: [
              {
                type: 'text',
                text: language === 'ar' ? 'لم يتم العثور على الخدمة' : 'Service not found',
              },
            ],
          };
        }

        const serviceName = language === 'ar' ? service.name : (service.nameEn || service.name);
        const description = language === 'ar' ? service.description : (service.descriptionEn || service.description);

        return {
          content: [
            {
              type: 'text',
              text: `📋 ${serviceName}\n\n` +
                    `📂 ${language === 'ar' ? 'الفئة' : 'Category'}: ${service.category}\n` +
                    `${service.isOnline ? (language === 'ar' ? '🌐 متاح أونلاين' : '🌐 Available Online') : (language === 'ar' ? '🏢 مكتب فقط' : '🏢 Office Only')}\n\n` +
                    `📝 ${language === 'ar' ? 'الوصف' : 'Description'}:\n${description}`,
            },
          ],
        };
      }

      case 'get_statistics': {
        const { language } = StatsSchema.parse(args);
        
        const total = await prisma.governmentService.count();
        const online = await prisma.governmentService.count({ where: { isOnline: true } });
        const active = await prisma.governmentService.count({ where: { isActive: true } });
        
        const byCategory = await prisma.governmentService.groupBy({
          by: ['category'],
          _count: { id: true },
          where: { isActive: true }
        });

        const categoryNames: any = {
          'CIVIL_STATUS': language === 'ar' ? 'الحالة المدنية' : 'Civil Status',
          'EMPLOYMENT': language === 'ar' ? 'التشغيل والعمل' : 'Employment',
          'BUSINESS': language === 'ar' ? 'التجارة والأعمال' : 'Business',
          'EDUCATION': language === 'ar' ? 'التعليم' : 'Education',
          'HOUSING': language === 'ar' ? 'السكن' : 'Housing',
          'TRANSPORTATION': language === 'ar' ? 'النقل' : 'Transportation',
          'SOCIAL_SECURITY': language === 'ar' ? 'الضمان الاجتماعي' : 'Social Security',
          'TECHNOLOGY': language === 'ar' ? 'التكنولوجيا' : 'Technology'
        };

        let response = language === 'ar' 
          ? `📊 إحصائيات البوابة الحكومية الجزائرية:\n\n`
          : `📊 Algerian Government Portal Statistics:\n\n`;
        
        response += language === 'ar'
          ? `• إجمالي الخدمات: ${total}\n• الخدمات المتاحة أونلاين: ${online}\n• الخدمات النشطة: ${active}\n\n🏛️ التوزيع حسب الفئات:\n`
          : `• Total Services: ${total}\n• Online Services: ${online}\n• Active Services: ${active}\n\n🏛️ By Category:\n`;

        byCategory.forEach(cat => {
          response += `• ${categoryNames[cat.category] || cat.category}: ${cat._count.id} ${language === 'ar' ? 'خدمة' : 'services'}\n`;
        });

        return {
          content: [
            {
              type: 'text',
              text: response,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error('Tool execution error:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'services://summary',
        mimeType: 'application/json',
        name: 'services-summary',
        description: 'Complete summary of all government services with statistics',
      },
    ],
  };
});

// Handle resource requests
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === 'services://summary') {
    const total = await prisma.governmentService.count();
    const online = await prisma.governmentService.count({ where: { isOnline: true } });
    
    const byCategory = await prisma.governmentService.groupBy({
      by: ['category'],
      _count: { id: true },
      where: { isActive: true }
    });

    const summary = {
      total_services: total,
      online_services: online,
      categories: byCategory.reduce((acc: any, cat) => {
        acc[cat.category] = cat._count.id;
        return acc;
      }, {}),
      last_updated: new Date().toISOString()
    };

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  }

  throw new Error(`Resource not found: ${uri}`);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('🚀 Minimal Algerian Services MCP Server running on stdio');
  console.log('💬 Available tools: chat_assistant, search_services, get_service_by_id, get_statistics');
  console.log('📚 Available resources: services://summary');
}

main().catch(console.error);
