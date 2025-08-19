import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// MCP Tool definitions for OpenAI function calling
const MCP_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "search_government_services",
      description: "Search for Algerian government services based on user query. Use this when users ask about specific services, documents, or procedures.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search terms extracted from user query (in Arabic or English)"
          },
          category: {
            type: "string",
            enum: [
              "CIVIL_STATUS", "EDUCATION", "HEALTH", "EMPLOYMENT", "BUSINESS", 
              "TAXATION", "HOUSING", "TRANSPORTATION", "SOCIAL_SECURITY", 
              "TECHNOLOGY", "ENVIRONMENT", "AGRICULTURE", "CULTURE", "SPORTS", 
              "ENERGY", "SOCIAL_SUPPORT", "SPECIAL_NEEDS", "LAW_JUSTICE", 
              "TOURISM", "ENTERTAINMENT", "INDUSTRY", "MEDIA", "MANAGEMENT", 
              "COMPLAINTS", "ADMINISTRATION", "OTHER"
            ],
            description: "Service category if detected from user query"
          },
          limit: {
            type: "number",
            description: "Number of results to return (default: 5)",
            default: 5
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_service_details",
      description: "Get detailed information about a specific government service by ID",
      parameters: {
        type: "object",
        properties: {
          serviceId: {
            type: "string",
            description: "The ID of the government service to get details for"
          }
        },
        required: ["serviceId"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_services_statistics",
      description: "Get statistics about available government services",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false
      }
    }
  }
];

// Interface for MCP tool execution
interface MCPToolCall {
  name: string;
  parameters: any;
}

interface MCPToolResult {
  toolName: string;
  result: any;
  success: boolean;
  error?: string;
}

