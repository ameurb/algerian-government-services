# 📡 Algerian Government Services API Documentation

Complete API documentation for integrating with the Algerian Government Services platform at `api.findapply.com`.

## 🌐 Base URLs

```
Production: https://api.findapply.com:8081
Development: http://localhost:8081
Dashboard: https://api.findapply.com/dashboard
```

## 🔑 Authentication

### API Key Authentication
```http
Authorization: Bearer your-api-key-here
Content-Type: application/json
```

### Getting API Keys
Visit the admin dashboard at `https://api.findapply.com/dashboard` to generate API keys with specific permissions.

### Demo API Keys (for testing):
```
mcp_live_demo123    # Full access (all permissions)
mcp_test_456789     # Limited access (search and stats only)
```

## 📡 Available Endpoints

### 1. 🔍 Search Government Services
```http
POST /search
```

**Search for Algerian government services by query, category, or keywords.**

#### Parameters:
```json
{
  "query": "string (required)",
  "category": "string (optional)",
  "limit": "number (optional, default: 10, max: 50)"
}
```

#### Response:
```json
{
  "requestId": "req_1234567890_abc123",
  "query": "National ID",
  "count": 4,
  "results": [
    {
      "id": "68a07ded4df63e86f897b8b1",
      "name": "طلب الحصول على بطاقة التعريف الوطنية البيومترية الإلكترونية",
      "nameEn": "Request for Electronic Biometric National ID Card",
      "description": "تقديم طلب للحصول على بطاقة التعريف الوطنية البيومترية الإلكترونية",
      "category": "CIVIL_STATUS",
      "isOnline": false,
      "bawabticUrl": "https://bawabatic.dz?req=informations&op=detail&id=89",
      "requirements": ["بطاقة التعريف الوطنية", "استمارة الطلب"],
      "process": ["تحضير الوثائق المطلوبة", "ملء استمارة الطلب"],
      "fee": "200 دج",
      "duration": null,
      "contactInfo": "اتصل بالمكتب المختص"
    }
  ],
  "metadata": {
    "queryTime": 15,
    "timestamp": "2025-08-17T00:00:00.000Z"
  }
}
```

### 2. 📋 Get Service Details
```http
GET /service/{serviceId}
```

**Get detailed information about a specific government service.**

#### Response:
```json
{
  "requestId": "get_1234567890_abc123",
  "result": {
    "id": "68a07ded4df63e86f897b8b1",
    "name": "طلب الحصول على بطاقة التعريف الوطنية البيومترية الإلكترونية",
    "nameEn": "Request for Electronic Biometric National ID Card",
    "description": "تقديم طلب للحصول على بطاقة التعريف الوطنية البيومترية الإلكترونية",
    "descriptionEn": "Submit application for electronic biometric national ID card",
    "category": "CIVIL_STATUS",
    "requirements": ["National ID", "Application form", "Required documents"],
    "process": ["Prepare documents", "Fill application", "Submit to office"],
    "fee": "200 دج",
    "duration": "2-3 weeks",
    "contactInfo": "اتصل بالمكتب المختص",
    "bawabticUrl": "https://bawabatic.dz?req=informations&op=detail&id=89",
    "isOnline": false,
    "isActive": true
  }
}
```

### 3. 📊 Get Statistics
```http
GET /stats
```

**Get database and system statistics.**

#### Response:
```json
{
  "requestId": "stats_1234567890_abc123",
  "total": 49,
  "online": 11,
  "active": 49,
  "byCategory": [
    {"category": "CIVIL_STATUS", "count": 11},
    {"category": "BUSINESS", "count": 9},
    {"category": "EMPLOYMENT", "count": 8}
  ],
  "metadata": {
    "queryTime": 5,
    "timestamp": "2025-08-17T00:00:00.000Z"
  }
}
```

### 4. ❤️ Health Check
```http
GET /health
```

**Check API server health and connectivity.**

#### Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-17T00:00:00.000Z",
  "server": "Algerian Youth MCP Server",
  "version": "1.0.0",
  "database": "connected",
  "uptime": 86400
}
```

### 5. 🛠️ Available Tools
```http
GET /tools
```

**Get list of available MCP tools.**

#### Response:
```json
{
  "tools": [
    {
      "name": "search_services",
      "description": "Search for Algerian government services",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": {"type": "string"},
          "category": {"type": "string"},
          "limit": {"type": "number"}
        }
      }
    }
  ]
}
```

## 🌊 Streaming Endpoints

### 6. 📡 Streaming Search
```http
POST /stream/search
```

**Stream search results with real-time progress updates using Server-Sent Events (SSE).**

#### Parameters:
```json
{
  "query": "string (required)",
  "category": "string (optional)",
  "limit": "number (optional, default: 10)",
  "chunkSize": "number (optional, default: 1)"
}
```

#### SSE Response Stream:
```javascript
// Event: metadata
data: {"type":"metadata","requestId":"stream_123","query":"National ID","timestamp":"2025-08-17T00:00:00Z"}

// Event: progress
data: {"type":"progress","message":"Searching database...","progress":25}

// Event: result chunk
data: {"type":"result","chunk":0,"totalChunks":3,"data":[{"id":"123","name":"Service"}],"progress":50}

// Event: completion
data: {"type":"complete","requestId":"stream_123","totalResults":5,"queryTime":150}
```

### 7. 📊 Streaming Statistics
```http
GET /stream/stats
```

**Stream real-time statistics updates every 2 seconds using SSE.**

#### SSE Response Stream:
```javascript
// Real-time stats updates
data: {"type":"stats_update","data":{"total":49,"online":11,"active":49,"byCategory":[...],"timestamp":"2025-08-17T00:00:00Z"}}
```

## 💻 Programming Examples

### JavaScript (Node.js)

```javascript
// Install: npm install node-fetch
const fetch = require('node-fetch');

class AlgerianServicesAPI {
  constructor(apiKey, baseUrl = 'https://api.findapply.com:8081') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Search for government services
  async searchServices(query, category = null, limit = 10) {
    return await this.makeRequest('/search', {
      method: 'POST',
      body: JSON.stringify({ query, category, limit })
    });
  }

  // Get service details by ID
  async getServiceDetails(serviceId) {
    return await this.makeRequest(`/service/${serviceId}`);
  }

  // Get system statistics
  async getStatistics() {
    return await this.makeRequest('/stats');
  }

  // Check API health
  async checkHealth() {
    return await this.makeRequest('/health');
  }
}

// Usage Examples
const api = new AlgerianServicesAPI('your-api-key-here');

