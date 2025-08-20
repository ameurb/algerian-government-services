import { getMCPClient } from './mcp-stdio-client';
import { prisma } from './prisma';

// MCP-powered chat handler with full formatting and templates
export async function handleMCPChatMessage(
  message: string,
  sessionId: string,
  userId?: string
): Promise<{ response: string; metadata: any }> {
  
  const startTime = Date.now();
  console.log('[MCP-CHAT] Processing message:', message);
  
  try {
    // Step 1: Save user message (with retry on connection issues)
    try {
      await prisma.chatMessage.create({
        data: {
          sessionId,
          userId,
          role: 'USER',
          content: message,
        },
      });
    } catch (dbError) {
      console.warn('[MCP-CHAT] Database save failed, continuing with search:', dbError);
    }
    
    // Step 2: Use MCP stdio for intelligent search
    const mcpClient = await getMCPClient();
    const searchResult = await mcpClient.searchServices(message);
    
    console.log('[MCP-CHAT] MCP search result:', {
      query: searchResult.query,
      count: searchResult.count,
      searchTerms: searchResult.searchTerms
    });
    
    // Step 3: Format response using templates
    const responseText = formatResponseWithTemplates(searchResult, message);
    
    // Step 4: Save assistant response
    try {
      await prisma.chatMessage.create({
        data: {
          sessionId,
          userId,
          role: 'ASSISTANT',
          content: responseText,
          metadata: {
            servicesFound: searchResult.count,
            searchTerms: searchResult.searchTerms,
            source: 'mcp-stdio',
            processingTime: Date.now() - startTime
          }
        },
      });
    } catch (dbError) {
      console.warn('[MCP-CHAT] Assistant response save failed:', dbError);
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`[MCP-CHAT] Completed in ${processingTime}ms, found ${searchResult.count} services`);
    
    return {
      response: responseText,
      metadata: {
        servicesFound: searchResult.count,
        searchTerms: searchResult.searchTerms,
        source: 'mcp-stdio',
        processingTime
      }
    };
    
  } catch (error) {
    console.error('[MCP-CHAT] Error:', error);
    
    // Fallback response
    const errorResponse = detectLanguage(message) === 'arabic' 
      ? 'عذراً، حدث خطأ في البحث. يرجى المحاولة مرة أخرى أو جرب كلمات مفتاحية أخرى مثل "بطاقة التعريف" أو "جواز السفر".'
      : 'Sorry, an error occurred during search. Please try again or try other keywords like "National ID" or "Passport".';
    
    return {
      response: errorResponse,
      metadata: {
        error: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      }
    };
  }
}

// Format response using proper templates
function formatResponseWithTemplates(searchResult: any, originalQuery: string): string {
  const language = detectLanguage(originalQuery);
  const isArabic = language === 'arabic';
  
  if (searchResult.count === 0) {
    // No services found
    if (isArabic) {
      return `لم أجد خدمات تطابق "${originalQuery}" في قاعدة البيانات.\n\n🔍 **جرب البحث عن:**\n• بطاقة التعريف البيومترية\n• جواز السفر البيومتري\n• رخصة السياقة\n• تأسيس شركة\n• منحة التعليم العالي\n• الضمان الاجتماعي\n\n💡 أو اكتب "إحصائيات" لمعرفة جميع الخدمات المتاحة.`;
    } else {
      return `I couldn't find services matching "${originalQuery}" in the database.\n\n🔍 **Try searching for:**\n• Biometric National ID\n• Biometric Passport\n• Driving License\n• Company Registration\n• Higher Education Grants\n• Social Security\n\n💡 Or type "statistics" to see all available services.`;
    }
  }
  
  // Services found - format properly
  const count = searchResult.count;
  const services = searchResult.services;
  
  let response = '';
  
  if (isArabic) {
    response = `وجدت **${count} خدمة** متعلقة بـ "${originalQuery}":\n\n`;
  } else {
    response = `Found **${count} services** related to "${originalQuery}":\n\n`;
  }
  
  services.forEach((service: any, index: number) => {
    response += `**${index + 1}. ${service.name}**\n`;
    
    if (service.nameEn && isArabic) {
      response += `   _(${service.nameEn})_\n`;
    }
    
    response += `   📂 ${isArabic ? 'التصنيف' : 'Category'}: ${service.category}\n`;
    
    if (service.description) {
      const desc = service.description.length > 120 
        ? service.description.substring(0, 120) + '...'
        : service.description;
      response += `   📝 ${isArabic ? 'الوصف' : 'Description'}: ${desc}\n`;
    }
    
    if (service.requirements && service.requirements.length > 0) {
      response += `   📋 ${isArabic ? 'المتطلبات' : 'Requirements'}:\n`;
      service.requirements.slice(0, 3).forEach((req: string) => {
        response += `      • ${req}\n`;
      });
    }
    
    if (service.fee && service.fee !== 'غير محدد') {
      response += `   💰 ${isArabic ? 'الرسوم' : 'Fee'}: ${service.fee}\n`;
    }
    
    if (service.duration && service.duration !== 'غير محدد') {
      response += `   ⏱️ ${isArabic ? 'المدة' : 'Duration'}: ${service.duration}\n`;
    }
    
    if (service.office) {
      response += `   🏢 ${isArabic ? 'المكتب' : 'Office'}: ${service.office}\n`;
    }
    
    if (service.bawabticUrl || service.onlineUrl) {
      const url = service.bawabticUrl || service.onlineUrl;
      response += `   🌐 ${isArabic ? 'الرابط' : 'Link'}: ${url}\n`;
    }
    
    if (service.isOnline) {
      response += `   ✅ ${isArabic ? 'متاح أونلاين' : 'Available Online'}\n`;
    }
    
    response += '\n';
  });
  
  if (isArabic) {
    response += `💡 **هل تحتاج تفاصيل أكثر؟** اكتب رقم الخدمة أو جرب البحث عن خدمة أخرى!`;
  } else {
    response += `💡 **Need more details?** Enter the service number or try searching for another service!`;
  }
  
  return response;
}

// Detect query language
function detectLanguage(text: string): 'arabic' | 'english' | 'french' {
  // Arabic characters detection
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
  if (arabicPattern.test(text)) {
    return 'arabic';
  }
  
  // French detection (basic)
  const frenchWords = ['le', 'la', 'les', 'de', 'du', 'et', 'ou', 'carte', 'passeport'];
  const lowerText = text.toLowerCase();
  if (frenchWords.some(word => lowerText.includes(word))) {
    return 'french';
  }
  
  return 'english';
}