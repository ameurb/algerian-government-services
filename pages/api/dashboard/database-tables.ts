import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get table information from SQLite
    const tableInfo = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'
    ` as any[];

    const tables = [];

    for (const table of tableInfo) {
      const tableName = table.name;
      
      // Get row count
      const countResult = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`) as any[];
      const count = countResult[0]?.count || 0;

      // Get column information
      const columnsResult = await prisma.$queryRawUnsafe(`PRAGMA table_info("${tableName}")`) as any[];
      const columns = columnsResult.map((col: any) => ({
        name: col.name,
        type: col.type,
        nullable: col.notnull === 0,
        primaryKey: col.pk === 1
      }));

      tables.push({
        name: tableName,
        count,
        columns
      });
    }

    res.status(200).json({
      success: true,
      tables,
      totalTables: tables.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch database tables',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}