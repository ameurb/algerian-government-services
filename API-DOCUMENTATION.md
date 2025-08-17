# 📡 Algerian Government Services API - Simple Guide

Easy-to-use API for accessing Algerian government services.

## 🚀 Quick Start

### API Base URL
```
https://api.findapply.com:8081
```

### API Key (for testing)
```
dz_live_demo123
```

### Basic Usage
```bash
curl -H "Authorization: Bearer dz_live_demo123" \
  -X POST https://api.findapply.com:8081/search \
  -H "Content-Type: application/json" \
  -d '{"query": "National ID", "limit": 5}'
```

## 📋 Simple Endpoints

### 1. 🔍 Search Services
**What it does:** Find government services by keyword

**URL:** `POST /search`

**Send this:**
```json
{
  "query": "National ID",
  "limit": 5
}
```

**You get:**
```json
{
  "count": 3,
  "results": [
    {
      "name": "Request for Electronic Biometric National ID Card",
      "description": "Submit application for national ID card",
      "fee": "200 دج",
      "requirements": ["National ID", "Photos"],
      "link": "https://bawabatic.dz/..."
    }
  ]
}
```

### 2. 📊 Get Statistics
**What it does:** See how many services are available

**URL:** `GET /stats`

**You get:**
```json
{
  "total": 49,
  "online": 11,
  "byCategory": [
    {"category": "CIVIL_STATUS", "count": 11},
    {"category": "BUSINESS", "count": 9}
  ]
}
```

### 3. ❤️ Health Check
**What it does:** Check if API is working

**URL:** `GET /health`

**You get:**
```json
{
  "status": "healthy",
  "server": "Algerian Youth MCP Server"
}
```

## 💻 Programming Examples

### JavaScript
```javascript
// Simple search
async function searchServices(query) {
  const response = await fetch('https://api.findapply.com:8081/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer dz_live_demo123'
    },
    body: JSON.stringify({ query, limit: 10 })
  });
  
  const data = await response.json();
  console.log(`Found ${data.count} services`);
  
  data.results.forEach(service => {
    console.log(`• ${service.name}`);
    console.log(`  Fee: ${service.fee || 'Free'}`);
  });
}

// Usage
searchServices('National ID');
searchServices('Company registration');
searchServices('Passport');
```

### Python
```python
import requests

def search_services(query):
    url = 'https://api.findapply.com:8081/search'
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dz_live_demo123'
    }
    data = {'query': query, 'limit': 10}
    
    response = requests.post(url, json=data, headers=headers)
    result = response.json()
    
    print(f"Found {result['count']} services")
    for service in result['results']:
        print(f"• {service['name']}")
        print(f"  Fee: {service.get('fee', 'Free')}")

# Usage
search_services('National ID')
search_services('Business registration')
```

### PHP
```php
<?php
function searchServices($query) {
    $url = 'https://api.findapply.com:8081/search';
    $data = json_encode(['query' => $query, 'limit' => 10]);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer dz_live_demo123'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $result = json_decode($response, true);
    echo "Found {$result['count']} services\n";
}

searchServices('National ID');
?>
```

## 🔍 What You Can Search For

### Arabic Queries
```
بطاقة الهوية       → National ID services
جواز السفر         → Passport services  
شهادة الميلاد      → Birth certificate
تأسيس شركة        → Company registration
رخصة السياقة       → Driving license
```

### English Queries
```
National ID         → Identity documents
Passport           → Travel documents
Birth certificate  → Civil status documents
Company           → Business services
Tax               → Tax services
Education         → University services
```

### Service Categories
```
CIVIL_STATUS      → ID cards, certificates (11 services)
BUSINESS          → Company, tax services (9 services)
EMPLOYMENT        → Job services (8 services)
HOUSING           → Housing support (10 services)
EDUCATION         → University services (4 services)
TRANSPORTATION    → Driving licenses (3 services)
```

## 🌊 Streaming API (Advanced)

### Progressive Search
**What it does:** Get results piece by piece with progress updates

**URL:** `POST /stream/search`

**Example:**
```bash
curl -H "Authorization: Bearer dz_live_demo123" \
  -X POST https://api.findapply.com:8081/stream/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Company", "chunkSize": 1}' \
  --no-buffer
```

**You get (streaming):**
```
data: {"type":"progress","message":"Searching...","progress":25}
data: {"type":"result","data":[{"name":"Service 1"}]}
data: {"type":"result","data":[{"name":"Service 2"}]}
data: {"type":"complete","totalResults":2}
```

### JavaScript Streaming
```javascript
const response = await fetch('/stream/search', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer dz_live_demo123',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query: 'National ID' })
});

const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = new TextDecoder().decode(value);
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log('Received:', data.type);
    }
  }
}
```

## ❌ Common Errors

### No API Key
```bash
# Wrong ❌
curl https://api.findapply.com:8081/search

# Correct ✅  
curl -H "Authorization: Bearer dz_live_demo123" \
  https://api.findapply.com:8081/search
```

### Invalid Query
```json
// Wrong ❌
{"limit": 5}

// Correct ✅
{"query": "National ID", "limit": 5}
```

## 🎯 Real Examples That Work

```bash
# Search for ID services
curl -H "Authorization: Bearer dz_live_demo123" \
  -X POST https://api.findapply.com:8081/search \
  -d '{"query": "National ID"}'

# Search for business services  
curl -H "Authorization: Bearer dz_live_demo123" \
  -X POST https://api.findapply.com:8081/search \
  -d '{"query": "Company", "category": "BUSINESS"}'

# Get API health
curl https://api.findapply.com:8081/health

# Get statistics
curl -H "Authorization: Bearer dz_live_demo123" \
  https://api.findapply.com:8081/stats
```

## 📞 Need Help?

- **Dashboard:** https://api.findapply.com:3030/dashboard
- **Test API:** Use `dz_live_demo123` key
- **GitHub:** https://github.com/ameurb/algerian-government-services

---

**🎉 Start using the API in 2 minutes!** Just copy the examples above. 🇩🇿