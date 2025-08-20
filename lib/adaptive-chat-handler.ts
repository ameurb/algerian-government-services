import { prisma } from './prisma';
import { openai } from './openai';

// Fully adaptive chat handler - learns from database content dynamically
export async function handleAdaptiveChatMessage(
  message: string,
  sessionId: string,
  userId?: string
): Promise<{ response: string; metadata: any }> {
  
  const startTime = Date.now();
  console.log('[ADAPTIVE-CHAT] Processing:', message);
  
  try {
    // Step 1: Dynamically analyze what's in the database
    const databaseContent = await analyzeDatabaseContent();
    console.log('[ADAPTIVE-CHAT] Database analysis:', {
      totalServices: databaseContent.totalServices,
      categories: databaseContent.categories.length,
      keyTerms: databaseContent.keyTerms.length
    });
    
    // Step 2: Use AI to understand user intent with database context
    const userIntent = await analyzeUserIntentWithDatabaseContext(message, databaseContent);
    console.log('[ADAPTIVE-CHAT] User intent:', userIntent);
    
    // Step 3: Perform adaptive search based on database content
    const searchResult = await performAdaptiveSearch(message, userIntent, databaseContent);
    console.log('[ADAPTIVE-CHAT] Search result:', {
      count: searchResult.count,
      relevanceScore: searchResult.relevanceScore
    });
    
    // Step 4: Generate intelligent response using database content and user intent
    const responseText = await generateAdaptiveResponse(searchResult, userIntent, databaseContent);
    
    // Step 5: Save to database (with error handling)
    try {
      await prisma.chatMessage.create({
        data: { sessionId, userId, role: 'USER', content: message },
      });
      
      await prisma.chatMessage.create({
        data: {
          sessionId,
          userId,
          role: 'ASSISTANT',
          content: responseText,
          metadata: {
            servicesFound: searchResult.count,
            intent: userIntent,
            relevanceScore: searchResult.relevanceScore,
            source: 'adaptive-database',
            processingTime: Date.now() - startTime
          }
        },
      });
    } catch (dbError) {
      console.warn('[ADAPTIVE-CHAT] Database save warning:', dbError);
    }
    
    return {
      response: responseText,
      metadata: {
        servicesFound: searchResult.count,
        intent: userIntent,
        relevanceScore: searchResult.relevanceScore,
        source: 'adaptive-database',
        processingTime: Date.now() - startTime,
        success: true
      }
    };
    
  } catch (error) {
    console.error('[ADAPTIVE-CHAT] Error:', error);
    
    const isArabic = /[\u0600-\u06FF]/.test(message);
    const errorResponse = isArabic 
      ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى أو إعادة صياغة سؤالك.'
      : 'Sorry, an error occurred. Please try again or rephrase your question.';
    
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

// Dynamically analyze database content - no hardcoding
async function analyzeDatabaseContent() {
  console.log('[ADAPTIVE-ANALYSIS] Analyzing database content...');
  
  try {
    // Get all active services
    const services = await prisma.governmentService.findMany({
      where: { isActive: true },
      select: {
        name: true,
        nameEn: true,
        description: true,
        descriptionEn: true,
        category: true,
        subcategory: true,
        subcategoryEn: true,
        requirements: true,
        requirementsEn: true,
        process: true,
        processEn: true,
        targetGroup: true,
        targetGroupEn: true
      }
    });
    
    // Extract key terms dynamically from all content
    const allText = services.flatMap(service => [
      service.name,
      service.nameEn,
      service.description,
      service.descriptionEn,
      service.subcategory,
      service.subcategoryEn,
      ...(service.requirements || []),
      ...(service.requirementsEn || []),
      ...(service.process || []),
      ...(service.processEn || []),
      service.targetGroup,
      service.targetGroupEn
    ]).filter(Boolean);
    
    // Extract unique categories dynamically
    const categories = Array.from(new Set(services.map(s => s.category)));
    
    // Extract key terms using AI
    const keyTerms = await extractKeyTermsFromContent(allText.filter((text): text is string => text !== null));
    
    return {
      totalServices: services.length,
      services,
      categories,
      keyTerms,
      allContent: allText
    };
    
  } catch (error) {
    console.error('[ADAPTIVE-ANALYSIS] Error:', error);
    return {
      totalServices: 0,
      services: [],
      categories: [],
      keyTerms: [],
      allContent: []
    };
  }
}

// Use AI to extract key terms from database content dynamically
async function extractKeyTermsFromContent(allText: string[]): Promise<string[]> {
  try {
    const sampleText = allText.slice(0, 100).join(' '); // Sample for analysis
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Extract the most important and commonly used terms from this government services content.

TASK: Return a JSON array of key terms that users might search for.
Include both Arabic and English terms.
Focus on service names, document types, procedures, and common user needs.

FORMAT: ["term1", "term2", "term3", ...]
MAX: 50 terms`
        },
        {
          role: 'user',
          content: `Content sample: ${sampleText.substring(0, 2000)}`
        }
      ],
      max_tokens: 200,
      temperature: 0.1
    });
    
    const terms = JSON.parse(completion.choices[0]?.message?.content || '[]');
    return Array.isArray(terms) ? terms : [];
    
  } catch (error) {
    console.error('[ADAPTIVE-ANALYSIS] Key terms extraction failed:', error);
    return [];
  }
}

// Analyze user intent with database context - fully adaptive
async function analyzeUserIntentWithDatabaseContext(
  userQuery: string, 
  databaseContent: any
): Promise<any> {
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', 
      messages: [
        {
          role: 'system',
          content: `You are analyzing user intent for a government services database.

CONTEXT: The database contains ${databaseContent.totalServices} services in these categories: ${databaseContent.categories.join(', ')}

Common terms in database: ${databaseContent.keyTerms.slice(0, 20).join(', ')}

TASK: Analyze the user query and determine:
1. What specific information they want
2. Which database content is most relevant
3. How to search effectively in this specific database

OUTPUT: JSON only
{
  "userWants": "what the user is trying to achieve",
  "relevantCategories": ["category1", "category2"],
  "searchStrategy": "how to search in this database",
  "expectedInfo": "what specific info they need from results",
  "language": "arabic|english|french",
  "searchTerms": ["adaptive", "terms", "based", "on", "database"]
}`
        },
        {
          role: 'user',
          content: `User Query: "${userQuery}"

Available Categories: ${databaseContent.categories.join(', ')}
Database Key Terms: ${databaseContent.keyTerms.join(', ')}`
        }
      ],
      max_tokens: 300,
      temperature: 0.2
    });
    
    return JSON.parse(completion.choices[0]?.message?.content || '{}');
    
  } catch (error) {
    console.error('[ADAPTIVE-INTENT] Analysis failed:', error);
    return {
      userWants: "general inquiry",
      relevantCategories: [],
      searchStrategy: "broad search",
      expectedInfo: "service information",
      language: /[\u0600-\u06FF]/.test(userQuery) ? "arabic" : "english",
      searchTerms: [userQuery]
    };
  }
}

// Perform adaptive search based on database content analysis
async function performAdaptiveSearch(
  userQuery: string,
  userIntent: any,
  databaseContent: any
) {
  
  // Build search conditions dynamically based on AI analysis
  const searchTerms = userIntent.searchTerms || [userQuery];
  const searchConditions: any[] = [];
  
  // Create search conditions for each term
  for (const term of searchTerms) {
    if (term && term.length > 1) {
      const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      searchConditions.push(
        { name: { contains: safeTerm, mode: 'insensitive' as const } },
        { nameEn: { contains: safeTerm, mode: 'insensitive' as const } },
        { description: { contains: safeTerm, mode: 'insensitive' as const } },
        { descriptionEn: { contains: safeTerm, mode: 'insensitive' as const } },
        { subcategory: { contains: safeTerm, mode: 'insensitive' as const } },
        { subcategoryEn: { contains: safeTerm, mode: 'insensitive' as const } }
      );
    }
  }
  
  if (searchConditions.length === 0) {
    return { count: 0, results: [], relevanceScore: 0 };
  }
  
  const whereClause: any = {
    isActive: true,
    OR: searchConditions
  };
  
  // Add category filter if AI identified relevant categories
  if (userIntent.relevantCategories && userIntent.relevantCategories.length > 0) {
    whereClause.category = { in: userIntent.relevantCategories };
  }
  
  const services = await prisma.governmentService.findMany({
    where: whereClause,
    take: 10,
    orderBy: [{ createdAt: 'desc' }]
  });
  
  // Calculate relevance score using AI
  const relevanceScore = services.length > 0 ? 
    await calculateRelevanceScore(userQuery, services.slice(0, 3)) : 0;
  
  return {
    query: userQuery, // Preserve the original user query
    count: services.length,
    results: services,
    relevanceScore,
    searchTerms: userIntent.searchTerms
  };
}

// Calculate relevance score using AI
async function calculateRelevanceScore(userQuery: string, services: any[]): Promise<number> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Rate how well these services match the user's query on a scale of 0-1.
          
Consider semantic relevance, not just keyword matching.
Return only a number between 0 and 1.`
        },
        {
          role: 'user',
          content: `User Query: "${userQuery}"

Services Found:
${services.map(s => `${s.name} - ${s.description?.substring(0, 100)}`).join('\n')}

Relevance Score (0-1):`
        }
      ],
      max_tokens: 10,
      temperature: 0.1
    });
    
    const score = parseFloat(completion.choices[0]?.message?.content?.trim() || '0.5');
    return Math.max(0, Math.min(1, score));
    
  } catch (error) {
    return 0.5; // Default relevance
  }
}

