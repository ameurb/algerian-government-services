import { openai } from './openai';
import { prisma } from './prisma';

// Semantic search using OpenAI embeddings - handles typos and intent naturally
export class AISemanticSearch {
  
  static async searchWithAI(userQuery: string): Promise<any> {
    console.log('[AI-SEMANTIC] Processing query:', userQuery);
    
    try {
      // Step 1: Use AI to understand user intent and generate search strategy
      const intentAnalysis = await this.analyzeUserIntent(userQuery);
      console.log('[AI-SEMANTIC] Intent analysis:', intentAnalysis);
      
      // Step 2: Generate embeddings for semantic search
      const queryEmbedding = await this.generateEmbedding(userQuery);
      
      // Step 3: Get all services and find semantic matches
      const services = await this.getAllServices();
      const semanticMatches = await this.findSemanticMatches(
        queryEmbedding, 
        services, 
        intentAnalysis
      );
      
      // Step 4: Use AI to rank and select best matches
      const finalResults = await this.rankWithAI(semanticMatches, userQuery, intentAnalysis);
      
      return {
        query: userQuery,
        intent: intentAnalysis,
        results: finalResults,
        count: finalResults.length,
        source: 'ai-semantic'
      };
      
    } catch (error) {
      console.error('[AI-SEMANTIC] Error:', error);
      // Fallback to basic search
      return await this.fallbackSearch(userQuery);
    }
  }
  
