import { openai } from './openai';
import { prisma } from './prisma';

// Human-like response generator with tools and resources
export async function generateHumanResponse(
  searchResults: any,
  userQuery: string
): Promise<string> {
  
  console.log('[HUMAN-RESPONSE] Generating natural response for:', userQuery);
  
  if (searchResults.count === 0) {
    return generateNoResultsHumanResponse(userQuery, searchResults.databaseContent);
  }
  
  // Use advanced AI with tools and resources for human-like responses
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful human assistant for Algerian government services. 

🎯 **RESPONSE STYLE:**
- Write naturally like a human expert would explain
- NO formal prefixes like "بخصوص" or "Regarding" 
- Start directly with helpful information
- Be conversational and friendly
- Focus on what the user actually needs to know

📋 **RESPONSE RULES:**
1. **Direct answer first** - immediately tell them what they need
2. **Essential info only** - requirements, fees, duration, where to go
3. **Natural language** - like explaining to a friend
4. **User's language** - respond in Arabic if they asked in Arabic
5. **Actionable guidance** - tell them exactly what to do next

✅ **GOOD EXAMPLES:**
- User: "بطاقة الهوية" → "لاستخراج بطاقة الهوية تحتاج إلى..."
- User: "passport" → "To get a passport, you need to..."
- User: "رخصة السياقة" → "للحصول على رخصة السياقة يجب..."

❌ **AVOID:**
- "بخصوص رخصة السياقة"
- "Regarding your request"  
- Formal or robotic language
- Long lists of irrelevant information

🎯 **BE NATURAL AND HELPFUL** like a human expert would explain!`
        },
        {
          role: 'user',
          content: `User asked: "${userQuery}"

Available services from database:
${JSON.stringify(searchResults.results.slice(0, 2), null, 2)}

Respond naturally in the user's language, focusing on the most relevant service. Tell them what they need to know to get "${userQuery}".`
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_service_info",
            description: "Extract specific information from a government service",
            parameters: {
              type: "object",
              properties: {
                service_name: { type: "string" },
                info_type: { 
                  type: "string", 
                  enum: ["requirements", "process", "fees", "duration", "contact", "location"]
                }
              },
              required: ["service_name", "info_type"]
            }
          }
        },
        {
          type: "function", 
          function: {
            name: "get_similar_services",
            description: "Find similar services in the database",
            parameters: {
              type: "object",
              properties: {
                category: { type: "string" },
                keyword: { type: "string" }
              },
              required: ["keyword"]
            }
          }
        }
      ],
      max_tokens: 400,
      temperature: 0.3
    });

    const aiResponse = completion.choices[0]?.message?.content?.trim();
    
    if (aiResponse) {
      console.log('[HUMAN-RESPONSE] Generated human-like response');
      return aiResponse;
    }
    
    // Fallback to simple human response
    return generateSimpleHumanResponse(searchResults, userQuery);
    
  } catch (error) {
    console.error('[HUMAN-RESPONSE] AI generation failed:', error);
    return generateSimpleHumanResponse(searchResults, userQuery);
  }
}

