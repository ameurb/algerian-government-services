import fetch from 'node-fetch';

const testChat = async () => {
  console.log('🧪 Testing Chat API with Database Integration');
  console.log('='.repeat(50));

  const baseUrl = 'http://localhost:3000';
  
  const tests = [
    {
      name: 'Arabic Search - Passport',
      message: 'ابحث عن جواز السفر',
      language: 'ar'
    },
    {
      name: 'Arabic Stats Request',
      message: 'اعرض الإحصائيات',
      language: 'ar'
    },
    {
      name: 'English Search - Employment',
      message: 'search for employment services',
      language: 'en'
    },
    {
      name: 'English Stats Request',
      message: 'show statistics',
      language: 'en'
    },
    {
      name: 'Arabic Category Search',
      message: 'ابحث عن خدمات العمل',
      language: 'ar'
    }
  ];

  for (const test of tests) {
    console.log(`\n🔍 Testing: ${test.name}`);
    console.log(`Query: "${test.message}" (${test.language})`);
    
    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: test.message,
          language: test.language
        }),
      });

      if (!response.ok) {
        console.log(`❌ HTTP Error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      console.log(`✅ Response Type: ${data.type}`);
      console.log(`📝 Message: ${data.message}`);
      
      if (data.data) {
        if (Array.isArray(data.data)) {
          console.log(`📊 Found ${data.data.length} services`);
          data.data.slice(0, 2).forEach((service: any, index: number) => {
            console.log(`   ${index + 1}. ${service.name} (${service.category})`);
          });
        } else if (data.data.total !== undefined) {
          console.log(`📈 Statistics - Total: ${data.data.total}, Online: ${data.data.online}, Active: ${data.data.active}`);
        }
      }

    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎉 Chat API testing completed!');
  console.log('\n🌐 Access the chat interface at: http://localhost:3000/chat');
  console.log('💡 You can now interact with your database using natural language!');
};

testChat().catch(console.error);
