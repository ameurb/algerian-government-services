import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// API Key model (you may want to add this to your Prisma schema)
interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  lastUsed: string;
  isActive: boolean;
  createdAt: string;
  description?: string;
}

// In-memory store for demo (in production, use database)
let apiKeys: APIKey[] = [
  {
    id: '1',
    name: 'MCP Server Key',
    key: 'mcp_live_**********************',
    permissions: ['mcp:read', 'mcp:write', 'search:all'],
    lastUsed: '2025-01-15 10:30:00',
    isActive: true,
    createdAt: '2025-01-01 00:00:00',
    description: 'Main API key for MCP server operations'
  },
  {
    id: '2', 
    name: 'Chat Service Key',
    key: 'chat_live_*********************',
    permissions: ['chat:read', 'chat:write', 'session:manage'],
    lastUsed: '2025-01-15 11:45:00',
    isActive: true,
    createdAt: '2025-01-10 00:00:00',
    description: 'API key for chat service operations'
  },
  {
    id: '3',
    name: 'Analytics Key', 
    key: 'analytics_**********************',
    permissions: ['stats:read', 'metrics:read'],
    lastUsed: '2025-01-14 15:20:00',
    isActive: false,
    createdAt: '2025-01-05 00:00:00',
    description: 'Read-only access for analytics and reporting'
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  switch (req.method) {
    case 'GET':
      return res.status(200).json(apiKeys);
      
    case 'POST':
      const { name, permissions, description } = req.body;
      
      if (!name || !permissions) {
        return res.status(400).json({ error: 'Name and permissions are required' });
      }
      
      const newKey: APIKey = {
        id: uuidv4(),
        name,
        key: `api_live_${generateRandomKey()}`,
        permissions: Array.isArray(permissions) ? permissions : [permissions],
        lastUsed: 'Never',
        isActive: true,
        createdAt: new Date().toISOString(),
        description
      };
      
      apiKeys.push(newKey);
      return res.status(201).json(newKey);
      
    case 'DELETE':
      const { keyId } = req.query;
      
      if (!keyId) {
        return res.status(400).json({ error: 'Key ID is required' });
      }
      
      apiKeys = apiKeys.filter(key => key.id !== keyId);
      return res.status(200).json({ message: 'API key deleted successfully' });
      
    case 'PUT':
      const { id } = req.query;
      const updates = req.body;
      
      const keyIndex = apiKeys.findIndex(key => key.id === id);
      if (keyIndex === -1) {
        return res.status(404).json({ error: 'API key not found' });
      }
      
      apiKeys[keyIndex] = { ...apiKeys[keyIndex], ...updates };
      return res.status(200).json(apiKeys[keyIndex]);
      
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

function generateRandomKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}