import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
import { prisma } from './prisma';
import { humanizeResponse, openai } from './openai';
import { ServiceCategory } from '@prisma/client';
import { handleError, ChatError, ERROR_CODES, getFallbackResponse } from './error-handler';
import { RateLimiter } from './rate-limiter';

export type NextApiResponseServerIo = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sessionId: string;
  metadata?: {
    servicesFound?: number;
    category?: string;
    searchQuery?: string;
  };
}

// Debug logging utility
class ChatLogger {
  static debug(component: string, sessionId: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [CHAT-DEBUG] [${component}] [Session: ${sessionId.slice(0, 8)}...] ${message}`);
    if (data) {
      console.log(`[${timestamp}] [CHAT-DEBUG] [${component}] [Session: ${sessionId.slice(0, 8)}...] Data:`, JSON.stringify(data, null, 2));
    }
  }

  static info(component: string, sessionId: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [CHAT-INFO] [${component}] [Session: ${sessionId.slice(0, 8)}...] ${message}`);
    if (data) {
      console.log(`[${timestamp}] [CHAT-INFO] [${component}] [Session: ${sessionId.slice(0, 8)}...] Data:`, JSON.stringify(data, null, 2));
    }
  }

  static error(component: string, sessionId: string, message: string, error?: any) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [CHAT-ERROR] [${component}] [Session: ${sessionId.slice(0, 8)}...] ${message}`);
    if (error) {
      console.error(`[${timestamp}] [CHAT-ERROR] [${component}] [Session: ${sessionId.slice(0, 8)}...] Error:`, error);
    }
  }

  static timing(component: string, sessionId: string, operation: string, startTime: number) {
    const duration = Date.now() - startTime;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [CHAT-TIMING] [${component}] [Session: ${sessionId.slice(0, 8)}...] ${operation} took ${duration}ms`);
    return duration;
  }
}