// Generate adaptive response based on database content and user intent
async function generateAdaptiveResponse(
  searchResult: any,
  userIntent: any,
  databaseContent: any
): Promise<string> {
  
  if (searchResult.count === 0) {
    // Generate suggestions from actual database service names
    const popularServices = databaseContent.services.slice(0, 8).map((s: any) => s.name);
    const isArabic = /[\u0600-\u06FF]/.test(searchResult.query);
    
    if (isArabic) {
      return `لم أجد خدمات مطابقة لـ "${searchResult.query}".\n\n🔍 **الخدمات المتاحة في قاعدة البيانات:**\n${popularServices.map((name: string) => `• ${name}`).join('\n')}\n\n💡 جرب إعادة صياغة سؤالك أو استخدم كلمات مفتاحية من الخدمات أعلاه.`;
    } else {
      return `I couldn't find services matching "${searchResult.query}".\n\n🔍 **Available services in database:**\n${popularServices.map((name: string) => `• ${name}`).join('\n')}\n\n💡 Try rephrasing your question or use keywords from the services above.`;
    }
  }
  
  // Generate adaptive response using AI with database context
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system', 
          content: `You are creating responses for a government services database that contains ${databaseContent.totalServices} services.

TASK: Create a smart, helpful response that directly answers the user's question using ONLY the search results provided.

RULES:
1. **Answer their specific question** - don't list all services
2. **Extract and summarize** only the most relevant information
3. **Use the user's language** (${userIntent.language})
4. **Be contextual and helpful** - focus on what they actually need
5. **Use ONLY information from the search results** - no external knowledge

USER WANTS: ${userIntent.userWants}
EXPECTED INFO: ${userIntent.expectedInfo}

FORMAT:
- Start by directly addressing their question
- Provide the most relevant service information
- Include key details: requirements, process, fees, where to go
- End with helpful next step
- Be concise but complete`
        },
        {
          role: 'user',
          content: `User asked: "${searchResult.query}"

They want to know about: ${userIntent.userWants}

Most relevant service found:
Name: ${searchResult.results[0]?.name}
Description: ${searchResult.results[0]?.description}
Requirements: ${JSON.stringify(searchResult.results[0]?.requirements)}
Fee: ${searchResult.results[0]?.fee}
Duration: ${searchResult.results[0]?.duration}
Office: ${searchResult.results[0]?.office}
Contact: ${searchResult.results[0]?.contactInfo}

Create a natural response in ${userIntent.language} that directly tells them what they need to know about "${searchResult.query}".`
        }
      ],
      max_tokens: 600,
      temperature: 0.3
    });
    
    const aiResponse = completion.choices[0]?.message?.content?.trim();
    
    if (aiResponse) {
      console.log('[ADAPTIVE-RESPONSE] AI generated adaptive response');
      return aiResponse;
    }
    
    // Fallback to simple adaptive response
    return generateSimpleAdaptiveResponse(searchResult, userIntent);
    
  } catch (error) {
    console.error('[ADAPTIVE-RESPONSE] AI generation failed:', error);
    return generateSimpleAdaptiveResponse(searchResult, userIntent);
  }
}

