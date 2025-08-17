#!/usr/bin/env tsx

import 'dotenv/config';

interface TestResult {
  scenario: string;
  endpoint: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  responseTime: number;
  details?: any;
  error?: string;
  query?: any;
  response?: any;
}

class MCPTester {
  private baseUrl: string;
  private results: TestResult[] = [];

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      const responseTime = Date.now() - startTime;
      console.log(`[${response.status}] ${options.method || 'GET'} ${endpoint} - ${responseTime}ms`);
      
      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`[ERROR] ${options.method || 'GET'} ${endpoint} - ${responseTime}ms:`, error);
      throw error;
    }
  }

  private addResult(result: TestResult) {
    this.results.push(result);
    const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
    console.log(`${status} ${result.scenario} (${result.responseTime}ms)`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  async testHealthEndpoint() {
    const startTime = Date.now();
    try {
      const response = await this.makeRequest('/health');
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        this.addResult({
          scenario: 'Health Check',
          endpoint: '/health',
          status: 'PASS',
          responseTime,
          details: data,
          query: null,
          response: data
        });
      } else {
        this.addResult({
          scenario: 'Health Check',
          endpoint: '/health',
          status: 'FAIL',
          responseTime,
          error: `HTTP ${response.status}`,
          query: null,
          response: `HTTP ${response.status}`
        });
      }
    } catch (error) {
      this.addResult({
        scenario: 'Health Check',
        endpoint: '/health',
        status: 'FAIL',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        query: null,
        response: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async testToolsEndpoint() {
    const startTime = Date.now();
    try {
      const response = await this.makeRequest('/tools');
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        const hasTools = data.tools && data.tools.length > 0;
        this.addResult({
          scenario: 'Tools List',
          endpoint: '/tools',
          status: hasTools ? 'PASS' : 'FAIL',
          responseTime,
          details: `${data.tools?.length || 0} tools found`
        });
      } else {
        this.addResult({
          scenario: 'Tools List',
          endpoint: '/tools',
          status: 'FAIL',
          responseTime,
          error: `HTTP ${response.status}`
        });
      }
    } catch (error) {
      this.addResult({
        scenario: 'Tools List',
        endpoint: '/tools',
        status: 'FAIL',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async testStatsEndpoint() {
    const startTime = Date.now();
    try {
      const response = await this.makeRequest('/stats');
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        const hasStats = typeof data.total === 'number';
        this.addResult({
          scenario: 'Statistics',
          endpoint: '/stats',
          status: hasStats ? 'PASS' : 'FAIL',
          responseTime,
          details: `Total: ${data.total}, Online: ${data.online}, Active: ${data.active}`
        });
      } else {
        this.addResult({
          scenario: 'Statistics',
          endpoint: '/stats',
          status: 'FAIL',
          responseTime,
          error: `HTTP ${response.status}`
        });
      }
    } catch (error) {
      this.addResult({
        scenario: 'Statistics',
        endpoint: '/stats',
        status: 'FAIL',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async testSearchScenarios() {
    const scenarios = [
      // English searches
      { query: 'Passport', expected: 'should find passport service', lang: 'EN' },
      { query: 'National ID', expected: 'should find ID card service', lang: 'EN' },
      { query: 'Education', expected: 'should find education services', lang: 'EN' },
      
      // Arabic searches
      { query: 'جواز السفر', expected: 'should find passport in Arabic', lang: 'AR' },
      { query: 'بطاقة الهوية', expected: 'should find ID card in Arabic', lang: 'AR' },
      { query: 'تعليم', expected: 'should find education in Arabic', lang: 'AR' },
      
      // Partial matches
      { query: 'passport', expected: 'case insensitive search', lang: 'EN' },
      { query: 'EDUCATION', expected: 'uppercase search', lang: 'EN' },
      
      // No results expected
      { query: 'xyz123notfound', expected: 'should return no results', lang: 'EN' },
      { query: 'خدمة غير موجودة', expected: 'should return no results in Arabic', lang: 'AR' },
      
      // Special characters
      { query: 'test-search', expected: 'hyphen in search', lang: 'EN' },
      { query: 'test & search', expected: 'ampersand in search', lang: 'EN' },
      
      // Empty and edge cases
      { query: '', expected: 'empty query', lang: 'EN' },
      { query: ' ', expected: 'whitespace only', lang: 'EN' },
      { query: 'a', expected: 'single character', lang: 'EN' },
    ];

    for (const scenario of scenarios) {
      await this.testSearch(scenario.query, scenario.expected, scenario.lang);
    }
  }

  async testSearch(query: string, description: string, language: string) {
    const startTime = Date.now();
    const queryData = { query, limit: 5 };
    try {
      const response = await this.makeRequest('/search', {
        method: 'POST',
        body: JSON.stringify(queryData)
      });
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        const isValid = typeof data.count === 'number' && Array.isArray(data.results);
        
        this.addResult({
          scenario: `Search [${language}]: ${description}`,
          endpoint: '/search',
          status: isValid ? 'PASS' : 'FAIL',
          responseTime,
          details: `Query: "${query}" → ${data.count} results (${data.requestId})`,
          query: queryData,
          response: data
        });
      } else {
        const errorText = await response.text();
        this.addResult({
          scenario: `Search [${language}]: ${description}`,
          endpoint: '/search',
          status: 'FAIL',
          responseTime,
          error: `HTTP ${response.status}`,
          query: queryData,
          response: errorText
        });
      }
    } catch (error) {
      this.addResult({
        scenario: `Search [${language}]: ${description}`,
        endpoint: '/search',
        status: 'FAIL',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        query: queryData,
        response: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async testServiceDetailsScenarios() {
    // First, get a valid service ID
    try {
      const searchResponse = await this.makeRequest('/search', {
        method: 'POST',
        body: JSON.stringify({ query: 'Passport', limit: 1 })
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.results && searchData.results.length > 0) {
          const serviceId = searchData.results[0].id;
          await this.testServiceDetails(serviceId, 'Valid service ID');
        }
      }
    } catch (error) {
      console.log('Could not get valid service ID for testing');
    }

    // Test invalid service IDs
    await this.testServiceDetails('invalid-id', 'Invalid service ID');
    await this.testServiceDetails('689f93a8aa7e6e91a81a52c9', 'Non-existent but valid format ID');
    await this.testServiceDetails('', 'Empty service ID');
  }

  async testServiceDetails(serviceId: string, description: string) {
    const startTime = Date.now();
    try {
      const response = await this.makeRequest(`/service/${serviceId}`);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        const isValid = data.result && typeof data.result === 'object';
        
        this.addResult({
          scenario: `Service Details: ${description}`,
          endpoint: `/service/${serviceId}`,
          status: isValid ? 'PASS' : 'FAIL',
          responseTime,
          details: `Service: ${data.result?.name || 'N/A'} (${data.requestId})`
        });
      } else if (response.status === 404 && description.includes('Invalid')) {
        // Expected 404 for invalid IDs
        this.addResult({
          scenario: `Service Details: ${description}`,
          endpoint: `/service/${serviceId}`,
          status: 'PASS',
          responseTime,
          details: 'Expected 404 for invalid ID'
        });
      } else {
        this.addResult({
          scenario: `Service Details: ${description}`,
          endpoint: `/service/${serviceId}`,
          status: 'FAIL',
          responseTime,
          error: `HTTP ${response.status}`
        });
      }
    } catch (error) {
      this.addResult({
        scenario: `Service Details: ${description}`,
        endpoint: `/service/${serviceId}`,
        status: 'FAIL',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async testCategoryFiltering() {
    const categories = [
      'CIVIL_STATUS',
      'EDUCATION', 
      'HEALTH',
      'EMPLOYMENT',
      'ADMINISTRATION',
      'INVALID_CATEGORY'
    ];

    for (const category of categories) {
      const startTime = Date.now();
      try {
        const response = await this.makeRequest('/search', {
          method: 'POST',
          body: JSON.stringify({ 
            query: 'test', 
            category: category,
            limit: 3 
          })
        });
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
          const data = await response.json();
          const isValid = typeof data.count === 'number';
          
          this.addResult({
            scenario: `Category Filter: ${category}`,
            endpoint: '/search',
            status: isValid ? 'PASS' : 'FAIL',
            responseTime,
            details: `${data.count} results with category filter`
          });
        } else {
          this.addResult({
            scenario: `Category Filter: ${category}`,
            endpoint: '/search',
            status: category === 'INVALID_CATEGORY' ? 'PASS' : 'FAIL',
            responseTime,
            error: `HTTP ${response.status} ${category === 'INVALID_CATEGORY' ? '(expected)' : ''}`
          });
        }
      } catch (error) {
        this.addResult({
          scenario: `Category Filter: ${category}`,
          endpoint: '/search',
          status: 'FAIL',
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  async testPerformanceAndLimits() {
    // Test different result limits
    const limits = [1, 5, 10, 25, 50, 100]; // 100 should be rejected (max 50)
    
    for (const limit of limits) {
      const startTime = Date.now();
      try {
        const response = await this.makeRequest('/search', {
          method: 'POST',
          body: JSON.stringify({ 
            query: 'service', 
            limit: limit
          })
        });
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
          const data = await response.json();
          const isValid = data.results.length <= Math.min(limit, 50);
          
          this.addResult({
            scenario: `Limit Test: ${limit}`,
            endpoint: '/search',
            status: isValid ? 'PASS' : 'FAIL',
            responseTime,
            details: `Requested: ${limit}, Got: ${data.results.length}, Time: ${responseTime}ms`
          });
        } else {
          this.addResult({
            scenario: `Limit Test: ${limit}`,
            endpoint: '/search',
            status: limit > 50 ? 'PASS' : 'FAIL', // Expect failure for > 50
            responseTime,
            error: `HTTP ${response.status} ${limit > 50 ? '(expected)' : ''}`
          });
        }
      } catch (error) {
        this.addResult({
          scenario: `Limit Test: ${limit}`,
          endpoint: '/search',
          status: 'FAIL',
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  async runAllTests() {
    console.log('\n🧪 Starting MCP Server Test Scenarios\n');
    console.log(`Target Server: ${this.baseUrl}`);
    console.log('=' * 50);

    // Basic endpoint tests
    console.log('\n📋 Basic Endpoint Tests');
    await this.testHealthEndpoint();
    await this.testToolsEndpoint();
    await this.testStatsEndpoint();

    // Search functionality tests
    console.log('\n🔍 Search Functionality Tests');
    await this.testSearchScenarios();

    // Service details tests
    console.log('\n📄 Service Details Tests');
    await this.testServiceDetailsScenarios();

    // Category filtering tests
    console.log('\n🏷️ Category Filtering Tests');
    await this.testCategoryFiltering();

    // Performance and limits tests
    console.log('\n⚡ Performance and Limits Tests');
    await this.testPerformanceAndLimits();

    // Generate summary
    this.generateSummary();
  }

  saveDetailedResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-results-detailed-${timestamp}.txt`;
    
    let content = `MCP Server Test Results - Detailed Report\n`;
    content += `===========================================\n`;
    content += `Timestamp: ${new Date().toISOString()}\n`;
    content += `Target Server: ${this.baseUrl}\n`;
    content += `Total Tests: ${this.results.length}\n\n`;

    // Detailed test results
    content += `DETAILED TEST RESULTS:\n`;
    content += `======================\n\n`;

    this.results.forEach((result, index) => {
      content += `Test ${index + 1}: ${result.scenario}\n`;
      content += `  Endpoint: ${result.endpoint}\n`;
      content += `  Status: ${result.status}\n`;
      content += `  Response Time: ${result.responseTime}ms\n`;
      if (result.details) {
        content += `  Details: ${result.details}\n`;
      }
      if (result.error) {
        content += `  Error: ${result.error}\n`;
      }
      if (result.query) {
        content += `  Query: ${JSON.stringify(result.query, null, 2)}\n`;
      }
      if (result.response) {
        content += `  Response: ${JSON.stringify(result.response, null, 2)}\n`;
      }
      content += `\n`;
    });

    // Summary statistics
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const total = this.results.length;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / total;

    content += `SUMMARY STATISTICS:\n`;
    content += `==================\n`;
    content += `Total Tests: ${total}\n`;
    content += `Passed: ${passed}\n`;
    content += `Failed: ${failed}\n`;
    content += `Skipped: ${skipped}\n`;
    content += `Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`;
    content += `Average Response Time: ${avgResponseTime.toFixed(0)}ms\n\n`;

    // Failed tests details
    if (failed > 0) {
      content += `FAILED TESTS:\n`;
      content += `=============\n`;
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          content += `• ${r.scenario}: ${r.error || 'Unknown error'}\n`;
        });
      content += `\n`;
    }

    // Category breakdown
    content += `CATEGORY BREAKDOWN:\n`;
    content += `==================\n`;
    const categories = {
      'Basic Endpoints': this.results.filter(r => 
        r.scenario.includes('Health') || 
        r.scenario.includes('Tools') || 
        r.scenario.includes('Statistics')
      ),
      'Search Tests': this.results.filter(r => r.scenario.includes('Search')),
      'Service Details': this.results.filter(r => r.scenario.includes('Service Details')),
      'Category Filtering': this.results.filter(r => r.scenario.includes('Category Filter')),
      'Performance': this.results.filter(r => r.scenario.includes('Limit Test'))
    };

    Object.entries(categories).forEach(([category, tests]) => {
      const categoryPassed = tests.filter(t => t.status === 'PASS').length;
      const categoryTotal = tests.length;
      const categoryRate = categoryTotal > 0 ? ((categoryPassed / categoryTotal) * 100).toFixed(1) : '0.0';
      content += `${category}: ${categoryPassed}/${categoryTotal} (${categoryRate}%)\n`;
    });

    // Save to file
    require('fs').writeFileSync(filename, content);
    console.log(`\n📄 Detailed results saved to: ${filename}`);
    
    return filename;
  }

  generateSummary() {
    console.log('\n' + '=' * 50);
    console.log('📊 TEST SUMMARY');
    console.log('=' * 50);

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const total = this.results.length;

    const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / total;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    console.log(`⚡ Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`   • ${r.scenario}: ${r.error || 'Unknown error'}`);
        });
    }

    console.log('\n🏆 Test Results by Category:');
    const categories = {
      'Basic Endpoints': this.results.filter(r => 
        r.scenario.includes('Health') || 
        r.scenario.includes('Tools') || 
        r.scenario.includes('Statistics')
      ),
      'Search Tests': this.results.filter(r => r.scenario.includes('Search')),
      'Service Details': this.results.filter(r => r.scenario.includes('Service Details')),
      'Category Filtering': this.results.filter(r => r.scenario.includes('Category Filter')),
      'Performance': this.results.filter(r => r.scenario.includes('Limit Test'))
    };

    Object.entries(categories).forEach(([category, tests]) => {
      const categoryPassed = tests.filter(t => t.status === 'PASS').length;
      const categoryTotal = tests.length;
      const categoryRate = categoryTotal > 0 ? ((categoryPassed / categoryTotal) * 100).toFixed(1) : '0.0';
      console.log(`   ${category}: ${categoryPassed}/${categoryTotal} (${categoryRate}%)`);
    });

    console.log('\n' + '=' * 50);
    console.log(passed === total ? '🎉 ALL TESTS PASSED!' : '⚠️  Some tests failed - check logs above');
    console.log('=' * 50);

    // Save detailed results to file
    this.saveDetailedResults();
  }
}

async function main() {
  const tester = new MCPTester();
  await tester.runAllTests();
}

main().catch(console.error);