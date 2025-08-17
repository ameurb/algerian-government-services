#!/usr/bin/env tsx

import 'dotenv/config';
import { z } from 'zod';
import { PrismaClient, ServiceCategory } from '@prisma/client';
import express from 'express';
import cors from 'cors';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.MCP_PORT || 3333;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));
app.use(express.json());

// Input schemas
const SearchServicesInputSchema = z.object({
  query: z.string().optional(),
  category: z.nativeEnum(ServiceCategory).optional(),
  limit: z.number().min(1).max(50).default(10),
});

const GetServiceByIdInputSchema = z.object({
  id: z.string().describe('Service ID'),
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT 
  });
});

// MCP Tools endpoints
app.get('/mcp/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'search_services',
        description: 'Search for Algerian government services with streaming results',
        inputSchema: SearchServicesInputSchema,
        endpoint: '/mcp/tools/search_services'
      },
      {
        name: 'get_service_by_id',
        description: 'Get a specific service by ID',
        inputSchema: GetServiceByIdInputSchema,
        endpoint: '/mcp/tools/get_service_by_id'
      },
      {
        name: 'get_statistics',
        description: 'Get database statistics',
        inputSchema: z.object({}),
        endpoint: '/mcp/tools/get_statistics'
      },
    ],
  });
});

// Search services tool
app.post('/mcp/tools/search_services', async (req, res) => {
  try {
    const { query, category, limit } = SearchServicesInputSchema.parse(req.body);
    
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

    res.json({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ 
            query,
            category,
            count: results.length, 
            results,
            timestamp: new Date().toISOString()
          }, null, 2),
        },
      ],
    });
  } catch (error) {
    res.status(400).json({
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    });
  }
});

// Get service by ID tool
app.post('/mcp/tools/get_service_by_id', async (req, res) => {
  try {
    const { id } = GetServiceByIdInputSchema.parse(req.body);
    const result = await prisma.governmentService.findUnique({ where: { id } });
    
    res.json({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            ...result,
            timestamp: new Date().toISOString()
          }, null, 2),
        },
      ],
    });
  } catch (error) {
    res.status(400).json({
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    });
  }
});

// Get stats tool
app.post('/mcp/tools/get_statistics', async (req, res) => {
  try {
    const total = await prisma.governmentService.count();
    const online = await prisma.governmentService.count({ where: { isOnline: true } });
    const active = await prisma.governmentService.count({ where: { isActive: true } });
    
    const categoryStats = await prisma.governmentService.groupBy({
      by: ['category'],
      _count: { category: true },
    });
    
    res.json({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ 
            total, 
            online, 
            active,
            categories: categoryStats.map(stat => ({
              category: stat.category,
              count: stat._count.category,
            })),
            timestamp: new Date().toISOString()
          }, null, 2),
        },
      ],
    });
  } catch (error) {
    res.status(500).json({
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    });
  }
});

// MCP Resources endpoints
app.get('/mcp/resources', (req, res) => {
  res.json({
    resources: [
      {
        uri: 'services://summary',
        name: 'services-summary',
        description: 'Summary of all government services',
        mimeType: 'application/json',
        endpoint: '/mcp/resources/summary'
      },
      {
        uri: 'services://live-stats',
        name: 'live-statistics',
        description: 'Real-time service statistics',
        mimeType: 'application/json',
        endpoint: '/mcp/resources/live-stats'
      },
    ],
  });
});

