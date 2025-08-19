# 🚀 dzservices.findapply.com Production Deployment

Complete deployment guide for the clean subdomain structure.

## 🌐 Production URL Structure

### Clean URLs with Nginx Proxy:
```
https://dzservices.findapply.com           → Next.js App (Chat Interface)
https://dzservices.findapply.com/dashboard → Admin Dashboard
https://dzservices.findapply.com/api       → MCP Server API (proxied from :8081)
https://dzservices.findapply.com/prisma    → Prisma Studio (proxied from :5556)
https://dzservices.findapply.com/health    → System Health Check
```

### Backend Services:
```
Next.js:      Port 3000 (proxied via Nginx)
MCP Server:   Port 8081 (proxied to /api)
Prisma:       Port 5556 (proxied to /prisma)
MongoDB:      Atlas (cloud)
```

## ⚙️ Environment Configuration

### Production .env:
```env
# Database - MongoDB Atlas
DATABASE_URL="mongodb+srv://ameurbennaoui:JdUvoZGc4oxROKnX@cluster0.auavcz1.mongodb.net/youths_portal?serverSelectionTimeoutMS=30000&connectTimeoutMS=30000&socketTimeoutMS=30000"

# NextAuth.js
NEXTAUTH_URL="https://dzservices.findapply.com"
NEXTAUTH_SECRET="your-production-secret-here"

# MCP Server
MCP_SERVER_PORT=8081
MCP_SERVER_URL="https://dzservices.findapply.com/api"
MCP_API_KEY="dz_live_demo123"

# Next.js
NEXT_PUBLIC_APP_URL="https://dzservices.findapply.com"
PORT=3000
NODE_ENV=production

# Domain Configuration
DOMAIN="dzservices.findapply.com"
CORS_ORIGIN="https://dzservices.findapply.com"
```

## 🚀 Deployment Steps

### 1. DNS Configuration
```
# Add DNS records for dzservices.findapply.com:
A     dzservices     YOUR_SERVER_IP
CNAME www.dzservices dzservices.findapply.com
```

### 2. Server Setup
```bash
# Clone repository
git clone https://github.com/ameurb/algerian-government-services.git
cd algerian-government-services

# Configure environment
cp .env.example .env
nano .env  # Update with production values

# Deploy with new domain
DOMAIN=dzservices.findapply.com ./deploy.sh
```

### 3. Nginx Configuration
```bash
# Install nginx configuration
sudo cp nginx-dzservices.findapply.com.conf /etc/nginx/sites-available/dzservices.findapply.com
sudo ln -s /etc/nginx/sites-available/dzservices.findapply.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 4. SSL Certificate
```bash
# Get SSL certificate for subdomain
sudo certbot --nginx -d dzservices.findapply.com -d www.dzservices.findapply.com
```

### 5. Firewall Configuration
```bash
# Configure firewall for clean URLs
sudo ufw allow 22         # SSH
sudo ufw allow 80         # HTTP  
sudo ufw allow 443        # HTTPS
sudo ufw enable

# Internal ports (blocked from external access)
# Port 3000: Next.js (internal only)
# Port 8081: MCP Server (internal only) 
# Port 5556: Prisma Studio (internal only)
```

## 📡 API Usage Examples

### Production API Calls:
```bash
# Search services
curl -H "Authorization: Bearer dz_live_demo123" \
  -X POST https://dzservices.findapply.com/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "National ID", "limit": 5}'

# Get service details
curl -H "Authorization: Bearer dz_live_demo123" \
  https://dzservices.findapply.com/api/service/SERVICE_ID

# Get statistics
curl -H "Authorization: Bearer dz_live_demo123" \
  https://dzservices.findapply.com/api/stats

# Health check (no auth required)
curl https://dzservices.findapply.com/health

# Streaming search
curl -H "Authorization: Bearer dz_live_demo123" \
  -X POST https://dzservices.findapply.com/api/stream/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Company", "chunkSize": 2}' \
  --no-buffer
```

### JavaScript SDK Update:
```javascript
const api = new AlgerianServicesAPI('dz_live_demo123', 'https://dzservices.findapply.com/api');
const results = await api.search('National ID', 'CIVIL_STATUS', 5);
```

### Python SDK Update:
```python
api = AlgerianServicesAPI('dz_live_demo123', 'https://dzservices.findapply.com/api')
results = api.search_services('Company', 'BUSINESS', 3)
```

## 🧪 Testing Deployment

```bash
# Test all endpoints
curl https://dzservices.findapply.com                    # Main app
curl https://dzservices.findapply.com/dashboard          # Dashboard
curl https://dzservices.findapply.com/health             # Health check
curl https://dzservices.findapply.com/prisma             # Prisma Studio

# Test API with authentication
curl -H "Authorization: Bearer dz_live_demo123" \
  https://dzservices.findapply.com/api/stats

# Test streaming
curl -H "Authorization: Bearer dz_live_demo123" \
  -X POST https://dzservices.findapply.com/api/stream/search \
  -d '{"query": "National ID"}' --no-buffer
```

## 📊 Production URLs Summary

### For Citizens:
- **🤖 Main Chat**: https://dzservices.findapply.com
- **📱 Mobile**: Same URL, responsive design

### For Administrators:
- **📊 Dashboard**: https://dzservices.findapply.com/dashboard
- **🗄️ Database**: https://dzservices.findapply.com/prisma

### For Developers:
- **📡 API Base**: https://dzservices.findapply.com/api
- **📚 Documentation**: Available in dashboard
- **🔑 Demo Key**: dz_live_demo123

### For Monitoring:
- **❤️ Health**: https://dzservices.findapply.com/health
- **📈 Stats**: https://dzservices.findapply.com/api/stats

## 🎯 Benefits of Clean URL Structure

### ✅ Professional Appearance:
- Clean, memorable subdomain
- No port numbers in user-facing URLs
- Consistent URL structure across services

### ✅ Security:
- Internal ports hidden from external access
- Nginx handles SSL termination
- Firewall protection for backend services

### ✅ Scalability:
- Easy to add new services under /api
- Subdomain isolation
- Load balancing ready

---

**🎉 Your Algerian Government Services platform will be accessible at:**
**🔗 https://dzservices.findapply.com**

**Professional, clean URLs for a government services platform!** 🇩🇿✨