import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get basic database stats
    const [
      totalServices,
      totalUsers, 
      totalChats,
      totalSessions,
      activeServices,
      onlineServices
    ] = await Promise.all([
      prisma.governmentService.count(),
      prisma.user.count(),
      prisma.chatMessage.count(),
      prisma.session.count(),
      prisma.governmentService.count({ where: { isActive: true } }),
      prisma.governmentService.count({ where: { isOnline: true } })
    ]);

    // Get services by category
    const servicesByCategory = await prisma.governmentService.groupBy({
      by: ['category'],
      _count: {
        category: true
      }
    });

    // Get recent chat activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentChats = await prisma.chatMessage.count({
      where: {
        timestamp: {
          gte: oneDayAgo
        }
      }
    });

    // Check MCP server health
    let mcpHealth = 'unknown';
    let mcpResponseTime = 0;
    
    try {
      const mcpStartTime = Date.now();
      const mcpResponse = await fetch('http://localhost:8080/health');
      mcpResponseTime = Date.now() - mcpStartTime;
      
      if (mcpResponse.ok) {
        mcpHealth = 'healthy';
      } else {
        mcpHealth = 'unhealthy';
      }
    } catch (error) {
      mcpHealth = 'offline';
    }

    // Response structure
    const stats = {
      totalServices,
      totalUsers,
      totalChats,
      apiCalls: recentChats, // Using recent chats as API call proxy
      mcpHealth,
      mcpResponseTime,
      dbConnections: totalSessions,
      activeServices,
      onlineServices,
      servicesByCategory: servicesByCategory.map(item => ({
        category: item.category,
        count: item._count.category
      })),
      systemInfo: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage()
      },
      lastUpdated: new Date().toISOString()
    };

    res.status(200).json(stats);
    
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}