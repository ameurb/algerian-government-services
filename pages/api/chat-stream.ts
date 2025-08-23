import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { PrismaClient } from '@prisma/client';
import { TemplateManager } from '@/lib/ai-templates';

const prisma = new PrismaClient();

// Remove edge runtime to support Prisma SQLite

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, sessionId, language = 'ar' } = req.body;
    
    // Get the latest user message
    const userMessage = messages[messages.length - 1];
    const userQuery = userMessage.content;
    
    console.log('🎯 Chat Stream API:', {
      userQuery: userQuery.substring(0, 50) + '...',
      language,
      sessionId,
      messagesCount: messages.length
    });

    // Search for relevant services
    const services = await searchServices(userQuery, language);
    console.log('🔍 Found services:', services.length);
    
    // Enhanced Analysis and Context Generation
    const queryAnalysis = analyzeUserQuery(userQuery, language);
    const serviceCategory = detectServiceCategory(userQuery);
    
    // Generate comprehensive context with found services
    const detailedServicesContext = services.length > 0 ? 
      `\n\n## 📊 Available Services Analysis:\n\n**Query Intent:** ${queryAnalysis.intent}\n**Service Category:** ${serviceCategory}\n**Services Found:** ${services.length}\n\n### 🎯 Matching Services:\n${services.map((s, index) => 
        `\n**${index + 1}. ${s.name}** ${s.nameEn ? `(${s.nameEn})` : ''}\n` +
        `- **Description:** ${s.description}\n` +
        `- **Category:** ${s.category}\n` +
        `- **Fee:** ${s.fee || 'غير محدد'}\n` +
        `- **Processing Time:** ${s.processingTime || 'غير محدد'}\n` +
        `- **Ministry:** ${s.ministry || 'غير محدد'}\n` +
        `- **Online Available:** ${s.isOnline ? 'نعم' : 'لا'}\n` +
        `- **Contact:** ${s.contactPhone || 'غير متوفر'}\n` +
        `- **Required Documents:** ${s.documents ? s.documents.split('|').join(', ') : 'يرجى الاستفسار'}\n` +
        `- **Process Steps:** ${s.process ? s.process.split('|').join(' → ') : 'يرجى الاستفسار'}\n` +
        `${s.bawabticUrl ? `- **Official Link:** ${s.bawabticUrl}` : ''}`
      ).join('\n\n')}\n` : '\n\n## ❌ No Services Found\nNo exact matches found in database. Provide general guidance based on common procedures.\n';

    // Enhanced system prompt with comprehensive analysis
    const enhancedSystemPrompt = `# Government Services Assistant - Enhanced Analysis Mode

You are an expert Algerian government services assistant with deep knowledge of administrative procedures.

## Your Mission:
Provide **comprehensive, human-like responses** that analyze the user's query and offer complete guidance.

## Response Requirements:

### 1. **Query Analysis** 
- Understand user's specific intent and needs
- Identify the exact service they're looking for
- Consider their language preference and cultural context

### 2. **Comprehensive Information**
When services are found, provide:
- **Clear step-by-step procedures** 
- **Complete document requirements**
- **Exact fees and processing times**
- **Contact information and office locations**
- **Online service options**
- **Important warnings and tips**

### 3. **Human-Centric Guidance**
- Use a **helpful, patient tone**
- Explain **why** certain documents are needed
- Provide **alternatives** when possible
- Offer **proactive suggestions** for related services
- Include **practical tips** from experience

### 4. **Response Structure**
Always format responses with:
- 🎯 **Direct Answer** to their question
- 📋 **Detailed Process** if procedure-related
- 📄 **Required Documents** with explanations
- 🏢 **Government Office** information
- 💰 **Costs and Timeline** 
- 🌐 **Online Options** if available
- ⚠️ **Important Notes** and warnings
- 💡 **Additional Suggestions** and related services

### 5. **Language Guidelines**
- **Respond in the user's language** (Arabic/English/French)
- Use **respectful, professional Arabic** for Arabic queries
- Use **clear, administrative English** for English queries  
- Use **formal French administrative language** for French queries
- Include **key terms in other languages** when helpful

### 6. **Cultural Sensitivity**
- Understand **Algerian administrative culture**
- Reference **local practices and customs**
- Be aware of **common citizen challenges**
- Provide **reassuring guidance** for complex procedures

${detailedServicesContext}

## Current Query Context:
- **User Query:** "${userQuery}"
- **Language:** ${language}
- **Intent:** ${queryAnalysis.intent}
- **Category:** ${serviceCategory}
- **Services Found:** ${services.length}

Provide a comprehensive, helpful response that fully addresses the user's needs with all relevant information and suggestions.`;

    // Enhanced messages with comprehensive context
    const enhancedMessages = [
      {
        role: 'system' as const,
        content: enhancedSystemPrompt
      },
      ...messages.slice(-3), // Keep last 3 messages for context
    ];

    // Use OpenAI with streaming
    const result = await streamText({
      model: openai('gpt-4o-mini'),
      messages: enhancedMessages,
      temperature: 0.3,
      async onFinish({ text, usage }) {
        try {
          // Save conversation to database
          await saveConversation(sessionId, userQuery, text, language, services);
          console.log('💾 Conversation saved:', { 
            sessionId, 
            tokensUsed: usage?.totalTokens,
            servicesReferenced: services.length 
          });
        } catch (error) {
          console.error('❌ Failed to save conversation:', error);
        }
      },
    });

    // Handle streaming response for Next.js Pages API
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    for await (const chunk of result.textStream) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('❌ Chat Stream API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Search for relevant government services
 */
async function searchServices(query: string, language: string, limit: number = 8) {
  try {
    const searchTerms = extractSearchTerms(query, language);
    
    const services = await prisma.governmentService.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: searchTerms.join(' ') } },
          { nameEn: { contains: searchTerms.join(' ') } },
          { nameFr: { contains: searchTerms.join(' ') } },
          { description: { contains: searchTerms.join(' ') } },
          { keywords: { contains: searchTerms.join(' ') } },
          { keywordsEn: { contains: searchTerms.join(' ') } },
          { keywordsFr: { contains: searchTerms.join(' ') } },
        ]
      },
      take: limit,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return services;
  } catch (error) {
    console.error('❌ Service search error:', error);
    return [];
  }
}

