import { prisma } from './prisma';
import { directDatabaseSearch, formatSearchResponse } from './direct-search';

// Simple, reliable chat handler - database only, no external dependencies
export async function handleSimpleChatMessage(
  message: string,
  sessionId: string,
  userId?: string
): Promise<{ response: string; metadata: any }> {
  
  const startTime = Date.now();
  console.log('[SIMPLE-CHAT] Processing message:', message);
  
  try {
    // Step 1: Save user message to database
    await prisma.chatMessage.create({
      data: {
        sessionId,
        userId,
        role: 'USER',
        content: message,
      },
    });
    
    // Step 2: Direct database search - no AI orchestration, just database
    const searchResult = await directDatabaseSearch(message, sessionId);
    
    // Step 3: Format response based on database results
    const responseText = formatSearchResponse(searchResult, message);
    
    // Step 4: Save assistant response
    await prisma.chatMessage.create({
      data: {
        sessionId,
        userId,
        role: 'ASSISTANT',
        content: responseText,
        metadata: {
          servicesFound: searchResult.count,
          searchTerms: searchResult.searchTerms,
          source: 'direct-database',
          processingTime: Date.now() - startTime
        }
      },
    });
    
    const processingTime = Date.now() - startTime;
    console.log(`[SIMPLE-CHAT] Completed in ${processingTime}ms, found ${searchResult.count} services`);
    
    return {
      response: responseText,
      metadata: {
        servicesFound: searchResult.count,
        searchTerms: searchResult.searchTerms,
        source: 'direct-database',
        processingTime
      }
    };
    
  } catch (error) {
    console.error('[SIMPLE-CHAT] Error:', error);
    
    // Simple error response
    const errorResponse = 'عذراً، حدث خطأ في البحث. يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني.';
    
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