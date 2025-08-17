#!/usr/bin/env tsx

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { PrismaClient, ServiceCategory } from '@prisma/client';

const app = express();
const port = process.env.MCP_SERVER_PORT || 8080;
const prisma = new PrismaClient();

// Debug logging utility
class Logger {
  static debug(component: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [DEBUG] [${component}] ${message}`);
    if (data) {
      console.log(`[${timestamp}] [DEBUG] [${component}] Data:`, JSON.stringify(data, null, 2));
    }
  }

  static info(component: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] [${component}] ${message}`);
    if (data) {
      console.log(`[${timestamp}] [INFO] [${component}] Data:`, JSON.stringify(data, null, 2));
    }
  }

  static error(component: string, message: string, error?: any) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] [${component}] ${message}`);
    if (error) {
      console.error(`[${timestamp}] [ERROR] [${component}] Error:`, error);
    }
  }
}

// Middleware - CORS configuration for api.findapply.com
const allowedOrigins = [
  'http://localhost:3000',                    // Development
  'https://api.findapply.com',               // Production main
  'https://www.api.findapply.com',           // Production www
  'https://app.findapply.com',               // Alternative subdomain
  'https://admin.findapply.com',             // Admin subdomain
  process.env.CORS_ORIGIN                    // Environment override
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

app.use(express.json());

// API Key Authentication Middleware
const API_KEYS = new Map([
  ['dz_live_demo123', { name: 'Algeria Demo Key', permissions: ['*'], isActive: true }],
  ['dz_test_456789', { name: 'Algeria Test Key', permissions: ['search', 'stats'], isActive: true }],
  [process.env.MCP_API_KEY, { name: 'Main API Key', permissions: ['*'], isActive: true }]
].filter(([key]) => key)); // Remove undefined keys

function authenticateApiKey(req: any, res: any, next: any) {
  // Skip authentication for health check
  if (req.path === '/health') {
    return next();
  }

  const authHeader = req.headers.authorization;
  const apiKey = authHeader?.replace('Bearer ', '') || req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API key required', 
      message: 'Provide API key in Authorization header or x-api-key header' 
    });
  }

  const keyInfo = API_KEYS.get(apiKey);
  
  if (!keyInfo || !keyInfo.isActive) {
    return res.status(401).json({ 
      error: 'Invalid API key', 
      message: 'API key is invalid or inactive' 
    });
  }

  // Add key info to request
  req.apiKey = { key: apiKey, ...keyInfo };
  next();
}

// Apply authentication to protected routes
app.use('/search', authenticateApiKey);
app.use('/service', authenticateApiKey);
app.use('/stats', authenticateApiKey);
app.use('/tools', authenticateApiKey);
app.use('/stream', authenticateApiKey);

// Request logging middleware
app.use((req, res, next) => {
  Logger.info('HTTP', `${req.method} ${req.path}`, {
    query: req.query,
    body: req.body,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type']
    }
  });
  next();
});

// Input schemas
const SearchServicesInputSchema = z.object({
  query: z.string().describe('Search query in Arabic or English'),
  category: z.nativeEnum(ServiceCategory).optional(),
  limit: z.number().min(1).max(50).default(10),
});

const GetServiceByIdInputSchema = z.object({
  id: z.string().describe('Service ID'),
});

// Health check endpoint
app.get('/health', (req, res) => {
  Logger.info('HEALTH', 'Health check requested');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'Algerian Youth MCP Server',
    version: '1.0.0'
  });
});

// List available tools
app.get('/tools', (req, res) => {
  Logger.info('TOOLS', 'Tools list requested');
  const tools = [
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
  ];
  
  Logger.debug('TOOLS', 'Returning tools list', { count: tools.length, tools });
  res.json({ tools });
});

// Search services endpoint
app.post('/search', async (req, res) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  Logger.info('SEARCH', `Starting search request ${requestId}`, req.body);
  
  try {
    Logger.debug('SEARCH', `Validating input for ${requestId}`);
    const { query, category, limit } = SearchServicesInputSchema.parse(req.body);
    
    Logger.debug('SEARCH', `Building query for ${requestId}`, { query, category, limit });
    
    const whereClause: any = {
      isActive: true,
    };

    if (query) {
      // Escape special regex characters for MongoDB
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      whereClause.OR = [
        { name: { contains: escapedQuery, mode: 'insensitive' } },
        { nameEn: { contains: escapedQuery, mode: 'insensitive' } },
        { description: { contains: escapedQuery, mode: 'insensitive' } },
        { descriptionEn: { contains: escapedQuery, mode: 'insensitive' } },
      ];
      Logger.debug('SEARCH', `Added text search for ${requestId}`, { 
        originalQuery: query,
        escapedQuery: escapedQuery 
      });
    }

    if (category) {
      whereClause.category = category;
      Logger.debug('SEARCH', `Added category filter for ${requestId}`, { category });
    }

    Logger.debug('SEARCH', `Executing database query for ${requestId}`, { whereClause });
    const startTime = Date.now();
    
    const results = await prisma.governmentService.findMany({
      where: whereClause,
      take: limit,
      select: {
        id: true,
        name: true,
        nameEn: true,
        description: true,
        descriptionEn: true,
        category: true,
        isOnline: true,
        bawabticUrl: true,
        requirements: true,
        process: true,
        fee: true,
        duration: true,
        contactInfo: true,
      },
    });

    const queryTime = Date.now() - startTime;
    Logger.info('SEARCH', `Database query completed for ${requestId}`, {
      resultsCount: results.length,
      queryTimeMs: queryTime
    });

    const response = {
      requestId,
      query,
      category,
      count: results.length,
      results,
      metadata: {
        queryTime: queryTime,
        timestamp: new Date().toISOString()
      }
    };

    Logger.debug('SEARCH', `Returning response for ${requestId}`, {
      responseSize: JSON.stringify(response).length,
      hasResults: results.length > 0
    });

    res.json(response);

  } catch (error) {
    Logger.error('SEARCH', `Search failed for ${requestId}`, error);
    res.status(500).json({ 
      error: 'Search failed', 
      requestId,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Streaming search endpoint
app.post('/stream/search', async (req, res) => {
  const requestId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  Logger.info('STREAM', `Starting streaming search request ${requestId}`);
  
  try {
    // Validate input
    const { query, category, limit = 10, chunkSize = 1 } = SearchServicesInputSchema.parse(req.body);
    
    Logger.info('STREAM', `Streaming search for ${requestId}`, { query, category, limit, chunkSize });

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control, Content-Type, Authorization'
    });

    // Send initial metadata
    res.write(`data: ${JSON.stringify({
      type: 'metadata',
      requestId,
      query,
      category,
      timestamp: new Date().toISOString()
    })}\n\n`);

    // Build search query
    const startTime = Date.now();
    const whereClause: any = { isActive: true };

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

    // Stream progress update
    res.write(`data: ${JSON.stringify({
      type: 'progress',
      message: 'Searching database...',
      progress: 25
    })}\n\n`);

    // Execute query
    const results = await prisma.governmentService.findMany({
      where: whereClause,
      take: limit,
      select: {
        id: true,
        name: true,
        nameEn: true,
        description: true,
        descriptionEn: true,
        category: true,
        isOnline: true,
        bawabticUrl: true,
        requirements: true,
        process: true,
        fee: true,
        duration: true,
        contactInfo: true,
      },
    });

    // Stream progress update
    res.write(`data: ${JSON.stringify({
      type: 'progress',
      message: 'Processing results...',
      progress: 75
    })}\n\n`);

    // Stream results in chunks
    for (let i = 0; i < results.length; i += chunkSize) {
      const chunk = results.slice(i, i + chunkSize);
      
      res.write(`data: ${JSON.stringify({
        type: 'result',
        chunk: i / chunkSize,
        totalChunks: Math.ceil(results.length / chunkSize),
        data: chunk,
        progress: Math.min(100, 75 + (25 * (i + chunkSize) / results.length))
      })}\n\n`);

      // Small delay to demonstrate streaming (remove in production)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Send completion
    const queryTime = Date.now() - startTime;
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      requestId,
      totalResults: results.length,
      queryTime,
      timestamp: new Date().toISOString()
    })}\n\n`);

    res.end();

    Logger.info('STREAM', `Streaming search completed for ${requestId}`, {
      resultsCount: results.length,
      queryTimeMs: queryTime
    });

  } catch (error) {
    Logger.error('STREAM', `Streaming search failed for ${requestId}`, error);
    
    res.write(`data: ${JSON.stringify({
      type: 'error',
      requestId,
      error: 'Streaming search failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })}\n\n`);
    
    res.end();
  }
});