// Services summary resource
app.get('/mcp/resources/summary', async (req, res) => {
  try {
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
      timestamp: new Date().toISOString(),
    };

    res.json({
      contents: [
        {
          uri: 'services://summary',
          mimeType: 'application/json',
          text: JSON.stringify(summary, null, 2),
        },
      ],
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get summary' });
  }
});

// Live stats resource
app.get('/mcp/resources/live-stats', async (req, res) => {
  try {
    const stats = await Promise.all([
      prisma.governmentService.count(),
      prisma.governmentService.count({ where: { isOnline: true } }),
      prisma.governmentService.count({ where: { isActive: true } }),
      prisma.governmentService.count({ where: { category: 'EMPLOYMENT' } }),
      prisma.governmentService.count({ where: { category: 'BUSINESS' } }),
      prisma.governmentService.count({ where: { category: 'EDUCATION' } }),
    ]);

    const liveStats = {
      total: stats[0],
      online: stats[1],
      active: stats[2],
      employment: stats[3],
      business: stats[4],
      education: stats[5],
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    res.json({
      contents: [
        {
          uri: 'services://live-stats',
          mimeType: 'application/json',
          text: JSON.stringify(liveStats, null, 2),
        },
      ],
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get live stats' });
  }
});

// Streaming endpoint with Server-Sent Events
app.get('/stream/services', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const batchSize = parseInt(req.query.batchSize as string) || 5;
  const delay = parseInt(req.query.delay as string) || 1000;

  try {
    const total = await prisma.governmentService.count();
    const batches = Math.ceil(total / batchSize);

    // Send start event
    res.write(`data: ${JSON.stringify({ 
      type: 'start', 
      total, 
      batches, 
      batchSize,
      timestamp: new Date().toISOString()
    })}\n\n`);

    // Stream services in batches
    for (let i = 0; i < batches; i++) {
      const services = await prisma.governmentService.findMany({
        skip: i * batchSize,
        take: batchSize,
        select: {
          id: true,
          name: true,
          nameEn: true,
          category: true,
          isOnline: true,
          description: true,
        },
      });

      res.write(`data: ${JSON.stringify({
        type: 'batch',
        batchNumber: i + 1,
        totalBatches: batches,
        services,
        timestamp: new Date().toISOString()
      })}\n\n`);

      // Add delay between batches
      if (i < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Send completion event
    res.write(`data: ${JSON.stringify({ 
      type: 'complete', 
      total,
      timestamp: new Date().toISOString()
    })}\n\n`);

  } catch (error) {
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })}\n\n`);
  }

  res.end();
});

// Real-time stats streaming
app.get('/stream/stats', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const interval = parseInt(req.query.interval as string) || 5000;

  const sendStats = async () => {
    try {
      const stats = await Promise.all([
        prisma.governmentService.count(),
        prisma.governmentService.count({ where: { isOnline: true } }),
        prisma.governmentService.count({ where: { isActive: true } }),
      ]);

      const categoryStats = await prisma.governmentService.groupBy({
        by: ['category'],
        _count: { category: true },
      });

      res.write(`data: ${JSON.stringify({
        type: 'stats',
        total: stats[0],
        online: stats[1],
        active: stats[2],
        categories: categoryStats.map(stat => ({
          category: stat.category,
          count: stat._count.category,
        })),
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      })}\n\n`);
    } catch (error) {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })}\n\n`);
    }
  };

  // Send initial stats
  await sendStats();

  // Send stats at intervals
  const statsInterval = setInterval(sendStats, interval);

  // Clean up on connection close
  req.on('close', () => {
    clearInterval(statsInterval);
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Algerian Services MCP HTTP Server',
    version: '1.0.0',
    description: 'HTTP-based MCP server for Algerian government services',
    endpoints: {
      health: 'GET /health',
      tools: 'GET /mcp/tools',
      resources: 'GET /mcp/resources',
      streaming: {
        services: 'GET /stream/services?batchSize=5&delay=1000',
        stats: 'GET /stream/stats?interval=5000'
      },
      mcp_tools: {
        search_services: 'POST /mcp/tools/search_services',
        get_service_by_id: 'POST /mcp/tools/get_service_by_id',
        get_statistics: 'POST /mcp/tools/get_statistics'
      },
      mcp_resources: {
        summary: 'GET /mcp/resources/summary',
        live_stats: 'GET /mcp/resources/live-stats'
      }
    },
    timestamp: new Date().toISOString()
  });
});

async function main() {
  // Start HTTP server
  app.listen(PORT, () => {
    console.log(`🚀 MCP HTTP Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 Tools: http://localhost:${PORT}/mcp/tools`);
    console.log(`📚 Resources: http://localhost:${PORT}/mcp/resources`);
    console.log(`🌊 Streaming Services: http://localhost:${PORT}/stream/services`);
    console.log(`📈 Streaming Stats: http://localhost:${PORT}/stream/stats`);
    console.log(`📖 API Docs: http://localhost:${PORT}/api/docs`);
    console.log('');
    console.log('🔌 MCP HTTP Server ready for connections!');
  });
}

main().catch((err) => {
  console.error('❌ Server failed:', err);
  process.exit(1);
});
