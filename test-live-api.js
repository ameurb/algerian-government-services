const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testLiveAPI() {
  const baseUrl = 'https://dzservices.findapply.com';
  
  console.log('🧪 Testing live AI chat API...\n');
  
  // Test queries to verify AI functionality
  const testQueries = [
    'بطاقة الهوية',
    'منح التعليم', 
    'تأسيس شركة'
  ];
  
  for (const query of testQueries) {
    console.log(`🔍 Testing query: "${query}"`);
    
    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          sessionId: `test_${Date.now()}`,
          userId: null
        }),
        timeout: 15000
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Response status: ${response.status}`);
        console.log(`📝 Response preview: ${data.response?.substring(0, 200)}...`);
        console.log(`🔧 Services found: ${data.metadata?.servicesFound || 'unknown'}`);
        console.log('---');
      } else {
        console.log(`❌ API Error: ${response.status} - ${response.statusText}`);
        const errorText = await response.text();
        console.log(`Error details: ${errorText.substring(0, 200)}`);
        console.log('---');
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
      console.log('---');
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Test the streaming API specifically
  console.log('\n🌊 Testing streaming API...');
  try {
    const streamResponse = await fetch(`${baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'بطاقة الهوية',
        sessionId: `stream_test_${Date.now()}`,
        userId: null
      }),
      timeout: 10000
    });
    
    console.log(`Streaming API status: ${streamResponse.status}`);
    if (streamResponse.status === 200) {
      console.log('✅ Streaming API is responding');
      console.log(`Content-Type: ${streamResponse.headers.get('content-type')}`);
    } else {
      console.log('❌ Streaming API error');
      const errorText = await streamResponse.text();
      console.log(`Error: ${errorText.substring(0, 200)}`);
    }
    
  } catch (error) {
    console.log(`❌ Streaming API failed: ${error.message}`);
  }
  
  console.log('\n🏁 Live API testing completed!');
}

testLiveAPI().catch(console.error);