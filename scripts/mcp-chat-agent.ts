import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ChatSession {
  id: string;
  messages: ChatMessage[];
  language: 'ar' | 'en';
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tools_used?: string[];
  data?: any;
}

class MCPChatAgent {
  private sessions: Map<string, ChatSession> = new Map();

  // Simulate AI provider analyzing user query and selecting tools
  private async analyzeQuery(message: string, language: 'ar' | 'en') {
    const query = message.toLowerCase();
    
    // Intent classification (what an AI would do)
    const intents = {
      search: {
        patterns: {
          ar: ['ابحث', 'بحث', 'اريد', 'اعطيني', 'ايجاد', 'اعرض', 'كيف', 'ماذا'],
          en: ['search', 'find', 'look', 'show', 'how', 'what', 'give me', 'tell me']
        }
      },
      stats: {
        patterns: {
          ar: ['احصائيات', 'إحصائيات', 'عدد', 'كم', 'تقرير', 'معلومات عامة', 'اعرض الإحصائيات'],
          en: ['stats', 'statistics', 'count', 'how many', 'report', 'overview', 'what are the statistics']
        }
      },
      specific_service: {
        patterns: {
          ar: ['تفاصيل', 'معلومات عن', 'اشرح لي', 'كيفية'],
          en: ['details', 'information about', 'explain', 'how to']
        }
      }
    };

    // Keyword extraction (what an AI would do)
    const keywords = {
      ar: {
        'جواز': ['passport', 'CIVIL_STATUS'],
        'بطاقة': ['id', 'CIVIL_STATUS'],
        'هوية': ['identity', 'CIVIL_STATUS'],
        'عمل': ['employment', 'EMPLOYMENT'],
        'وظيفة': ['job', 'EMPLOYMENT'],
        'توظيف': ['employment', 'EMPLOYMENT'],
        'تجارة': ['business', 'BUSINESS'],
        'شركة': ['company', 'BUSINESS'],
        'تعليم': ['education', 'EDUCATION'],
        'دراسة': ['study', 'EDUCATION'],
        'سكن': ['housing', 'HOUSING'],
        'منزل': ['house', 'HOUSING'],
        'نقل': ['transport', 'TRANSPORTATION'],
        'رخصة': ['license', 'CIVIL_STATUS'],
        'قيادة': ['driving', 'TRANSPORTATION'],
        'ضمان': ['insurance', 'SOCIAL_SECURITY'],
        'صحة': ['health', 'HEALTH'],
        'زواج': ['marriage', 'CIVIL_STATUS'],
        'طلاق': ['divorce', 'CIVIL_STATUS']
      },
      en: {
        'passport': ['جواز', 'CIVIL_STATUS'],
        'id': ['بطاقة', 'CIVIL_STATUS'],
        'employment': ['عمل', 'EMPLOYMENT'],
        'job': ['وظيفة', 'EMPLOYMENT'],
        'business': ['تجارة', 'BUSINESS'],
        'education': ['تعليم', 'EDUCATION'],
        'housing': ['سكن', 'HOUSING'],
        'transport': ['نقل', 'TRANSPORTATION'],
        'driving': ['قيادة', 'TRANSPORTATION'],
        'license': ['رخصة', 'CIVIL_STATUS'],
        'marriage': ['زواج', 'CIVIL_STATUS']
      }
    };

    // Detect intent
    let selectedIntent = 'search';
    for (const [intent, config] of Object.entries(intents)) {
      if (config.patterns[language].some(pattern => query.includes(pattern))) {
        selectedIntent = intent;
        break;
      }
    }

    // Extract relevant keywords and categories
    const detectedKeywords: string[] = [];
    const detectedCategories: string[] = [];
    
    for (const [keyword, info] of Object.entries(keywords[language])) {
      if (query.includes(keyword)) {
        detectedKeywords.push(keyword);
        detectedCategories.push(info[1]); // Use the second element which is the category
      }
    }

    return {
      intent: selectedIntent,
      keywords: detectedKeywords,
      categories: [...new Set(detectedCategories)],
      originalQuery: message
    };
  }

