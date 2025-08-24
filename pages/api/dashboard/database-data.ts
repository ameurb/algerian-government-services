import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { table, page = 1, pageSize = 20, search = '' } = req.body;

    if (!table) {
      return res.status(400).json({ error: 'Table name is required' });
    }

    const offset = (page - 1) * pageSize;
    let records: any[] = [];
    let total = 0;

    // Handle different tables with proper search
    switch (table) {
      case 'government_services':
        const serviceWhere = search ? {
          OR: [
            { name: { contains: search } },
            { nameEn: { contains: search } },
            { description: { contains: search } }
          ]
        } : {};

        [records, total] = await Promise.all([
          prisma.governmentService.findMany({
            where: serviceWhere,
            skip: offset,
            take: pageSize,
            orderBy: { createdAt: 'desc' }
          }),
          prisma.governmentService.count({ where: serviceWhere })
        ]);
        break;

      case 'chat_sessions':
        const sessionWhere = search ? {
          OR: [
            { sessionId: { contains: search } },
            { language: { contains: search } }
          ]
        } : {};

        [records, total] = await Promise.all([
          prisma.chatSession.findMany({
            where: sessionWhere,
            skip: offset,
            take: pageSize,
            orderBy: { createdAt: 'desc' }
          }),
          prisma.chatSession.count({ where: sessionWhere })
        ]);
        break;

      case 'chat_messages':
        const messageWhere = search ? {
          OR: [
            { content: { contains: search } },
            { language: { contains: search } },
            { sessionId: { contains: search } }
          ]
        } : {};

        [records, total] = await Promise.all([
          prisma.chatMessage.findMany({
            where: messageWhere,
            skip: offset,
            take: pageSize,
            orderBy: { timestamp: 'desc' }
          }),
          prisma.chatMessage.count({ where: messageWhere })
        ]);
        break;

      case 'ai_templates':
        const templateWhere = search ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
            { category: { contains: search } }
          ]
        } : {};

        [records, total] = await Promise.all([
          prisma.aITemplate.findMany({
            where: templateWhere,
            skip: offset,
            take: pageSize,
            orderBy: { createdAt: 'desc' }
          }),
          prisma.aITemplate.count({ where: templateWhere })
        ]);
        break;

      case 'service_analytics':
        const analyticsWhere = search ? {
          OR: [
            { searchQuery: { contains: search } },
            { language: { contains: search } },
            { sessionId: { contains: search } }
          ]
        } : {};

        [records, total] = await Promise.all([
          prisma.serviceAnalytics.findMany({
            where: analyticsWhere,
            skip: offset,
            take: pageSize,
            orderBy: { timestamp: 'desc' },
            include: {
              service: {
                select: { name: true, nameEn: true }
              }
            }
          }),
          prisma.serviceAnalytics.count({ where: analyticsWhere })
        ]);
        break;

      default:
        return res.status(400).json({ error: 'Invalid table name' });
    }

    res.status(200).json({
      success: true,
      records,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch table data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}