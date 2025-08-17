// 🇩🇿 Algerian Government Services API - JavaScript SDK Example
// Simple integration example for Node.js and browser

class AlgerianServicesAPI {
  constructor(apiKey, baseUrl = 'https://api.findapply.com:8081') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`API Error ${response.status}: ${error.message || response.statusText}`);
    }
    
    return await response.json();
  }

  // Search services
  async search(query, category = null, limit = 10) {
    return await this.request('/search', {
      method: 'POST',
      body: JSON.stringify({ query, category, limit })
    });
  }

  // Get service details
  async getService(serviceId) {
    return await this.request(`/service/${serviceId}`);
  }

  // Get statistics
  async getStats() {
    return await this.request('/stats');
  }

  // Check health
  async health() {
    return await this.request('/health');
  }
}

// Usage Examples
async function examples() {
  const api = new AlgerianServicesAPI('your-api-key-here');

  try {
    console.log('🇩🇿 Algerian Government Services API Examples\n');

    // 1. Search for National ID services
    console.log('1. 🆔 Searching for National ID services...');
    const nationalId = await api.search('National ID', 'CIVIL_STATUS', 3);
    console.log(`   Found ${nationalId.count} services`);
    nationalId.results.forEach((service, i) => {
      console.log(`   ${i+1}. ${service.nameEn || service.name} - ${service.fee || 'Free'}`);
    });

    // 2. Search for business services
    console.log('\n2. 🏢 Searching for business services...');
    const business = await api.search('Company', 'BUSINESS', 3);
    console.log(`   Found ${business.count} services`);
    business.results.forEach((service, i) => {
      console.log(`   ${i+1}. ${service.nameEn || service.name}`);
      if (service.bawabticUrl) {
        console.log(`      Link: ${service.bawabticUrl}`);
      }
    });

    // 3. Search in Arabic
    console.log('\n3. 🔤 Searching in Arabic...');
    const arabic = await api.search('جواز السفر', null, 2);
    console.log(`   Found ${arabic.count} services for passport`);

    // 4. Get detailed service information
    if (nationalId.results.length > 0) {
      console.log('\n4. 📋 Getting detailed service information...');
      const details = await api.getService(nationalId.results[0].id);
      const service = details.result;
      
      console.log(`   Service: ${service.nameEn || service.name}`);
      console.log(`   Category: ${service.category}`);
      console.log(`   Fee: ${service.fee || 'Not specified'}`);
      console.log(`   Requirements: ${service.requirements?.join(', ') || 'None listed'}`);
    }

    // 5. Get system statistics
    console.log('\n5. 📊 System Statistics...');
    const stats = await api.getStats();
    console.log(`   Total Services: ${stats.total}`);
    console.log(`   Online Services: ${stats.online}`);
    console.log('   By Category:');
    stats.byCategory.forEach(cat => {
      console.log(`     • ${cat.category}: ${cat.count} services`);
    });

    // 6. Check API health
    console.log('\n6. ❤️ API Health Check...');
    const health = await api.health();
    console.log(`   Status: ${health.status}`);
    console.log(`   Server: ${health.server} v${health.version}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run examples
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AlgerianServicesAPI };
} else {
  // Browser environment
  window.AlgerianServicesAPI = AlgerianServicesAPI;
}

// Auto-run examples if this file is executed directly
if (require.main === module) {
  examples();
}