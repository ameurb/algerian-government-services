import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { generateObject, generateText, streamText } from 'ai';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Enhanced search query schema
const SearchQuerySchema = z.object({
  intent: z.enum(['information', 'procedure', 'requirements', 'timeline', 'cost']),
  serviceType: z.string().describe('Type of government service requested'),
  keywords: z.array(z.string()).describe('Key terms for database search'),
  language: z.enum(['ar', 'en', 'both']),
  urgency: z.enum(['low', 'normal', 'high']),
  category: z.enum(['CIVIL_STATUS', 'ADMINISTRATION', 'EDUCATION', 'HEALTH', 'SOCIAL', 'BUSINESS', 'JUSTICE', 'OTHER']).optional()
});

type SearchQuery = z.infer<typeof SearchQuerySchema>;

// Response enhancement schema
const EnhancedResponseSchema = z.object({
  summary: z.string().describe('Brief summary of the query and available services'),
  recommendations: z.array(z.string()).describe('Specific recommendations based on user intent'),
  nextSteps: z.array(z.string()).describe('Clear next steps the user should take'),
  warnings: z.array(z.string()).optional().describe('Important warnings or considerations')
});

export class AISearchEngine {
  private model: 'openai' | 'anthropic';

  constructor(model: 'openai' | 'anthropic' = 'openai') {
    this.model = model;
  }

  /**
   * Analyze user query using AI to extract intent and generate optimized search terms
   */
  async analyzeQuery(userQuery: string): Promise<SearchQuery> {
    const provider = this.model === 'openai' ? 
      openai('gpt-4o-mini') : 
      anthropic('claude-3-haiku-20240307');

    const result = await generateObject({
      model: provider,
      schema: SearchQuerySchema,
      prompt: `
        Analyze this user query about Algerian government services and extract:
        1. The user's intent (what they want to know)
        2. The type of service they need
        3. Keywords for database search (both Arabic and English)
        4. Language preference
        5. Urgency level
        6. Most likely service category

        User Query: "${userQuery}"

        Context: This is for searching Algerian government services database.
        Available categories: CIVIL_STATUS, ADMINISTRATION, EDUCATION, HEALTH, SOCIAL, BUSINESS, JUSTICE, OTHER

        Extract Arabic and English keywords that would help find relevant services.
        Consider common variations, synonyms, and related terms.
      `,
    });

    return result.object;
  }

  /**
   * Search database using AI-optimized keywords
   */
  async searchServices(analysis: SearchQuery, limit: number = 10) {
    const { keywords, category, language } = analysis;
    
    // Build dynamic search query - use OR for keywords (any keyword can match)
    const keywordConditions = keywords.flatMap(keyword => [
      { name: { contains: keyword, mode: 'insensitive' as const } },
      { nameEn: { contains: keyword, mode: 'insensitive' as const } },
      { description: { contains: keyword, mode: 'insensitive' as const } },
      { descriptionEn: { contains: keyword, mode: 'insensitive' as const } },
      { subcategory: { contains: keyword, mode: 'insensitive' as const } },
      { subcategoryEn: { contains: keyword, mode: 'insensitive' as const } }
    ]);

    const whereClause: any = {
      isActive: true,
      OR: keywordConditions
    };

    // Add category filter if specified
    if (category) {
      whereClause.category = category;
    }

    const services = await prisma.governmentService.findMany({
      where: whereClause,
      take: limit,
      orderBy: [
        { isOnline: 'desc' },
        { name: 'asc' }
      ]
    });

    return services;
  }

  /**
   * Generate enhanced AI response with streaming support
   */
  async *generateEnhancedResponse(
    userQuery: string, 
    services: any[], 
    analysis: SearchQuery
  ): AsyncIterable<string> {
    const provider = this.model === 'openai' ? 
      openai('gpt-4o') : 
      anthropic('claude-3-sonnet-20240229');

    const servicesContext = services.map(service => ({
      name: service.name,
      nameEn: service.nameEn,
      description: service.description,
      descriptionEn: service.descriptionEn,
      category: service.category,
      fee: service.fee,
      duration: service.duration,
      requirements: service.requirements?.slice(0, 3) || [],
      process: service.process?.slice(0, 3) || [],
      isOnline: service.isOnline,
      bawabticUrl: service.bawabticUrl
    })).slice(0, 5); // Limit context size

    const stream = streamText({
      model: provider,
      messages: [
        {
          role: 'system',
          content: `You are an expert assistant for Algerian government services. 
          
          Guidelines:
          - Respond in the same language as the user's query
          - If Arabic query, respond in Arabic; if English, respond in English
          - Be accurate, helpful, and concise
          - Focus on practical next steps
          - Include relevant service details (fees, requirements, timeline)
          - Use emojis appropriately for readability
          - Format response with clear sections
          - Mention if services are available online
          - Include warnings about document requirements or deadlines`
        },
        {
          role: 'user',
          content: `
          User Query: "${userQuery}"
          
          User Intent: ${analysis.intent}
          Service Type Needed: ${analysis.serviceType}
          
          Available Services:
          ${JSON.stringify(servicesContext, null, 2)}
          
          Please provide a comprehensive response that:
          1. Directly answers their question
          2. Lists relevant services with key details
          3. Explains the process and requirements
          4. Provides clear next steps
          5. Includes fees and timeline information
          6. Mentions online availability where applicable
          `
        }
      ],
      temperature: 0.3
    });

    for await (const chunk of stream.textStream) {
      yield chunk;
    }
  }

