const { spawn } = require('child_process');
const path = require('path');

// MCP Server Test with English Questions
console.log('🚀 Testing MCP Server with English Questions');
console.log('═'.repeat(50));

// Test questions in English
const testQuestions = [
  {
    id: 1,
    message: "Show me education services",
    description: "Testing education category recognition"
  },
  {
    id: 2, 
    message: "How do I get a passport?",
    description: "Testing civil status services"
  },
  {
    id: 3,
    message: "What health services are available?", 
    description: "Testing health category services"
  },
  {
    id: 4,
    message: "Find employment services",
    description: "Testing employment category"
  }
];

// Function to create MCP JSON-RPC request
function createMCPRequest(id, toolName, args) {
  return JSON.stringify({
    jsonrpc: "2.0",
    id: id,
    method: "tools/call",
    params: {
      name: toolName,
      arguments: args
    }
  }) + '\n';
}

// Test function
async function testMCPServer() {
  console.log('\n📋 English Test Questions:');
  
  testQuestions.forEach(test => {
    console.log(`\n${test.id}. "${test.message}"`);
    console.log(`   Description: ${test.description}`);
    
    // Show the MCP request format
    const request = createMCPRequest(test.id, "chat", {
      message: test.message,
      language: "en"
    });
    
    console.log(`   MCP Request: ${request.trim()}`);
  });
  
  console.log('\n📊 Additional Tools to Test:');
  
  // Statistics request
  console.log('\n🔢 Get Statistics:');
  const statsRequest = createMCPRequest(5, "get_stats", {});
  console.log(`   Request: ${statsRequest.trim()}`);
  
  // Search services request
  console.log('\n🔍 Search Services:');
  const searchRequest = createMCPRequest(6, "search_services", {
    query: "passport",
    language: "en"
  });
  console.log(`   Request: ${searchRequest.trim()}`);
  
  // Resource request
  console.log('\n📚 Read Resources:');
  const resourceRequest = JSON.stringify({
    jsonrpc: "2.0",
    id: 7,
    method: "resources/read",
    params: {
      uri: "services://summary"
    }
  });
  console.log(`   Request: ${resourceRequest}`);
  
  console.log('\n✅ Test formats ready for MCP server interaction!');
  console.log('💡 The server is running on stdio and accepts these JSON-RPC 2.0 requests.');
}

// Run the test
testMCPServer().catch(console.error);
