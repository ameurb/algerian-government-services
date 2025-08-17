import { spawn } from 'child_process';
import { promises as fs } from 'fs';

// Simple test script to interact with the running MCP server
async function testMCPServerWithEnglish() {
  console.log('🧪 Testing MCP Server with English Questions');
  console.log('═'.repeat(50));

  const testQuestions = [
    {
      question: 'Show me education services',
      description: 'Testing education service search'
    },
    {
      question: 'How do I get a passport?',
      description: 'Testing passport information request'
    },
    {
      question: 'What health services are available?',
      description: 'Testing health services inquiry'
    },
    {
      question: 'Give me statistics about government services',
      description: 'Testing statistics request'
    },
    {
      question: 'Find employment services',
      description: 'Testing employment service search'
    }
  ];

  for (let i = 0; i < testQuestions.length; i++) {
    const { question, description } = testQuestions[i];
    
    console.log(`\n${i + 1}. ${description}`);
    console.log(`❓ Question: "${question}"`);
    console.log('─'.repeat(40));
    
    try {
      // Create a simple MCP request
      const mcpRequest = {
        jsonrpc: '2.0',
        id: i + 1,
        method: 'tools/call',
        params: {
          name: 'chat_assistant',
          arguments: {
            message: question,
            language: 'en'
          }
        }
      };

      console.log('📤 MCP Request:', JSON.stringify(mcpRequest, null, 2));
      
      // For now, let's simulate what the response would look like
      console.log('💬 Expected Response: Processing English question about Algerian government services...');
      
      // Add delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error testing question: ${error}`);
    }
  }

  console.log('\n🎯 Test Summary:');
  console.log('✅ Created English test questions');
  console.log('✅ Formatted MCP protocol requests');
  console.log('✅ Ready for live MCP server interaction');
  
  console.log('\n📋 To manually test with the running MCP server:');
  console.log('1. The MCP server is running on stdio');
  console.log('2. Send JSON-RPC requests in the format shown above');
  console.log('3. Available tools: chat_assistant, search_services, get_service_by_id, get_statistics');
}

// Test direct tool calls
async function testDirectToolCalls() {
  console.log('\n🔧 Testing Direct Tool Calls');
  console.log('═'.repeat(30));

  const tools = [
    {
      name: 'search_services',
      args: { query: 'education', language: 'en' },
      description: 'Search for education services'
    },
    {
      name: 'get_statistics',
      args: {},
      description: 'Get service statistics'
    },
    {
      name: 'chat',
      args: { message: 'What passport services are available?', language: 'en' },
      description: 'Chat about passport services'
    }
  ];

  tools.forEach((tool, index) => {
    console.log(`\n${index + 1}. ${tool.description}`);
    console.log(`🔧 Tool: ${tool.name}`);
    console.log(`📝 Arguments:`, JSON.stringify(tool.args, null, 2));
    
    const mcpRequest = {
      jsonrpc: '2.0',
      id: `tool_${index + 1}`,
      method: 'tools/call',
      params: {
        name: tool.name,
        arguments: tool.args
      }
    };
    
    console.log('📤 MCP Request:', JSON.stringify(mcpRequest, null, 2));
  });
}

// Test resource access
async function testResourceAccess() {
  console.log('\n📚 Testing Resource Access');
  console.log('═'.repeat(25));

  const resourceRequest = {
    jsonrpc: '2.0',
    id: 'resource_1',
    method: 'resources/read',
    params: {
      uri: 'services://summary'
    }
  };

  console.log('📋 Testing services summary resource');
  console.log('📤 MCP Request:', JSON.stringify(resourceRequest, null, 2));
}

async function main() {
  console.log('🚀 MCP Server English Testing Suite');
  console.log('Current time:', new Date().toLocaleString());
  console.log('\n');

  await testMCPServerWithEnglish();
  await testDirectToolCalls();
  await testResourceAccess();

  console.log('\n🎉 All tests prepared!');
  console.log('\n💡 To interact with the live MCP server:');
  console.log('   - Copy the JSON-RPC requests shown above');
  console.log('   - Send them to the stdio interface of the running server');
  console.log('   - The server is listening for JSON-RPC 2.0 messages');
}

main().catch(console.error);
