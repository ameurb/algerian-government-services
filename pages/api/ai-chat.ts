import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToCoreMessages } from 'ai';
import { aiSearchEngine } from '@/lib/ai-search-engine';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  try {
    // Get the latest user message
    const userMessage = messages[messages.length - 1];
    const userQuery = userMessage.content;

    // Perform AI-enhanced search
    const searchResult = await aiSearchEngine.search(userQuery, 6);
    
    // Create context for the AI response
    const servicesContext = searchResult.services.map(service => ({
      name: service.name,
      nameEn: service.nameEn,
      description: service.description,
      category: service.category,
      fee: service.fee,
      duration: service.duration,
      isOnline: service.isOnline,
      requirements: service.requirements?.slice(0, 3),
      bawabticUrl: service.bawabticUrl
    }));

    const contextMessage = `
    البحث المحسّن بالذكاء الاصطناعي:
    - القصد: ${searchResult.analysis.intent}
    - نوع الخدمة: ${searchResult.analysis.serviceType}  
    - الكلمات المفتاحية: ${searchResult.analysis.keywords.join(', ')}
    - تم العثور على ${searchResult.services.length} خدمة

    الخدمات المتاحة:
    ${servicesContext.map(s => `- ${s.name}: ${s.description} ${s.fee ? `(${s.fee})` : ''} ${s.isOnline ? '[متاح أونلاين]' : ''}`).join('\n')}

    توصيات الذكاء الاصطناعي:
    ${searchResult.recommendations.summary}
    
    الخطوات التالية:
    ${searchResult.recommendations.nextSteps.join('\n')}
    `;

    // Create enhanced messages with context
    const enhancedMessages = [
      {
        role: 'system',
        content: `أنت مساعد ذكي متطور للخدمات الحكومية الجزائرية مدعوم بتقنيات الذكاء الاصطناعي المتقدمة.

المهام الأساسية:
1. الإجابة على استفسارات المواطنين حول الخدمات الحكومية
2. تقديم معلومات دقيقة وحديثة
3. شرح الإجراءات والمتطلبات بوضوح
4. توجيه المواطنين للخطوات العملية

إرشادات الإجابة:
- أجب باللغة نفسها المستخدمة في السؤال
- استخدم الرموز التعبيرية بشكل مناسب
- قسم الإجابة إلى أقسام واضحة
- اذكر الرسوم والمدة الزمنية إن وجدت
- أشر إلى الخدمات المتاحة أونلاين
- قدم نصائح عملية ومفيدة

تم تحسين البحث بالذكاء الاصطناعي وإليك السياق:`
      },
      ...convertToCoreMessages(messages),
      {
        role: 'user',
        content: `${userQuery}

السياق من البحث المحسّن:
${contextMessage}`
      }
    ];

    // Choose the appropriate AI model
    const model = process.env.OPENAI_API_KEY ? 
      openai('gpt-4o-mini') : 
      anthropic('claude-3-haiku-20240307');

    const result = streamText({
      model,
      messages: enhancedMessages,
      temperature: 0.3,
      maxTokens: 2000,
      onFinish: (completion) => {
        console.log('AI Response completed:', {
          tokensUsed: completion.usage?.totalTokens,
          servicesFound: searchResult.services.length,
          userQuery
        });
      }
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Enhanced Chat API Error:', error);
    
    // Fallback response
    const fallbackModel = openai('gpt-4o-mini');
    const fallbackResult = streamText({
      model: fallbackModel,
      messages: convertToCoreMessages(messages),
      temperature: 0.7,
      maxTokens: 1000
    });

    return fallbackResult.toDataStreamResponse();
  }
}