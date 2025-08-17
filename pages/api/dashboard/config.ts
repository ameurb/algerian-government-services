import { NextApiRequest, NextApiResponse } from 'next';

interface ConfigItem {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: 'server' | 'database' | 'ai' | 'security' | 'performance';
  description: string;
  editable: boolean;
  sensitive: boolean;
}

// Configuration items (in production, store in database or config file)
let configurations: ConfigItem[] = [
  // Server Configuration
  {
    key: 'MCP_SERVER_PORT',
    value: '8080',
    type: 'number',
    category: 'server',
    description: 'Port for MCP HTTP server',
    editable: true,
    sensitive: false
  },
  {
    key: 'CORS_ORIGIN',
    value: 'https://api.findapply.com',
    type: 'string',
    category: 'security',
    description: 'Allowed CORS origins for API access',
    editable: true,
    sensitive: false
  },
  {
    key: 'MAX_CONNECTIONS',
    value: '100',
    type: 'number',
    category: 'performance',
    description: 'Maximum concurrent database connections',
    editable: true,
    sensitive: false
  },
  
  // Database Configuration
  {
    key: 'DATABASE_URL',
    value: 'mongodb+srv://****@cluster0.mongodb.net/youths_portal',
    type: 'string',
    category: 'database',
    description: 'MongoDB Atlas connection string',
    editable: true,
    sensitive: true
  },
  {
    key: 'CONNECTION_TIMEOUT',
    value: '30000',
    type: 'number',
    category: 'database',
    description: 'Database connection timeout in milliseconds',
    editable: true,
    sensitive: false
  },
  
  // AI Configuration
  {
    key: 'OPENAI_MODEL',
    value: 'gpt-4o-mini',
    type: 'string',
    category: 'ai',
    description: 'OpenAI model for chat responses',
    editable: true,
    sensitive: false
  },
  {
    key: 'AI_TEMPERATURE',
    value: '0.3',
    type: 'number',
    category: 'ai',
    description: 'AI response temperature (creativity level)',
    editable: true,
    sensitive: false
  },
  {
    key: 'MAX_TOKENS',
    value: '800',
    type: 'number',
    category: 'ai',
    description: 'Maximum tokens for AI responses',
    editable: true,
    sensitive: false
  },
  
  // Security Configuration
  {
    key: 'RATE_LIMIT_REQUESTS',
    value: '20',
    type: 'number',
    category: 'security',
    description: 'Rate limit: requests per minute',
    editable: true,
    sensitive: false
  },
  {
    key: 'SESSION_TIMEOUT',
    value: '86400000',
    type: 'number',
    category: 'security',
    description: 'Session timeout in milliseconds (24 hours)',
    editable: true,
    sensitive: false
  },
  
  // Performance Configuration
  {
    key: 'CACHE_TTL',
    value: '300',
    type: 'number',
    category: 'performance',
    description: 'Cache TTL in seconds for search results',
    editable: true,
    sensitive: false
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  switch (req.method) {
    case 'GET':
      return await getConfigurations(req, res);
      
    case 'PUT':
      return await updateConfiguration(req, res);
      
    case 'POST':
      return await addConfiguration(req, res);
      
    case 'DELETE':
      return await deleteConfiguration(req, res);
      
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getConfigurations(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { category } = req.query;
    
    let filteredConfigs = configurations;
    
    if (category && typeof category === 'string') {
      filteredConfigs = configurations.filter(config => config.category === category);
    }
    
    // Mask sensitive values
    const maskedConfigs = filteredConfigs.map(config => ({
      ...config,
      value: config.sensitive ? '***HIDDEN***' : config.value
    }));
    
    res.status(200).json({
      configurations: maskedConfigs,
      categories: ['server', 'database', 'ai', 'security', 'performance'],
      total: filteredConfigs.length
    });
    
  } catch (error) {
    console.error('Configuration fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch configurations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function updateConfiguration(req: NextApiRequest, res: NextApiResponse) {
  const { key, value } = req.body;
  
  if (!key || value === undefined) {
    return res.status(400).json({ error: 'Key and value are required' });
  }
  
  try {
    const configIndex = configurations.findIndex(config => config.key === key);
    
    if (configIndex === -1) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    const config = configurations[configIndex];
    
    if (!config.editable) {
      return res.status(403).json({ error: 'Configuration is not editable' });
    }
    
    // Validate value type
    if (config.type === 'number' && isNaN(Number(value))) {
      return res.status(400).json({ error: 'Value must be a number' });
    }
    
    if (config.type === 'boolean' && typeof value !== 'boolean') {
      return res.status(400).json({ error: 'Value must be a boolean' });
    }
    
    // Update configuration
    configurations[configIndex] = {
      ...config,
      value: String(value)
    };
    
    res.status(200).json({
      message: 'Configuration updated successfully',
      configuration: configurations[configIndex]
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to update configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function addConfiguration(req: NextApiRequest, res: NextApiResponse) {
  const { key, value, type, category, description } = req.body;
  
  if (!key || !value || !type || !category || !description) {
    return res.status(400).json({ 
      error: 'Key, value, type, category, and description are required' 
    });
  }
  
  // Check if key already exists
  if (configurations.find(config => config.key === key)) {
    return res.status(409).json({ error: 'Configuration key already exists' });
  }
  
  const newConfig: ConfigItem = {
    key,
    value: String(value),
    type,
    category,
    description,
    editable: true,
    sensitive: false
  };
  
  configurations.push(newConfig);
  
  res.status(201).json({
    message: 'Configuration added successfully',
    configuration: newConfig
  });
}

async function deleteConfiguration(req: NextApiRequest, res: NextApiResponse) {
  const { key } = req.query;
  
  if (!key || typeof key !== 'string') {
    return res.status(400).json({ error: 'Configuration key is required' });
  }
  
  // Prevent deletion of critical configurations
  const protectedKeys = ['DATABASE_URL', 'MCP_SERVER_PORT', 'OPENAI_API_KEY'];
  if (protectedKeys.includes(key)) {
    return res.status(403).json({ 
      error: 'Cannot delete protected configuration',
      protected: protectedKeys
    });
  }
  
  const originalLength = configurations.length;
  configurations = configurations.filter(config => config.key !== key);
  
  if (configurations.length === originalLength) {
    return res.status(404).json({ error: 'Configuration not found' });
  }
  
  res.status(200).json({ message: 'Configuration deleted successfully' });
}