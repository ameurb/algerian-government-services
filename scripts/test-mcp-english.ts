import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

class MCPTestClient {
  private client: Client;
  private transport: StdioClientTransport;

  constructor() {
    this.client = new Client(
      {
        name: 'mcp-test-client',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );
  }

  async connect() {
    try {
      console.log('🔄 Connecting to MCP server...');
      
      // Start the MCP server process
      const serverProcess = spawn('npx', ['tsx', 'scripts/minimal-mcp-server.ts'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'inherit'],
      });

      this.transport = new StdioClientTransport({
        stdin: serverProcess.stdin!,
        stdout: serverProcess.stdout!,
      });

      await this.client.connect(this.transport);
      console.log('✅ Connected to MCP server!');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to MCP server:', error);
      return false;
    }
  }

  async testEnglishQuestions() {
    console.log('\n🧪 Testing English Questions...\n');

    const testQuestions = [
      'Show me education services',
      'How do I get a passport?',
      'What health services are available?',
      'Give me statistics about government services',
      'Find employment services',
      'List all available services'
    ];

    for (const question of testQuestions) {
      try {
        console.log(`\n❓ Question: "${question}"`);
        console.log('─'.repeat(50));

        const response = await this.client.callTool({
          name: 'chat_assistant',
          arguments: {
            message: question,
            language: 'en'
          }
        });

        if (response.content) {
          response.content.forEach((content, index) => {
            if (content.type === 'text') {
              console.log(`💬 Response: ${content.text}`);
            }
          });
        }

        // Small delay between questions
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Error testing question "${question}":`, error);
      }
    }
  }

  async testServiceSearch() {
    console.log('\n🔍 Testing Service Search...\n');

    try {
      const searchResponse = await this.client.callTool({
        name: 'search_services',
        arguments: {
          query: 'education',
          language: 'en'
        }
      });

      console.log('🔍 Search Results for "education":');
      if (searchResponse.content) {
        searchResponse.content.forEach(content => {
          if (content.type === 'text') {
            console.log(content.text);
          }
        });
      }

    } catch (error) {
      console.error('❌ Error testing service search:', error);
    }
  }

  async testStatistics() {
    console.log('\n📊 Testing Statistics...\n');

    try {
      const statsResponse = await this.client.callTool({
        name: 'get_statistics',
        arguments: {}
      });

      console.log('📊 Government Services Statistics:');
      if (statsResponse.content) {
        statsResponse.content.forEach(content => {
          if (content.type === 'text') {
            console.log(content.text);
          }
        });
      }

    } catch (error) {
      console.error('❌ Error testing statistics:', error);
    }
  }

  async disconnect() {
    try {
      await this.client.close();
      console.log('\n✅ Disconnected from MCP server');
    } catch (error) {
      console.error('❌ Error disconnecting:', error);
    }
  }
}

async function runTests() {
  const client = new MCPTestClient();
  
  console.log('🧪 MCP Server English Question Testing');
  console.log('═'.repeat(50));

  const connected = await client.connect();
  if (!connected) {
    console.log('❌ Could not connect to MCP server. Exiting...');
    return;
  }

  try {
    await client.testEnglishQuestions();
    await client.testServiceSearch();
    await client.testStatistics();
  } catch (error) {
    console.error('❌ Test execution error:', error);
  } finally {
    await client.disconnect();
  }

  console.log('\n🎉 Testing completed!');
}

// Run the tests
runTests().catch(console.error);
