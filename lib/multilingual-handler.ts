import { sqliteService } from './sqlite-prisma';
import { openai } from './openai';

// Multilingual handler using 3 language collections (Arabic, French, English)
export async function handleMultilingualChat(
  message: string,
  sessionId: string,
  userId?: string
): Promise<{ response: string; metadata: any }> {
  
  const startTime = Date.now();
  console.log('[MULTILINGUAL] Processing:', message);
  
  try {
    // Step 1: Detect user language and query appropriate collection
    const userLanguage = detectUserLanguage(message);
    console.log('[MULTILINGUAL] Detected language:', userLanguage);
    
    // Step 2: Query multiple documents from appropriate language collection
    const services = await queryLanguageCollection(message, userLanguage);
    console.log('[MULTILINGUAL] Found services:', {
      language: userLanguage,
      count: services.length,
      services: services.map(s => s.title)
    });
    
    // Step 3: Get categories for context
    const categories = await sqliteService.getCategories();
    
    // Step 4: Generate comprehensive markdown response
    const responseText = await generateMultilingualResponse(services, message, userLanguage, categories);
    
    // Step 5: Save to chat history (using original MongoDB for chat logs)
    try {
      const { prisma } = await import('./prisma');
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
            servicesFound: services.length,
            language: userLanguage,
            source: 'multilingual-sqlite',
            processingTime: Date.now() - startTime
          }
        },
      });
    } catch (dbError) {
      console.warn('[MULTILINGUAL] Chat history save warning:', dbError);
    }
    
    return {
      response: responseText,
      metadata: {
        servicesFound: services.length,
        language: userLanguage,
        source: 'multilingual-sqlite',
        processingTime: Date.now() - startTime,
        success: true
      }
    };
    
  } catch (error) {
    console.error('[MULTILINGUAL] Error:', error);
    
    const isArabic = /[\u0600-\u06FF]/.test(message);
    const errorResponse = isArabic 
      ? 'عذراً، حدث خطأ في البحث. يرجى المحاولة مرة أخرى.'
      : 'Sorry, an error occurred during search. Please try again.';
    
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

// Detect user language for appropriate collection query
function detectUserLanguage(message: string): 'arabic' | 'french' | 'english' {
  // Arabic detection
  const arabicPattern = /[\u0600-\u06FF]/;
  if (arabicPattern.test(message)) {
    return 'arabic';
  }
  
  // French detection (common French words)
  const frenchWords = ['le', 'la', 'les', 'de', 'du', 'des', 'et', 'ou', 'carte', 'passeport', 'permis', 'société', 'état', 'civil'];
  const lowerMessage = message.toLowerCase();
  if (frenchWords.some(word => lowerMessage.includes(word))) {
    return 'french';
  }
  
  return 'english';
}

// Query the appropriate language collection using SQLite
async function queryLanguageCollection(message: string, language: string) {
  console.log('[MULTILINGUAL] Querying', language, 'collection');
  
  // Extract search terms
  const searchTerms = extractSearchTerms(message, language);
  console.log('[MULTILINGUAL] Search terms:', searchTerms);
  
  if (searchTerms.length === 0) {
    return [];
  }
  
  // Query the appropriate language collection
  let services;
  
  try {
    switch (language) {
      case 'arabic':
        services = await sqliteService.queryArabicServices(searchTerms);
        break;
        
      case 'french':
        services = await sqliteService.queryFrenchServices(searchTerms);
        break;
        
      case 'english':
      default:
        services = await sqliteService.queryEnglishServices(searchTerms);
        break;
    }
    
    return services;
  } catch (error) {
    console.error('[MULTILINGUAL] Database query error:', error);
    return [];
  }
}

// Extract search terms based on language
function extractSearchTerms(message: string, language: string): string[] {
  const terms = [message.toLowerCase().trim()];
  
  // Language-specific variations
  if (language === 'arabic') {
    const arabicVariations: Record<string, string[]> = {
      'بطاقة الهوية': ['بطاقة', 'التعريف', 'هوية', 'بيومترية'],
      'جواز السفر': ['جواز', 'سفر', 'بيومتري'],
      'رخصة السياقة': ['رخصة', 'سياقة', 'قيادة'],
      'شهادة الميلاد': ['شهادة', 'ميلاد'],
      'عقد الزواج': ['عقد', 'زواج'],
      'شركة': ['شركة', 'تأسيس', 'تسجيل'],
      'عمل': ['عمل', 'توظيف', 'وظيفة'],
      'سكن': ['سكن', 'إسكان', 'بناء'],
      'ضريبة': ['ضريبة', 'جباية', 'مالية']
    };
    
    for (const [pattern, variations] of Object.entries(arabicVariations)) {
      if (message.includes(pattern)) {
        terms.push(...variations);
      }
    }
  } else if (language === 'french') {
    const frenchVariations: Record<string, string[]> = {
      'carte identité': ['carte', 'identité', 'nationale'],
      'passeport': ['passeport', 'biométrique'],
      'permis conduire': ['permis', 'conduire', 'conduite'],
      'acte naissance': ['acte', 'naissance'],
      'acte mariage': ['acte', 'mariage'],
      'société': ['société', 'entreprise', 'création'],
      'emploi': ['emploi', 'travail', 'poste'],
      'logement': ['logement', 'habitat'],
      'impôt': ['impôt', 'taxe', 'fiscal']
    };
    
    for (const [pattern, variations] of Object.entries(frenchVariations)) {
      if (message.toLowerCase().includes(pattern)) {
        terms.push(...variations);
      }
    }
  } else {
    const englishVariations: Record<string, string[]> = {
      'id card': ['id', 'card', 'identity', 'national'],
      'passport': ['passport', 'biometric'],
      'driving license': ['driving', 'license', 'permit'],
      'birth certificate': ['birth', 'certificate'],
      'marriage certificate': ['marriage', 'certificate'],
      'company': ['company', 'business', 'registration'],
      'employment': ['employment', 'job', 'work'],
      'housing': ['housing', 'residence'],
      'tax': ['tax', 'taxation', 'fiscal']
    };
    
    for (const [pattern, variations] of Object.entries(englishVariations)) {
      if (message.toLowerCase().includes(pattern)) {
        terms.push(...variations);
      }
    }
  }
  
  // Add individual words
  const words = message.split(/\s+/).filter(word => word.length > 2);
  terms.push(...words);
  
  return Array.from(new Set(terms));
}

// Generate comprehensive multilingual markdown response
async function generateMultilingualResponse(
  services: any[],
  userQuery: string,
  language: string,
  categories: any[]
): Promise<string> {
  
  if (services.length === 0) {
    return generateNoResultsResponse(userQuery, language, categories);
  }
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Create a comprehensive markdown response for Algerian government services.

🎯 **TASK:** 
Analyze ALL the provided services and create a complete, well-structured markdown response.

📋 **MARKDOWN RULES:**
1. **Proper markdown syntax** - use ##, ###, -, *, **, []()
2. **User's language** - respond in ${language}
3. **Comprehensive summary** - combine information from ALL services
4. **Official service URLs** - use AccessOnlineServiceUrl when available
5. **Well-organized structure** - clear sections and subsections

✅ **RESPONSE STRUCTURE:**
\`\`\`markdown
## Main Service Title

### الخطوات / Steps / Étapes
1. Step 1
2. Step 2

### المتطلبات / Requirements / Exigences  
- Requirement 1
- Requirement 2

### معلومات الخدمة / Service Info / Informations
**الرسوم / Fee / Coût:** [amount]
**المدة / Duration / Durée:** [time]

### الخدمات المتاحة / Available Services / Services Disponibles
- Service 1: [Official Link](URL)
- Service 2: [Official Link](URL)

### جهات الاختصاص / Organizations / Organisations
**المسؤول:** Organization name
\`\`\`

🎯 **FOCUS:** Create comprehensive, actionable guidance using ALL provided service information.`
        },
        {
          role: 'user',
          content: `User Query (${language}): "${userQuery}"

Services Found (${services.length}):
${services.map((service, index) => `
Service ${index + 1}:
Title: ${service.title}
Content: ${service.content}
Summary: ${service.summary}
Category: ${service.categoryName}
Organization: ${service.OrganizationConcerned}
Target: ${service.TargetPopulation}
Official URL: ${service.AccessOnlineServiceUrl}
Service URL: ${service.url}
Themes: ${service.Themes}
`).join('\n')}

Create a comprehensive markdown response that synthesizes ALL this information to help the user with "${userQuery}".`
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const aiResponse = completion.choices[0]?.message?.content?.trim();
    
    if (aiResponse) {
      console.log('[MULTILINGUAL] Generated comprehensive response');
      return aiResponse;
    }
    
    // Fallback to manual markdown generation
    return generateManualMarkdownResponse(services, userQuery, language);
    
  } catch (error) {
    console.error('[MULTILINGUAL] AI response failed:', error);
    return generateManualMarkdownResponse(services, userQuery, language);
  }
}

