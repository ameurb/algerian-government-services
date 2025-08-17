import { z } from 'zod';

export interface MCPSearchResult {
  query: string;
  category?: string;
  count: number;
  results: Array<{
    id: string;
    name: string;
    nameEn?: string;
    description: string;
    category: string;
    isOnline: boolean;
    bawabticUrl?: string;
  }>;
}

export interface MCPServiceDetail {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  category: string;
  requirements?: string[];
  process?: string[];
  fee?: string;
  duration?: string;
  contactInfo?: string;
  isOnline: boolean;
  bawabticUrl?: string;
}

export interface MCPStats {
  total: number;
  online: number;
  active: number;
}

// For now, we'll simulate MCP calls since we can't directly connect to stdio MCP server from browser
// In production, you'd need an HTTP adapter or WebSocket bridge
export class MCPClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/mcp') {
    this.baseUrl = baseUrl;
  }

  async searchServices(query: string, category?: string, limit: number = 10): Promise<MCPSearchResult> {
    const response = await fetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, category, limit }),
    });

    if (!response.ok) {
      throw new Error(`MCP search failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getServiceById(id: string): Promise<MCPServiceDetail | null> {
    const response = await fetch(`${this.baseUrl}/service/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`MCP get service failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getStats(): Promise<MCPStats> {
    const response = await fetch(`${this.baseUrl}/stats`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`MCP get stats failed: ${response.statusText}`);
    }

    return response.json();
  }
}

export const mcpClient = new MCPClient();