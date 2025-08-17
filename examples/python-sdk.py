#!/usr/bin/env python3
# 🇩🇿 Algerian Government Services API - Python SDK Example

import requests
import json
from typing import Optional, Dict, List, Any

class AlgerianServicesAPI:
    """Python SDK for Algerian Government Services API"""
    
    def __init__(self, api_key: str, base_url: str = "https://api.findapply.com:8081"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        })
        self.session.timeout = 30

    def _make_request(self, endpoint: str, method: str = 'GET', data: Optional[Dict] = None) -> Dict[str, Any]:
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
            print(f"❌ API Request failed: {e}")
            raise

    def search_services(self, query: str, category: Optional[str] = None, limit: int = 10) -> Dict[str, Any]:
        """Search for government services"""
        data = {'query': query, 'limit': limit}
        if category:
            data['category'] = category
            
        return self._make_request('/search', 'POST', data)

    def get_service_details(self, service_id: str) -> Dict[str, Any]:
        """Get detailed service information"""
        return self._make_request(f'/service/{service_id}')

    def get_statistics(self) -> Dict[str, Any]:
        """Get system statistics"""
        return self._make_request('/stats')

    def check_health(self) -> Dict[str, Any]:
        """Check API health"""
        return self._make_request('/health')

    def get_tools(self) -> Dict[str, Any]:
        """Get available MCP tools"""
        return self._make_request('/tools')

def main():
    """Example usage of the API"""
    
    # Initialize API client
    api = AlgerianServicesAPI('mcp_live_demo123')  # Demo API key
    
    print("🇩🇿 Algerian Government Services API - Python Examples\n")
    
    try:
        # Example 1: Search for National ID services
        print("1. 🆔 Searching for National ID services...")
        national_id_results = api.search_services('National ID', 'CIVIL_STATUS', 5)
        print(f"   ✅ Found {national_id_results['count']} services")
        
        for i, service in enumerate(national_id_results['results'], 1):
            print(f"   {i}. {service.get('nameEn', service['name'])}")
            print(f"      Fee: {service.get('fee', 'Not specified')}")
            print(f"      Online: {'Yes' if service['isOnline'] else 'No'}")
        
        # Example 2: Search for business services
        print("\n2. 🏢 Searching for business services...")
        business_results = api.search_services('Company registration', 'BUSINESS', 3)
        print(f"   ✅ Found {business_results['count']} business services")
        
        for service in business_results['results']:
            print(f"   • {service.get('nameEn', service['name'])}")
            if service.get('bawabticUrl'):
                print(f"     🔗 {service['bawabticUrl']}")
        
        # Example 3: Search with Arabic query
        print("\n3. 🔤 Searching with Arabic query...")
        arabic_results = api.search_services('بطاقة الهوية', 'CIVIL_STATUS', 3)
        print(f"   ✅ Found {arabic_results['count']} services for Arabic query")
        
        # Example 4: Get detailed service information
        if national_id_results['results']:
            print("\n4. 📋 Getting detailed service information...")
            service_id = national_id_results['results'][0]['id']
            details = api.get_service_details(service_id)
            service = details['result']
            
            print(f"   Service: {service.get('nameEn', service['name'])}")
            print(f"   Description: {service.get('descriptionEn', service['description'])}")
            print(f"   Requirements: {', '.join(service.get('requirements', []))}")
            print(f"   Contact: {service.get('contactInfo', 'Not specified')}")
        
        # Example 5: Get system statistics
        print("\n5. 📊 System Statistics...")
        stats = api.get_statistics()
        print(f"   Total Services: {stats['total']}")
        print(f"   Online Services: {stats['online']}")
        print(f"   Active Services: {stats['active']}")
        print("   Services by Category:")
        for category in stats['byCategory']:
            print(f"     • {category['category']}: {category['count']} services")
        
        # Example 6: Check API health
        print("\n6. ❤️ API Health Check...")
        health = api.check_health()
        print(f"   Status: {health['status']}")
        print(f"   Server: {health['server']} v{health.get('version', 'Unknown')}")
        print(f"   Database: {health.get('database', 'Unknown')}")
        
        # Example 7: Advanced search patterns
        print("\n7. 🔍 Advanced Search Patterns...")
        
        # Search across multiple categories
        categories = ['CIVIL_STATUS', 'BUSINESS', 'EDUCATION']
        all_services = []
        
        for category in categories:
            results = api.search_services('application', category, 2)
            all_services.extend(results['results'])
            print(f"   {category}: {results['count']} services found")
        
        print(f"   Total across categories: {len(all_services)} services")
        
        # Search with different queries
        queries = [
            'Birth certificate',
            'Passport', 
            'Driving license',
            'University scholarship',
            'Tax number'
        ]
        
        print("\n   Quick searches:")
        for query in queries:
            try:
                results = api.search_services(query, None, 1)
                status = f"✅ {results['count']} found" if results['count'] > 0 else "❌ None found"
                print(f"   {query}: {status}")
            except Exception as e:
                print(f"   {query}: ❌ Error - {e}")

    except Exception as e:
        print(f"❌ Error: {e}")

# Helper function for batch operations
def search_multiple_services(api: AlgerianServicesAPI, queries: List[str]) -> Dict[str, Any]:
    """Search for multiple services in batch"""
    results = {}
    
    for query in queries:
        try:
            search_result = api.search_services(query, None, 5)
            results[query] = {
                'count': search_result['count'],
                'services': search_result['results']
            }
        except Exception as e:
            results[query] = {'error': str(e)}
    
    return results

# Helper function for getting service details in batch
def get_service_details_batch(api: AlgerianServicesAPI, service_ids: List[str]) -> Dict[str, Any]:
    """Get details for multiple services"""
    details = {}
    
    for service_id in service_ids:
        try:
            service_detail = api.get_service_details(service_id)
            details[service_id] = service_detail['result']
        except Exception as e:
            details[service_id] = {'error': str(e)}
    
    return details

if __name__ == "__main__":
    main()