import { prisma } from './prisma';

// Direct database search - no external dependencies, just local database
export async function directDatabaseSearch(query: string, sessionId: string) {
  console.log('[DIRECT-SEARCH] Starting search for:', query);
  
  try {
    // Simple, effective search logic
    const searchTerms = extractSearchTerms(query);
    console.log('[DIRECT-SEARCH] Search terms:', searchTerms);
    
    // Search conditions - comprehensive but simple
    const searchConditions: any[] = [];
    
    for (const term of searchTerms) {
      searchConditions.push(
        { name: { contains: term, mode: 'insensitive' as const } },
        { nameEn: { contains: term, mode: 'insensitive' as const } },
        { description: { contains: term, mode: 'insensitive' as const } },
        { descriptionEn: { contains: term, mode: 'insensitive' as const } },
        { subcategory: { contains: term, mode: 'insensitive' as const } },
        { subcategoryEn: { contains: term, mode: 'insensitive' as const } }
      );
    }
    
    // Execute search
    const services = await prisma.governmentService.findMany({
      where: {
        isActive: true,
        OR: searchConditions
      },
      take: 5,
      select: {
        id: true,
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
        fee: true,
        duration: true,
        processingTime: true,
        office: true,
        contactInfo: true,
        contactPhone: true,
        bawabticUrl: true,
        onlineUrl: true,
        isOnline: true,
        benefits: true,
        benefitsEn: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('[DIRECT-SEARCH] Found services:', services.length);
    
    return {
      query,
      count: services.length,
      results: services,
      source: 'direct-database',
      searchTerms
    };
    
  } catch (error) {
    console.error('[DIRECT-SEARCH] Database error:', error);
    throw error;
  }
}

// Extract search terms with typo tolerance and variations
function extractSearchTerms(query: string): string[] {
  const originalQuery = query.toLowerCase().trim();
  const terms = [originalQuery];
  
  // Common variations and typo corrections
  const variations: Record<string, string[]> = {
    // ID Card variations (including typos)
    'بطاقة الهوية': ['بطاقة التعريف', 'التعريف الوطنية', 'بيومترية', 'هوية', 'ID'],
    'بطاقه الهويه': ['بطاقة التعريف', 'التعريف الوطنية', 'بيومترية', 'هوية', 'ID'],
    'بطاقه الهوية': ['بطاقة التعريف', 'التعريف الوطنية', 'بيومترية', 'هوية', 'ID'],
    'بطاقة الهويه': ['بطاقة التعريف', 'التعريف الوطنية', 'بيومترية', 'هوية', 'ID'],
    'id card': ['بطاقة التعريف', 'National ID', 'هوية', 'بيومترية'],
    'national id': ['بطاقة التعريف', 'التعريف الوطنية', 'هوية', 'بيومترية'],
    
    // Education grants (including typos)
    'منح التعليم': ['منحة', 'تعليم', 'دراسة', 'جامعة', 'grant', 'scholarship', 'education'],
    'منح التعليمم': ['منحة', 'تعليم', 'دراسة', 'جامعة', 'grant', 'scholarship'],
    'منحة التعليم': ['منحة', 'تعليم', 'دراسة', 'grant', 'education'],
    'education grants': ['منحة', 'تعليم', 'grant', 'scholarship'],
    'scholarship': ['منحة', 'تعليم', 'grant', 'education'],
    
    // Company registration (including typos) 
    'تأسيس شركة': ['شركة', 'تجارة', 'استثمار', 'تسجيل', 'company', 'business'],
    'تاسيس شركه': ['شركة', 'تجارة', 'استثمار', 'تسجيل', 'company', 'business'],
    'تأسيس شركه': ['شركة', 'تجارة', 'استثمار', 'تسجيل', 'company', 'business'],
    'company registration': ['شركة', 'تجارة', 'تسجيل', 'company', 'business'],
    
    // Passport (including typos)
    'جواز السفر': ['جواز', 'سفر', 'passport', 'بيومتري'],
    'passport': ['جواز', 'سفر', 'passport', 'بيومتري'],
    
    // Driving license (including typos)
    'رخصة السياقة': ['رخصة', 'سياقة', 'قيادة', 'driving', 'license'],
    'رخصت سياقه': ['رخصة', 'سياقة', 'قيادة', 'driving', 'license'],
    'driving license': ['رخصة', 'سياقة', 'قيادة', 'driving']
  };
  
  // Add variations for the query
  for (const [pattern, alternatives] of Object.entries(variations)) {
    if (originalQuery.includes(pattern.toLowerCase()) || 
        pattern.toLowerCase().includes(originalQuery)) {
      terms.push(...alternatives);
    }
  }
  
  // Also split query into individual words for broader matching
  const words = originalQuery.split(/\s+/).filter(word => word.length > 2);
  terms.push(...words);
  
  // Remove duplicates and return
  return Array.from(new Set(terms));
}

// Format response for display - database content only
export function formatSearchResponse(searchResult: any, originalQuery: string): string {
  if (searchResult.count === 0) {
    return `لم أجد خدمات تطابق "${originalQuery}" في قاعدة البيانات.\n\n🔍 جرب البحث عن:\n• بطاقة التعريف\n• جواز السفر\n• رخصة السياقة\n• تأسيس شركة\n• منحة التعليم\n\nأو اكتب "عدد الخدمات" لمعرفة إحصائيات قاعدة البيانات.`;
  }
  
  const count = searchResult.count;
  const services = searchResult.results;
  
  let response = `وجدت ${count} خدمة متعلقة بـ "${originalQuery}":\n\n`;
  
  services.forEach((service: any, index: number) => {
    response += `${index + 1}. **${service.name}**\n`;
    if (service.nameEn) {
      response += `   (${service.nameEn})\n`;
    }
    response += `   📂 التصنيف: ${service.category}\n`;
    if (service.description) {
      response += `   📝 الوصف: ${service.description.substring(0, 100)}${service.description.length > 100 ? '...' : ''}\n`;
    }
    if (service.fee && service.fee !== 'غير محدد') {
      response += `   💰 الرسوم: ${service.fee}\n`;
    }
    if (service.duration && service.duration !== 'غير محدد') {
      response += `   ⏱️ المدة: ${service.duration}\n`;
    }
    if (service.office) {
      response += `   🏢 المكتب: ${service.office}\n`;
    }
    if (service.bawabticUrl || service.onlineUrl) {
      const url = service.bawabticUrl || service.onlineUrl;
      response += `   🌐 الرابط: ${url}\n`;
    }
    if (service.isOnline) {
      response += `   ✅ متاح أونلاين\n`;
    }
    response += '\n';
  });
  
  response += `💡 هل تريد تفاصيل أكثر عن خدمة معينة؟ أو جرب البحث عن خدمة أخرى!`;
  
  return response;
}