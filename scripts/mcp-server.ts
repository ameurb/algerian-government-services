#!/usr/bin/env tsx

import 'dotenv/config';
import { z } from 'zod';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { PrismaClient, ServiceCategory } from '@prisma/client';

const prisma = new PrismaClient();

// Input schemas
const SearchServicesInputSchema = z.object({
  query: z.string().describe('Search query in Arabic or English'),
  category: z.nativeEnum(ServiceCategory).optional(),
  limit: z.number().min(1).max(50).default(10),
});

const GetServiceByIdInputSchema = z.object({
  id: z.string().describe('Service ID'),
});

const server = new Server(
  {
    name: 'algerian-services-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Setup tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_services',
        description: 'Search for Algerian government services',
        inputSchema: SearchServicesInputSchema,
      },
      {
        name: 'get_service_by_id',
        description: 'Get a specific service by ID',
        inputSchema: GetServiceByIdInputSchema,
      },
      {
        name: 'get_statistics',
        description: 'Get database statistics',
        inputSchema: z.object({}),
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_services': {
        const { query, category, limit } = SearchServicesInputSchema.parse(args);
        
        const whereClause: any = {
          isActive: true,
        };

        if (query) {
          whereClause.OR = [
            { name: { contains: query, mode: 'insensitive' } },
            { nameEn: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { descriptionEn: { contains: query, mode: 'insensitive' } },
          ];
        }

        if (category) {
          whereClause.category = category;
        }

        const results = await prisma.governmentService.findMany({
          where: whereClause,
          take: limit,
          select: {
            id: true,
            name: true,
            nameEn: true,
            description: true,
            category: true,
            isOnline: true,
            bawabticUrl: true,
          },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ 
                query,
                category,
                count: results.length, 
                results 
              }, null, 2),
            },
          ],
        };
      }

      case 'get_service_by_id': {
        const { id } = GetServiceByIdInputSchema.parse(args);
        const result = await prisma.governmentService.findUnique({ where: { id } });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_statistics': {
        const total = await prisma.governmentService.count();
        const online = await prisma.governmentService.count({ where: { isOnline: true } });
        const active = await prisma.governmentService.count({ where: { isActive: true } });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ total, online, active }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
});

// Setup resource handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'services://summary',
        name: 'services-summary',
        description: 'Summary of all government services',
        mimeType: 'application/json',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === 'services://summary') {
    const total = await prisma.governmentService.count();
    const online = await prisma.governmentService.count({ where: { isOnline: true } });
    
    const categoryStats = await prisma.governmentService.groupBy({
      by: ['category'],
      _count: { category: true },
    });

    const summary = {
      total,
      online,
      offline: total - online,
      categoryBreakdown: categoryStats.map(stat => ({
        category: stat.category,
        count: stat._count.category,
      })),
    };

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP server running on stdio');
}

main().catch((err) => {
  console.error('Server failed:', err);
  process.exit(1);
});