// Generate simple human-like response when AI fails
function generateSimpleHumanResponse(searchResults: any, userQuery: string): string {
  const services = searchResults.results;
  const isArabic = /[\u0600-\u06FF]/.test(userQuery);
  
  if (services.length === 0) {
    return generateNoResultsHumanResponse(userQuery);
  }
  
  const mainService = services[0];
  let response = '';
  
  if (isArabic) {
    // Natural Arabic response
    if (userQuery.includes('بطاقة الهوية') || userQuery.includes('بطاقة التعريف')) {
      response = `لاستخراج بطاقة الهوية الوطنية:\n\n`;
    } else if (userQuery.includes('جواز السفر')) {
      response = `للحصول على جواز السفر:\n\n`;
    } else if (userQuery.includes('رخصة السياقة') || userQuery.includes('رخصة القيادة')) {
      response = `للحصول على رخصة السياقة:\n\n`;
    } else if (userQuery.includes('شركة') || userQuery.includes('تأسيس')) {
      response = `لتأسيس شركة:\n\n`;
    } else {
      response = `${mainService.name}:\n\n`;
    }
    
    if (mainService.description) {
      response += `${mainService.description}\n\n`;
    }
    
    if (mainService.requirements && mainService.requirements.length > 0) {
      response += `**ما تحتاجه:**\n`;
      mainService.requirements.slice(0, 4).forEach((req: string) => {
        response += `• ${req}\n`;
      });
      response += '\n';
    }
    
    if (mainService.fee && mainService.fee !== 'غير محدد') {
      response += `💰 **التكلفة:** ${mainService.fee}\n`;
    }
    
    if (mainService.duration && mainService.duration !== 'غير محدد') {
      response += `⏱️ **المدة:** ${mainService.duration}\n`;
    }
    
    if (mainService.office) {
      response += `📍 **أين تذهب:** ${mainService.office}\n`;
    }
    
    if (mainService.contactInfo) {
      response += `📞 **للاستفسار:** ${mainService.contactInfo}\n`;
    }
    
    if (mainService.bawabticUrl || mainService.onlineUrl) {
      const url = mainService.bawabticUrl || mainService.onlineUrl;
      response += `\n🌐 **رابط الخدمة:** ${url}`;
    }
    
  } else {
    // Natural English response
    if (userQuery.toLowerCase().includes('id') || userQuery.toLowerCase().includes('identity')) {
      response = `To get a national ID card:\n\n`;
    } else if (userQuery.toLowerCase().includes('passport')) {
      response = `To get a passport:\n\n`;
    } else if (userQuery.toLowerCase().includes('driving') || userQuery.toLowerCase().includes('license')) {
      response = `To get a driving license:\n\n`;
    } else if (userQuery.toLowerCase().includes('company') || userQuery.toLowerCase().includes('business')) {
      response = `To register a company:\n\n`;
    } else {
      response = `${mainService.name}:\n\n`;
    }
    
    if (mainService.description) {
      response += `${mainService.description}\n\n`;
    }
    
    if (mainService.requirements && mainService.requirements.length > 0) {
      response += `**What you need:**\n`;
      mainService.requirements.slice(0, 4).forEach((req: string) => {
        response += `• ${req}\n`;
      });
      response += '\n';
    }
    
    if (mainService.fee && mainService.fee !== 'غير محدد') {
      response += `💰 **Cost:** ${mainService.fee}\n`;
    }
    
    if (mainService.duration && mainService.duration !== 'غير محدد') {
      response += `⏱️ **Duration:** ${mainService.duration}\n`;
    }
    
    if (mainService.office) {
      response += `📍 **Where to go:** ${mainService.office}\n`;
    }
    
    if (mainService.contactInfo) {
      response += `📞 **Contact:** ${mainService.contactInfo}\n`;
    }
    
    if (mainService.bawabticUrl || mainService.onlineUrl) {
      const url = mainService.bawabticUrl || mainService.onlineUrl;
      response += `\n🌐 **Service link:** ${url}`;
    }
  }
  
  return response;
}

// Human-like response when no results found
function generateNoResultsHumanResponse(userQuery: string, databaseContent?: any): string {
  const isArabic = /[\u0600-\u06FF]/.test(userQuery);
  
  if (isArabic) {
    return `لم أجد معلومات عن "${userQuery}" في قاعدة البيانات.\n\n💡 **يمكنك البحث عن:**\n• بطاقة التعريف البيومترية\n• جواز السفر البيومتري\n• رخصة السياقة\n• تسجيل شركة\n• منحة تعليمية\n• خدمات صحية\n\n✨ جرب استخدام كلمات مختلفة أو اسأل بطريقة أخرى!`;
  } else {
    return `I couldn't find information about "${userQuery}" in the database.\n\n💡 **You can search for:**\n• Biometric National ID\n• Biometric Passport\n• Driving License\n• Company Registration\n• Education Grants\n• Health Services\n\n✨ Try using different words or ask in a different way!`;
  }
}

