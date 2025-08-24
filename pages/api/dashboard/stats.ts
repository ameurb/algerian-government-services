import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get basic counts
    const [totalServices, totalSessions, totalMessages] = await Promise.all([
      prisma.governmentService.count({ where: { isActive: true } }),
      prisma.chatSession.count({ where: { isActive: true } }),
      prisma.chatMessage.count()
    ]);

    // Get services by category
    const servicesByCategory = await prisma.governmentService.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } }
    });

    // Get messages by language
    const messagesByLanguage = await prisma.chatMessage.groupBy({
      by: ['language'],
      _count: { language: true },
      orderBy: { _count: { language: 'desc' } }
    });

    // Get recent activity (last 10 messages)
    const recentActivity = await prisma.chatMessage.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      where: { role: 'USER' },
      select: {
        content: true,
        language: true,
        timestamp: true,
        sessionId: true
      }
    });

    // System health checks
    const systemHealth = await checkSystemHealth();

    const dashboardStats: any = {
      totalServices,
      totalSessions,
      totalMessages,
      servicesByCategory: servicesByCategory.map(item => ({
        category: item.category,
        count: item._count.category
      })),
      messagesByLanguage: messagesByLanguage.map(item => ({
        language: item.language || 'unknown',
        count: item._count.language
      })),
      recentActivity,
      systemHealth,
      lastUpdated: new Date().toISOString()
    };

    res.status(200).json(dashboardStats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function checkSystemHealth() {
  const health: {
    database: 'healthy' | 'warning' | 'error';
    ai: 'healthy' | 'warning' | 'error';
    streaming: 'healthy' | 'warning' | 'error';
  } = {
    database: 'healthy',
    ai: 'healthy',
    streaming: 'healthy'
  };

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    health.database = 'error';
  }

  try {
    // Test AI service (simple check)
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    if (!hasOpenAI) {
      health.ai = 'warning';
    }
  } catch (error) {
    health.ai = 'error';
  }

  // Streaming is always healthy if API is responding
  health.streaming = 'healthy';

  return health;
}