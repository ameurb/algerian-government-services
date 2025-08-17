import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Proxy request to HTTP MCP server
    const mcpResponse = await fetch('http://localhost:8081/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MCP_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    if (!mcpResponse.ok) {
      throw new Error(`MCP server error: ${mcpResponse.status}`);
    }

    const data = await mcpResponse.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('MCP search API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}