async function examples() {
  try {
    // Search for National ID services
    const nationalIdServices = await api.searchServices('National ID', 'CIVIL_STATUS', 5);
    console.log('National ID Services:', nationalIdServices.results.length);

    // Search for business services
    const businessServices = await api.searchServices('Company registration', 'BUSINESS', 3);
    console.log('Business Services:', businessServices.results);

    // Get specific service details
    if (nationalIdServices.results.length > 0) {
      const serviceDetails = await api.getServiceDetails(nationalIdServices.results[0].id);
      console.log('Service Details:', serviceDetails.result);
    }

    // Get system statistics
    const stats = await api.getStatistics();
    console.log('Total Services:', stats.total);
    console.log('Services by Category:', stats.byCategory);

    // Check API health
    const health = await api.checkHealth();
    console.log('API Status:', health.status);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

examples();
```

### Python

```python
# Install: pip install requests
import requests
import json
from typing import Optional, Dict, Any

class AlgerianServicesAPI:
    def __init__(self, api_key: str, base_url: str = "https://api.findapply.com:8081"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        })

    def make_request(self, endpoint: str, method: str = 'GET', data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request to API"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method == 'GET':
                response = self.session.get(url)
            elif method == 'POST':
                response = self.session.post(url, json=data)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            print(f"API Request failed: {e}")
            raise

    def search_services(self, query: str, category: Optional[str] = None, limit: int = 10) -> Dict[str, Any]:
        """Search for government services"""
        data = {'query': query, 'limit': limit}
        if category:
            data['category'] = category
            
        return self.make_request('/search', 'POST', data)

    def get_service_details(self, service_id: str) -> Dict[str, Any]:
        """Get detailed service information"""
        return self.make_request(f'/service/{service_id}')

    def get_statistics(self) -> Dict[str, Any]:
        """Get system statistics"""
        return self.make_request('/stats')

    def check_health(self) -> Dict[str, Any]:
        """Check API health"""
        return self.make_request('/health')

# Usage Examples
def main():
    api = AlgerianServicesAPI('your-api-key-here')
    
    try:
        # Search for passport services
        passport_services = api.search_services('Passport', 'ADMINISTRATION', 5)
        print(f"Found {passport_services['count']} passport services")
        
        # Search for Arabic services
        arabic_services = api.search_services('بطاقة الهوية', 'CIVIL_STATUS', 3)
        print(f"Found {arabic_services['count']} Arabic ID services")
        
        # Get service details
        if passport_services['results']:
            service_id = passport_services['results'][0]['id']
            details = api.get_service_details(service_id)
            print(f"Service: {details['result']['name']}")
            print(f"Requirements: {details['result']['requirements']}")
        
        # Get system statistics
        stats = api.get_statistics()
        print(f"Total services: {stats['total']}")
        print(f"Online services: {stats['online']}")
        
        # Check health
        health = api.check_health()
        print(f"API Status: {health['status']}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
```

### TypeScript

```typescript
// Install: npm install axios @types/node
import axios, { AxiosInstance, AxiosResponse } from 'axios';

interface SearchRequest {
  query: string;
  category?: string;
  limit?: number;
}

interface ServiceResult {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  category: string;
  isOnline: boolean;
  bawabticUrl?: string;
  requirements: string[];
  process: string[];
  fee: string | null;
  duration: string | null;
  contactInfo: string | null;
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
    category: string;
    count: number;
  }>;
  metadata: {
    queryTime: number;
    timestamp: string;
  };
}

interface HealthResponse {
  status: string;
  timestamp: string;
  server: string;
  version: string;
  database?: string;
  uptime?: number;
}

class AlgerianServicesAPI {
  private client: AxiosInstance;

  constructor(apiKey: string, baseUrl: string = 'https://api.findapply.com:8081') {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 30000
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  /**
   * Search for government services
   */
  async searchServices(request: SearchRequest): Promise<SearchResponse> {
    const response: AxiosResponse<SearchResponse> = await this.client.post('/search', request);
    return response.data;
  }

  /**
   * Get detailed service information
   */
  async getServiceDetails(serviceId: string): Promise<ServiceDetailsResponse> {
    const response: AxiosResponse<ServiceDetailsResponse> = await this.client.get(`/service/${serviceId}`);
    return response.data;
  }

  /**
   * Get system statistics
   */
  async getStatistics(): Promise<StatsResponse> {
    const response: AxiosResponse<StatsResponse> = await this.client.get('/stats');
    return response.data;
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<HealthResponse> {
    const response: AxiosResponse<HealthResponse> = await this.client.get('/health');
    return response.data;
  }

  /**
   * Get available MCP tools
   */
  async getTools(): Promise<any> {
    const response = await this.client.get('/tools');
    return response.data;
  }
}

// Usage Examples
async function examples() {
  const api = new AlgerianServicesAPI('your-api-key-here');

  try {
    // Search for different types of services
    const queries = [
      { query: 'National ID', category: 'CIVIL_STATUS' },
      { query: 'Passport', category: 'ADMINISTRATION' },
      { query: 'Company registration', category: 'BUSINESS' },
      { query: 'University scholarship', category: 'EDUCATION' },
      { query: 'Driving license', category: 'TRANSPORTATION' }
    ];

    for (const searchRequest of queries) {
      console.log(`\n🔍 Searching for: ${searchRequest.query}`);
      
      const results = await api.searchServices({
        ...searchRequest,
        limit: 5
      });
      
      console.log(`📊 Found ${results.count} services`);
      
      // Get details for first result
      if (results.results.length > 0) {
        const service = results.results[0];
        console.log(`📋 Service: ${service.nameEn || service.name}`);
        console.log(`💰 Fee: ${service.fee || 'Not specified'}`);
        console.log(`📞 Contact: ${service.contactInfo || 'Not specified'}`);
        
        // Get full details
        const details = await api.getServiceDetails(service.id);
        console.log(`🔗 Link: ${details.result.bawabticUrl || 'Not available'}`);
      }
    }

    // Get system statistics
    console.log('\n📈 System Statistics:');
    const stats = await api.getStatistics();
    console.log(`Total Services: ${stats.total}`);
    console.log(`Online Services: ${stats.online}`);
    console.log('Categories:');
    stats.byCategory.forEach(cat => {
      console.log(`  • ${cat.category}: ${cat.count} services`);
    });

    // Check API health
    const health = await api.checkHealth();
    console.log(`\n❤️ API Status: ${health.status}`);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.status, error.response?.data);
    } else {
      console.error('Error:', error);
    }
  }
}

export { AlgerianServicesAPI, SearchRequest, ServiceResult, SearchResponse };
```

### React/Next.js Integration

```tsx
// React hook for using the API
import { useState, useEffect } from 'react';
import { AlgerianServicesAPI, SearchResponse, ServiceResult } from './algerian-api';

export function useAlgerianServices(apiKey: string) {
  const [api] = useState(() => new AlgerianServicesAPI(apiKey));
  
  const searchServices = async (query: string, category?: string) => {
    try {
      return await api.searchServices({ query, category, limit: 10 });
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  };

  return { searchServices, api };
}

// React component example
export function ServiceSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ServiceResult[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { searchServices } = useAlgerianServices('your-api-key');

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await searchServices(query);
      setResults(response.results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for government services..."
          className="w-full p-2 border rounded"
        />
        <button 
          onClick={handleSearch}
          disabled={loading}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div className="space-y-2">
        {results.map((service) => (
          <div key={service.id} className="p-4 border rounded">
            <h3 className="font-bold">{service.nameEn || service.name}</h3>
            <p className="text-gray-600">{service.description}</p>
            <div className="mt-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                {service.category}
              </span>
              {service.isOnline && (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                  Available Online
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### PHP

```php
<?php
class AlgerianServicesAPI {
    private $apiKey;
    private $baseUrl;
    
    public function __construct($apiKey, $baseUrl = 'https://api.findapply.com:8081') {
        $this->apiKey = $apiKey;
        $this->baseUrl = $baseUrl;
    }
    
    private function makeRequest($endpoint, $method = 'GET', $data = null) {
        $url = $this->baseUrl . $endpoint;
        
        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->apiKey
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        if ($method === 'POST' && $data) {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new Exception("API Error: HTTP $httpCode");
        }
        
        return json_decode($response, true);
    }
    
    public function searchServices($query, $category = null, $limit = 10) {
        $data = ['query' => $query, 'limit' => $limit];
        if ($category) {
            $data['category'] = $category;
        }
        
        return $this->makeRequest('/search', 'POST', $data);
    }
    
    public function getServiceDetails($serviceId) {
        return $this->makeRequest("/service/$serviceId");
    }
    
    public function getStatistics() {
        return $this->makeRequest('/stats');
    }
    
    public function checkHealth() {
        return $this->makeRequest('/health');
    }
}

// Usage Example
try {
    $api = new AlgerianServicesAPI('your-api-key-here');
    
    // Search for services
    $results = $api->searchServices('National ID', 'CIVIL_STATUS', 5);
    echo "Found " . $results['count'] . " services\n";
    
    // Get statistics
    $stats = $api->getStatistics();
    echo "Total services: " . $stats['total'] . "\n";
    
    // Check health
    $health = $api->checkHealth();
    echo "API Status: " . $health['status'] . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
```

## 🧪 Sample Queries

### Common Search Queries

```javascript
// Identity and Civil Status
await api.searchServices('National ID', 'CIVIL_STATUS');
await api.searchServices('Birth certificate', 'CIVIL_STATUS');
await api.searchServices('Passport', 'ADMINISTRATION');

// Business and Commerce
await api.searchServices('Company registration', 'BUSINESS');
await api.searchServices('Commercial register', 'BUSINESS');
await api.searchServices('Tax number', 'BUSINESS');

// Education
await api.searchServices('University scholarship', 'EDUCATION');
await api.searchServices('Student grant', 'EDUCATION');
await api.searchServices('Education certificate', 'EDUCATION');

// Employment
await api.searchServices('Job platform', 'EMPLOYMENT');
await api.searchServices('Employment support', 'EMPLOYMENT');
await api.searchServices('Career assistance', 'EMPLOYMENT');

// Transportation
await api.searchServices('Driving license', 'TRANSPORTATION');
await api.searchServices('Vehicle registration', 'TRANSPORTATION');

// Housing
await api.searchServices('Housing support', 'HOUSING');
await api.searchServices('Social housing', 'HOUSING');

// Arabic Queries
await api.searchServices('بطاقة الهوية', 'CIVIL_STATUS');
await api.searchServices('جواز السفر', 'ADMINISTRATION');
await api.searchServices('شهادة الميلاد', 'CIVIL_STATUS');
await api.searchServices('رخصة السياقة', 'TRANSPORTATION');
```

### Advanced Query Examples

```javascript
// Multi-category search
const categories = ['CIVIL_STATUS', 'BUSINESS', 'EDUCATION'];
const allResults = [];

for (const category of categories) {
  const results = await api.searchServices('application', category, 5);
  allResults.push(...results.results);
}

// Pagination example
async function getAllServices(query, pageSize = 10) {
  const allServices = [];
  let hasMore = true;
  let page = 0;
  
  while (hasMore) {
    const results = await api.searchServices(query, null, pageSize);
    allServices.push(...results.results);
    
    hasMore = results.results.length === pageSize;
    page++;
    
    // Safety limit
    if (page > 10) break;
  }
  
  return allServices;
}

// Error handling with retry
async function searchWithRetry(query, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await api.searchServices(query);
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts`);
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

## 📋 Service Categories

Available categories for filtering:

- `CIVIL_STATUS` - الحالة المدنية (ID cards, birth certificates)
- `ADMINISTRATION` - الإدارة العامة (Passports, official documents)
- `BUSINESS` - التجارة والأعمال (Company registration, commercial services)
- `EMPLOYMENT` - التشغيل والعمل (Job services, employment support)
- `EDUCATION` - التعليم (University services, scholarships)
- `HEALTH` - الصحة (Medical services, health records)
- `HOUSING` - السكن والعمران (Housing support, social housing)
- `TRANSPORTATION` - النقل والمواصلات (Driving licenses, vehicle registration)
- `TECHNOLOGY` - التكنولوجيا والرقمنة (Digital services)
- `SOCIAL_SECURITY` - الضمان الاجتماعي (Social support programs)

## 🔧 Error Handling

### Common Error Codes

```javascript
// 400 - Bad Request
{
  "error": "Invalid request parameters",
  "details": "Query parameter is required"
}

// 401 - Unauthorized
{
  "error": "Authentication required",
  "details": "Valid API key required"
}

// 404 - Not Found
{
  "error": "Service not found",
  "details": "Service ID does not exist"
}

// 429 - Rate Limited
{
  "error": "Rate limit exceeded",
  "details": "Too many requests. Please wait."
}

// 500 - Server Error
{
  "error": "Internal server error",
  "details": "Database connection failed"
}
```

### Error Handling Best Practices

```javascript
async function robustApiCall() {
  try {
    const results = await api.searchServices('National ID');
    return results;
  } catch (error) {
    if (error.response) {
      // API returned an error response
      switch (error.response.status) {
        case 400:
          console.error('Bad request:', error.response.data.details);
          break;
        case 401:
          console.error('Authentication failed - check API key');
          break;
        case 429:
          console.error('Rate limited - wait before retrying');
          break;
        case 500:
          console.error('Server error - try again later');
          break;
        default:
          console.error('Unknown error:', error.response.status);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error - check connection');
    } else {
      // Other error
      console.error('Error:', error.message);
    }
    
    throw error;
  }
}
```

## 📊 Rate Limits

- **20 requests per minute** per API key
- **1000 requests per day** per API key
- **Bulk operations**: Contact admin for higher limits

## 🔒 Security

- **HTTPS required** for all API calls
- **API key authentication** for all endpoints
- **CORS enabled** for web applications
- **Rate limiting** to prevent abuse

## 🌐 SDKs and Libraries

### Official SDKs (Coming Soon)
- **algerian-services-js** - JavaScript/TypeScript SDK
- **algerian-services-python** - Python SDK
- **algerian-services-php** - PHP SDK

### Community Libraries
- Submit your integration for inclusion in documentation

---

**🎉 Start building with the Algerian Government Services API!** 🇩🇿

For support, visit: https://api.findapply.com/dashboard