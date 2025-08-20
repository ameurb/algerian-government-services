import { prisma } from './prisma';

// Optimized chat handler - database content only, comprehensive formatting
export async function handleOptimizedChatMessage(
  message: string,
  sessionId: string,
  userId?: string
): Promise<{ response: string; metadata: any }> {
  
  const startTime = Date.now();
  console.log('[OPTIMIZED-CHAT] Processing:', message);
  
  try {
    // Step 1: Enhanced search with typo tolerance
    const searchResult = await searchServicesWithTypoTolerance(message);
    console.log('[OPTIMIZED-CHAT] Search completed:', {
      query: message,
      count: searchResult.count,
      searchTerms: searchResult.searchTerms
    });
    
    // Step 2: Generate intelligent contextual response based on user query
    const { generateIntelligentResponse } = await import('./ai-response-generator');
    const responseText = await generateIntelligentResponse(searchResult, message);
    
    // Step 3: Save both messages to database (with error handling)
    try {
      // Save user message
      await prisma.chatMessage.create({
        data: {
          sessionId,
          userId,
          role: 'USER',
          content: message,
        },
      });
      
      // Save assistant response
      await prisma.chatMessage.create({
        data: {
          sessionId,
          userId,
          role: 'ASSISTANT',
          content: responseText,
          metadata: {
            servicesFound: searchResult.count,
            searchTerms: searchResult.searchTerms,
            source: 'optimized-database',
            processingTime: Date.now() - startTime
          }
        },
      });
    } catch (dbError) {
      console.warn('[OPTIMIZED-CHAT] Database save warning (continuing):', dbError);
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`[OPTIMIZED-CHAT] Completed in ${processingTime}ms, found ${searchResult.count} services`);
    
    return {
      response: responseText,
      metadata: {
        servicesFound: searchResult.count,
        searchTerms: searchResult.searchTerms,
        source: 'optimized-database',
        processingTime,
        success: true
      }
    };
    
  } catch (error) {
    console.error('[OPTIMIZED-CHAT] Error:', error);
    
    // Generate helpful error response based on language
    const isArabic = /[\u0600-\u06FF]/.test(message);
    const errorResponse = isArabic 
      ? `عذراً، حدث خطأ في البحث.\n\n🔍 **جرب البحث عن:**\n• بطاقة التعريف البيومترية\n• جواز السفر\n• رخصة السياقة\n• تأسيس شركة\n• منحة التعليم\n\n💡 أو اكتب "إحصائيات الخدمات" لمعرفة جميع الخدمات المتاحة.`
      : `Sorry, an error occurred during search.\n\n🔍 **Try searching for:**\n• Biometric National ID\n• Passport\n• Driving License\n• Company Registration\n• Education Grants\n\n💡 Or type "service statistics" to see all available services.`;
    
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

// Enhanced search with comprehensive typo tolerance
async function searchServicesWithTypoTolerance(query: string) {
  const searchTerms = extractEnhancedSearchTerms(query);
  console.log('[OPTIMIZED-SEARCH] Enhanced search terms:', searchTerms);
  
  // Build comprehensive search conditions
  const searchConditions: any[] = [];
  
  for (const term of searchTerms) {
    if (term.length > 1) { // Skip very short terms
      // Escape special regex characters to prevent MongoDB errors
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
    return { query, count: 0, results: [], searchTerms };
  }
  
  // Execute search
  const services = await prisma.governmentService.findMany({
    where: {
      isActive: true,
      OR: searchConditions
    },
    take: 8, // Get more results for better coverage
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
      benefitsEn: true,
      targetGroup: true,
      targetGroupEn: true
    },
    orderBy: [
      { createdAt: 'desc' }
    ]
  });
  
  return {
    query,
    count: services.length,
    results: services,
    searchTerms
  };
}

// Extract enhanced search terms with comprehensive typo tolerance
function extractEnhancedSearchTerms(query: string): string[] {
  const originalQuery = query.toLowerCase().trim();
  const terms = [originalQuery];
  
  // Comprehensive typo-tolerant variations
  const variations: Record<string, string[]> = {
    // ID Cards - all possible variations and typos
    'بطاقة الهوية': ['بطاقة', 'التعريف', 'الوطنية', 'بيومترية', 'هوية', 'ID'],
    'بطاقه الهويه': ['بطاقة', 'التعريف', 'الوطنية', 'بيومترية', 'هوية', 'ID'],
    'بطاقه الهوية': ['بطاقة', 'التعريف', 'الوطنية', 'بيومترية', 'هوية', 'ID'],
    'بطاقة الهويه': ['بطاقة', 'التعريف', 'الوطنية', 'بيومترية', 'هوية', 'ID'],
    'بطاقة': ['التعريف', 'بيومترية', 'هوية', 'ID'],
    'هوية': ['بطاقة', 'التعريف', 'بيومترية', 'ID'],
    'id card': ['بطاقة', 'التعريف', 'National', 'هوية', 'بيومترية'],
    'national id': ['بطاقة', 'التعريف', 'الوطنية', 'هوية', 'بيومترية'],
    
    // Education - all variations
    'منح التعليم': ['منحة', 'تعليم', 'دراسة', 'جامعة', 'grant', 'scholarship', 'education'],
    'منح التعليمم': ['منحة', 'تعليم', 'دراسة', 'grant', 'scholarship'],
    'منحة التعليم': ['منحة', 'تعليم', 'دراسة', 'grant'],
    'منحة': ['تعليم', 'دراسة', 'grant', 'scholarship'],
    'تعليم': ['منحة', 'دراسة', 'جامعة', 'education'],
    'education grants': ['منحة', 'تعليم', 'grant', 'scholarship'],
    'scholarship': ['منحة', 'تعليم', 'grant'],
    
    // Business - all variations  
    'تأسيس شركة': ['شركة', 'تجارة', 'استثمار', 'تسجيل', 'company', 'business'],
    'تاسيس شركه': ['شركة', 'تجارة', 'استثمار', 'تسجيل', 'company', 'business'],
    'تأسيس شركه': ['شركة', 'تجارة', 'استثمار', 'تسجيل', 'company', 'business'],
    'شركة': ['تأسيس', 'تجارة', 'استثمار', 'تسجيل', 'company', 'business'],
    'company registration': ['شركة', 'تجارة', 'تسجيل', 'company', 'business'],
    'company': ['شركة', 'تأسيس', 'تجارة', 'business'],
    
    // Passport - all variations
    'جواز السفر': ['جواز', 'سفر', 'passport', 'بيومتري'],
    'جواز سفر': ['جواز', 'سفر', 'passport', 'بيومتري'], 
    'passport': ['جواز', 'سفر', 'بيومتري'],
    'جواز': ['سفر', 'passport', 'بيومتري'],
    
    // Driving license - all variations
    'رخصة السياقة': ['رخصة', 'سياقة', 'قيادة', 'driving', 'license'],
    'رخصت سياقه': ['رخصة', 'سياقة', 'قيادة', 'driving', 'license'],
    'رخصة القيادة': ['رخصة', 'سياقة', 'قيادة', 'driving', 'license'],
    'رخصة': ['سياقة', 'قيادة', 'driving', 'license'],
    'سياقة': ['رخصة', 'قيادة', 'driving', 'license'],
    'driving license': ['رخصة', 'سياقة', 'قيادة', 'driving'],
    'driving': ['رخصة', 'سياقة', 'قيادة', 'license'],
    
    // Birth certificate
    'شهادة الميلاد': ['شهادة', 'ميلاد', 'birth', 'certificate'],
    'شهاده ميلاد': ['شهادة', 'ميلاد', 'birth', 'certificate'],
    'birth certificate': ['شهادة', 'ميلاد', 'birth'],
    'شهادة': ['ميلاد', 'birth', 'certificate'],
    
    // Housing
    'سكن': ['إسكان', 'housing', 'بناء', 'ترقوي'],
    'إسكان': ['سكن', 'housing', 'بناء'],
    'housing': ['سكن', 'إسكان', 'بناء'],
    
    // Tax services
    'ضريبة': ['جباية', 'tax', 'مالية'],
    'جباية': ['ضريبة', 'tax', 'مالية'],
    'tax': ['ضريبة', 'جباية', 'مالية']
  };
  
  // Add variations for the query
  for (const [pattern, alternatives] of Object.entries(variations)) {
    if (originalQuery.includes(pattern.toLowerCase()) || 
        pattern.toLowerCase().includes(originalQuery) ||
        levenshteinDistance(originalQuery, pattern.toLowerCase()) <= 2) {
      terms.push(...alternatives);
    }
  }
  
  // Split query into individual words for broader matching
  const words = originalQuery.split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !['the', 'and', 'or', 'في', 'من', 'إلى', 'عن'].includes(word));
  terms.push(...words);
  
  return Array.from(new Set(terms));
}

// Simple Levenshtein distance for typo tolerance
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  const n = str2.length;
  const m = str1.length;

  if (n === 0) return m;
  if (m === 0) return n;

  for (let i = 0; i <= m; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= n; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }

  return matrix[m][n];
}