  // AI analyzes user intent - handles typos naturally
  static async analyzeUserIntent(query: string): Promise<any> {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI that understands user intent for Algerian government services.

TASK: Analyze the user query and extract semantic meaning, even with typos.

OUTPUT FORMAT: JSON only, no other text.
{
  "intent": "what the user wants",
  "category": "CIVIL_STATUS|EDUCATION|BUSINESS|EMPLOYMENT|etc",
  "keywords": ["semantic", "keywords", "not", "exact", "matches"],
  "corrected_query": "typo-corrected version",
  "confidence": 0.8
}

EXAMPLES:
- "بطاقه الهويه" (with typos) → intent: "national ID card", category: "CIVIL_STATUS"
- "منح التعليمم" (with typos) → intent: "education grants", category: "EDUCATION"  
- "تاسيس شركه" (with typos) → intent: "company registration", category: "BUSINESS"
- "رخصت سياقه" (with typos) → intent: "driving license", category: "TRANSPORTATION"

Be intelligent about understanding what users really want, regardless of spelling.`
        },
        {
          role: 'user',
          content: query
        }
      ],
      max_tokens: 200,
      temperature: 0.1
    });

    try {
      return JSON.parse(completion.choices[0]?.message?.content || '{}');
    } catch {
      return {
        intent: "general_inquiry",
        category: "OTHER",
        keywords: [query],
        corrected_query: query,
        confidence: 0.5
      };
    }
  }
  
  // Generate embeddings for semantic similarity
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('[AI-SEMANTIC] Embedding error:', error);
      return [];
    }
  }
  
  // Get all services for semantic matching
  static async getAllServices(): Promise<any[]> {
    return await prisma.governmentService.findMany({
      where: { isActive: true },
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
        fee: true,
        duration: true,
        bawabticUrl: true,
        isOnline: true
      }
    });
  }
  
  // Find semantic matches using AI reasoning
  static async findSemanticMatches(
    queryEmbedding: number[], 
    services: any[], 
    intent: any
  ): Promise<any[]> {
    
    // Use AI to match services semantically
    const serviceMatches = [];
    
    for (const service of services) {
      // Create search text combining all relevant fields
      const searchText = [
        service.name,
        service.nameEn,
        service.description,
        service.descriptionEn,
        service.subcategory,
        service.subcategoryEn,
        service.category
      ].filter(Boolean).join(' ');
      
      // Calculate semantic similarity using AI
      const similarity = await this.calculateSemanticSimilarity(
        intent,
        service,
        searchText
      );
      
      if (similarity > 0.3) { // Threshold for relevance
        serviceMatches.push({
          ...service,
          similarity,
          matchReason: similarity > 0.7 ? 'high_relevance' : 'partial_match'
        });
      }
    }
    
    // Sort by similarity score
    return serviceMatches
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);
  }
  
  // AI-powered semantic similarity calculation
  static async calculateSemanticSimilarity(
    intent: any,
    service: any,
    serviceText: string
  ): Promise<number> {
    
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Rate semantic similarity between user intent and service.

TASK: Return ONLY a number between 0 and 1.
- 1.0 = Perfect match
- 0.8 = Very relevant  
- 0.6 = Somewhat relevant
- 0.4 = Slightly relevant
- 0.2 = Barely relevant
- 0.0 = Not relevant

Consider semantic meaning, not exact words. Handle typos intelligently.`
          },
          {
            role: 'user',
            content: `User Intent: ${JSON.stringify(intent)}
            
Service: ${serviceText}
Category: ${service.category}

Similarity score (0-1):`
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      });
      
      const score = parseFloat(completion.choices[0]?.message?.content?.trim() || '0');
      return Math.max(0, Math.min(1, score)); // Ensure 0-1 range
      
    } catch (error) {
      console.error('[AI-SEMANTIC] Similarity calculation error:', error);
      
      // Fallback: Basic category matching
      if (intent.category && service.category === intent.category) {
        return 0.6;
      }
      
      // Fallback: Keyword matching with fuzzy logic
      const keywords = intent.keywords || [];
      const serviceTextLower = serviceText.toLowerCase();
      let matchCount = 0;
      
      for (const keyword of keywords) {
        if (serviceTextLower.includes(keyword.toLowerCase())) {
          matchCount++;
        }
      }
      
      return Math.min(0.8, matchCount / Math.max(1, keywords.length));
    }
  }
  
  // Final AI ranking of results
  static async rankWithAI(matches: any[], userQuery: string, intent: any): Promise<any[]> {
    if (matches.length === 0) return [];
    
    try {
      // Use AI to select and rank the best matches
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Select and rank the most relevant services for the user query.

TASK: Return JSON array of service IDs in order of relevance.
Consider user intent, service relevance, and practical usefulness.
Return maximum 3-5 most helpful services.

Format: ["service_id_1", "service_id_2", "service_id_3"]`
          },
          {
            role: 'user',
            content: `User Query: "${userQuery}"
Intent: ${JSON.stringify(intent)}

Available Services:
${matches.map((m, i) => `${i+1}. ID: ${m.id}, Name: ${m.name}, Category: ${m.category}, Similarity: ${m.similarity}`).join('\n')}

Best service IDs in order:`
          }
        ],
        max_tokens: 100,
        temperature: 0.1
      });
      
      const rankedIds = JSON.parse(completion.choices[0]?.message?.content || '[]');
      
      // Return services in AI-ranked order
      const rankedServices = [];
      for (const id of rankedIds) {
        const service = matches.find(m => m.id === id);
        if (service) rankedServices.push(service);
      }
      
      // Add any remaining high-similarity services
      for (const service of matches) {
        if (!rankedIds.includes(service.id) && service.similarity > 0.7) {
          rankedServices.push(service);
        }
      }
      
      return rankedServices.slice(0, 5);
      
    } catch (error) {
      console.error('[AI-SEMANTIC] Ranking error:', error);
      return matches.slice(0, 3);
    }
  }
  
  // Fallback search if AI fails
  static async fallbackSearch(userQuery: string): Promise<any> {
    console.log('[AI-SEMANTIC] Using fallback search');
    
    const services = await prisma.governmentService.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: userQuery, mode: 'insensitive' } },
          { nameEn: { contains: userQuery, mode: 'insensitive' } },
          { description: { contains: userQuery, mode: 'insensitive' } }
        ]
      },
      take: 3,
      select: {
        id: true,
        name: true,
        nameEn: true,
        description: true,
        category: true,
        fee: true,
        duration: true,
        bawabticUrl: true
      }
    });
    
    return {
      query: userQuery,
      results: services,
      count: services.length,
      source: 'fallback'
    };
  }
}