export async function handleChatMessage(
  message: string,
  sessionId: string,
  userId?: string,
  ipAddress?: string
): Promise<{ response: string; metadata?: any }> {
  const startTime = Date.now();
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  ChatLogger.info('HANDLER', sessionId, `Starting message processing for ${messageId}`, {
    messageLength: message.length,
    userId,
    ipAddress,
    messagePreview: message.substring(0, 50) + (message.length > 50 ? '...' : '')
  });

  try {
    // Rate limiting check
    ChatLogger.debug('RATE_LIMIT', sessionId, `Checking rate limit for ${messageId}`);
    const rateLimitKey = ipAddress || sessionId;
    const rateLimitResult = RateLimiter.isRateLimited(rateLimitKey, 20, 60 * 1000); // 20 requests per minute
    
    ChatLogger.debug('RATE_LIMIT', sessionId, `Rate limit result for ${messageId}`, {
      isLimited: rateLimitResult.isLimited,
      remaining: rateLimitResult.remaining,
      resetTime: rateLimitResult.resetTime
    });
    
    if (rateLimitResult.isLimited) {
      ChatLogger.error('RATE_LIMIT', sessionId, `Rate limit exceeded for ${messageId}`);
      throw new ChatError(
        'Rate limit exceeded',
        ERROR_CODES.RATE_LIMIT,
        429,
        'عدد كبير جداً من الطلبات. يرجى الانتظار قليلاً قبل المحاولة مرة أخرى.'
      );
    }

    // Validate input
    ChatLogger.debug('VALIDATION', sessionId, `Validating input for ${messageId}`, {
      messageLength: message.length,
      isEmpty: !message.trim()
    });
    
    if (!message.trim() || message.length > 1000) {
      ChatLogger.error('VALIDATION', sessionId, `Invalid message for ${messageId}`, {
        isEmpty: !message.trim(),
        tooLong: message.length > 1000,
        length: message.length
      });
      throw new ChatError(
        'Invalid message content',
        ERROR_CODES.VALIDATION_ERROR,
        400,
        'يرجى إدخال رسالة صحيحة (1-1000 حرف).'
      );
    }

    // Save user message to database with retry mechanism
    ChatLogger.debug('DATABASE', sessionId, `Saving user message for ${messageId}`);
    const dbSaveStart = Date.now();
    
    await retryOperation(async () => {
      await prisma.chatMessage.create({
        data: {
          sessionId,
          userId,
          role: 'USER',
          content: message,
        },
      });
    }, 3);
    
    ChatLogger.timing('DATABASE', sessionId, `User message save for ${messageId}`, dbSaveStart);

    // Use OpenAI to orchestrate MCP tools and generate response
    ChatLogger.info('AI-MCP', sessionId, `Starting AI-orchestrated MCP processing for ${messageId}`);
    const aiMcpStart = Date.now();
    let finalResponse: string;
    let aiUsed = false;
    let toolsUsed: string[] = [];
    
    try {
      // Import the new OpenAI MCP orchestration function
      const { processUserQueryWithMCP } = await import('./openai');
      
      ChatLogger.debug('AI-MCP', sessionId, `Calling OpenAI orchestrator for ${messageId}`, {
        query: message
      });
      
      finalResponse = await processUserQueryWithMCP(message);
      aiUsed = true;
      toolsUsed = ['ai-orchestrated-mcp'];
      
      ChatLogger.timing('AI-MCP', sessionId, `AI-MCP orchestration for ${messageId}`, aiMcpStart);
      ChatLogger.debug('AI-MCP', sessionId, `AI-MCP response generated for ${messageId}`, {
        responseLength: finalResponse.length,
        responsePreview: finalResponse.substring(0, 100) + '...',
        toolsUsed
      });
      
    } catch (aiMcpError) {
      ChatLogger.error('AI-MCP', sessionId, `AI-MCP orchestration failed for ${messageId}, using direct MCP fallback`, aiMcpError);
      
      // Fallback: Direct MCP search without AI orchestration
      ChatLogger.info('FALLBACK', sessionId, `Using direct MCP search fallback for ${messageId}`);
      const fallbackStart = Date.now();
      const searchResult = await searchServices(message, sessionId, messageId);
      ChatLogger.timing('FALLBACK', sessionId, `Direct MCP search for ${messageId}`, fallbackStart);
      
      finalResponse = await generateFallbackResponse(searchResult, message, sessionId, messageId);
      toolsUsed = ['direct-mcp-fallback'];
      
      ChatLogger.debug('FALLBACK', sessionId, `Fallback response generated for ${messageId}`, {
        responseLength: finalResponse.length,
        responsePreview: finalResponse.substring(0, 100) + '...',
        servicesFound: searchResult.count
      });
    }

    // Save assistant response to database
    ChatLogger.debug('DATABASE', sessionId, `Saving assistant response for ${messageId}`);
    const assistantSaveStart = Date.now();
    
    await retryOperation(async () => {
      await prisma.chatMessage.create({
        data: {
          sessionId,
          userId,
          role: 'ASSISTANT',
          content: finalResponse,
          metadata: {
            messageId,
            searchQuery: message,
            rateLimitRemaining: rateLimitResult.remaining,
            aiUsed,
            toolsUsed,
            processingTimeMs: Date.now() - startTime,
            mcpOrchestrated: aiUsed
          },
        },
      });
    }, 3);
    
    ChatLogger.timing('DATABASE', sessionId, `Assistant message save for ${messageId}`, assistantSaveStart);

    const totalProcessingTime = ChatLogger.timing('HANDLER', sessionId, `Total processing for ${messageId}`, startTime);

    const response = {
      response: finalResponse,
      metadata: {
        messageId,
        rateLimitRemaining: rateLimitResult.remaining,
        aiUsed,
        toolsUsed,
        processingTimeMs: totalProcessingTime,
        searchQuery: message,
        mcpOrchestrated: aiUsed,
        responseSource: aiUsed ? 'ai-orchestrated-mcp' : 'direct-mcp-fallback'
      },
    };

    ChatLogger.info('HANDLER', sessionId, `Message processing completed for ${messageId}`, {
      success: true,
      totalTimeMs: totalProcessingTime,
      aiUsed,
      toolsUsed,
      mcpOrchestrated: aiUsed
    });

    return response;
  } catch (error) {
    const chatError = handleError(error, 'handleChatMessage');
    console.error('Chat message handling error:', chatError);
    
    return {
      response: chatError.userMessage || getFallbackResponse('ar'),
      metadata: { 
        error: true, 
        errorCode: chatError.code,
        statusCode: chatError.statusCode 
      },
    };
  }
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  
  throw lastError!;
}

