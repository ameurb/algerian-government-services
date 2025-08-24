import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return await getTemplates(req, res);
    case 'POST':
      return await createTemplate(req, res);
    case 'PUT':
      return await updateTemplate(req, res);
    case 'DELETE':
      return await deleteTemplate(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getTemplates(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { category, language } = req.query;
    
    const where: any = {};
    if (category && typeof category === 'string') where.category = category;
    if (language && typeof language === 'string') where.language = language;

    const templates = await prisma.aITemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      templates,
      total: templates.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function createTemplate(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, description, template, language, category, variablesStr, isActive } = req.body;

    if (!name || !template) {
      return res.status(400).json({ error: 'Name and template content are required' });
    }

    const newTemplate = await prisma.aITemplate.create({
      data: {
        name,
        description,
        template,
        language: language || 'multilingual',
        category,
        variablesStr,
        isActive: isActive !== false
      }
    });

    res.status(201).json({
      success: true,
      template: newTemplate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create template',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function updateTemplate(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const updates = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Template ID is required' });
    }

    const updatedTemplate = await prisma.aITemplate.update({
      where: { id: parseInt(id) },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      template: updatedTemplate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update template',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function deleteTemplate(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Template ID is required' });
    }

    await prisma.aITemplate.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete template',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}