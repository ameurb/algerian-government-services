# 🔍 API Query Examples

Comprehensive examples of queries you can send to the Algerian Government Services API.

## 🏛️ Civil Status Services (CIVIL_STATUS)

### National ID and Identity Documents
```javascript
// English queries
await api.search('National ID', 'CIVIL_STATUS');
await api.search('Identity card', 'CIVIL_STATUS');
await api.search('ID card renewal', 'CIVIL_STATUS');
await api.search('Biometric ID card', 'CIVIL_STATUS');

// Arabic queries
await api.search('بطاقة الهوية', 'CIVIL_STATUS');
await api.search('بطاقة التعريف الوطنية', 'CIVIL_STATUS');
await api.search('بطاقة التعريف الوطنية البيومترية', 'CIVIL_STATUS');
```

### Birth and Marriage Certificates
```javascript
// English
await api.search('Birth certificate', 'CIVIL_STATUS');
await api.search('Marriage certificate', 'CIVIL_STATUS');
await api.search('Death certificate', 'CIVIL_STATUS');

// Arabic
await api.search('شهادة الميلاد', 'CIVIL_STATUS');
await api.search('شهادة الزواج', 'CIVIL_STATUS');
await api.search('شهادة الوفاة', 'CIVIL_STATUS');
```

## ✈️ Administration Services (ADMINISTRATION)

### Passport Services
```javascript
// English
await api.search('Passport', 'ADMINISTRATION');
await api.search('Passport renewal', 'ADMINISTRATION');
await api.search('Passport application', 'ADMINISTRATION');
await api.search('Biometric passport', 'ADMINISTRATION');

// Arabic
await api.search('جواز السفر', 'ADMINISTRATION');
await api.search('تجديد جواز السفر', 'ADMINISTRATION');
await api.search('طلب جواز السفر', 'ADMINISTRATION');
```

## 🏢 Business Services (BUSINESS)

### Company Registration
```javascript
// English
await api.search('Company registration', 'BUSINESS');
await api.search('Business license', 'BUSINESS');
await api.search('Commercial register', 'BUSINESS');
await api.search('Company establishment', 'BUSINESS');
await api.search('Online company setup', 'BUSINESS');

// Arabic  
await api.search('تأسيس شركة', 'BUSINESS');
await api.search('تسجيل شركة', 'BUSINESS');
await api.search('السجل التجاري', 'BUSINESS');
await api.search('إنشاء شركة', 'BUSINESS');
```

### Tax Services
```javascript
// English
await api.search('Tax number', 'BUSINESS');
await api.search('Tax registration', 'BUSINESS');
await api.search('Tax declaration', 'BUSINESS');
await api.search('VAT registration', 'BUSINESS');

// Arabic
await api.search('الرقم الجبائي', 'BUSINESS');
await api.search('التسجيل الجبائي', 'BUSINESS');
await api.search('التصريح الجبائي', 'BUSINESS');
```

## 💼 Employment Services (EMPLOYMENT)

### Job and Employment
```javascript
// English
await api.search('Job application', 'EMPLOYMENT');
await api.search('Employment platform', 'EMPLOYMENT');
await api.search('Career services', 'EMPLOYMENT');
await api.search('Job search', 'EMPLOYMENT');

// Arabic
await api.search('طلب عمل', 'EMPLOYMENT');
await api.search('منصة التوظيف', 'EMPLOYMENT');
await api.search('البحث عن عمل', 'EMPLOYMENT');
await api.search('فرص العمل', 'EMPLOYMENT');
```

## 🎓 Education Services (EDUCATION)

### University and Scholarships
```javascript
// English
await api.search('University scholarship', 'EDUCATION');
await api.search('Student grant', 'EDUCATION');
await api.search('Education certificate', 'EDUCATION');
await api.search('Academic transcript', 'EDUCATION');

// Arabic
await api.search('منحة جامعية', 'EDUCATION');
await api.search('دعم التعليم', 'EDUCATION');
await api.search('شهادة التعليم', 'EDUCATION');
await api.search('كشف النقاط', 'EDUCATION');
```

## 🚗 Transportation Services (TRANSPORTATION)

### Driving and Vehicles
```javascript
// English
await api.search('Driving license', 'TRANSPORTATION');
await api.search('Driver license renewal', 'TRANSPORTATION');
await api.search('Vehicle registration', 'TRANSPORTATION');
await api.search('Car license', 'TRANSPORTATION');

// Arabic
await api.search('رخصة السياقة', 'TRANSPORTATION');
await api.search('رخصة القيادة', 'TRANSPORTATION');
await api.search('تسجيل السيارة', 'TRANSPORTATION');
```

## 🏠 Housing Services (HOUSING)

