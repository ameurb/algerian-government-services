import { prisma } from './prisma';
import { openai } from './openai';

// Multi-document handler - queries multiple services and creates comprehensive summary
export async function handleMultiDocumentChat(
  message: string,
  sessionId: string,
  userId?: string
): Promise<{ response: string; metadata: any }> {
  
  const startTime = Date.now();
  console.log('[MULTI-DOC] Processing:', message);
  
  try {
    // Step 1: Query multiple related documents from collection
    const multipleServices = await queryMultipleDocuments(message);
    console.log('[MULTI-DOC] Found documents:', {
      query: message,
      count: multipleServices.length,
      services: multipleServices.map(s => s.name)
    });
    
    // Step 2: Create comprehensive summary using AI
    const responseText = await createComprehensiveSummary(multipleServices, message);
    
    // Step 3: Save to database
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
            servicesFound: multipleServices.length,
            source: 'multi-document',
            processingTime: Date.now() - startTime
          }
        },
      });
    } catch (dbError) {
      console.warn('[MULTI-DOC] Database save warning:', dbError);
    }
    
    return {
      response: responseText,
      metadata: {
        servicesFound: multipleServices.length,
        source: 'multi-document',
        processingTime: Date.now() - startTime,
        success: true
      }
    };
    
  } catch (error) {
    console.error('[MULTI-DOC] Error:', error);
    
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

// Query multiple related documents from the collection
async function queryMultipleDocuments(query: string) {
  console.log('[MULTI-DOC] Querying multiple documents for:', query);
  
  // Extract search terms
  const searchTerms = extractSearchTerms(query);
  console.log('[MULTI-DOC] Search terms:', searchTerms);
  
  // Build search conditions for multiple documents
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
    return [];
  }
  
  // Query multiple documents (increased limit for comprehensive results)
  const services = await prisma.governmentService.findMany({
    where: {
      isActive: true,
      OR: searchConditions
    },
    take: 8, // Get multiple documents for comprehensive summary
    select: {
      id: true,
      name: true,
      nameEn: true,
      description: true,
      descriptionEn: true,
      category: true,
      subcategory: true,
      requirements: true,
      requirementsEn: true,
      process: true,
      processEn: true,
      fee: true,
      duration: true,
      processingTime: true,
      office: true,
      contactInfo: true,
      contactPhone: true,
      contactEmail: true,
      bawabticUrl: true,
      onlineUrl: true,
      isOnline: true,
      benefits: true,
      benefitsEn: true,
      targetGroup: true,
      targetGroupEn: true,
      ministry: true,
      agency: true
    },
    orderBy: [
      { createdAt: 'desc' }
    ]
  });
  
  return services;
}

// Create comprehensive summary from multiple documents
async function createComprehensiveSummary(services: any[], userQuery: string): Promise<string> {
  
  if (services.length === 0) {
    const isArabic = /[\u0600-\u06FF]/.test(userQuery);
    return isArabic 
      ? `## لم أجد معلومات عن "${userQuery}"\n\n### 💡 جرب البحث عن:\n\n` +
        `<clickable>بطاقة التعريف</clickable>\n\n` +
        `<clickable>جواز السفر</clickable>\n\n` +
        `<clickable>رخصة السياقة</clickable>\n\n` +
        `<clickable>تأسيس شركة</clickable>\n\n` +
        `<clickable>منحة التعليم</clickable>\n\n` +
        `<clickable>خدمات السكن</clickable>`
      : `## No information found for "${userQuery}"\n\n### 💡 Try searching for:\n\n` +
        `<clickable>National ID</clickable>\n\n` +
        `<clickable>Passport</clickable>\n\n` +
        `<clickable>Driving License</clickable>\n\n` +
        `<clickable>Company Registration</clickable>\n\n` +
        `<clickable>Education Grants</clickable>\n\n` +
        `<clickable>Housing Services</clickable>`;
  }
  
  try {
    console.log('[MULTI-DOC] Creating comprehensive summary from', services.length, 'documents');
    
    // Use AI to create comprehensive summary from multiple documents
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are creating a comprehensive summary from multiple government services documents.

🎯 **TASK:** 
Create a comprehensive markdown-formatted response that addresses the user's query.

📋 **MARKDOWN FORMAT RULES:**
1. **Use proper markdown syntax** - headers (##, ###), lists (-, *), bold (**text**)
2. **Organize with headers** - clear sections and subsections
3. **User's language** - Arabic if they asked in Arabic
4. **Clickable suggestions** - format suggestions as simple text (no markdown in suggestions)
5. **Database content only** - no external information

✅ **MARKDOWN STRUCTURE:**
\`\`\`markdown
## الخدمة الرئيسية

### المتطلبات
- متطلب 1
- متطلب 2

### الخطوات
1. خطوة أولى
2. خطوة ثانية

### معلومات إضافية
**الرسوم:** 200 دج
**المدة:** 7-15 يوم

[رابط الخدمة](https://example.com)
\`\`\`

🎯 **GOAL:** Well-structured markdown that displays beautifully in the UI.`
        },
        {
          role: 'user',
          content: `User Query: "${userQuery}"

Multiple Services Found (${services.length} documents):

${services.map((service, index) => `
Document ${index + 1}:
Name: ${service.name}
Description: ${service.description}
Category: ${service.category}
Subcategory: ${service.subcategory}
Requirements: ${JSON.stringify(service.requirements)}
Process: ${JSON.stringify(service.process)}
Fee: ${service.fee}
Duration: ${service.duration}
Office: ${service.office}
Contact: ${service.contactInfo}
Phone: ${service.contactPhone}
Link: ${service.bawabticUrl || service.onlineUrl}
Online: ${service.isOnline}
Benefits: ${JSON.stringify(service.benefits)}
Target: ${service.targetGroup}
Ministry: ${service.ministry}
`).join('\n')}

Create a comprehensive summary that addresses "${userQuery}" using information from ALL these documents.`
        }
      ],
      max_tokens: 800,
      temperature: 0.3
    });

    const aiSummary = completion.choices[0]?.message?.content?.trim();
    
    if (aiSummary) {
      console.log('[MULTI-DOC] AI generated comprehensive summary');
      return aiSummary;
    }
    
    // Fallback to manual summarization
    return createManualSummary(services, userQuery);
    
  } catch (error) {
    console.error('[MULTI-DOC] AI summary failed:', error);
    return createManualSummary(services, userQuery);
  }
}

