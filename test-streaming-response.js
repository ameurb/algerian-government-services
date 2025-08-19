const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testStreamingResponse() {
  const baseUrl = 'https://dzservices.findapply.com';
  
  console.log('🌊 Testing AI streaming response...\n');
  
  try {
    const response = await fetch(`${baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'بطاقة الهوية',
        sessionId: `test_${Date.now()}`,
        userId: null
      })
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.status === 200 && response.body) {
      console.log('\n📡 Streaming response:');
      console.log('===================================');
      
      const decoder = new TextDecoder();
      const reader = response.body.getReader();
      let fullResponse = '';
      let eventCount = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        eventCount++;
        
        // Parse and display events
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'text_chunk' && data.text) {
                console.log(`💬 AI Response: ${data.text.substring(0, 200)}...`);
              } else if (data.type === 'response_complete') {
                console.log(`✅ Response complete: ${data.content?.substring(0, 300)}...`);
                console.log(`📊 Metadata:`, data.metadata);
                return; // Exit after complete response
              } else if (data.type === 'processing_stage') {
                console.log(`⚙️ Stage: ${data.message} (${data.progress}%)`);
              }
            } catch (e) {
              // Ignore malformed JSON
            }
          }
        }
        
        // Prevent infinite loop
        if (eventCount > 100) {
          console.log('⚠️ Stopping after 100 events');
          break;
        }
      }
      
      console.log('===================================');
      console.log(`📈 Total events received: ${eventCount}`);
      
    } else {
      console.log('❌ Failed to get streaming response');
      const errorText = await response.text();
      console.log(`Error: ${errorText.substring(0, 500)}`);
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
}

testStreamingResponse();