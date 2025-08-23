import { openai } from '@ai-sdk/openai';
import { generateObject, streamText } from 'ai';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { AI_TEMPLATES } from '@/lib/ai-templates';

const prisma = new PrismaClient();

// Schema for AI-powered query analysis
const QueryAnalysisSchema = z.object({
  preferredLanguage: z.enum(['ar', 'en', 'fr']).describe('User\'s preferred language detected from their query'),
  intent: z.enum(['information', 'procedure', 'requirements', 'documents', 'location', 'timeline', 'cost', 'status', 'help']).describe('User\'s primary intent'),
  urgency: z.enum(['low', 'normal', 'high']).describe('Urgency level of the request'),
  serviceType: z.string().describe('Type of government service the user is asking about'),
  specificNeeds: z.array(z.string()).describe('Specific needs or questions the user has'),
  searchKeywords: z.array(z.string()).describe('Keywords to search in the database'),
  category: z.string().describe('Most likely service category'),
  responseFormat: z.enum(['detailed', 'summary', 'step_by_step', 'quick_answer']).describe('Best response format for this query')
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, sessionId } = req.body;
    const userMessage = messages[messages.length - 1];
    const userQuery = userMessage.content;
    
    // Step 1: AI-powered query analysis
    const analysis = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: QueryAnalysisSchema,
      prompt: `Analyze this user query about Algerian government services:

"${userQuery}"

Determine:
1. The user's preferred language (Arabic, English, or French) based on the text
2. Their primary intent (what they want to achieve)
3. The urgency level of their request
4. The type of government service they need
5. Their specific needs and questions
6. Keywords to search for relevant services
7. The most likely service category
8. The best response format for their query

Consider Algerian administrative context and common citizen needs.`
    });

    // Step 2: Search for relevant services using AI keywords
    const services = await searchServicesWithAI(analysis.object.searchKeywords);

    // Step 3: Generate enhanced contextual prompt
    const comprehensiveContext = generateComprehensiveContext(
      userQuery, 
      analysis.object, 
      services
    );
    const result = await streamText({
      model: openai('gpt-4o'),
      messages: [
        {
          role: 'system',
          content: comprehensiveContext
        },
        {
          role: 'user', 
          content: userQuery
        }
      ],
      temperature: 0.3,
      async onFinish({ text, usage }) {
        try {
          await saveEnhancedConversation(sessionId, userQuery, text, analysis.object, services);
        } catch (error) {
          // Silently handle save errors
        }
      },
    });

    // Stream response with proper headers
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
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
    // Send error as streaming response
    res.writeHead(500, {
      'Content-Type': 'application/json',
    });
    res.end(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }));
  }
}

/**
 * Search services using AI-generated keywords
 */