  // Execute MCP tools based on analysis
  private async executeMCPTools(analysis: any) {
    const results: any = {};

    switch (analysis.intent) {
      case 'stats':
        results.stats = await this.getStats();
        break;
        
      case 'search':
      case 'specific_service':
        results.services = await this.searchServices(
          analysis.keywords.join(' ') || analysis.originalQuery,
          analysis.categories[0] || undefined
        );
        break;
    }

    return results;
  }

  // MCP Tool: Get Statistics
  private async getStats() {
    const total = await prisma.governmentService.count();
    const online = await prisma.governmentService.count({ where: { isOnline: true } });
    const active = await prisma.governmentService.count({ where: { isActive: true } });
    
    const byCategory = await prisma.governmentService.groupBy({
      by: ['category'],
      _count: { id: true },
      where: { isActive: true }
    });

    return { total, online, active, byCategory };
  }

  // MCP Tool: Search Services
  private async searchServices(query: string, category?: string) {
    const conditions: any = { isActive: true };
    
    if (category) {
      conditions.category = category;
    }

    if (query) {
      const keywords = query.split(/\s+/).filter(word => word.length > 1);
      conditions.OR = [];
      
      keywords.forEach(keyword => {
        conditions.OR.push(
          { name: { contains: keyword, mode: 'insensitive' } },
          { nameEn: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
          { descriptionEn: { contains: keyword, mode: 'insensitive' } },
          { subcategory: { contains: keyword, mode: 'insensitive' } }
        );
      });
    }

    return await prisma.governmentService.findMany({
      where: conditions,
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
  }

  // Generate human-like response (what AI provider would do)
  private generateHumanResponse(analysis: any, results: any, language: 'ar' | 'en'): string {
    const { intent, keywords, originalQuery } = analysis;

    if (intent === 'stats') {
      if (language === 'ar') {
        let response = `إليك نظرة عامة على خدمات البوابة الحكومية:\n\n`;
        response += `📊 **الإحصائيات العامة:**\n`;
        response += `• إجمالي الخدمات المتاحة: ${results.stats.total} خدمة\n`;
        response += `• الخدمات المتاحة أونلاين: ${results.stats.online} خدمة\n`;
        response += `• الخدمات النشطة: ${results.stats.active} خدمة\n\n`;
        
        response += `🏛️ **التوزيع حسب الفئات:**\n`;
        results.stats.byCategory.forEach((cat: any) => {
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
        
        response += `\n💡 يمكنك البحث عن خدمة معينة بكتابة اسمها أو فئتها.`;
        return response;
      } else {
        let response = `Here's an overview of our government services portal:\n\n`;
        response += `📊 **General Statistics:**\n`;
        response += `• Total available services: ${results.stats.total}\n`;
        response += `• Online services: ${results.stats.online}\n`;
        response += `• Active services: ${results.stats.active}\n\n`;
        
        response += `🏛️ **Distribution by Categories:**\n`;
        results.stats.byCategory.forEach((cat: any) => {
          response += `• ${cat.category}: ${cat._count.id} services\n`;
        });
        
        response += `\n💡 You can search for specific services by typing their name or category.`;
        return response;
      }
    }

    if (intent === 'search' || intent === 'specific_service') {
      const services = results.services || [];
      
      if (services.length === 0) {
        if (language === 'ar') {
          return `لم أجد خدمات تطابق "${originalQuery}". \n\n🔍 **جرب البحث عن:**\n• جواز السفر\n• بطاقة التعريف\n• خدمات العمل\n• تسجيل الشركات\n• رخصة القيادة\n\n💡 أو يمكنك طلب الإحصائيات العامة بكتابة "إحصائيات".`;
        } else {
          return `I couldn't find services matching "${originalQuery}".\n\n🔍 **Try searching for:**\n• Passport services\n• ID card\n• Employment services\n• Business registration\n• Driving license\n\n💡 Or you can ask for general statistics.`;
        }
      }

      if (language === 'ar') {
        let response = `وجدت ${services.length} خدمة تطابق بحثك عن "${originalQuery}":\n\n`;
        services.forEach((service: any, index: number) => {
          response += `${index + 1}. **${service.name}**\n`;
          if (service.nameEn) response += `   🌐 English: ${service.nameEn}\n`;
          response += `   📂 الفئة: ${service.category}\n`;
          response += `   ${service.isOnline ? '🌐 متاح أونلاين' : '🏢 مكتب فقط'}\n`;
          if (service.description && service.description.length < 100) {
            response += `   📝 ${service.description}\n`;
          }
          response += `\n`;
        });
        
        response += `💡 هل تريد تفاصيل أكثر عن خدمة معينة؟ اذكر اسمها.`;
        return response;
      } else {
        let response = `Found ${services.length} service(s) matching "${originalQuery}":\n\n`;
        services.forEach((service: any, index: number) => {
          response += `${index + 1}. **${service.nameEn || service.name}**\n`;
          if (service.nameEn && service.name !== service.nameEn) {
            response += `   🇩🇿 Arabic: ${service.name}\n`;
          }
          response += `   📂 Category: ${service.category}\n`;
          response += `   ${service.isOnline ? '🌐 Available Online' : '🏢 Office Only'}\n`;
          if (service.descriptionEn && service.descriptionEn.length < 100) {
            response += `   📝 ${service.descriptionEn}\n`;
          }
          response += `\n`;
        });
        
        response += `💡 Want more details about a specific service? Just mention its name.`;
        return response;
      }
    }

    return language === 'ar' 
      ? 'عذراً، لم أفهم طلبك. يمكنك أن تسأل عن الخدمات الحكومية أو الإحصائيات.'
      : 'Sorry, I didn\'t understand your request. You can ask about government services or statistics.';
  }

  // Main chat function (simulates AI provider interaction)
  async chat(message: string, sessionId: string = 'default', language: 'ar' | 'en' = 'ar'): Promise<string> {
    try {
      // Get or create session
      if (!this.sessions.has(sessionId)) {
        this.sessions.set(sessionId, {
          id: sessionId,
          messages: [],
          language
        });
      }

      const session = this.sessions.get(sessionId)!;
      
      // Add user message
      session.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      // AI Analysis Phase
      console.log(`🤖 AI analyzing query: "${message}"`);
      const analysis = await this.analyzeQuery(message, language);
      console.log(`🧠 Analysis result:`, analysis);

      // Tool Selection & Execution Phase
      console.log(`🔧 Executing MCP tools...`);
      const results = await this.executeMCPTools(analysis);
      console.log(`📊 Tool results:`, Object.keys(results));

      // Response Generation Phase
      console.log(`✍️ Generating human response...`);
      const humanResponse = this.generateHumanResponse(analysis, results, language);

      // Add assistant message
      session.messages.push({
        role: 'assistant',
        content: humanResponse,
        timestamp: new Date(),
        tools_used: [analysis.intent],
        data: results
      });

      return humanResponse;

    } catch (error) {
      console.error('Chat error:', error);
      return language === 'ar' 
        ? 'عذراً، حدث خطأ أثناء معالجة طلبك.'
        : 'Sorry, an error occurred while processing your request.';
    }
  }
}

// Test the MCP Chat Agent
const testMCPChatAgent = async () => {
  console.log('🤖 Testing MCP Chat Agent (AI Provider Simulation)');
  console.log('='.repeat(60));

  const agent = new MCPChatAgent();

  const testQueries = [
    { message: 'ابحث عن جواز السفر', language: 'ar' as const },
    { message: 'اعرض الإحصائيات', language: 'ar' as const },
    { message: 'كيف أحصل على بطاقة تعريف؟', language: 'ar' as const },
    { message: 'خدمات العمل والتوظيف', language: 'ar' as const },
    { message: 'search for employment services', language: 'en' as const },
    { message: 'show me business registration services', language: 'en' as const },
    { message: 'what are the statistics?', language: 'en' as const },
  ];

  for (const query of testQueries) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`👤 User (${query.language}): ${query.message}`);
    console.log(`${'='.repeat(50)}`);
    
    const response = await agent.chat(query.message, 'test-session', query.language);
    
    console.log(`🤖 Assistant Response:`);
    console.log(response);
    
    console.log(`\n⏱️ Waiting before next query...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n🎉 MCP Chat Agent testing completed!`);
  console.log(`💡 This simulates how an AI provider would interact with our MCP server.`);
  
  await prisma.$disconnect();
};

testMCPChatAgent().catch(console.error);
