# 🚀 Production Deployment for api.findapply.com

## 🎯 Final Configuration Summary

### 🌐 Your Domain Structure:
```
https://api.findapply.com         → Next.js Chat Application (Clean URL)
https://api.findapply.com/mcp     → MCP Server API (Proxied)
https://api.findapply.com:8080    → MCP Server Direct Access
https://admin.api.findapply.com   → Prisma Studio (Admin)
```

### ⚙️ Environment Configuration:
```env
# Database - MongoDB Atlas
DATABASE_URL="mongodb+srv://ameurbennaoui:JdUvoZGc4oxROKnX@cluster0.auavcz1.mongodb.net/youths_portal?serverSelectionTimeoutMS=30000&connectTimeoutMS=30000&socketTimeoutMS=30000"

# NextAuth.js
NEXTAUTH_URL="https://api.findapply.com"
NEXTAUTH_SECRET="your-secret-key-here"

# MCP Server - Direct Access
MCP_SERVER_PORT=8080
MCP_SERVER_URL="https://api.findapply.com:8080"
MCP_API_KEY="your-mcp-api-key-here"

# Next.js
NEXT_PUBLIC_APP_URL="https://api.findapply.com"
PORT=3000
```

## 🚀 Deployment Steps

### 1. Server Setup
```bash
# On your Ubuntu server
git clone https://github.com/ameurb/algerian-government-services.git
cd algerian-government-services

# Configure environment
cp .env.example .env
# Edit .env with your OpenAI API key and NextAuth secret

# Deploy
DOMAIN=api.findapply.com ./deploy.sh
```

### 2. DNS Configuration
```
# Add these DNS records to api.findapply.com:
A     @     YOUR_SERVER_IP
A     www   YOUR_SERVER_IP
```

### 3. Nginx Setup
```bash
# Copy nginx configuration
sudo cp nginx-api.findapply.com.conf /etc/nginx/sites-available/api.findapply.com
sudo ln -s /etc/nginx/sites-available/api.findapply.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 4. SSL Certificates
```bash
# Setup SSL for all ports
sudo certbot --nginx -d api.findapply.com -d www.api.findapply.com

# The configuration will automatically handle:
# - Port 443 (HTTPS) for main traffic
# - Port 8080 (HTTPS) for direct MCP access
# - Port 3000 (HTTPS) for direct Next.js access
```

## 🧪 Testing Your Deployment

### Test Each Service:
```bash
# 1. Test Next.js App
curl https://api.findapply.com:3000

# 2. Test MCP Server Health
curl https://api.findapply.com:8080/health

# 3. Test MCP Search API
curl -X POST https://api.findapply.com:8080/search \
  -H "Content-Type: application/json" \
  -d '{"query": "National ID", "limit": 3}'

# 4. Test Chat API through Next.js
curl -X POST https://api.findapply.com:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "National ID", "sessionId": "test"}'

# 5. Test Database Stats
curl https://api.findapply.com:8080/stats
```

## 📊 Service Architecture

### 🏗️ **3-Server Setup:**

1. **Next.js Frontend** (Port 3000)
   - ChatGPT-like interface with RTL/LTR support
   - Authentication via NextAuth.js
   - Responsive design for mobile/desktop

2. **MCP HTTP Server** (Port 8080) 
   - Direct API access for government services
   - Real-time search and service details
   - Streaming responses with MongoDB Atlas

3. **Database** (MongoDB Atlas)
   - 49+ Algerian government services
   - Secure cloud hosting with auto-scaling
   - Automatic backups and monitoring

### 🔐 **Security Features:**
- **CORS configured** for api.findapply.com
- **SSL certificates** for all ports (443, 8080, 3000)
- **NextAuth.js** for user authentication
- **MongoDB Atlas** enterprise security
- **Firewall rules** for port access control

## 🎉 Final Result

**Your citizens will access:**
- **Main App**: https://api.findapply.com
- **API Docs**: https://api.findapply.com/mcp/tools

**Features available:**
- 🤖 ChatGPT-like AI assistant in Arabic/English
- 🔄 Automatic RTL/LTR text direction detection
- 📱 Mobile-responsive design with modern UI
- 🇩🇿 49+ real Algerian government services
- ⚡ Fast MongoDB Atlas performance
- 🔒 Secure HTTPS connections on all ports

**Professional government services platform ready for production!** 🇩🇿✨

## 📞 Support & Monitoring

```bash
# Check all services status
pm2 status

# View logs
pm2 logs algerian-nextjs
pm2 logs algerian-mcp

# Test full deployment
npm run verify:deployment

# Test streaming functionality
npm run test:streaming
```