// Streaming statistics endpoint
app.get('/stream/stats', async (req, res) => {
  const requestId = `stream_stats_${Date.now()}`;
  
  try {
    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Send real-time stats every 2 seconds
    const interval = setInterval(async () => {
      try {
        const [total, online, active] = await Promise.all([
          prisma.governmentService.count(),
          prisma.governmentService.count({ where: { isOnline: true } }),
          prisma.governmentService.count({ where: { isActive: true } }),
        ]);

        const categoryStats = await prisma.governmentService.groupBy({
          by: ['category'],
          _count: { category: true }
        });

        res.write(`data: ${JSON.stringify({
          type: 'stats_update',
          requestId,
          data: {
            total,
            online,
            active,
            byCategory: categoryStats.map(item => ({
              category: item.category,
              count: item._count.category
            })),
            timestamp: new Date().toISOString()
          }
        })}\n\n`);

      } catch (error) {
        res.write(`data: ${JSON.stringify({
          type: 'error',
          error: 'Failed to fetch stats',
          timestamp: new Date().toISOString()
        })}\n\n`);
      }
    }, 2000);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(interval);
      Logger.info('STREAM', `Stats streaming ended for ${requestId}`);
    });

  } catch (error) {
    Logger.error('STREAM', `Stats streaming failed for ${requestId}`, error);
    res.status(500).json({ error: 'Streaming failed' });
  }
});

