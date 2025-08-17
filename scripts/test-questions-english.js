// Simple test for the MCP server with English questions
console.log('🧪 MCP Server English Test Questions');
console.log('═'.repeat(40));

const englishTestQuestions = [
  {
    question: "Show me education services",
    category: "Education",
    expectedResult: "Should return Algerian education services"
  },
  {
    question: "How do I get a passport?",
    category: "Civil Status", 
    expectedResult: "Should return passport-related services"
  },
  {
    question: "What health services are available?",
    category: "Health",
    expectedResult: "Should return available health services"
  },
  {
    question: "Give me statistics about government services",
    category: "Statistics",
    expectedResult: "Should return service counts and categories"
  },
  {
    question: "Find employment services",
    category: "Employment",
    expectedResult: "Should return job and employment related services"
  },
  {
    question: "List business registration services",
    category: "Business",
    expectedResult: "Should return business-related government services"
  }
];

console.log('\n📋 Test Questions Ready:\n');

englishTestQuestions.forEach((test, index) => {
  console.log(`${index + 1}. Question: "${test.question}"`);
  console.log(`   Category: ${test.category}`);
  console.log(`   Expected: ${test.expectedResult}`);
  console.log('');
});

console.log('🔧 MCP Tool Commands to Test:');
console.log('');

console.log('1. Chat Tool:');
console.log('   {"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "chat", "arguments": {"message": "Show me education services", "language": "en"}}}');
console.log('');

console.log('2. Search Services:');
console.log('   {"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "search_services", "arguments": {"query": "passport", "language": "en"}}}');
console.log('');

console.log('3. Get Statistics:');
console.log('   {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "get_stats", "arguments": {}}}');
console.log('');

console.log('4. Get Service by ID:');
console.log('   {"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "get_service_by_id", "arguments": {"id": "SERVICE_ID"}}}');
console.log('');

console.log('5. Read Resources:');
console.log('   {"jsonrpc": "2.0", "id": 5, "method": "resources/read", "params": {"uri": "services://summary"}}');
console.log('');

console.log('✅ Ready to test English questions with the MCP server!');
console.log('💡 The MCP server is running on stdio and accepting JSON-RPC 2.0 requests.');
console.log('📤 Copy and paste the JSON commands above to test different tools.');
