import { openai } from './openai';

// AI-powered response generator that creates smart summaries
export async function generateIntelligentResponse(
  searchResults: any,
  userQuery: string
): Promise<string> {
  
  console.log('[AI-RESPONSE] Generating intelligent response for:', userQuery);
  console.log('[AI-RESPONSE] Search results count:', searchResults.count);
  
  // If no results, provide helpful guidance
  if (searchResults.count === 0) {
    return generateNoResultsResponse(userQuery);
  }
  
  // Use AI to create a contextual summary based on user query and results
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert assistant for Algerian government services. 

TASK: Create a smart, contextual response based on the user's query and search results.

RESPONSE RULES:
1. **Answer the user's specific question** - don't list all services
2. **Extract only relevant information** that directly answers their query
3. **Be concise and helpful** - focus on what they actually need
4. **Use the language of the user's query** (Arabic/English)
5. **Provide actionable guidance** based on the most relevant service(s)

RESPONSE FORMAT:
- Start with direct answer to their question
- Include most relevant service details (1-2 services max)
- Add essential info: requirements, fee, duration, where to go
- End with helpful next step or additional guidance

EXAMPLES:
- User asks "بطاقة الهوية" → Focus on ID card issuance process, not tracking or reading services
- User asks "passport" → Focus on passport application, not photo upload services
- User asks "company registration" → Focus on registration process, not certificates

Be smart about understanding what they really need and respond accordingly.`
        },
        {
          role: 'user', 
          content: `User Query: "${userQuery}"

Search Results:
${JSON.stringify(searchResults.results.slice(0, 5), null, 2)}

Please create a smart, contextual response that directly answers the user's question using only the most relevant information from these results.`
        }
      ],
      max_tokens: 800,
      temperature: 0.3,
    });

    const aiResponse = completion.choices[0]?.message?.content?.trim();
    
    if (aiResponse) {
      console.log('[AI-RESPONSE] AI-generated response length:', aiResponse.length);
      return aiResponse;
    }
    
    // Fallback if AI fails
    return generateFallbackResponse(searchResults, userQuery);
    
  } catch (error) {
    console.error('[AI-RESPONSE] AI generation failed:', error);
    return generateFallbackResponse(searchResults, userQuery);
  }
}

// Generate helpful response when no results found
function generateNoResultsResponse(userQuery: string): string {
  const isArabic = /[\u0600-\u06FF]/.test(userQuery);
  
  if (isArabic) {
    return `لم أجد خدمات مطابقة تماماً لـ "${userQuery}".\n\n🔍 **جرب البحث بكلمات أخرى:**\n• بطاقة التعريف (بدلاً من بطاقة الهوية)\n• جواز السفر البيومتري\n• رخصة السياقة\n• تأسيس شركة\n• منحة التعليم\n\n💡 أو اسأل بطريقة مختلفة مثل "كيف أحصل على..." أو "ما هي متطلبات..."`;
  } else {
    return `I couldn't find services exactly matching "${userQuery}".\n\n🔍 **Try searching with different terms:**\n• National ID (instead of ID card)\n• Biometric Passport\n• Driving License\n• Company Registration\n• Education Grants\n\n💡 Or ask differently like "How to get..." or "What are the requirements for..."`;
  }
}

// Fallback response if AI fails
function generateFallbackResponse(searchResults: any, userQuery: string): string {
  const isArabic = /[\u0600-\u06FF]/.test(userQuery);
  const services = searchResults.results;
  
  if (services.length === 0) {
    return generateNoResultsResponse(userQuery);
  }
  
  // Show only the most relevant service
  const mainService = services[0];
  
  let response = '';
  
  if (isArabic) {
    response = `للحصول على ${userQuery}:\n\n`;
    response += `**${mainService.name}**\n`;
    if (mainService.description) {
      response += `📝 ${mainService.description.substring(0, 150)}${mainService.description.length > 150 ? '...' : ''}\n\n`;
    }
    
    if (mainService.requirements && mainService.requirements.length > 0) {
      response += `📋 **المتطلبات:**\n`;
      mainService.requirements.slice(0, 4).forEach((req: string) => {
        response += `• ${req}\n`;
      });
      response += '\n';
    }
    
    if (mainService.fee && mainService.fee !== 'غير محدد') {
      response += `💰 **الرسوم:** ${mainService.fee}\n`;
    }
    if (mainService.duration && mainService.duration !== 'غير محدد') {
      response += `⏱️ **المدة:** ${mainService.duration}\n`;
    }
    if (mainService.office) {
      response += `🏢 **أين:** ${mainService.office}\n`;
    }
    
    if (services.length > 1) {
      response += `\n💡 يوجد ${services.length - 1} خدمة أخرى متعلقة. هل تريد المزيد من التفاصيل؟`;
    }
  } else {
    response = `To get ${userQuery}:\n\n`;
    response += `**${mainService.name}**\n`;
    if (mainService.description) {
      response += `📝 ${mainService.description.substring(0, 150)}${mainService.description.length > 150 ? '...' : ''}\n\n`;
    }
    
    if (mainService.requirements && mainService.requirements.length > 0) {
      response += `📋 **Requirements:**\n`;
      mainService.requirements.slice(0, 4).forEach((req: string) => {
        response += `• ${req}\n`;
      });
      response += '\n';
    }
    
    if (mainService.fee && mainService.fee !== 'غير محدد') {
      response += `💰 **Fee:** ${mainService.fee}\n`;
    }
    if (mainService.duration && mainService.duration !== 'غير محدد') {
      response += `⏱️ **Duration:** ${mainService.duration}\n`;
    }
    if (mainService.office) {
      response += `🏢 **Where:** ${mainService.office}\n`;
    }
    
    if (services.length > 1) {
      response += `\n💡 There are ${services.length - 1} other related services. Want more details?`;
    }
  }
  
  return response;
}