async function generateFallbackResponse(searchResult: any, userQuery: string, sessionId: string, messageId: string): Promise<string> {
  if (searchResult.count > 0) {
    const services = searchResult.results.slice(0, 3);
    let response = `تم العثور على ${searchResult.count} خدمة متعلقة بـ "${userQuery}":\n\n`;
    
    const mcpServerUrl = process.env.MCP_SERVER_URL || 'http://localhost:8081';
    
    // Display service information with available details from search results
    for (let index = 0; index < services.length; index++) {
      const service = services[index];
      response += `${index + 1}. **${service.name}**\n`;
      if (service.nameEn) response += `   (${service.nameEn})\n`;
      response += `   التصنيف: ${service.category}\n`;
      
      // Use available information from search results
      if (service.description) response += `   📝 الوصف: ${service.description}\n`;
      if (service.requirements && service.requirements.length > 0) {
        response += `   📋 المتطلبات:\n`;
        service.requirements.forEach((req: string) => {
          response += `      • ${req}\n`;
        });
      }
      if (service.fee) response += `   💰 الرسوم: ${service.fee}\n`;
      if (service.duration) response += `   ⏱️ المدة: ${service.duration}\n`;
      if (service.contactInfo) response += `   📞 الاتصال: ${service.contactInfo}\n`;
      if (service.bawabticUrl) response += `   🌐 الرابط: ${service.bawabticUrl}\n`;
      if (service.isOnline) response += `   ✅ متاح أونلاين\n`;
      response += '\n';
    }
    
    return response;
  } else {
    return `لم أتمكن من العثور على خدمات متعلقة بـ "${userQuery}". يرجى تجربة كلمات مفتاحية أخرى أو التواصل مع خدمة العملاء للمساعدة.`;
  }
}