// Generate no results response with suggestions from categories
function generateNoResultsResponse(userQuery: string, language: string, categories: any[]): string {
  
  const suggestions = categories.slice(0, 8);
  
  if (language === 'arabic') {
    return `## لم أجد معلومات عن "${userQuery}"\n\n### 💡 جرب البحث في هذه الفئات:\n\n` +
      suggestions.map(cat => `<clickable>${cat.categoryNameAr}</clickable>\n\n`).join('') +
      `\n### 🌐 تصفح جميع الفئات:\n` +
      suggestions.map(cat => `- [${cat.categoryNameAr}](${cat.baseUrl}?req=themes&op=services&id=${cat.categoryId})`).join('\n');
  } else if (language === 'french') {
    return `## Aucune information trouvée pour "${userQuery}"\n\n### 💡 Essayez de rechercher dans ces catégories:\n\n` +
      suggestions.map(cat => `<clickable>${cat.categoryNameFr}</clickable>\n\n`).join('') +
      `\n### 🌐 Parcourir toutes les catégories:\n` +
      suggestions.map(cat => `- [${cat.categoryNameFr}](${cat.baseUrl}?req=themes&op=services&id=${cat.categoryId})`).join('\n');
  } else {
    return `## No information found for "${userQuery}"\n\n### 💡 Try searching in these categories:\n\n` +
      suggestions.map(cat => `<clickable>${cat.categoryNameEn}</clickable>\n\n`).join('') +
      `\n### 🌐 Browse all categories:\n` +
      suggestions.map(cat => `- [${cat.categoryNameEn}](${cat.baseUrl}?req=themes&op=services&id=${cat.categoryId})`).join('\n');
  }
}