### Housing and Real Estate
```javascript
// English
await api.search('Housing support', 'HOUSING');
await api.search('Social housing', 'HOUSING');
await api.search('Property registration', 'HOUSING');
await api.search('Real estate', 'HOUSING');

// Arabic
await api.search('دعم السكن', 'HOUSING');
await api.search('السكن الاجتماعي', 'HOUSING');
await api.search('تسجيل العقار', 'HOUSING');
```

## 🏥 Health Services (HEALTH)

### Medical and Health
```javascript
// English
await api.search('Health insurance', 'HEALTH');
await api.search('Medical certificate', 'HEALTH');
await api.search('Vaccination record', 'HEALTH');

// Arabic
await api.search('التأمين الصحي', 'HEALTH');
await api.search('الشهادة الطبية', 'HEALTH');
await api.search('سجل التطعيم', 'HEALTH');
```

## 🔍 Advanced Query Patterns

### Complex Search Queries
```javascript
// Batch processing
const queries = [
  { query: 'National ID', category: 'CIVIL_STATUS', limit: 3 },
  { query: 'Company registration', category: 'BUSINESS', limit: 3 },
  { query: 'Scholarship', category: 'EDUCATION', limit: 3 }
];

const results = await Promise.all(
  queries.map(q => api.searchServices(q))
);

// Service discovery by category
const categories = ['CIVIL_STATUS', 'BUSINESS', 'EDUCATION'];
const categoryResults = {};

for (const category of categories) {
  const result = await api.search('service', category, 5);
  categoryResults[category] = result.results;
}

// Multi-language search
const multiLangQueries = [
  'National ID',           // English
  'بطاقة الهوية',          // Arabic
  'Carte d\'identité'      // French
];

const multiLangResults = await Promise.all(
  multiLangQueries.map(q => api.search(q, 'CIVIL_STATUS'))
);
```

### Error Handling Patterns
```javascript
// Retry mechanism
async function searchWithRetry(api, query, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await api.search(query);
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts`);
      }
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, 1000 * Math.pow(2, attempt - 1))
      );
    }
  }
}

// Graceful degradation
async function robustServiceSearch(api, query) {
  try {
    // Try specific category first
    const results = await api.search(query, 'CIVIL_STATUS', 5);
    if (results.count > 0) return results;
    
    // Fall back to general search
    return await api.search(query, null, 10);
  } catch (error) {
    console.warn('Search failed, using fallback:', error.message);
    
    // Return empty results structure
    return {
      count: 0,
      results: [],
      metadata: { 
        queryTime: 0, 
        timestamp: new Date().toISOString(),
        error: error.message 
      }
    };
  }
}
```

### Performance Optimization
```javascript
// Caching layer
class CachedAlgerianAPI extends AlgerianServicesAPI {
  constructor(config) {
    super(config);
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async searchServices(request) {
    const cacheKey = JSON.stringify(request);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const result = await super.searchServices(request);
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  }
}

// Connection pooling for high-volume usage
const apiPool = Array.from({ length: 5 }, () => 
  new AlgerianServicesAPI({ apiKey: 'your-key' })
);

let currentApi = 0;
function getAPI() {
  const api = apiPool[currentApi];
  currentApi = (currentApi + 1) % apiPool.length;
  return api;
}
```

## 📊 Real Query Examples

### Successful Queries (Based on Current Database)

```javascript
// These queries return actual results from the current database:

// Civil Status (11 services available)
await api.search('National ID');              // ✅ Returns 4 results
await api.search('Birth certificate');        // ✅ Returns 1 result  
await api.search('بطاقة الهوية');              // ✅ Returns ID services

// Business (9 services available)
await api.search('Company');                  // ✅ Returns 3 company services
await api.search('Commercial register');      // ✅ Returns certificates
await api.search('Tax');                      // ✅ Returns 4 tax services

// Employment (8 services available)
await api.search('Employment');               // ✅ Returns job platforms
await api.search('Job');                      // ✅ Returns employment services

// Education (4 services available)
await api.search('Education');                // ✅ Returns education grant
await api.search('University');               // ✅ Returns scholarship info

// Transportation (3 services available)
await api.search('Driving');                  // ✅ Returns license services

// Housing (10 services available)
await api.search('Housing');                  // ✅ Returns housing support
```

### Query Performance Tips

```javascript
// Optimize your queries for better results:

// ✅ Good queries (specific, clear)
'National ID'
'Company registration' 
'Birth certificate'
'Driving license'

// ❌ Poor queries (too vague, might return no results)
'Document'
'Application'
'Government'
'Service'

// ✅ Use English terms for better compatibility
'National ID' instead of 'بطاقة الهوية'
'Passport' instead of 'جواز السفر'

// ✅ Include category for faster, more accurate results
await api.search('National ID', 'CIVIL_STATUS');  // Faster
await api.search('National ID');                  // Slower, broader search
```

---

**📡 Ready to integrate with the Algerian Government Services API!** 🇩🇿

For more examples and support, visit: https://api.findapply.com/dashboard