async function searchServicesWithAI(keywords: string[]) {
  try {
    const conditions = keywords.flatMap(keyword => [
      { name: { contains: keyword } },
      { nameEn: { contains: keyword } },
      { nameFr: { contains: keyword } },
      { description: { contains: keyword } },
      { keywords: { contains: keyword } },
      { keywordsEn: { contains: keyword } },
      { keywordsFr: { contains: keyword } }
    ]);

    const services = await prisma.governmentService.findMany({
      where: {
        isActive: true,
        OR: conditions
      },
      take: 10,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return services;
  } catch (error) {
    return [];
  }
}

/**
 * Generate comprehensive context for AI response
 */
function generateComprehensiveContext(
  userQuery: string,
  analysis: z.infer<typeof QueryAnalysisSchema>,
  services: any[]
): string {
  
  const languageInstructions = {
    ar: 'استخدم اللغة العربية الفصحى المهذبة والمحترمة. استخدم المصطلحات الإدارية الجزائرية المناسبة.',
    en: 'Use clear, professional English. Use appropriate Algerian administrative terminology.',
    fr: 'Utilisez un français administratif formel et professionnel. Utilisez la terminologie administrative algérienne appropriée.'
  };

  const responseFormatInstructions = {
    detailed: 'Provide a comprehensive, detailed response with all necessary information',
    summary: 'Provide a concise summary with key points',
    step_by_step: 'Provide clear step-by-step instructions',
    quick_answer: 'Provide a direct, quick answer'
  };

  const servicesInfo = services.length > 0 ? 
    services.map(s => {
      const docs = s.documents ? s.documents.split('|') : [];
      const steps = s.process ? s.process.split('|') : [];
      
      return `
## Service: ${s.name} ${s.nameEn ? `(${s.nameEn})` : ''}

**Description:** ${s.description}
**Category:** ${s.category}  
**Ministry:** ${s.ministry || 'غير محدد'}
**Agency:** ${s.agency || 'غير محدد'}
**Fee:** ${s.fee || 'غير محدد'}
**Processing Time:** ${s.processingTime || 'غير محدد'}
**Contact Phone:** ${s.contactPhone || 'غير متوفر'}
**Contact Email:** ${s.contactEmail || 'غير متوفر'}
**Online Available:** ${s.isOnline ? 'نعم' : 'لا'}
**Official Link:** ${s.bawabticUrl || 'غير متوفر'}

**Required Documents:**
${docs.map((doc: string) => `- ${doc}`).join('\n')}

**Process Steps:**
${steps.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n')}
`;
    }).join('\n') : 'No specific services found in database.';

  return `# Enhanced Government Services Assistant

You are an expert Algerian government services assistant providing comprehensive, human-centered assistance.

## Query Analysis Results:
- **User's Preferred Language:** ${analysis.preferredLanguage}
- **Intent:** ${analysis.intent}
- **Urgency:** ${analysis.urgency}
- **Service Type:** ${analysis.serviceType}
- **Specific Needs:** ${analysis.specificNeeds.join(', ')}
- **Complexity:** Services found: ${services.length}
- **Recommended Response Format:** ${analysis.responseFormat}

## Language Instructions:
${languageInstructions[analysis.preferredLanguage]}

## Response Format Requirements:
${responseFormatInstructions[analysis.responseFormat]}

## Available Services Data:
${servicesInfo}

## Response Guidelines:

### Format your response as structured markdown with:

1. **🎯 Direct Answer** - Answer their exact question first
2. **📋 Service Overview** - Explain available services 
3. **📄 Required Documents** - List all required documents with explanations
4. **🏢 Government Office** - Ministry, agency, contact information
5. **💰 Fees & Timeline** - Exact costs and processing times
6. **📱 How to Apply** - Step-by-step process 
7. **🌐 Online Options** - Digital services and links
8. **⚠️ Important Notes** - Warnings, tips, and advice
9. **🔗 Related Services** - Suggest other relevant services
10. **💡 Next Steps** - What the user should do next

### Human-Centered Approach:
- Be empathetic and understanding
- Explain the "why" behind requirements
- Provide context about Algerian administrative culture
- Offer practical tips from real experience
- Address common concerns and challenges
- Be proactive in offering help

### Markdown Formatting:
- Use proper headers (# ## ###)
- Use bullet points and numbered lists
- Use **bold** for important information
- Use emojis for visual organization
- Use tables when appropriate
- Include clickable links

**Respond in ${analysis.preferredLanguage === 'ar' ? 'Arabic' : analysis.preferredLanguage === 'fr' ? 'French' : 'English'} based on the user's query language.**

Provide a comprehensive, helpful response that fully addresses their needs.`;
}

/**
 * Save conversation with enhanced metadata
 */
async function saveEnhancedConversation(
  sessionId: string,
  userQuery: string, 
  assistantResponse: string,
  analysis: z.infer<typeof QueryAnalysisSchema>,
  services: any[]
) {
  try {
    // Ensure session exists
    await prisma.chatSession.upsert({
      where: { sessionId },
      update: { 
        lastActive: new Date(),
        language: analysis.preferredLanguage,
        contextData: JSON.stringify({
          lastIntent: analysis.intent,
          lastCategory: analysis.category,
          servicesDiscussed: services.map(s => s.id)
        })
      },
      create: {
        sessionId,
        language: analysis.preferredLanguage,
        contextData: JSON.stringify({ initialQuery: userQuery }),
        isActive: true
      }
    });

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'USER',
        content: userQuery,
        language: analysis.preferredLanguage,
        serviceRefs: services.map(s => s.id.toString()).join(','),
        metadataStr: JSON.stringify({
          intent: analysis.intent,
          urgency: analysis.urgency,
          servicesFound: services.length
        })
      }
    });

    // Save assistant message
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'ASSISTANT',
        content: assistantResponse,
        language: analysis.preferredLanguage,
        serviceRefs: services.map(s => s.id.toString()).join(','),
        metadataStr: JSON.stringify({
          responseLength: assistantResponse.length,
          servicesReferenced: services.length,
          responseFormat: analysis.responseFormat
        })
      }
    });

    // Track analytics for each service
    for (let i = 0; i < services.length; i++) {
      await prisma.serviceAnalytics.create({
        data: {
          serviceId: services[i].id,
          searchQuery: userQuery,
          language: analysis.preferredLanguage,
          resultRank: i + 1,
          sessionId,
          clicked: false
        }
      });
    }

  } catch (error) {
    // Silently handle database errors
    throw error;
  }
}