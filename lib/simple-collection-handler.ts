import { prisma } from './prisma';
import { openai } from './openai';

// Simple single collection handler - uses only governmentService collection
export async function handleSimpleCollectionChat(
  message: string,
  sessionId: string,
  userId?: string
): Promise<{ response: string; metadata: any }> {
  
  const startTime = Date.now();
  console.log('[SIMPLE-COLLECTION] Processing:', message);
  
  try {
    // Step 1: Simple direct search in single collection
    const searchResult = await searchSingleCollection(message);
    console.log('[SIMPLE-COLLECTION] Search result:', {
      query: message,
      count: searchResult.length
    });
    
    // Step 2: Generate human response using only this collection data
    const responseText = await generateResponseFromCollection(searchResult, message);
    
    // Step 3: Save to database (single collection approach)
    try {
      await prisma.chatMessage.create({
        data: {
          sessionId,
          userId,
          role: 'USER',
          content: message,
        },
      });
      
      await prisma.chatMessage.create({
        data: {
          sessionId,
          userId,
          role: 'ASSISTANT',
          content: responseText,
          metadata: {
            servicesFound: searchResult.length,
            source: 'single-collection',
            processingTime: Date.now() - startTime
          }
        },
      });
    } catch (dbError) {
      console.warn('[SIMPLE-COLLECTION] Database save warning:', dbError);
    }
    
    return {
      response: responseText,
      metadata: {
        servicesFound: searchResult.length,
        source: 'single-collection',
        processingTime: Date.now() - startTime,
        success: true
      }
    };
    
  } catch (error) {
    console.error('[SIMPLE-COLLECTION] Error:', error);
    
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

// Simple search in single governmentService collection only
async function searchSingleCollection(query: string) {
  console.log('[SIMPLE-COLLECTION] Searching in governmentService collection for:', query);
  
  // Simple search terms extraction
  const searchTerms = extractSimpleSearchTerms(query);
  console.log('[SIMPLE-COLLECTION] Search terms:', searchTerms);
  
  // Build simple search conditions
  const searchConditions: any[] = [];
  
  for (const term of searchTerms) {
    if (term && term.length > 1) {
      const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      searchConditions.push(
        { name: { contains: safeTerm, mode: 'insensitive' as const } },
        { nameEn: { contains: safeTerm, mode: 'insensitive' as const } },
        { description: { contains: safeTerm, mode: 'insensitive' as const } },
        { descriptionEn: { contains: safeTerm, mode: 'insensitive' as const } }
      );
    }
  }
  
  if (searchConditions.length === 0) {
    return [];
  }
  
  // Single collection query - simple and fast
  const services = await prisma.governmentService.findMany({
    where: {
      isActive: true,
      OR: searchConditions
    },
    take: 3, // Keep it simple - max 3 results
    select: {
      id: true,
      name: true,
      nameEn: true,
      description: true,
      category: true,
      requirements: true,
      fee: true,
      duration: true,
      office: true,
      contactInfo: true,
      bawabticUrl: true,
      isOnline: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  return services;
}

// Extract simple search terms without complex logic
function extractSimpleSearchTerms(query: string): string[] {
  const terms = [query.toLowerCase().trim()];
  
  // Simple variations only
  const simpleVariations: Record<string, string[]> = {
    'بطاقة الهوية': ['بطاقة', 'التعريف', 'هوية', 'ID'],
    'جواز السفر': ['جواز', 'سفر', 'passport'],
    'رخصة السياقة': ['رخصة', 'سياقة', 'قيادة', 'license', 'driving'],
    'تأسيس شركة': ['شركة', 'تأسيس', 'company', 'business'],
    'شهادة الميلاد': ['شهادة', 'ميلاد', 'birth', 'certificate'],
    'منح التعليم': ['منحة', 'تعليم', 'grant', 'education'],
    'ضريبة': ['ضريبة', 'جباية', 'tax'],
    'سكن': ['سكن', 'إسكان', 'housing']
  };
  
  // Add variations if found
  for (const [pattern, variations] of Object.entries(simpleVariations)) {
    if (query.toLowerCase().includes(pattern.toLowerCase())) {
      terms.push(...variations);
      break; // Only one match needed
    }
  }
  
  // Add individual words
  const words = query.split(/\s+/).filter(word => word.length > 2);
  terms.push(...words);
  
  return Array.from(new Set(terms));
}

// Generate response using AI with single collection data
async function generateResponseFromCollection(services: any[], userQuery: string): Promise<string> {
  
  if (services.length === 0) {
    const isArabic = /[\u0600-\u06FF]/.test(userQuery);
    return isArabic 
      ? `لم أجد معلومات عن "${userQuery}".\n\n💡 جرب البحث عن: بطاقة التعريف، جواز السفر، رخصة السياقة، تأسيس شركة`
      : `No information found for "${userQuery}".\n\nTry searching for: National ID, Passport, Driving License, Company Registration`;
  }
  
  try {
    // Use AI to create natural response from single collection data
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Create a natural, helpful response about Algerian government services.

RULES:
1. **Natural conversation** - like talking to a human expert
2. **User's language** - Arabic if they asked in Arabic, English if English
3. **Essential info only** - what they need to know
4. **No formal prefixes** - start directly with useful information
5. **Database content only** - use only the provided service information

EXAMPLES:
- Arabic query → Start with "لاستخراج..." or "للحصول على..." 
- English query → Start with "To get..." or "For..."

Be conversational and helpful!`
        },
        {
          role: 'user',
          content: `User asked: "${userQuery}"

Service found:
Name: ${services[0].name}
Description: ${services[0].description}
Requirements: ${JSON.stringify(services[0].requirements)}
Fee: ${services[0].fee}
Duration: ${services[0].duration}
Office: ${services[0].office}
Contact: ${services[0].contactInfo}

Create a natural response that tells them how to get "${userQuery}".`
        }
      ],
      max_tokens: 300,
      temperature: 0.3
    });

    const aiResponse = completion.choices[0]?.message?.content?.trim();
    if (aiResponse) {
      return aiResponse;
    }
    
    // Fallback to simple formatting
    return formatSimpleResponse(services[0], userQuery);
    
  } catch (error) {
    console.error('[SIMPLE-COLLECTION] AI response failed:', error);
    return formatSimpleResponse(services[0], userQuery);
  }
}

// Simple response formatting fallback
function formatSimpleResponse(service: any, userQuery: string): string {
  const isArabic = /[\u0600-\u06FF]/.test(userQuery);
  
  let response = '';
  
  if (isArabic) {
    response = `${service.name}:\n\n`;
    if (service.description) {
      response += `${service.description}\n\n`;
    }
    
    if (service.requirements && service.requirements.length > 0) {
      response += `**المطلوب:**\n`;
      service.requirements.slice(0, 4).forEach((req: string) => {
        response += `• ${req}\n`;
      });
      response += '\n';
    }
    
    if (service.fee && service.fee !== 'غير محدد') {
      response += `💰 **الرسوم:** ${service.fee}\n`;
    }
    
    if (service.duration && service.duration !== 'غير محدد') {
      response += `⏱️ **المدة:** ${service.duration}\n`;
    }
    
    if (service.office) {
      response += `📍 **المكان:** ${service.office}\n`;
    }
    
  } else {
    response = `${service.name}:\n\n`;
    if (service.description) {
      response += `${service.description}\n\n`;
    }
    
    if (service.requirements && service.requirements.length > 0) {
      response += `**Requirements:**\n`;
      service.requirements.slice(0, 4).forEach((req: string) => {
        response += `• ${req}\n`;
      });
      response += '\n';
    }
    
    if (service.fee && service.fee !== 'غير محدد') {
      response += `💰 **Fee:** ${service.fee}\n`;
    }
    
    if (service.duration && service.duration !== 'غير محدد') {
      response += `⏱️ **Duration:** ${service.duration}\n`;
    }
    
    if (service.office) {
      response += `📍 **Location:** ${service.office}\n`;
    }
  }
  
  if (service.bawabticUrl) {
    response += `\n🌐 ${isArabic ? 'الرابط' : 'Link'}: ${service.bawabticUrl}`;
  }
  
  return response;
}