async function searchServices(query: string, sessionId: string, messageId: string) {
  ChatLogger.debug('SEARCH', sessionId, `Starting category detection for ${messageId}`, { query });
  
  // Arabic to English query translation for better search results
  const queryTranslations: Record<string, string> = {
    'بطاقة الهوية': 'National ID',
    'بطاقة التعريف': 'National ID', 
    'بطاقة التعريف الوطنية': 'National ID',
    'بطاقة التعريف الوطنية البيومترية': 'National ID',
    'جواز السفر': 'Passport',
    'شهادة الميلاد': 'Birth certificate',
    'رخصة القيادة': 'Driving license',
    'رخصة السياقة': 'Driving license',
    'تعليم': 'Education',
    'جامعة': 'University',
    'صحة': 'Health',
    'مستشفى': 'Hospital',
    'عمل': 'Employment',
    'وظيفة': 'Job',
    'تجارة': 'Business',
    'شركة': 'Company',
    'تأسيس شركة': 'Company',
    'اريد تاسيس شركة': 'Company',
    'كيف اسس شركة': 'Company',
    'إنشاء شركة': 'Company',
    'استثمار': 'Investment',
    'استثمار دعم': 'Investment support',
    'رقم الاخضر': 'Green number',
    'الرقم الاخضر': 'Green number',
    'دعم': 'Support',
    'مساعدة': 'Assistance',
    'خدمات': 'Services',
    'ضريبة': 'Tax',
    'جباية': 'Tax',
    'سكن': 'Housing',
    'إسكان': 'Housing'
  };
  
  // AI-powered category detection
  let detectedCategory: ServiceCategory | undefined;
  
  try {
    ChatLogger.debug('SEARCH', sessionId, `Using AI to detect category for ${messageId}`, { query });
    
    const categoryCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert at categorizing Algerian government services. 
          
Given a user query, respond with ONLY the most appropriate category from this list:
CIVIL_STATUS, EDUCATION, HEALTH, EMPLOYMENT, BUSINESS, TAXATION, HOUSING, TRANSPORTATION, SOCIAL_SECURITY, TECHNOLOGY, ENVIRONMENT, AGRICULTURE, CULTURE, SPORTS, ENERGY, SOCIAL_SUPPORT, SPECIAL_NEEDS, LAW_JUSTICE, TOURISM, ENTERTAINMENT, INDUSTRY, MEDIA, MANAGEMENT, COMPLAINTS, ADMINISTRATION, OTHER

Examples:
- "بطاقة الهوية" → CIVIL_STATUS
- "جواز السفر" → ADMINISTRATION  
- "رخصة السياقة" → TRANSPORTATION
- "استثمار" → BUSINESS
- "تعليم" → EDUCATION
- "صحة" → HEALTH
- "عمل" → EMPLOYMENT

Respond with ONLY the category name, nothing else.`
        },
        {
          role: 'user',
          content: `Query: "${query}"`
        }
      ],
      max_tokens: 20,
      temperature: 0.1,
    });

    const categoryResponse = categoryCompletion.choices[0]?.message?.content?.trim();
    if (categoryResponse && Object.values(ServiceCategory).includes(categoryResponse as ServiceCategory)) {
      detectedCategory = categoryResponse as ServiceCategory;
      ChatLogger.debug('SEARCH', sessionId, `AI detected category for ${messageId}`, { 
        query,
        detectedCategory,
        confidence: 'high'
      });
    } else {
      ChatLogger.debug('SEARCH', sessionId, `AI category detection failed for ${messageId}`, { 
        query,
        aiResponse: categoryResponse
      });
    }
  } catch (error) {
    ChatLogger.error('SEARCH', sessionId, `AI category detection error for ${messageId}`, error);
  }

  if (!detectedCategory) {
    ChatLogger.debug('SEARCH', sessionId, `No category detected for ${messageId}, using general search`);
  }

  // Translate Arabic queries to English for better search results
  let searchQuery = query;
  for (const [arabicTerm, englishTerm] of Object.entries(queryTranslations)) {
    if (query.includes(arabicTerm)) {
      searchQuery = englishTerm;
      ChatLogger.debug('SEARCH', sessionId, `Translated query for ${messageId}`, { 
        originalQuery: query,
        translatedQuery: searchQuery,
        arabicTerm,
        englishTerm 
      });
      break;
    }
  }

  // Try MCP server first, fallback to direct database
  const mcpServerUrl = process.env.MCP_SERVER_URL || 'http://localhost:8081';
  ChatLogger.debug('SEARCH', sessionId, `Attempting MCP server search for ${messageId}`, { 
    mcpServerUrl,
    originalQuery: query,
    searchQuery,
    category: detectedCategory 
  });

  try {
    const mcpStart = Date.now();
    const mcpResponse = await fetch(`${mcpServerUrl}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MCP_API_KEY}`,
      },
      body: JSON.stringify({
        query: searchQuery,
        category: detectedCategory,
        limit: 5
      }),
    });

    if (mcpResponse.ok) {
      const mcpResult = await mcpResponse.json();
      ChatLogger.timing('SEARCH', sessionId, `MCP server search for ${messageId}`, mcpStart);
      ChatLogger.info('SEARCH', sessionId, `MCP server search successful for ${messageId}`, {
        resultsCount: mcpResult.count,
        requestId: mcpResult.requestId,
        queryTime: mcpResult.metadata?.queryTime
      });
      
      return {
        query: mcpResult.query,
        category: mcpResult.category,
        count: mcpResult.count,
        results: mcpResult.results,
        source: 'mcp-server',
        requestId: mcpResult.requestId
      };
    } else {
      ChatLogger.error('SEARCH', sessionId, `MCP server returned error for ${messageId}`, {
        status: mcpResponse.status,
        statusText: mcpResponse.statusText
      });
    }
  } catch (mcpError) {
    ChatLogger.error('SEARCH', sessionId, `MCP server connection failed for ${messageId}, falling back to direct database`, mcpError);
  }

  // Fallback to direct database search
  ChatLogger.info('SEARCH', sessionId, `Using direct database search for ${messageId}`);
  const dbStart = Date.now();
  
  const whereClause: any = {
    isActive: true,
  };

  // Add text search
  whereClause.OR = [
    { name: { contains: query, mode: 'insensitive' } },
    { nameEn: { contains: query, mode: 'insensitive' } },
    { description: { contains: query, mode: 'insensitive' } },
    { descriptionEn: { contains: query, mode: 'insensitive' } },
  ];

  if (detectedCategory) {
    whereClause.category = detectedCategory;
  }

  ChatLogger.debug('SEARCH', sessionId, `Executing database query for ${messageId}`, { whereClause });

  const results = await prisma.governmentService.findMany({
    where: whereClause,
    take: 5,
    select: {
      id: true,
      name: true,
      nameEn: true,
      description: true,
      category: true,
      isOnline: true,
      bawabticUrl: true,
      requirements: true,
      fee: true,
      duration: true,
    },
  });

  ChatLogger.timing('SEARCH', sessionId, `Direct database search for ${messageId}`, dbStart);
  ChatLogger.info('SEARCH', sessionId, `Direct database search completed for ${messageId}`, {
    resultsCount: results.length
  });

  return {
    query,
    category: detectedCategory,
    count: results.length,
    results,
    source: 'direct-database'
  };
}