import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { stringify } from 'csv-stringify';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { table, format } = req.body;

    if (!table || !format) {
      return res.status(400).json({ error: 'Table and format are required' });
    }

    let data: any[] = [];

    // Fetch data based on table
    switch (table) {
      case 'government_services':
        data = await prisma.governmentService.findMany({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        });
        break;
      case 'chat_sessions':
        data = await prisma.chatSession.findMany({
          orderBy: { createdAt: 'desc' }
        });
        break;
      case 'chat_messages':
        data = await prisma.chatMessage.findMany({
          orderBy: { timestamp: 'desc' },
          take: 1000 // Limit to last 1000 messages
        });
        break;
      case 'ai_templates':
        data = await prisma.aITemplate.findMany({
          orderBy: { createdAt: 'desc' }
        });
        break;
      case 'service_analytics':
        data = await prisma.serviceAnalytics.findMany({
          orderBy: { timestamp: 'desc' },
          take: 1000
        });
        break;
      default:
        return res.status(400).json({ error: 'Invalid table name' });
    }

    // Generate export based on format
    switch (format) {
      case 'json':
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${table}.json"`);
        return res.status(200).json({
          metadata: {
            table,
            recordCount: data.length,
            exportedAt: new Date().toISOString(),
            format: 'json'
          },
          data
        });

      case 'csv':
        const csvData = await new Promise<string>((resolve, reject) => {
          stringify(data, { 
            header: true,
            encoding: 'utf8'
          }, (err, output) => {
            if (err) reject(err);
            else resolve(output);
          });
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${table}.csv"`);
        // Add BOM for proper UTF-8 handling in Excel
        return res.status(200).send('\uFEFF' + csvData);

      case 'excel':
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, table);
        
        const excelBuffer = XLSX.write(workbook, { 
          type: 'buffer', 
          bookType: 'xlsx',
          compression: true 
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${table}.xlsx"`);
        return res.status(200).send(excelBuffer);

      default:
        return res.status(400).json({ error: 'Invalid export format' });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Export failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}