// Advanced search with tools and resources
export async function searchWithToolsAndResources(
  userQuery: string,
  sessionId: string
): Promise<any> {
  
  console.log('[TOOLS-SEARCH] Advanced search with tools for:', userQuery);
  
  try {
    // Tool 1: Analyze query semantically
    const queryAnalysis = await analyzeQuerySemantics(userQuery);
    
    // Tool 2: Get database schema and content
    const databaseSchema = await getDatabaseSchema();
    
    // Tool 3: Perform intelligent search
    const searchResult = await performIntelligentSearch(userQuery, queryAnalysis, databaseSchema);
    
    // Resource: Get response templates
    const responseTemplates = await getResponseTemplates(queryAnalysis.language);
    
    return {
      query: userQuery,
      analysis: queryAnalysis,
      schema: databaseSchema,
      searchResult,
      templates: responseTemplates
    };
    
  } catch (error) {
    console.error('[TOOLS-SEARCH] Error:', error);
    throw error;
  }
}

// Tool: Analyze query semantics
async function analyzeQuerySemantics(query: string): Promise<any> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Analyze the semantic meaning of this government services query.

OUTPUT JSON:
{
  "mainIntent": "what they want",
  "language": "arabic|english|french", 
  "category": "most likely category",
  "keywords": ["key", "terms"],
  "searchType": "specific|general|informational"
}`
        },
        {
          role: 'user',
          content: query
        }
      ],
      max_tokens: 150,
      temperature: 0.1
    });
    
    return JSON.parse(completion.choices[0]?.message?.content || '{}');
  } catch (error) {
    return {
      mainIntent: query,
      language: /[\u0600-\u06FF]/.test(query) ? 'arabic' : 'english',
      category: 'OTHER',
      keywords: [query],
      searchType: 'general'
    };
  }
}

// Tool: Get database schema dynamically
async function getDatabaseSchema(): Promise<any> {
  try {
    const categories = await prisma.governmentService.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: true
    });
    
    const sampleServices = await prisma.governmentService.findMany({
      where: { isActive: true },
      take: 5,
      select: { name: true, nameEn: true, category: true, subcategory: true }
    });
    
    return {
      categories: categories.map(c => ({ category: c.category, count: c._count })),
      sampleServices,
      totalServices: await prisma.governmentService.count({ where: { isActive: true } })
    };
  } catch (error) {
    return { categories: [], sampleServices: [], totalServices: 0 };
  }
}

// Tool: Perform intelligent search
async function performIntelligentSearch(
  query: string,
  analysis: any,
  schema: any
): Promise<any> {
  
  // Build smart search terms
  const searchTerms = [query, ...analysis.keywords];
  const searchConditions: any[] = [];
  
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
    return { count: 0, results: [] };
  }
  
  const services = await prisma.governmentService.findMany({
    where: {
      isActive: true,
      OR: searchConditions
    },
    take: 5,
    orderBy: [{ createdAt: 'desc' }]
  });
  
  return {
    count: services.length,
    results: services,
    searchTerms
  };
}

// Resource: Get response templates
async function getResponseTemplates(language: string): Promise<any> {
  return {
    language,
    patterns: {
      arabic: {
        start: ["لـ", "للحصول على", "لاستخراج", "لتسجيل"],
        need: "تحتاج إلى",
        cost: "التكلفة",
        duration: "المدة", 
        where: "أين تذهب",
        contact: "للاستفسار"
      },
      english: {
        start: ["To get", "For", "To obtain", "To register"],
        need: "you need",
        cost: "Cost",
        duration: "Duration",
        where: "Where to go", 
        contact: "Contact"
      }
    }
  };
}