// Execute MCP tool calls
async function executeMCPTool(toolCall: MCPToolCall): Promise<MCPToolResult> {
  const apiBaseUrl = process.env.MCP_SERVER_URL || 'http://localhost:8080'; // Direct MCP server connection
  console.log('[AI-MCP] Attempting to connect to MCP server at:', apiBaseUrl);
  
  try {
    switch (toolCall.name) {
      case 'search_government_services':
        const searchResponse = await fetch(`${apiBaseUrl}/search`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer dz_live_demo123`
          },
          body: JSON.stringify({
            query: toolCall.parameters.query,
            category: toolCall.parameters.category,
            limit: toolCall.parameters.limit || 5
          })
        });
        
        if (!searchResponse.ok) {
          throw new Error(`Search failed: ${searchResponse.statusText}`);
        }
        
        const searchResult = await searchResponse.json();
        console.log('[AI-MCP] Search result:', JSON.stringify(searchResult, null, 2));
        return {
          toolName: 'search_government_services',
          result: searchResult,
          success: true
        };

      case 'get_service_details':
        const detailResponse = await fetch(`${apiBaseUrl}/service/${toolCall.parameters.serviceId}`, {
          headers: {
            'Authorization': `Bearer dz_live_demo123`
          }
        });
        
        if (!detailResponse.ok) {
          throw new Error(`Service details failed: ${detailResponse.statusText}`);
        }
        
        const detailResult = await detailResponse.json();
        return {
          toolName: 'get_service_details',
          result: detailResult,
          success: true
        };

      case 'get_services_statistics':
        const statsResponse = await fetch(`${apiBaseUrl}/stats`, {
          headers: {
            'Authorization': `Bearer dz_live_demo123`
          }
        });
        
        if (!statsResponse.ok) {
          throw new Error(`Statistics failed: ${statsResponse.statusText}`);
        }
        
        const statsResult = await statsResponse.json();
        return {
          toolName: 'get_services_statistics',
          result: statsResult,
          success: true
        };

      default:
        return {
          toolName: toolCall.name,
          result: null,
          success: false,
          error: `Unknown tool: ${toolCall.name}`
        };
    }
  } catch (error) {
    return {
      toolName: toolCall.name,
      result: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Main function: OpenAI orchestrates MCP tools and formats response
export async function processUserQueryWithMCP(userQuery: string): Promise<string> {
  try {
    console.log('[AI-MCP] Starting OpenAI orchestration for query:', userQuery);

    // Step 1: Let OpenAI analyze the query and decide which tools to use
    const initialCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful, intelligent assistant for Algerian government services. You adapt to the user's language and communication style.

LANGUAGE ADAPTATION:
1. DETECT the language of the user's question (Arabic, English, French)
2. RESPOND in the SAME language the user used
3. If Arabic query → Arabic response, If English query → English response
4. Be natural and conversational like ChatGPT

MANDATORY PROCESS:
1. For ANY question about government services, you MUST use search_government_services tool
2. Extract smart search terms from the user query
3. For Arabic queries, translate to English for searching but respond in Arabic
4. For English queries, search and respond in English
5. Always call tools before responding

INTELLIGENT SEARCH STRATEGY:
- "بطاقة الهوية" → Try: "التعريف", "ID", "بيومترية", "وطنية" 
- "منح التعليم" → Try: "منحة", "grant", "scholarship", "تعليم", "education"
- "تأسيس شركة" → Try: "شركة", "company", "تسجيل", "business", "استثمار"
- "جواز السفر" → Try: "passport", "بيومتري", "سفر"
- "رخصة السياقة" → Try: "driving", "license", "قيادة", "سياقة"

🧠 AI SEARCH RULES:
1. Try multiple related terms, not just exact matches
2. Search in both Arabic and English contexts
3. Use semantic understanding - if "بطاقة الهوية" fails, try broader "ID" or "التعريف"
4. For education queries, try both "تعليم" and "منحة" categories
5. For business queries, try "BUSINESS", "EMPLOYMENT", "TAXATION" categories

CONVERSATION STYLE:
- Be friendly, helpful, and conversational
- Show enthusiasm when finding useful information
- Provide practical guidance and next steps
- Handle diverse questions naturally
- If no results, suggest related services or alternative search terms

CRITICAL: Match the user's language and be genuinely helpful like ChatGPT.`
        },
        {
          role: 'user',
          content: `User query: "${userQuery}"`
        }
      ],
      tools: MCP_TOOLS,
      tool_choice: "required",
      max_tokens: 1000,
      temperature: 0.3,
    });

    const message = initialCompletion.choices[0]?.message;
    
    if (!message) {
      throw new Error('No response from OpenAI');
    }

    // Step 2: Execute any tool calls requested by OpenAI
    const toolResults: MCPToolResult[] = [];
    
    if (message.tool_calls && message.tool_calls.length > 0) {
      console.log('[AI-MCP] OpenAI requested', message.tool_calls.length, 'tool calls');
      
      for (const toolCall of message.tool_calls) {
        if (toolCall.type === 'function') {
          console.log('[AI-MCP] Executing tool:', toolCall.function.name);
          const result = await executeMCPTool({
            name: toolCall.function.name,
            parameters: JSON.parse(toolCall.function.arguments)
          });
          toolResults.push(result);
        }
      }
    }

    // Step 3: Let OpenAI format the final response using the tool results
    const messages: any[] = [
      {
        role: 'system',
        content: `You are a friendly, intelligent assistant for Algerian government services - like ChatGPT but specialized in government services.

LANGUAGE MATCHING:
- If user asked in Arabic → respond in Arabic
- If user asked in English → respond in English  
- If user asked in French → respond in French
- Match the user's tone and formality level

CONVERSATION STYLE:
- Be warm, helpful, and enthusiastic like ChatGPT
- Use natural expressions and conversational tone
- Show genuine interest in helping the user
- Be encouraging and supportive
- Handle diverse questions with flexibility

RESPONSE APPROACH:
1. **If services found**: Provide the useful information directly
2. **If no results**: Be understanding, suggest alternatives, offer to help differently  
3. **Be comprehensive but organized**: Include all useful details but structure them well
4. **Add personality**: Be naturally helpful and conversational
5. **End with engagement**: "What else can I help you with?" or "Need more details on anything?"

🎯 RESPONSE STRATEGY:
1. **When services found**: Present the most relevant service with key details
2. **When no exact match**: Suggest related services or broader categories
3. **Be contextually intelligent**: Understand what the user really needs
4. **Provide actionable guidance**: Next steps, requirements, where to go

📝 RESPONSE FORMAT:
- Start naturally: "للحصول على..." or "يمكنك..." (Arabic) / "To get..." (English)
- Focus on the MAIN service that answers the question
- Include essential info: requirements, fees, duration, where to apply
- End with helpful engagement: "هل تحتاج تفاصيل أكثر؟" / "Need more details?"
- Keep it conversational and helpful, not robotic

🤖 AI INTELLIGENCE:
- If "بطاقة الهوية" search fails, automatically suggest ID-related services
- If "منح التعليم" not found, suggest education or scholarship services  
- Always try to help, even with partial matches
- Use reasoning and context, not just keyword matching

CRITICAL: Be like ChatGPT - helpful, friendly, concise, and adapt to user's language.`
      },
      {
        role: 'user',
        content: `User query: "${userQuery}"`
      },
      {
        role: 'assistant',
        content: message.content,
        tool_calls: message.tool_calls
      }
    ];

    // Add tool results to the conversation
    if (message.tool_calls) {
      for (let i = 0; i < message.tool_calls.length; i++) {
        const toolCall = message.tool_calls[i];
        const toolResult = toolResults[i];
        
        const toolContent = JSON.stringify(toolResult.success ? toolResult.result : { error: toolResult.error });
        console.log('[AI-MCP] Tool result content:', toolContent);
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolContent
        });
      }
    }

    const finalCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 800,
      temperature: 0.5,
    });

    const finalResponse = finalCompletion.choices[0]?.message?.content;
    
    if (!finalResponse) {
      throw new Error('No final response from OpenAI');
    }

    console.log('[AI-MCP] Successfully generated response using', toolResults.length, 'tool results');
    return finalResponse;

  } catch (error) {
    console.error('[AI-MCP] Error in OpenAI orchestration:', error);
    throw error; // Let the socket.ts fallback handle this
  }
}

// Legacy function for fallback (kept for compatibility)
export async function humanizeResponse(rawData: any, userQuery: string): Promise<string> {
  // This is now a fallback - the main function is processUserQueryWithMCP
  return processUserQueryWithMCP(userQuery);
}