// Get service by ID endpoint
app.get('/service/:id', async (req, res) => {
  const requestId = `get_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const serviceId = req.params.id;
  
  Logger.info('GET_SERVICE', `Getting service ${serviceId} for ${requestId}`);
  
  try {
    Logger.debug('GET_SERVICE', `Validating service ID for ${requestId}`, { serviceId });
    const { id } = GetServiceByIdInputSchema.parse({ id: serviceId });
    
    Logger.debug('GET_SERVICE', `Querying database for ${requestId}`);
    const startTime = Date.now();
    
    const result = await prisma.governmentService.findUnique({ 
      where: { id } 
    });
    
    const queryTime = Date.now() - startTime;
    Logger.info('GET_SERVICE', `Database query completed for ${requestId}`, {
      found: !!result,
      queryTimeMs: queryTime
    });

    if (!result) {
      Logger.debug('GET_SERVICE', `Service not found for ${requestId}`, { serviceId });
      return res.status(404).json({
        error: 'Service not found',
        requestId,
        serviceId
      });
    }

    const response = {
      requestId,
      result,
      metadata: {
        queryTime: queryTime,
        timestamp: new Date().toISOString()
      }
    };

    Logger.debug('GET_SERVICE', `Returning service data for ${requestId}`, {
      serviceFound: true,
      serviceName: result.name
    });

    res.json(response);

  } catch (error) {
    Logger.error('GET_SERVICE', `Get service failed for ${requestId}`, error);
    res.status(500).json({ 
      error: 'Get service failed', 
      requestId,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get statistics endpoint
app.get('/stats', async (req, res) => {
  const requestId = `stats_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  Logger.info('STATS', `Getting statistics for ${requestId}`);
  
  try {
    Logger.debug('STATS', `Querying database statistics for ${requestId}`);
    const startTime = Date.now();
    
    const [total, online, active, byCategory] = await Promise.all([
      prisma.governmentService.count(),
      prisma.governmentService.count({ where: { isOnline: true } }),
      prisma.governmentService.count({ where: { isActive: true } }),
      prisma.governmentService.groupBy({
        by: ['category'],
        _count: {
          id: true
        }
      })
    ]);
    
    const queryTime = Date.now() - startTime;
    Logger.info('STATS', `Statistics query completed for ${requestId}`, {
      total,
      online,
      active,
      categories: byCategory.length,
      queryTimeMs: queryTime
    });

    const response = {
      requestId,
      total,
      online,
      active,
      byCategory: byCategory.map(cat => ({
        category: cat.category,
        count: cat._count.id
      })),
      metadata: {
        queryTime: queryTime,
        timestamp: new Date().toISOString()
      }
    };

    Logger.debug('STATS', `Returning statistics for ${requestId}`, response);
    res.json(response);

  } catch (error) {
    Logger.error('STATS', `Statistics failed for ${requestId}`, error);
    res.status(500).json({ 
      error: 'Statistics failed', 
      requestId,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  Logger.error('SERVER', 'Unhandled error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  try {
    Logger.info('SERVER', 'Starting MCP HTTP server...');
    
    // Test database connection
    Logger.debug('SERVER', 'Testing database connection...');
    const serviceCount = await prisma.governmentService.count();
    Logger.info('SERVER', 'Database connected successfully', { serviceCount });
    
    // Start HTTP server
    app.listen(port, () => {
      Logger.info('SERVER', `MCP HTTP Server running on port ${port}`);
      Logger.info('SERVER', 'Available endpoints:', {
        health: `http://localhost:${port}/health`,
        tools: `http://localhost:${port}/tools`,
        search: `http://localhost:${port}/search`,
        service: `http://localhost:${port}/service/:id`,
        stats: `http://localhost:${port}/stats`
      });
    });

  } catch (error) {
    Logger.error('SERVER', 'Failed to start server', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  Logger.info('SERVER', 'Shutting down MCP server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  Logger.info('SERVER', 'Shutting down MCP server...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();