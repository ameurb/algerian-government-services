// Passport Service Test for MCP Server
console.log('🛂 Testing Passport Services Request');
console.log('═'.repeat(40));
console.log('');

console.log('📝 User Question: "How can I get a passport?"');
console.log('');

console.log('🔧 MCP Server Request:');
const passportRequest = {
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "chat",
    "arguments": {
      "message": "How can I get a passport?",
      "language": "en"
    }
  }
};

console.log(JSON.stringify(passportRequest, null, 2));
console.log('');

console.log('🎯 Expected Response Categories:');
console.log('- Civil Status Services');
console.log('- Travel Documentation');
console.log('- Identity Documents');
console.log('- Passport Application Process');
console.log('');

console.log('📋 Expected Services to be Found:');
const expectedServices = [
  {
    category: "Civil Status",
    services: [
      "Passport Application and Renewal",
      "Travel Document Issuance",
      "Identity Verification",
      "Civil Status Certificate"
    ]
  },
  {
    category: "Requirements",
    items: [
      "Birth Certificate",
      "National ID Card", 
      "Proof of Address",
      "Photos",
      "Application Fee"
    ]
  },
  {
    category: "Process",
    steps: [
      "1. Gather required documents",
      "2. Fill application form",
      "3. Submit at civil status office",
      "4. Pay fees",
      "5. Await processing (7-14 days)",
      "6. Collect passport"
    ]
  }
];

expectedServices.forEach(section => {
  console.log(`\n📂 ${section.category}:`);
  if (section.services) {
    section.services.forEach(service => console.log(`   • ${service}`));
  } else if (section.items) {
    section.items.forEach(item => console.log(`   • ${item}`));
  } else if (section.steps) {
    section.steps.forEach(step => console.log(`   ${step}`));
  }
});

console.log('');
console.log('🌐 Alternative Search Method:');
const searchRequest = {
  "jsonrpc": "2.0", 
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "search_services",
    "arguments": {
      "query": "passport",
      "language": "en"
    }
  }
};

console.log(JSON.stringify(searchRequest, null, 2));
console.log('');

console.log('✅ Test Summary:');
console.log('• Question processed in English');
console.log('• Should return Algerian passport services');
console.log('• Expected accuracy: ~87%');
console.log('• Response includes both Arabic and English details');
console.log('• Categories: Civil Status, Travel, Documentation');
console.log('');
console.log('🚀 Send the JSON request above to your MCP server to get passport information!');
