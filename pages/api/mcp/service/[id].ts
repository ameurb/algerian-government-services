import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Valid service ID is required' });
    }

    // Proxy request to HTTP MCP server
    const mcpResponse = await fetch(`http://localhost:8081/service/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.MCP_API_KEY}`,
      },
    });

    if (!mcpResponse.ok) {
      if (mcpResponse.status === 404) {
        return res.status(404).json({ error: 'Service not found' });
      }
      throw new Error(`MCP server error: ${mcpResponse.status}`);
    }

    const data = await mcpResponse.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('MCP service API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}