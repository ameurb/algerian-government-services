import { NextApiRequest, NextApiResponse } from 'next';

interface MCPTool {
  id: string;
  name: string;
  description: string;
  type: 'search' | 'data' | 'utility' | 'custom';
  endpoint: string;
  parameters: Record<string, any>;
  isActive: boolean;
  lastUsed: string;
  usageCount: number;
  responseTime: number;
}

// Demo MCP tools (in production, store in database)
let mcpTools: MCPTool[] = [
  {
    id: '1',
    name: 'search_government_services',
    description: 'Search for Algerian government services based on query and category',
    type: 'search',
    endpoint: '/search',
    parameters: {
      query: { type: 'string', required: true, description: 'Search query' },
      category: { type: 'string', required: false, description: 'Service category filter' },
      limit: { type: 'number', required: false, default: 10, description: 'Number of results' }
    },
    isActive: true,
    lastUsed: new Date().toISOString(),
    usageCount: 1247,
    responseTime: 45
  },
  {
    id: '2',
    name: 'get_service_details',
    description: 'Get detailed information about a specific government service',
    type: 'data',
    endpoint: '/service/:id',
    parameters: {
      serviceId: { type: 'string', required: true, description: 'Service ID to retrieve' }
    },
    isActive: true,
    lastUsed: new Date(Date.now() - 60000).toISOString(),
    usageCount: 823,
    responseTime: 32
  },
  {
    id: '3',
    name: 'get_statistics',
    description: 'Get database and system statistics',
    type: 'utility',
    endpoint: '/stats',
    parameters: {},
    isActive: true,
    lastUsed: new Date(Date.now() - 300000).toISOString(),
    usageCount: 156,
    responseTime: 28
  },
  {
    id: '4',
    name: 'health_check',
    description: 'Check MCP server health and connectivity',
    type: 'utility',
    endpoint: '/health',
    parameters: {},
    isActive: true,
    lastUsed: new Date(Date.now() - 30000).toISOString(),
    usageCount: 2341,
    responseTime: 12
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  switch (req.method) {
    case 'GET':
      // Get all MCP tools
      const { type: filterType } = req.query;
      let filteredTools = mcpTools;
      
      if (filterType && typeof filterType === 'string') {
        filteredTools = mcpTools.filter(tool => tool.type === filterType);
      }
      
      return res.status(200).json(filteredTools);
      
    case 'POST':
      // Create new MCP tool
      const { name, description, type: toolType, endpoint, parameters } = req.body;
      
      if (!name || !description || !toolType || !endpoint) {
        return res.status(400).json({ 
          error: 'Name, description, type, and endpoint are required' 
        });
      }
      
      const newTool: MCPTool = {
        id: Date.now().toString(),
        name,
        description,
        type: toolType,
        endpoint,
        parameters: parameters || {},
        isActive: true,
        lastUsed: 'Never',
        usageCount: 0,
        responseTime: 0
      };
      
      mcpTools.push(newTool);
      return res.status(201).json(newTool);
      
    case 'PUT':
      // Update existing MCP tool
      const { id } = req.query;
      const updates = req.body;
      
      const toolIndex = mcpTools.findIndex(tool => tool.id === id);
      if (toolIndex === -1) {
        return res.status(404).json({ error: 'MCP tool not found' });
      }
      
      mcpTools[toolIndex] = { ...mcpTools[toolIndex], ...updates };
      return res.status(200).json(mcpTools[toolIndex]);
      
    case 'DELETE':
      // Delete MCP tool
      const { toolId } = req.query;
      
      if (!toolId) {
        return res.status(400).json({ error: 'Tool ID is required' });
      }
      
      const originalLength = mcpTools.length;
      mcpTools = mcpTools.filter(tool => tool.id !== toolId);
      
      if (mcpTools.length === originalLength) {
        return res.status(404).json({ error: 'MCP tool not found' });
      }
      
      return res.status(200).json({ message: 'MCP tool deleted successfully' });
      
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}