// Simple adaptive fallback that works with any database content
function generateSimpleAdaptiveResponse(searchResult: any, userIntent: any): string {
  const services = searchResult.results;
  const isArabic = userIntent.language === 'arabic';
  const userQuery = searchResult.query || 'طلبك';
  
  if (services.length === 0) {
    return isArabic 
      ? `لم أجد معلومات مطابقة لـ "${userQuery}". يرجى إعادة صياغة السؤال.`
      : `No matching information found for "${userQuery}". Please rephrase your question.`;
  }
  
  // Focus on the most relevant service
  const mainService = services[0];
  let response = '';
  
  if (isArabic) {
    // Use the original user query, ensure it's not undefined
    response = `بخصوص "${userQuery}":\n\n`;
    response += `**${mainService.name}**\n`;
    
    if (mainService.description) {
      response += `📝 ${mainService.description}\n\n`;
    }
    
    // Add relevant fields dynamically
    const relevantFields = [
      { key: 'requirements', label: 'المتطلبات', emoji: '📋' },
      { key: 'fee', label: 'الرسوم', emoji: '💰' },
      { key: 'duration', label: 'المدة', emoji: '⏱️' },
      { key: 'office', label: 'المكتب', emoji: '🏢' },
      { key: 'contactInfo', label: 'الاتصال', emoji: '📞' }
    ];
    
    relevantFields.forEach(field => {
      const value = mainService[field.key];
      if (value && value !== 'غير محدد' && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          response += `${field.emoji} **${field.label}:**\n${value.slice(0, 3).map(item => `• ${item}`).join('\n')}\n\n`;
        } else if (!Array.isArray(value)) {
          response += `${field.emoji} **${field.label}:** ${value}\n`;
        }
      }
    });
    
  } else {
    // Use the original user query, ensure it's not undefined
    response = `Regarding "${userQuery}":\n\n`;
    response += `**${mainService.name}**\n`;
    
    if (mainService.description) {
      response += `📝 ${mainService.description}\n\n`;
    }
    
    // Add relevant fields dynamically
    const relevantFields = [
      { key: 'requirements', label: 'Requirements', emoji: '📋' },
      { key: 'fee', label: 'Fee', emoji: '💰' },
      { key: 'duration', label: 'Duration', emoji: '⏱️' },
      { key: 'office', label: 'Office', emoji: '🏢' },
      { key: 'contactInfo', label: 'Contact', emoji: '📞' }
    ];
    
    relevantFields.forEach(field => {
      const value = mainService[field.key];
      if (value && value !== 'غير محدد' && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          response += `${field.emoji} **${field.label}:**\n${value.slice(0, 3).map(item => `• ${item}`).join('\n')}\n\n`;
        } else if (!Array.isArray(value)) {
          response += `${field.emoji} **${field.label}:** ${value}\n`;
        }
      }
    });
  }
  
  // Add links if available
  if (mainService.bawabticUrl || mainService.onlineUrl) {
    const url = mainService.bawabticUrl || mainService.onlineUrl;
    response += `\n🌐 ${isArabic ? 'الرابط' : 'Link'}: ${url}`;
  }
  
  return response;
}