  /**
   * Get structured recommendations using AI
   */
  async getRecommendations(
    userQuery: string, 
    services: any[], 
    analysis: SearchQuery
  ): Promise<z.infer<typeof EnhancedResponseSchema>> {
    const provider = this.model === 'openai' ? 
      openai('gpt-4o-mini') : 
      anthropic('claude-3-haiku-20240307');

    const result = await generateObject({
      model: provider,
      schema: EnhancedResponseSchema,
      prompt: `
        Based on the user query and available services, generate structured recommendations.
        
        User Query: "${userQuery}"
        Intent: ${analysis.intent}
        Available Services: ${services.length} found
        
        Services Context:
        ${services.slice(0, 3).map(s => `- ${s.name} (${s.nameEn}): ${s.description}`).join('\n')}
        
        Generate:
        1. A brief summary of what the user is looking for and what's available
        2. Specific recommendations based on their intent
        3. Clear, actionable next steps
        4. Any important warnings or considerations
        
        Respond in the same language as the user query.
      `,
    });

    return result.object;
  }

  /**
   * Main search method that combines AI analysis with database search
   */
  async search(userQuery: string, limit: number = 8) {
    const startTime = Date.now();
    console.log('🤖 AI Search Engine starting:', { 
      query: userQuery.substring(0, 50) + '...', 
      limit, 
      model: this.model 
    });

    try {
      // Step 1: Analyze query with AI
      console.log('📊 Step 1: Analyzing query with AI...');
      const analysis = await this.analyzeQuery(userQuery);
      console.log('✅ Query analysis completed:', {
        intent: analysis.intent,
        serviceType: analysis.serviceType,
        keywords: analysis.keywords,
        language: analysis.language,
        category: analysis.category
      });
      
      // Step 2: Search database using AI-optimized terms
      console.log('🔍 Step 2: Searching database with optimized terms...');
      const services = await this.searchServices(analysis, limit);
      console.log('✅ Database search completed:', {
        servicesFound: services.length,
        serviceNames: services.slice(0, 3).map(s => s.name)
      });
      
      // Step 3: Get structured recommendations
      console.log('💡 Step 3: Generating AI recommendations...');
      const recommendations = await this.getRecommendations(userQuery, services, analysis);
      console.log('✅ Recommendations generated:', {
        hasSummary: !!recommendations.summary,
        recommendationsCount: recommendations.recommendations?.length || 0,
        nextStepsCount: recommendations.nextSteps?.length || 0
      });
      
      const totalTime = Date.now() - startTime;
      console.log('🎉 AI Search completed successfully:', {
        totalTimeMs: totalTime,
        servicesFound: services.length,
        model: this.model
      });
      
      return {
        analysis,
        services,
        recommendations,
        metadata: {
          queryTime: startTime,
          servicesFound: services.length,
          model: this.model,
          processingTimeMs: totalTime
        }
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error('❌ AI Search Engine Error:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        query: userQuery,
        model: this.model,
        processingTimeMs: totalTime
      });
      
      throw new Error(`Failed to process search query: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stream-enabled search for real-time responses
   */
  async *searchStream(userQuery: string, limit: number = 8) {
    try {
      // Step 1: Analyze query
      const analysis = await this.analyzeQuery(userQuery);
      yield { type: 'analysis', data: analysis };
      
      // Step 2: Search database
      const services = await this.searchServices(analysis, limit);
      yield { type: 'services', data: services };
      
      // Step 3: Stream enhanced response
      yield { type: 'response_start', data: null };
      
      for await (const chunk of this.generateEnhancedResponse(userQuery, services, analysis)) {
        yield { type: 'response_chunk', data: chunk };
      }
      
      yield { type: 'response_end', data: { servicesCount: services.length } };
      
    } catch (error) {
      yield { type: 'error', data: { message: error instanceof Error ? error.message : 'Unknown error' } };
    }
  }
}

// Export configured instances
export const aiSearchEngine = new AISearchEngine('openai');
export const aiSearchEngineAnthropic = new AISearchEngine('anthropic');