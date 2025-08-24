import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { keywords } = req.body;
    const startTime = Date.now();

    if (!keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ error: 'Keywords array is required' });
    }

    // Generate search conditions
    const conditions = keywords.flatMap(keyword => [
      { name: { contains: keyword } },
      { nameEn: { contains: keyword } },
      { nameFr: { contains: keyword } },
      { description: { contains: keyword } },
      { keywords: { contains: keyword } },
      { keywordsEn: { contains: keyword } },
      { keywordsFr: { contains: keyword } }
    ]);

    // Execute search
    const services = await prisma.governmentService.findMany({
      where: {
        isActive: true,
        OR: conditions
      },
      take: 10,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Get search statistics
    const totalServices = await prisma.governmentService.count({ where: { isActive: true } });
    const categoryBreakdown = await prisma.governmentService.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { category: true }
    });

    const processingTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      services: services.map(s => ({
        id: s.id,
        name: s.name,
        nameEn: s.nameEn,
        nameFr: s.nameFr,
        description: s.description.substring(0, 200) + '...',
        category: s.category,
        priority: s.priority,
        isOnline: s.isOnline,
        fee: s.fee,
        processingTime: s.processingTime
      })),
      searchMetadata: {
        searchKeywords: keywords,
        searchConditions: conditions.length,
        servicesFound: services.length,
        totalServicesInDB: totalServices,
        searchHitRate: `${((services.length / totalServices) * 100).toFixed(1)}%`,
        processingTime,
        categoryBreakdown: categoryBreakdown.map(c => ({
          category: c.category,
          count: c._count.category
        }))
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Database search failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}