// Manual summary creation from multiple documents in markdown format
function createManualSummary(services: any[], userQuery: string): string {
  const isArabic = /[\u0600-\u06FF]/.test(userQuery);
  
  let response = '';
  
  if (isArabic) {
    response = `## خدمات "${userQuery}"\n\n`;
    response += `تم العثور على **${services.length} خدمة** متعلقة بطلبك:\n\n`;
    
    // Combine information from all services in markdown
    services.slice(0, 3).forEach((service, index) => {
      response += `### ${index + 1}. ${service.name}\n\n`;
      
      if (service.description) {
        response += `${service.description}\n\n`;
      }
      
      if (service.requirements && service.requirements.length > 0) {
        response += `#### المتطلبات\n`;
        service.requirements.slice(0, 4).forEach((req: string) => {
          response += `- ${req}\n`;
        });
        response += '\n';
      }
      
      if (service.process && service.process.length > 0) {
        response += `#### الخطوات\n`;
        service.process.slice(0, 3).forEach((step: string, stepIndex: number) => {
          response += `${stepIndex + 1}. ${step}\n`;
        });
        response += '\n';
      }
      
      response += `#### معلومات الخدمة\n`;
      if (service.fee && service.fee !== 'غير محدد') {
        response += `**الرسوم:** ${service.fee}\n`;
      }
      if (service.duration && service.duration !== 'غير محدد') {
        response += `**المدة:** ${service.duration}\n`;
      }
      if (service.office) {
        response += `**المكتب:** ${service.office}\n`;
      }
      
      if (service.bawabticUrl) {
        response += `\n[🌐 رابط الخدمة](${service.bawabticUrl})\n`;
      }
      
      response += '\n---\n\n';
    });
    
  } else {
    response = `## "${userQuery}" Services\n\n`;
    response += `Found **${services.length} services** related to your request:\n\n`;
    
    // Combine information from all services in markdown
    services.slice(0, 3).forEach((service, index) => {
      response += `### ${index + 1}. ${service.name}\n\n`;
      
      if (service.description) {
        response += `${service.description}\n\n`;
      }
      
      if (service.requirements && service.requirements.length > 0) {
        response += `#### Requirements\n`;
        service.requirements.slice(0, 4).forEach((req: string) => {
          response += `- ${req}\n`;
        });
        response += '\n';
      }
      
      if (service.process && service.process.length > 0) {
        response += `#### Process\n`;
        service.process.slice(0, 3).forEach((step: string, stepIndex: number) => {
          response += `${stepIndex + 1}. ${step}\n`;
        });
        response += '\n';
      }
      
      response += `#### Service Information\n`;
      if (service.fee && service.fee !== 'غير محدد') {
        response += `**Fee:** ${service.fee}\n`;
      }
      if (service.duration && service.duration !== 'غير محدد') {
        response += `**Duration:** ${service.duration}\n`;
      }
      if (service.office) {
        response += `**Office:** ${service.office}\n`;
      }
      
      if (service.bawabticUrl) {
        response += `\n[🌐 Service Link](${service.bawabticUrl})\n`;
      }
      
      response += '\n---\n\n';
    });
  }
  
  return response;
}

// Extract search terms for multi-document search
function extractSearchTerms(query: string): string[] {
  const terms = [query.toLowerCase().trim()];
  
  // Add common variations
  const variations: Record<string, string[]> = {
    'جواز السفر': ['جواز', 'سفر', 'passport', 'بيومتري'],
    'بطاقة الهوية': ['بطاقة', 'التعريف', 'هوية', 'ID', 'بيومترية'],
    'رخصة السياقة': ['رخصة', 'سياقة', 'قيادة', 'license', 'driving'],
    'تأسيس شركة': ['شركة', 'تأسيس', 'company', 'business', 'تسجيل'],
    'سكن': ['سكن', 'إسكان', 'housing', 'بناء', 'ترقوي'],
    'ضريبة': ['ضريبة', 'جباية', 'tax', 'مالية'],
    'شهادة الميلاد': ['شهادة', 'ميلاد', 'birth', 'certificate'],
    'منح التعليم': ['منحة', 'تعليم', 'grant', 'education', 'دراسة']
  };
  
  for (const [pattern, alternatives] of Object.entries(variations)) {
    if (query.toLowerCase().includes(pattern.toLowerCase())) {
      terms.push(...alternatives);
    }
  }
  
  // Add individual words
  const words = query.split(/\s+/).filter(word => word.length > 2);
  terms.push(...words);
  
  return Array.from(new Set(terms));
}