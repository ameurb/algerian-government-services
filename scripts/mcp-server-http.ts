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

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

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