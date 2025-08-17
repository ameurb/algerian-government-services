// Test available endpoints
const fetch = require('node-fetch').default || require('node-fetch');

async function testEndpoints() {
  const baseUrl = 'http://localhost:8081';
  const apiKey = 'dz_live_demo123';

  console.log('🔍 Testing MCP Server Endpoints...\n');

  // Test health
  try {
    const response = await fetch(`${baseUrl}/health`);
    const data = await response.json();
    console.log('✅ Health:', response.status, data);
  } catch (error) {
    console.log('❌ Health failed:', error.message);
  }

  // Test tools
  try {
    const response = await fetch(`${baseUrl}/tools`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const data = await response.json();
    console.log('✅ Tools:', response.status, data);
  } catch (error) {
    console.log('❌ Tools failed:', error.message);
  }

  // Test search
  try {
    const response = await fetch(`${baseUrl}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ query: 'passport', limit: 2 })
    });
    const data = await response.json();
    console.log('✅ Search:', response.status, `Found ${data.count} results`);
  } catch (error) {
    console.log('❌ Search failed:', error.message);
  }

  // Test streaming search
  try {
    const response = await fetch(`${baseUrl}/stream/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({ query: 'passport', chunkSize: 1 })
    });
    console.log('✅ Stream Search:', response.status, response.headers.get('content-type'));
  } catch (error) {
    console.log('❌ Stream Search failed:', error.message);
  }

  // Test stats
  try {
    const response = await fetch(`${baseUrl}/stats`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const data = await response.json();
    console.log('✅ Stats:', response.status, `Total: ${data.total}`);
  } catch (error) {
    console.log('❌ Stats failed:', error.message);
  }
}

testEndpoints();