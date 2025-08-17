#!/usr/bin/env tsx

// Use built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;

const MCP_HTTP_URL = 'http://localhost:3333';

console.log('🌐 Youth Portal MCP HTTP Client Test');
console.log('🔗 Testing HTTP-based MCP Server with Streaming');
console.log('==================================================\n');

async function testHealthCheck() {
  console.log('🔍 Testing Health Check...');
  try {
    const response = await fetch(`${MCP_HTTP_URL}/health`);
    const data = await response.json();
    console.log('✅ Health Check:', data);
  } catch (error) {
    console.error('❌ Health Check failed:', error);
  }
  console.log('');
}

async function testMCPTools() {
  console.log('🔧 Testing MCP Tools...');
  try {
    const response = await fetch(`${MCP_HTTP_URL}/mcp/tools`);
    const data = await response.json();
    console.log('✅ Available Tools:');
    data.tools.forEach((tool: any, idx: number) => {
      console.log(`  ${idx + 1}. ${tool.name}`);
      console.log(`     ${tool.description}`);
      console.log(`     Endpoint: ${tool.endpoint}`);
    });
  } catch (error) {
    console.error('❌ Tools test failed:', error);
  }
  console.log('');
}

async function testSearchServices() {
  console.log('🔍 Testing Search Services Tool...');
  try {
    const response = await fetch(`${MCP_HTTP_URL}/mcp/tools/search_services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'جواز', limit: 3 })
    });
    const data = await response.json();
    const result = JSON.parse(data.content[0].text);
    console.log('✅ Search Results:');
    console.log(`   Query: "${result.query}"`);
    console.log(`   Found: ${result.count} services`);
    result.results.forEach((service: any, idx: number) => {
      console.log(`   ${idx + 1}. ${service.name}`);
      console.log(`      English: ${service.nameEn || 'N/A'}`);
      console.log(`      Category: ${service.category}`);
      console.log(`      Online: ${service.isOnline ? '🌐' : '🏢'}`);
    });
  } catch (error) {
    console.error('❌ Search test failed:', error);
  }
  console.log('');
}

async function testGetStats() {
  console.log('📊 Testing Get Stats Tool...');
  try {
    const response = await fetch(`${MCP_HTTP_URL}/mcp/tools/get_statistics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await response.json();
    const stats = JSON.parse(data.content[0].text);
    console.log('✅ Database Statistics:');
    console.log(`   Total Services: ${stats.total}`);
    console.log(`   Online Services: ${stats.online}`);
    console.log(`   Active Services: ${stats.active}`);
    console.log('   Categories:');
    stats.categories.forEach((cat: any) => {
      console.log(`     ${cat.category}: ${cat.count} services`);
    });
  } catch (error) {
    console.error('❌ Stats test failed:', error);
  }
  console.log('');
}

async function testStreamingServices() {
  console.log('🌊 Testing Service Streaming...');
  console.log('   Opening Server-Sent Events stream...');
  
  try {
    const response = await fetch(`${MCP_HTTP_URL}/stream/services?batchSize=3&delay=2000`);
    
    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const eventData = JSON.parse(line.slice(6));
          
          switch (eventData.type) {
            case 'start':
              console.log(`   📡 Starting stream: ${eventData.total} services in ${eventData.batches} batches`);
              break;
            case 'batch':
              console.log(`   📦 Batch ${eventData.batchNumber}/${eventData.totalBatches}:`);
              eventData.services.forEach((service: any, idx: number) => {
                console.log(`      ${idx + 1}. ${service.name} ${service.isOnline ? '🌐' : '🏢'}`);
              });
              break;
            case 'complete':
              console.log(`   ✅ Stream complete! Total: ${eventData.total} services`);
              break;
            case 'error':
              console.log(`   ❌ Stream error: ${eventData.message}`);
              break;
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Streaming test failed:', error);
  }
  console.log('');
}

async function testResources() {
  console.log('📚 Testing MCP Resources...');
  try {
    const response = await fetch(`${MCP_HTTP_URL}/mcp/resources`);
    const data = await response.json();
    console.log('✅ Available Resources:');
    data.resources.forEach((resource: any, idx: number) => {
      console.log(`  ${idx + 1}. ${resource.name}`);
      console.log(`     URI: ${resource.uri}`);
      console.log(`     Endpoint: ${resource.endpoint}`);
    });

    // Test summary resource
    console.log('\n📊 Testing Summary Resource...');
    const summaryResponse = await fetch(`${MCP_HTTP_URL}/mcp/resources/summary`);
    const summaryData = await summaryResponse.json();
    const summary = JSON.parse(summaryData.contents[0].text);
    console.log('✅ Summary:');
    console.log(`   Total: ${summary.total}, Online: ${summary.online}, Offline: ${summary.offline}`);
    
  } catch (error) {
    console.error('❌ Resources test failed:', error);
  }
  console.log('');
}

async function main() {
  await testHealthCheck();
  await testMCPTools();
  await testSearchServices();
  await testGetStats();
  await testResources();
  await testStreamingServices();
  
  console.log('🎉 HTTP MCP Client Test Complete!');
  console.log('==================================================');
  console.log('📡 The HTTP MCP Server is running with:');
  console.log('   • REST API endpoints for all MCP tools');
  console.log('   • Server-Sent Events for real-time streaming');
  console.log('   • CORS enabled for web clients');
  console.log('   • Health monitoring and stats');
  console.log('');
  console.log('🌐 Access the server at: http://localhost:3333');
  console.log('📖 API Documentation: http://localhost:3333/api/docs');
}

main().catch(console.error);
