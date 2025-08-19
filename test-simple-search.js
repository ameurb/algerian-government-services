require('dotenv').config();

async function testSimpleSearch() {
  console.log('🧪 Testing Simple Database Search...\n');
  
  try {
    // Import the functions
    const { directDatabaseSearch, formatSearchResponse } = await import('./lib/direct-search.js');
    
    // Test cases with typos and variations
    const testCases = [
      'بطاقة الهوية',       // Exact match
      'بطاقه الهويه',       // With typos
      'بطاقة التعريف',      // Alternative term
      'منح التعليم',       // Education grants
      'منح التعليمم',      // With typo
      'تأسيس شركة',       // Company registration
      'تاسيس شركه',       // With typos
      'ID card',          // English
      'passport',         // English passport
      'جواز السفر'        // Arabic passport
    ];
    
    for (const query of testCases) {
      console.log(`🔍 Testing: "${query}"`);
      
      try {
        const result = await directDatabaseSearch(query, 'test_session');
        console.log(`📊 Found: ${result.count} services`);
        console.log(`🔧 Search terms: ${result.searchTerms.join(', ')}`);
        
        if (result.count > 0) {
          console.log('✅ Services:');
          result.results.slice(0, 2).forEach((service, index) => {
            console.log(`   ${index + 1}. ${service.name} (${service.category})`);
          });
          
          // Test response formatting
          const formattedResponse = formatSearchResponse(result, query);
          console.log(`📝 Response preview: ${formattedResponse.substring(0, 150)}...`);
        } else {
          console.log('❌ No services found');
          const formattedResponse = formatSearchResponse(result, query);
          console.log(`📝 No results response: ${formattedResponse.substring(0, 100)}...`);
        }
        
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
      
      console.log('---\n');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSimpleSearch();