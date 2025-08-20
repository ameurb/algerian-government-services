import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export class MCPStdioClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;

  async connect() {
    try {
      console.log('[MCP-STDIO-CLIENT] Starting MCP stdio server...');
      
      // Start the MCP stdio server process
      const serverProcess = spawn('npx', ['tsx', 'lib/mcp-stdio-server.ts'], {
        stdio: ['pipe', 'pipe', 'inherit'],
        cwd: process.cwd()
      });

      // Create stdio transport
      this.transport = new StdioClientTransport({
        reader: serverProcess.stdout!,
        writer: serverProcess.stdin!,
      } as any);

      // Create client
      this.client = new Client(
        {
          name: 'algerian-government-services-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      // Connect
      await this.client.connect(this.transport);
      console.log('[MCP-STDIO-CLIENT] Connected to MCP stdio server');
      
      return true;
    } catch (error) {
      console.error('[MCP-STDIO-CLIENT] Connection failed:', error);
      return false;
    }
  }

  async searchServices(query: string, category?: string, limit: number = 5) {
    if (!this.client) {
      throw new Error('MCP client not connected');
    }

    console.log('[MCP-STDIO-CLIENT] Searching services:', query);

    try {
      const result = await this.client.callTool({
        name: 'search_services',
        arguments: {
          query,
          category,
          limit
        }
      });

      if (result.content && Array.isArray(result.content) && result.content[0] && (result.content[0] as any).type === 'text') {
        return JSON.parse((result.content[0] as any).text);
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('[MCP-STDIO-CLIENT] Search error:', error);
      throw error;
    }
  }

  async getServiceDetails(serviceId: string) {
    if (!this.client) {
      throw new Error('MCP client not connected');
    }

    try {
      const result = await this.client.callTool({
        name: 'get_service_details',
        arguments: { serviceId }
      });

      if (result.content && Array.isArray(result.content) && result.content[0] && (result.content[0] as any).type === 'text') {
        return JSON.parse((result.content[0] as any).text);
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('[MCP-STDIO-CLIENT] Service details error:', error);
      throw error;
    }
  }

  async getStatistics() {
    if (!this.client) {
      throw new Error('MCP client not connected');
    }

    try {
      const result = await this.client.callTool({
        name: 'get_services_stats',
        arguments: {}
      });

      if (result.content && Array.isArray(result.content) && result.content[0] && (result.content[0] as any).type === 'text') {
        return JSON.parse((result.content[0] as any).text);
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('[MCP-STDIO-CLIENT] Statistics error:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
      }
      if (this.transport) {
        await this.transport.close();
        this.transport = null;
      }
      console.log('[MCP-STDIO-CLIENT] Disconnected');
    } catch (error) {
      console.error('[MCP-STDIO-CLIENT] Disconnect error:', error);
    }
  }
}

// Singleton instance for reuse
let mcpClient: MCPStdioClient | null = null;

export async function getMCPClient(): Promise<MCPStdioClient> {
  if (!mcpClient) {
    mcpClient = new MCPStdioClient();
    const connected = await mcpClient.connect();
    if (!connected) {
      throw new Error('Failed to connect to MCP stdio server');
    }
  }
  return mcpClient;
}