// Generate beautifully formatted response using database content only
function generateFormattedResponse(searchResult: any, originalQuery: string): string {
  const isArabic = /[\u0600-\u06FF]/.test(originalQuery);
  
  if (searchResult.count === 0) {
    if (isArabic) {
      return `🔍 لم أجد خدمات تطابق "${originalQuery}" في قاعدة البيانات.\n\n**جرب البحث عن:**\n🆔 بطاقة التعريف البيومترية\n✈️ جواز السفر البيومتري\n🚗 رخصة السياقة\n🏢 تأسيس شركة\n🎓 منحة التعليم العالي\n🏠 خدمات السكن\n💰 الخدمات الجبائية\n📋 شهادة الميلاد\n\n💡 أو اكتب **"إحصائيات"** لمعرفة جميع الخدمات المتاحة.`;
    } else {
      return `🔍 No services found matching "${originalQuery}" in the database.\n\n**Try searching for:**\n🆔 Biometric National ID\n✈️ Biometric Passport\n🚗 Driving License\n🏢 Company Registration\n🎓 Higher Education Grants\n🏠 Housing Services\n💰 Tax Services\n📋 Birth Certificate\n\n💡 Or type **"statistics"** to see all available services.`;
    }
  }
  
  // Services found - formulate response using received data and user query
  const count = searchResult.count;
  const services = searchResult.results;
  
  let response = '';
  
  // Natural response formulation based on query and results
  if (isArabic) {
    if (count === 1) {
      response = `✅ وجدت **خدمة واحدة** تتعلق بـ "${originalQuery}":\n\n`;
    } else {
      response = `✅ وجدت **${count} خدمة** متعلقة بـ "${originalQuery}":\n\n`;
    }
  } else {
    if (count === 1) {
      response = `✅ Found **1 service** related to "${originalQuery}":\n\n`;
    } else {
      response = `✅ Found **${count} services** related to "${originalQuery}":\n\n`;
    }
  }
  
  // Show top 5 services with full details
  services.slice(0, 5).forEach((service: any, index: number) => {
    response += `**${index + 1}. ${service.name}**\n`;
    
    if (service.nameEn && isArabic) {
      response += `   _(${service.nameEn})_\n`;
    }
    
    response += `   📂 ${isArabic ? 'التصنيف' : 'Category'}: ${service.category}`;
    if (service.subcategory) {
      response += ` - ${service.subcategory}`;
    }
    response += '\n';
    
    if (service.description) {
      const desc = service.description.length > 150 
        ? service.description.substring(0, 150) + '...'
        : service.description;
      response += `   📝 ${isArabic ? 'الوصف' : 'Description'}: ${desc}\n`;
    }
    
    // Requirements (show first 3)
    if (service.requirements && service.requirements.length > 0) {
      response += `   📋 ${isArabic ? 'المتطلبات' : 'Requirements'}:\n`;
      service.requirements.slice(0, 3).forEach((req: string) => {
        response += `      • ${req}\n`;
      });
      if (service.requirements.length > 3) {
        response += `      ${isArabic ? `... و ${service.requirements.length - 3} متطلبات أخرى` : `... and ${service.requirements.length - 3} more`}\n`;
      }
    }
    
    // Process steps (show first 2)
    if (service.process && service.process.length > 0) {
      response += `   📋 ${isArabic ? 'الخطوات' : 'Process'}:\n`;
      service.process.slice(0, 2).forEach((step: string, stepIndex: number) => {
        response += `      ${stepIndex + 1}. ${step}\n`;
      });
      if (service.process.length > 2) {
        response += `      ${isArabic ? `... و ${service.process.length - 2} خطوات أخرى` : `... and ${service.process.length - 2} more steps`}\n`;
      }
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
    
    if (service.contactInfo) {
      response += `   📞 ${isArabic ? 'الاتصال' : 'Contact'}: ${service.contactInfo}\n`;
    }
    
    if (service.bawabticUrl || service.onlineUrl) {
      const url = service.bawabticUrl || service.onlineUrl;
      response += `   🌐 ${isArabic ? 'الرابط' : 'Link'}: ${url}\n`;
    }
    
    if (service.isOnline) {
      response += `   ✅ ${isArabic ? 'متاح أونلاين' : 'Available Online'}\n`;
    }
    
    if (service.benefits && service.benefits.length > 0) {
      response += `   🎯 ${isArabic ? 'الفوائد' : 'Benefits'}: ${service.benefits.slice(0, 2).join(', ')}\n`;
    }
    
    response += '\n';
  });
  
  if (isArabic) {
    response += `💡 **هل تحتاج تفاصيل أكثر؟** أو جرب البحث عن خدمة أخرى!\n\n📊 اكتب **"إحصائيات"** لمعرفة جميع الخدمات المتاحة.`;
  } else {
    response += `💡 **Need more details?** Or try searching for another service!\n\n📊 Type **"statistics"** to see all available services.`;
  }
  
  return response;
}

// Get total services count
async function getTotalServices(): Promise<number> {
  try {
    return await prisma.governmentService.count({ where: { isActive: true } });
  } catch {
    return 50; // Fallback number
  }
}