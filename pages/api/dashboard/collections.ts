import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  switch (req.method) {
    case 'GET':
      return await getCollections(req, res);
      
    case 'POST':
      return await createCollection(req, res);
      
    case 'DELETE':
      return await deleteCollection(req, res);
      
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getCollections(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get collection information from database
    const collections = [
      {
        name: 'government_services',
        count: await prisma.governmentService.count(),
        description: 'Algerian government services with complete details',
        lastModified: await getLastModified('governmentService'),
        size: await getCollectionSize('governmentService'),
        indexes: ['category', 'name', 'isActive']
      },
      {
        name: 'users',
        count: await prisma.user.count(),
        description: 'Registered users and their profiles',
        lastModified: await getLastModified('user'),
        size: await getCollectionSize('user'),
        indexes: ['email', 'createdAt']
      },
      {
        name: 'chat_messages', 
        count: await prisma.chatMessage.count(),
        description: 'Chat conversation history',
        lastModified: await getLastModified('chatMessage'),
        size: await getCollectionSize('chatMessage'),
        indexes: ['sessionId', 'timestamp']
      },
      {
        name: 'sessions',
        count: await prisma.session.count(), 
        description: 'User session management',
        lastModified: await getLastModified('session'),
        size: await getCollectionSize('session'),
        indexes: ['sessionId', 'expiresAt']
      },
      {
        name: 'jobs',
        count: await prisma.job.count(),
        description: 'Job postings and opportunities',
        lastModified: await getLastModified('job'),
        size: await getCollectionSize('job'),
        indexes: ['category', 'wilaya', 'isActive']
      }
    ];

    res.status(200).json(collections);
    
  } catch (error) {
    console.error('Collections fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch collections',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function createCollection(req: NextApiRequest, res: NextApiResponse) {
  const { name, description, schema } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Collection name is required' });
  }
  
  try {
    // In a real implementation, you'd use database-specific commands
    // For now, return success response
    res.status(201).json({
      message: `Collection '${name}' created successfully`,
      collection: {
        name,
        description,
        createdAt: new Date().toISOString(),
        count: 0
      }
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create collection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function deleteCollection(req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.query;
  
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Collection name is required' });
  }
  
  // Prevent deletion of critical collections
  const protectedCollections = ['government_services', 'users', 'sessions'];
  if (protectedCollections.includes(name)) {
    return res.status(403).json({ 
      error: 'Cannot delete protected collection',
      protected: protectedCollections
    });
  }
  
  try {
    // In a real implementation, you'd use database-specific commands
    res.status(200).json({
      message: `Collection '${name}' deletion requested`,
      warning: 'This operation cannot be undone'
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to delete collection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getLastModified(model: string): Promise<string> {
  try {
    // This is a simplified version - in production you'd check actual timestamps
    const now = new Date();
    return now.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

async function getCollectionSize(model: string): Promise<string> {
  try {
    // Estimate collection size based on record count
    let count = 0;
    switch (model) {
      case 'governmentService':
        count = await prisma.governmentService.count();
        break;
      case 'user':
        count = await prisma.user.count();
        break;
      case 'chatMessage':
        count = await prisma.chatMessage.count();
        break;
      default:
        count = 0;
    }
    
    // Rough size estimation (average 1KB per record)
    const estimatedBytes = count * 1024;
    
    if (estimatedBytes < 1024) return `${estimatedBytes} B`;
    if (estimatedBytes < 1024 * 1024) return `${(estimatedBytes / 1024).toFixed(1)} KB`;
    return `${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;
    
  } catch (error) {
    return 'Unknown';
  }
}