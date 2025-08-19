# 🚀 CapRover Deployment Guide - dzservices.findapply.com

Deploy the Algerian Government Services platform using CapRover with Docker.

## 🌐 CapRover Deployment

### Prerequisites
- CapRover installed and configured
- Domain `findapply.com` pointed to your CapRover server
- GitHub repository access

### Quick Deployment Command:
```bash
caprover deploy -t captain-definition -a dzservices
```

## ⚙️ CapRover App Configuration

### 1. Create App in CapRover Dashboard
- **App Name**: `dzservices`
- **Has Persistent Data**: No
- **Instance Count**: 1 (can scale later)

### 2. Environment Variables
Set these in CapRover App → Environment Variables:

```bash
# Database
DATABASE_URL=mongodb+srv://ameurbennaoui:JdUvoZGc4oxROKnX@cluster0.auavcz1.mongodb.net/youths_portal?serverSelectionTimeoutMS=30000&connectTimeoutMS=30000&socketTimeoutMS=30000

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# NextAuth
NEXTAUTH_URL=https://dzservices.findapply.com
NEXTAUTH_SECRET=your_production_secret_here

# MCP Configuration
MCP_SERVER_PORT=8081
MCP_SERVER_URL=https://dzservices.findapply.com/api
MCP_API_KEY=dz_live_demo123

# Next.js
NEXT_PUBLIC_APP_URL=https://dzservices.findapply.com
PORT=3000
NODE_ENV=production

# Domain
DOMAIN=dzservices.findapply.com
CORS_ORIGIN=https://dzservices.findapply.com
```

### 3. Custom Domain Setup
In CapRover Dashboard:
- Go to Apps → dzservices → HTTP Settings
- Add custom domain: `dzservices.findapply.com`
- Enable HTTPS
- Enable Force HTTPS

### 4. Port Configuration
- **Container Port**: 3000 (Next.js)
- **Additional Ports**: 8081 (MCP Server)

## 📁 Required Files

### captain-definition (Already Created)
- Multi-stage Docker build
- Includes Next.js and MCP server
- Production optimized
- Health checks included

### Dockerfile (Already Created)
- Node.js 18 Alpine base
- Prisma client generation
- Next.js build optimization
- Dual service startup

### docker-compose.yml (For Local Testing)
```bash
# Test locally before deploying
docker-compose up --build
```

## 🚀 Deployment Process

### Step 1: Prepare Repository
```bash
# Ensure all files are committed
git add .
git commit -m "Prepare for CapRover deployment"
git push origin main
```

### Step 2: Deploy to CapRover
```bash
# From project root directory
caprover deploy -t captain-definition -a dzservices

# Alternative: Deploy from Git
caprover deploy -g https://github.com/ameurb/algerian-government-services.git -b main -a dzservices
```

### Step 3: Configure Environment
1. Go to CapRover Dashboard
2. Navigate to Apps → dzservices → App Configs
3. Add environment variables (listed above)
4. Save and restart app

### Step 4: Setup Custom Domain
1. Apps → dzservices → HTTP Settings
2. Add: `dzservices.findapply.com`
3. Enable HTTPS and Force HTTPS
4. Save changes

## 🔧 CapRover Configuration

### App Settings:
```yaml
App Name: dzservices
Port: 3000
Instance Count: 1
Persistent Data: No
Resource Limits:
  Memory: 1GB
  CPU: 0.5
```

### Health Check:
```bash
Health Check Path: /health
Health Check Timeout: 30s
```

### Load Balancer:
```yaml
Method: RoundRobin
Health Check: Enabled
Sticky Session: Disabled
```

## 📡 Post-Deployment URLs

After successful deployment:

### Public URLs:
- **🤖 Main Chat**: https://dzservices.findapply.com
- **📊 Dashboard**: https://dzservices.findapply.com/dashboard
- **❤️ Health Check**: https://dzservices.findapply.com/health

### API URLs (Clean):
- **🔍 Search**: https://dzservices.findapply.com/api/search
- **📊 Stats**: https://dzservices.findapply.com/api/stats
- **🌊 Streaming**: https://dzservices.findapply.com/api/stream/search

### Admin URLs:
- **🗄️ Database**: https://dzservices.findapply.com/prisma (if enabled)
- **📊 CapRover**: https://captain.your-domain.com

## 🧪 Testing Deployment

### Verify Services:
```bash
# Test main application
curl https://dzservices.findapply.com

# Test API with authentication
curl -H "Authorization: Bearer dz_live_demo123" \
  https://dzservices.findapply.com/api/stats

# Test health endpoint
curl https://dzservices.findapply.com/health

# Test streaming
curl -H "Authorization: Bearer dz_live_demo123" \
  -X POST https://dzservices.findapply.com/api/stream/search \
  -H "Content-Type: application/json" \
  -d '{"query": "National ID", "limit": 3}' \
  --no-buffer
```

## 🔒 Security Configuration

### Environment Variables (Sensitive):
- Store in CapRover App Configs (encrypted)
- Never commit to repository
- Use different API keys for production

### Network Security:
- Internal container communication only
- External access via Nginx proxy
- HTTPS enforced for all traffic

## 📊 Monitoring

### CapRover Built-in:
- App logs and metrics
- Resource usage monitoring
- Automatic restarts on failure
- Health check monitoring

### Application Monitoring:
- Health endpoint: `/health`
- API stats: `/api/stats` 
- Dashboard: `/dashboard`

## 🔄 Updates and Rollbacks

### Update Application:
```bash
# Deploy new version
caprover deploy -t captain-definition -a dzservices

# Check deployment status
caprover logs -a dzservices
```

### Rollback (if needed):
```bash
# In CapRover Dashboard:
# Apps → dzservices → Deployment → Previous Versions → Deploy
```

## 🎯 Quick Start Summary

```bash
# 1. Clone repository
git clone https://github.com/ameurb/algerian-government-services.git
cd algerian-government-services

# 2. Deploy to CapRover
caprover deploy -t captain-definition -a dzservices

# 3. Configure environment variables in CapRover dashboard

# 4. Add custom domain: dzservices.findapply.com

# 5. Enable HTTPS and test deployment
```

---

**🎉 Your Algerian Government Services platform will be live at:**
**🔗 https://dzservices.findapply.com**

**CapRover deployment ready with Docker containerization!** 🐳🇩🇿✨