// Manual markdown generation fallback
function generateManualMarkdownResponse(services: any[], userQuery: string, language: string): string {
  
  let response = '';
  
  if (language === 'arabic') {
    response = `## خدمات "${userQuery}"\n\n`;
    response += `تم العثور على **${services.length} خدمة** متعلقة بطلبك:\n\n`;
    
    services.slice(0, 3).forEach((service, index) => {
      response += `### ${index + 1}. ${service.title}\n\n`;
      
      if (service.summary) {
        response += `${service.summary}\n\n`;
      }
      
      if (service.content) {
        response += `#### تفاصيل الخدمة\n${service.content.substring(0, 300)}${service.content.length > 300 ? '...' : ''}\n\n`;
      }
      
      if (service.OrganizationConcerned) {
        response += `**الجهة المسؤولة:** ${service.OrganizationConcerned}\n`;
      }
      
      if (service.TargetPopulation) {
        response += `**الفئة المستهدفة:** ${service.TargetPopulation}\n`;
      }
      
      if (service.AccessOnlineServiceUrl) {
        response += `\n[🌐 الرابط الرسمي للخدمة](${service.AccessOnlineServiceUrl})\n`;
      } else if (service.url) {
        response += `\n[🌐 صفحة الخدمة](${service.url})\n`;
      }
      
      response += '\n---\n\n';
    });
    
  } else if (language === 'french') {
    response = `## Services "${userQuery}"\n\n`;
    response += `Trouvé **${services.length} services** liés à votre demande:\n\n`;
    
    services.slice(0, 3).forEach((service, index) => {
      response += `### ${index + 1}. ${service.title}\n\n`;
      
      if (service.summary) {
        response += `${service.summary}\n\n`;
      }
      
      if (service.content) {
        response += `#### Détails du service\n${service.content.substring(0, 300)}${service.content.length > 300 ? '...' : ''}\n\n`;
      }
      
      if (service.OrganizationConcerned) {
        response += `**Organisation responsable:** ${service.OrganizationConcerned}\n`;
      }
      
      if (service.TargetPopulation) {
        response += `**Population cible:** ${service.TargetPopulation}\n`;
      }
      
      if (service.AccessOnlineServiceUrl) {
        response += `\n[🌐 Lien officiel du service](${service.AccessOnlineServiceUrl})\n`;
      } else if (service.url) {
        response += `\n[🌐 Page du service](${service.url})\n`;
      }
      
      response += '\n---\n\n';
    });
    
  } else {
    response = `## "${userQuery}" Services\n\n`;
    response += `Found **${services.length} services** related to your request:\n\n`;
    
    services.slice(0, 3).forEach((service, index) => {
      response += `### ${index + 1}. ${service.title}\n\n`;
      
      if (service.summary) {
        response += `${service.summary}\n\n`;
      }
      
      if (service.content) {
        response += `#### Service Details\n${service.content.substring(0, 300)}${service.content.length > 300 ? '...' : ''}\n\n`;
      }
      
      if (service.OrganizationConcerned) {
        response += `**Responsible Organization:** ${service.OrganizationConcerned}\n`;
      }
      
      if (service.TargetPopulation) {
        response += `**Target Population:** ${service.TargetPopulation}\n`;
      }
      
      if (service.AccessOnlineServiceUrl) {
        response += `\n[🌐 Official Service Link](${service.AccessOnlineServiceUrl})\n`;
      } else if (service.url) {
        response += `\n[🌐 Service Page](${service.url})\n`;
      }
      
      response += '\n---\n\n';
    });
  }
  
  return response;
}