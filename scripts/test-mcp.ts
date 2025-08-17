#!/usr/bin/env tsx

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function testMCP() {
  console.log('🚀 Testing MCP Server directly...');

  // Spawn the server process
  const serverProcess = spawn('npx', ['tsx', 'scripts/mcp-server.ts'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'inherit'],
    shell: true, // Important for Windows
  });

  // Create transport
  const transport = new StdioClientTransport({
    reader: serverProcess.stdout!,
    writer: serverProcess.stdin!,
  });

  const client = new Client(
    { name: 'test-client', version: '1.0.0' },
    { capabilities: {} }
  );

  try {
    console.log('🔌 Connecting...');
    await client.connect(transport);
    console.log('✅ Connected!');

    // Test tools
    const tools = await client.listTools();
    console.log(`📋 Found ${tools.tools.length} tools:`);
    tools.tools.forEach(tool => {
      console.log(`  • ${tool.name}`);
    });

    // Test a simple call
    const result = await client.callTool({
      name: 'get_statistics',
      arguments: {}
    });

    console.log('📊 Stats result:', result);

    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    serverProcess.kill();
    await client.close();
  }
}

testMCP().catch(console.error);
