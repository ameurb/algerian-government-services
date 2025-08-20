import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { prisma } from './prisma.js';

// MCP stdio server with full tools and resources
class MCPStdioServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'algerian-government-services',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_services',
            description: 'Search for Algerian government services with typo tolerance',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query in Arabic, English, or French (handles typos)',
                },
                category: {
                  type: 'string',
                  enum: [
                    'CIVIL_STATUS', 'EDUCATION', 'HEALTH', 'EMPLOYMENT', 'BUSINESS',
                    'TAXATION', 'HOUSING', 'TRANSPORTATION', 'SOCIAL_SECURITY',
                    'TECHNOLOGY', 'ENVIRONMENT', 'AGRICULTURE', 'OTHER'
                  ],
                  description: 'Filter by service category',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results (default: 5)',
                  default: 5,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_service_details',
            description: 'Get detailed information about a specific government service',
            inputSchema: {
              type: 'object',
              properties: {
                serviceId: {
                  type: 'string',
                  description: 'The ID of the service to get details for',
                },
              },
              required: ['serviceId'],
            },
          },
          {
            name: 'get_services_stats',
            description: 'Get statistics about available government services',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'search_by_category',
            description: 'Browse services by category',
            inputSchema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  enum: [
                    'CIVIL_STATUS', 'EDUCATION', 'HEALTH', 'EMPLOYMENT', 'BUSINESS',
                    'TAXATION', 'HOUSING', 'TRANSPORTATION', 'SOCIAL_SECURITY',
                    'TECHNOLOGY', 'ENVIRONMENT', 'AGRICULTURE', 'OTHER'
                  ],
                },
                limit: {
                  type: 'number',
                  default: 10,
                },
              },
              required: ['category'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'search_services':
            return await this.searchServices(args);
          case 'get_service_details':
            return await this.getServiceDetails(args);
          case 'get_services_stats':
            return await this.getServicesStats();
          case 'search_by_category':
            return await this.searchByCategory(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    });
  }

  private setupResourceHandlers() {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'algerian://services/categories',
            name: 'Service Categories',
            description: 'List of all available service categories',
            mimeType: 'application/json',
          },
          {
            uri: 'algerian://services/statistics',
            name: 'Service Statistics',
            description: 'Statistics about available government services',
            mimeType: 'application/json',
          },
          {
            uri: 'algerian://templates/response',
            name: 'Response Templates',
            description: 'Templates for formatting user responses',
            mimeType: 'application/json',
          },
        ],
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        switch (uri) {
          case 'algerian://services/categories':
            return await this.getCategoriesResource();
          case 'algerian://services/statistics':
            return await this.getStatisticsResource();
          case 'algerian://templates/response':
            return await this.getResponseTemplates();
          default:
            throw new Error(`Unknown resource: ${uri}`);
        }
      } catch (error) {
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    });
  }

  // Tool implementations
  private async searchServices(args: any) {
    const { query, category, limit = 5 } = args;
    
    // Enhanced search with typo tolerance
    const searchTerms = this.extractSearchTerms(query);
    console.log('[MCP-STDIO] Search terms extracted:', searchTerms);
    
    const searchConditions: any[] = [];
    
    for (const term of searchTerms) {
      searchConditions.push(
        { name: { contains: term, mode: 'insensitive' } },
        { nameEn: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { descriptionEn: { contains: term, mode: 'insensitive' } },
        { subcategory: { contains: term, mode: 'insensitive' } },
        { subcategoryEn: { contains: term, mode: 'insensitive' } }
      );
    }
    
    const whereClause: any = {
      isActive: true,
      OR: searchConditions,
    };
    
    if (category) {
      whereClause.category = category;
    }
    
    const services = await prisma.governmentService.findMany({
      where: whereClause,
      take: limit,
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            query,
            searchTerms,
            category,
            count: services.length,
            services: services.map(service => ({
              id: service.id,
              name: service.name,
              nameEn: service.nameEn,
              description: service.description,
              category: service.category,
              subcategory: service.subcategory,
              requirements: service.requirements,
              fee: service.fee,
              duration: service.duration,
              office: service.office,
              contactInfo: service.contactInfo,
              bawabticUrl: service.bawabticUrl,
              isOnline: service.isOnline
            }))
          }, null, 2),
        },
      ],
    };
  }

  private async getServiceDetails(args: any) {
    const { serviceId } = args;
    
    const service = await prisma.governmentService.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(service, null, 2),
        },
      ],
    };
  }

  private async getServicesStats() {
    const total = await prisma.governmentService.count({ where: { isActive: true } });
    
    const byCategory = await prisma.governmentService.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: true,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            totalServices: total,
            categoryCounts: byCategory.map(item => ({
              category: item.category,
              count: item._count
            }))
          }, null, 2),
        },
      ],
    };
  }

  private async searchByCategory(args: any) {
    const { category, limit = 10 } = args;
    
    const services = await prisma.governmentService.findMany({
      where: {
        isActive: true,
        category: category
      },
      take: limit,
      select: {
        id: true,
        name: true,
        nameEn: true,
        description: true,
        fee: true,
        duration: true,
        isOnline: true
      }
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            category,
            count: services.length,
            services
          }, null, 2),
        },
      ],
    };
  }

  // Resource implementations
  private async getCategoriesResource() {
    const categories = [
      { value: 'CIVIL_STATUS', label: 'الحالة المدنية', labelEn: 'Civil Status' },
      { value: 'EDUCATION', label: 'التعليم', labelEn: 'Education' },
      { value: 'HEALTH', label: 'الصحة', labelEn: 'Health' },
      { value: 'EMPLOYMENT', label: 'التشغيل', labelEn: 'Employment' },
      { value: 'BUSINESS', label: 'التجارة', labelEn: 'Business' },
      { value: 'TRANSPORTATION', label: 'النقل', labelEn: 'Transportation' },
      { value: 'HOUSING', label: 'السكن', labelEn: 'Housing' },
      { value: 'SOCIAL_SECURITY', label: 'الضمان الاجتماعي', labelEn: 'Social Security' },
    ];

    return {
      contents: [
        {
          uri: 'algerian://services/categories',
          mimeType: 'application/json',
          text: JSON.stringify(categories, null, 2),
        },
      ],
    };
  }

  private async getStatisticsResource() {
    const stats = await this.getServicesStats();
    return {
      contents: [
        {
          uri: 'algerian://services/statistics',
          mimeType: 'application/json',
          text: stats.content[0].text,
        },
      ],
    };
  }

  private async getResponseTemplates() {
    const templates = {
      serviceFound: {
        arabic: {
          header: "وجدت {count} خدمة متعلقة بـ \"{query}\":",
          serviceFormat: "{index}. **{name}**\n   📂 التصنيف: {category}\n   📝 الوصف: {description}\n   💰 الرسوم: {fee}\n   ⏱️ المدة: {duration}\n   🏢 المكتب: {office}\n   🌐 الرابط: {url}\n",
          footer: "هل تحتاج تفاصيل أكثر عن خدمة معينة؟"
        },
        english: {
          header: "Found {count} services related to \"{query}\":",
          serviceFormat: "{index}. **{name}**\n   📂 Category: {category}\n   📝 Description: {description}\n   💰 Fee: {fee}\n   ⏱️ Duration: {duration}\n   🏢 Office: {office}\n   🌐 Link: {url}\n",
          footer: "Need more details about any service?"
        }
      },
      serviceNotFound: {
        arabic: "لم أجد خدمات تطابق \"{query}\" في قاعدة البيانات.\n\n🔍 جرب البحث عن:\n• بطاقة التعريف\n• جواز السفر\n• رخصة السياقة\n• تأسيس شركة\n• منحة التعليم",
        english: "I couldn't find services matching \"{query}\" in the database.\n\n🔍 Try searching for:\n• National ID\n• Passport\n• Driving license\n• Company registration\n• Education grants"
      }
    };

    return {
      contents: [
        {
          uri: 'algerian://templates/response',
          mimeType: 'application/json',
          text: JSON.stringify(templates, null, 2),
        },
      ],
    };
  }

  // Enhanced search term extraction with typo tolerance
  private extractSearchTerms(query: string): string[] {
    const originalQuery = query.toLowerCase().trim();
    const terms = [originalQuery];
    
    // Typo-tolerant variations
    const variations: Record<string, string[]> = {
      // ID Cards (with typos)
      'بطاقة الهوية': ['بطاقة التعريف', 'التعريف الوطنية', 'بيومترية', 'هوية', 'ID'],
      'بطاقه الهويه': ['بطاقة التعريف', 'التعريف الوطنية', 'بيومترية', 'هوية', 'ID'],
      'بطاقه الهوية': ['بطاقة التعريف', 'التعريف الوطنية', 'بيومترية', 'هوية', 'ID'],
      'بطاقة الهويه': ['بطاقة التعريف', 'التعريف الوطنية', 'بيومترية', 'هوية', 'ID'],
      'id card': ['بطاقة التعريف', 'National ID', 'هوية', 'بيومترية'],
      'national id': ['بطاقة التعريف', 'التعريف الوطنية', 'هوية', 'بيومترية'],
      
      // Education (with typos)
      'منح التعليم': ['منحة', 'تعليم', 'دراسة', 'جامعة', 'grant', 'scholarship'],
      'منح التعليمم': ['منحة', 'تعليم', 'دراسة', 'grant', 'scholarship'],
      'منحة التعليم': ['منحة', 'تعليم', 'دراسة', 'grant'],
      'education grants': ['منحة', 'تعليم', 'grant', 'scholarship'],
      'scholarship': ['منحة', 'تعليم', 'grant'],
      
      // Business (with typos)
      'تأسيس شركة': ['شركة', 'تجارة', 'استثمار', 'تسجيل', 'company', 'business'],
      'تاسيس شركه': ['شركة', 'تجارة', 'استثمار', 'تسجيل', 'company', 'business'],
      'تأسيس شركه': ['شركة', 'تجارة', 'استثمار', 'تسجيل', 'company', 'business'],
      'company registration': ['شركة', 'تجارة', 'تسجيل', 'company', 'business'],
      
      // Passport (with typos)
      'جواز السفر': ['جواز', 'سفر', 'passport', 'بيومتري'],
      'جواز سفر': ['جواز', 'سفر', 'passport', 'بيومتري'],
      'passport': ['جواز', 'سفر', 'passport', 'بيومتري'],
      
      // Driving license (with typos)
      'رخصة السياقة': ['رخصة', 'سياقة', 'قيادة', 'driving', 'license'],
      'رخصت سياقه': ['رخصة', 'سياقة', 'قيادة', 'driving', 'license'],
      'driving license': ['رخصة', 'سياقة', 'قيادة', 'driving'],
      
      // Birth certificate
      'شهادة الميلاد': ['شهادة', 'ميلاد', 'birth', 'certificate'],
      'شهاده ميلاد': ['شهادة', 'ميلاد', 'birth', 'certificate'],
      'birth certificate': ['شهادة', 'ميلاد', 'birth']
    };
    
    // Add variations for the query
    for (const [pattern, alternatives] of Object.entries(variations)) {
      if (originalQuery.includes(pattern.toLowerCase()) || 
          pattern.toLowerCase().includes(originalQuery)) {
        terms.push(...alternatives);
      }
    }
    
    // Split query into individual words for broader matching
    const words = originalQuery.split(/\s+/).filter(word => word.length > 2);
    terms.push(...words);
    
    return Array.from(new Set(terms));
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP stdio server started');
  }
}

// Start the server
const server = new MCPStdioServer();
server.start().catch(console.error);