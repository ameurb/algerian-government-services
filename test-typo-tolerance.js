require('dotenv').config();

async function testTypoTolerance() {
  console.log('🧪 Testing AI Semantic Search with Typos...\n');
  
  // Import the AI semantic search
  const { AISemanticSearch } = await import('./lib/ai-semantic-search.js');
  
  // Test queries with various typos and misspellings
  const testCases = [
    {
      query: 'بطاقه الهويه',
      expected: 'should find ID card services despite typos'
    },
    {
      query: 'منح التعليمم',
      expected: 'should find education grants despite extra letter'
    },
    {
      query: 'تاسيس شركه',
      expected: 'should find company registration despite missing ء'
    },
    {
      query: 'رخصت سياقه',
      expected: 'should find driving license despite typos'
    },
    {
      query: 'جواز سفر',
      expected: 'should find passport services with simplified spelling'
    },
    {
      query: 'شهاده ميلاد',
      expected: 'should find birth certificate despite ه instead of ة'
    },
    {
      query: 'iid card',
      expected: 'should handle English typos (double i)'
    },
    {
      query: 'educatin grants',
      expected: 'should handle English typos (missing o)'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`🔍 Testing: "${testCase.query}"`);
    console.log(`📝 Expected: ${testCase.expected}`);
    
    try {
      const startTime = Date.now();
      const result = await AISemanticSearch.searchWithAI(testCase.query);
      const duration = Date.now() - startTime;
      
      console.log(`⏱️ Duration: ${duration}ms`);
      console.log(`🎯 Intent detected: ${result.intent?.intent || 'unknown'}`);
      console.log(`📂 Category: ${result.intent?.category || 'unknown'}`);
      console.log(`🔧 Corrected query: ${result.intent?.corrected_query || 'none'}`);
      console.log(`📊 Services found: ${result.count}`);
      
      if (result.count > 0) {
        console.log('✅ Services:');
        result.results.slice(0, 2).forEach((service, index) => {
          console.log(`   ${index + 1}. ${service.name} (${service.category}) - Similarity: ${service.similarity?.toFixed(2) || 'N/A'}`);
        });
      } else {
        console.log('❌ No services found');
      }
      
      console.log('---\n');
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log('---\n');
    }
    
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🏁 Typo tolerance testing completed!');
}

testTypoTolerance().catch(console.error);