// 🇩🇿 Algerian Government Services API - TypeScript SDK Example
// Type-safe integration for TypeScript/JavaScript projects

interface APIConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

interface SearchRequest {
  query: string;
  category?: ServiceCategory;
  limit?: number;
}

interface ServiceResult {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  category: ServiceCategory;
  isOnline: boolean;
  bawabticUrl?: string;
  requirements: string[];
  process: string[];
  fee?: string;
  duration?: string;
  contactInfo?: string;
}

interface SearchResponse {
  requestId: string;
  query: string;
  count: number;
  results: ServiceResult[];
  metadata: {
    queryTime: number;
    timestamp: string;
  };
}

interface ServiceDetailsResponse {
  requestId: string;
  result: ServiceResult;
}

interface StatsResponse {
  requestId: string;
  total: number;
  online: number;
  active: number;
  byCategory: Array<{
    category: ServiceCategory;
    count: number;
  }>;
  metadata: {
    queryTime: number;
    timestamp: string;
  };
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'offline';
  timestamp: string;
  server: string;
  version: string;
  database?: string;
  uptime?: number;
}

type ServiceCategory = 
  | 'CIVIL_STATUS'
  | 'ADMINISTRATION'
  | 'BUSINESS'
  | 'EMPLOYMENT'
  | 'EDUCATION'
  | 'HEALTH'
  | 'HOUSING'
  | 'TRANSPORTATION'
  | 'TECHNOLOGY'
  | 'SOCIAL_SECURITY';

class AlgerianServicesAPI {
  private config: Required<APIConfig>;

  constructor(config: APIConfig) {
    this.config = {
      baseUrl: 'https://api.findapply.com:8081',
      timeout: 30000,
      ...config
    };
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          `API Error ${response.status}: ${errorData.message || response.statusText}`,
          response.status,
          errorData
        );
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(`Network Error: ${error.message}`, 0, { originalError: error });
    }
  }

  /**
   * Search for government services
   */
  async searchServices(request: SearchRequest): Promise<SearchResponse> {
    return await this.makeRequest<SearchResponse>('/search', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * Get detailed service information
   */
  async getServiceDetails(serviceId: string): Promise<ServiceDetailsResponse> {
    return await this.makeRequest<ServiceDetailsResponse>(`/service/${serviceId}`);
  }

  /**
   * Get system statistics
   */
  async getStatistics(): Promise<StatsResponse> {
    return await this.makeRequest<StatsResponse>('/stats');
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<HealthResponse> {
    return await this.makeRequest<HealthResponse>('/health');
  }

  /**
   * Get available tools
   */
  async getTools(): Promise<any> {
    return await this.makeRequest('/tools');
  }

  /**
   * Batch search multiple queries
   */
  async batchSearch(queries: SearchRequest[]): Promise<SearchResponse[]> {
    const promises = queries.map(query => this.searchServices(query));
    return await Promise.all(promises);
  }

  /**
   * Search and get details for first result
   */
  async searchAndGetDetails(query: string, category?: ServiceCategory): Promise<ServiceResult | null> {
    const searchResult = await this.searchServices({ query, category, limit: 1 });
    
    if (searchResult.results.length === 0) {
      return null;
    }

    const details = await this.getServiceDetails(searchResult.results[0].id);
    return details.result;
  }
}

class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details: any = {}
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Usage Examples
async function examples() {
  const api = new AlgerianServicesAPI({
    apiKey: 'dz_live_demo123', // Demo API key
    baseUrl: 'https://api.findapply.com:8081'
  });

  console.log('🇩🇿 Algerian Government Services API - TypeScript Examples\n');

  try {
    // Example 1: Type-safe search
    const nationalIdSearch: SearchRequest = {
      query: 'National ID',
      category: 'CIVIL_STATUS',
      limit: 5
    };

    const results = await api.searchServices(nationalIdSearch);
    console.log(`🆔 Found ${results.count} National ID services`);

    // Example 2: Batch search with error handling
    const queries: SearchRequest[] = [
      { query: 'Passport', category: 'ADMINISTRATION' },
      { query: 'Company registration', category: 'BUSINESS' },
      { query: 'University scholarship', category: 'EDUCATION' }
    ];

    console.log('\n🔍 Batch searching...');
    const batchResults = await api.batchSearch(queries);
    
    batchResults.forEach((result, index) => {
      console.log(`   ${queries[index].query}: ${result.count} services found`);
    });

    // Example 3: Search and get details in one call
    console.log('\n📋 Getting detailed service information...');
    const detailedService = await api.searchAndGetDetails('Birth certificate');
    
    if (detailedService) {
      console.log(`   Service: ${detailedService.nameEn || detailedService.name}`);
      console.log(`   Fee: ${detailedService.fee || 'Not specified'}`);
      console.log(`   Requirements: ${detailedService.requirements.join(', ')}`);
    } else {
      console.log('   No birth certificate services found');
    }

    // Example 4: Statistics with type safety
    console.log('\n📊 System Statistics...');
    const stats = await api.getStatistics();
    console.log(`   Total: ${stats.total}, Online: ${stats.online}, Active: ${stats.active}`);
    
    stats.byCategory.forEach(category => {
      console.log(`   ${category.category}: ${category.count} services`);
    });

    // Example 5: Health check with type safety
    const health = await api.checkHealth();
    console.log(`\n❤️ API Health: ${health.status}`);
    console.log(`   Server: ${health.server} v${health.version}`);

  } catch (error) {
    if (error instanceof APIError) {
      console.error(`❌ API Error ${error.statusCode}:`, error.message);
      console.error('   Details:', error.details);
    } else {
      console.error('❌ Unexpected Error:', error);
    }
  }
}

// React Hook for TypeScript projects
export function useAlgerianServices(apiKey: string) {
  const [api] = React.useState(() => new AlgerianServicesAPI({ apiKey }));
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const searchServices = async (request: SearchRequest): Promise<SearchResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.searchServices(request);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { searchServices, loading, error, api };
}

// Export for use in other files
export { 
  AlgerianServicesAPI, 
  APIError,
  type SearchRequest, 
  type ServiceResult, 
  type SearchResponse,
  type ServiceCategory
};

// Run examples if this file is executed directly
if (require.main === module) {
  examples();
}