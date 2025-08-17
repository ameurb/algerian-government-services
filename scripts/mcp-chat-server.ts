#!/usr/bin/env tsx

/**
 * MCP-compliant Chat Server for Algerian Government Services
 *
 * This script implements a streaming API endpoint for chatting with the
 * government services database using the Model Context Protocol (MCP).
 *
 * Usage:
 * - Start the server: `npx tsx scripts/mcp-chat-server.ts`
 * - Interact with the server using an MCP-compliant client.
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { PrismaClient, GovernmentService } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// MCP Request and Response Types
interface MCPRequest {
  method: string;
  params?: any;
}

interface MCPResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

class MCPChatServer {
  private prisma: PrismaClient;
  private server: import('http').Server;

  constructor(private port: number) {
    this.prisma = new PrismaClient();
    this.server = createServer(this.handleRequest.bind(this));
  }

  /**
   * Start the MCP server
   */
  public start() {
    this.server.listen(this.port, () => {
      console.log(`🚀 MCP Chat Server listening on http://localhost:${this.port}`);
    });
  }

  /**
   * Handle incoming HTTP requests
   */
  private async handleRequest(req: IncomingMessage, res: ServerResponse) {
    if (req.method === 'GET' && req.url === '/') {
      this.serveIndexHtml(res);
      return;
    }

    if (req.method !== 'POST' || req.url !== '/mcp') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const mcpRequest: MCPRequest = JSON.parse(body);
        await this.routeRequest(mcpRequest, res);
      } catch (error: any) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Bad Request', message: error.message }));
      }
    });
  }

  /**
   * Serve the index.html file
   */
  private serveIndexHtml(res: ServerResponse) {
    const indexPath = path.join(process.cwd(), 'public', 'index.html');
    fs.readFile(indexPath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Could not read index.html' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  }

  /**
   * Route MCP requests to the appropriate handler
   */
  private async routeRequest(req: MCPRequest, res: ServerResponse) {
    switch (req.method) {
      case 'chat_with_db_stream':
        await this.handleChatWithDbStream(req, res);
        break;
      default:
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Method not found: ${req.method}` }));
    }
  }

  /**
   * Handle streaming chat requests
   */
  private async handleChatWithDbStream(req: MCPRequest, res: ServerResponse) {
    const { query } = req.params;

    if (!query) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing query parameter' }));
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'application/jsonl+mcp',
      'Transfer-Encoding': 'chunked',
      'Connection': 'keep-alive'
    });

    try {
      // 1. Find relevant services in the database
      const services = await this.findRelevantServices(query);

      // 2. Generate a conversational response
      const responseGenerator = this.generateConversationalResponse(query, services);

      // 3. Stream the response
      for await (const chunk of responseGenerator) {
        res.write(JSON.stringify({ result: { chunk } }) + '\n');
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing time
      }

    } catch (error: any) {
      res.write(JSON.stringify({ error: { code: -32603, message: error.message } }) + '\n');
    } finally {
      res.end();
    }
  }

  /**
   * Find relevant services based on the user's query
   */
  private async findRelevantServices(query: string): Promise<GovernmentService[]> {
    // A simple keyword-based search. In a real application, you might use a more
    // sophisticated search engine or a vector database.
    const keywords = query.split(' ').filter(k => k.length > 2);

    const searchConditions = keywords.map(key => ({
        OR: [
            { name: { contains: key, mode: 'insensitive' } },
            { description: { contains: key, mode: 'insensitive' } },
            { nameEn: { contains: key, mode: 'insensitive' } },
            { descriptionEn: { contains: key, mode: 'insensitive' } },
            { category: { contains: key, mode: 'insensitive' } },
            { subcategory: { contains: key, mode: 'insensitive' } },
        ]
    }));

    return this.prisma.governmentService.findMany({
      where: {
        AND: searchConditions
      },
      take: 5,
    });
  }

  /**
   * Generate a conversational response from the database results
   */
  private async *generateConversationalResponse(query: string, services: GovernmentService[]): AsyncGenerator<string> {
    yield 'Hello! I am the Algerian Services Assistant. I have looked up the information for your query: ';
    yield `"${query}".\n\n`;

    if (services.length === 0) {
      yield "I couldn't find any specific services related to your query. Can you please rephrase it or ask something else?";
      return;
    }

    yield `I found ${services.length} relevant service(s):\n\n`;

    for (const service of services) {
      yield `**Service:** ${service.nameEn || service.name}\n`;
      yield `**Category:** ${service.category}\n`;
      if (service.descriptionEn || service.description) {
        yield `**Description:** ${service.descriptionEn || service.description}\n`;
      }
      if (service.requirements && service.requirements.length > 0) {
        yield `**Requirements:**\n`;
        for (const req of service.requirements) {
          yield `- ${req}\n`;
        }
      }
      if (service.onlineUrl) {
        yield `**You can find more information here:** ${service.onlineUrl}\n`;
      }
      yield '\n---\n\n';
    }

    yield "I hope this information was helpful. Let me know if you have any other questions!";
  }
}

// Main function to run the server
function main() {
  const server = new MCPChatServer(8080);
  server.start();
}

if (require.main === module) {
  main();
}

export { MCPChatServer };