/**
 * Extract search terms from user query
 */
function extractSearchTerms(query: string, language: string): string[] {
  const commonWords = {
    ar: ['في', 'من', 'إلى', 'على', 'عن', 'هذا', 'ذلك', 'كيف', 'ماذا', 'أين'],
    en: ['the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'how', 'what', 'where'],
    fr: ['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'dans', 'sur', 'pour', 'avec', 'comment', 'que', 'où']
  };

  const stopWords = commonWords[language as keyof typeof commonWords] || commonWords.ar;
  
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .slice(0, 10); // Limit to 10 search terms
}

/**
 * Analyze user query intent and needs
 */
function analyzeUserQuery(query: string, language: string) {
  const lowerQuery = query.toLowerCase();
  
  // Intent detection
  let intent = 'information'; // default
  
  if (lowerQuery.includes('كيف') || lowerQuery.includes('how') || lowerQuery.includes('comment')) {
    intent = 'procedure';
  } else if (lowerQuery.includes('متطلبات') || lowerQuery.includes('requirements') || lowerQuery.includes('exigences')) {
    intent = 'requirements';
  } else if (lowerQuery.includes('أين') || lowerQuery.includes('where') || lowerQuery.includes('où')) {
    intent = 'location';
  } else if (lowerQuery.includes('متى') || lowerQuery.includes('when') || lowerQuery.includes('quand')) {
    intent = 'timeline';
  } else if (lowerQuery.includes('كم') || lowerQuery.includes('cost') || lowerQuery.includes('combien')) {
    intent = 'cost';
  }
  
  // Urgency detection
  let urgency = 'normal';
  if (lowerQuery.includes('urgent') || lowerQuery.includes('مستعجل') || lowerQuery.includes('urgente')) {
    urgency = 'high';
  }
  
  // Complexity assessment
  let complexity = 'simple';
  if (lowerQuery.includes('تأسيس') || lowerQuery.includes('register') || lowerQuery.includes('création')) {
    complexity = 'complex';
  }
  
  return {
    intent,
    urgency,
    complexity,
    queryLength: query.length,
    hasSpecificTerms: lowerQuery.split(' ').length > 3
  };
}

/**
 * Detect service category from query
 */
function detectServiceCategory(query: string): string {
  const categoryKeywords = {
    'CIVIL_STATUS': ['جواز', 'بطاقة', 'هوية', 'passport', 'id', 'birth', 'marriage', 'divorce'],
    'EDUCATION': ['تعليم', 'مدرسة', 'جامعة', 'education', 'school', 'university', 'student'],
    'HEALTH': ['صحة', 'طبيب', 'مستشفى', 'health', 'doctor', 'hospital', 'medical'],
    'BUSINESS': ['تجارة', 'شركة', 'رخصة', 'business', 'company', 'license', 'trade'],
    'EMPLOYMENT': ['عمل', 'وظيفة', 'تشغيل', 'work', 'job', 'employment', 'career']
  };

  const lowerQuery = query.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      return category;
    }
  }
  
  return 'OTHER';
}

/**
 * Save conversation to database
 */
async function saveConversation(
  sessionId: string, 
  userQuery: string, 
  assistantResponse: string, 
  language: string,
  services: any[]
) {
  try {
    // Ensure session exists
    await prisma.chatSession.upsert({
      where: { sessionId },
      update: { 
        lastActive: new Date(),
        language 
      },
      create: {
        sessionId,
        language,
        isActive: true
      }
    });

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'USER',
        content: userQuery,
        language,
        metadataStr: JSON.stringify({
          servicesFound: services.length,
          serviceCategories: Array.from(new Set(services.map(s => s.category)))
        })
      }
    });

    // Save assistant message
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'ASSISTANT',
        content: assistantResponse,
        language,
        serviceRefs: services.map(s => s.id.toString()).join(','),
        metadataStr: JSON.stringify({
          servicesReferenced: services.length,
          responseLength: assistantResponse.length
        })
      }
    });

    // Track service analytics
    for (let i = 0; i < services.length; i++) {
      await prisma.serviceAnalytics.create({
        data: {
          serviceId: services[i].id,
          searchQuery: userQuery,
          language,
          resultRank: i + 1,
          sessionId,
          clicked: false // Will be updated when user interacts
        }
      });
    }

  } catch (error) {
    console.error('❌ Database save error:', error);
    throw error;
  }
}