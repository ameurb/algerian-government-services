# 🌐 Domain Configuration for api.findapply.com

This guide configures your **Algerian Government Services** application to use your domain `api.findapply.com`.

## 🎯 Recommended Domain Structure

### Option 1: Clean URLs with Direct Access (Your Configuration)
```
https://api.findapply.com              → Next.js App (Clean URL via Nginx)
https://api.findapply.com/mcp          → MCP Server API (Proxied)
https://api.findapply.com:8080         → MCP Server Direct Access
https://api.findapply.com:8080/search  → MCP Search API
https://api.findapply.com:8080/health  → MCP Health Check
https://api.findapply.com:8080/stats   → MCP Statistics
https://api.findapply.com:5556         → Prisma Studio (Direct)
```

### Option 2: Single Domain with Nginx Proxy (Alternative)
```
https://api.findapply.com/                 → Next.js App (Chat Interface)
https://api.findapply.com/api/mcp/search   → MCP API (Proxied)
https://api.findapply.com/api/chat         → Chat API
https://api.findapply.com/health           → System Health
https://api.findapply.com/stats            → Database Stats
```

### Option 2: Subdomain Structure (Alternative)
```
https://app.findapply.com     → Next.js Frontend
https://api.findapply.com     → MCP Server Direct
https://admin.findapply.com   → Prisma Studio/Admin
```

## ⚙️ Configuration Steps

### 1. Environment Variables
```env
# Production environment (.env.production)
NODE_ENV=production
NEXT_PUBLIC_APP_URL="https://api.findapply.com"
DOMAIN="api.findapply.com"
CORS_ORIGIN="https://api.findapply.com"
PORT=3000
MCP_SERVER_PORT=8081
DATABASE_URL="mongodb+srv://ameurbennaoui:JdUvoZGc4oxROKnX@cluster0.auavcz1.mongodb.net/youths_portal?serverSelectionTimeoutMS=30000&connectTimeoutMS=30000&socketTimeoutMS=30000"
```

### 2. DNS Configuration

**Add these DNS records to your domain:**
```
Type    Name    Value               TTL
A       @       YOUR_SERVER_IP      300
A       www     YOUR_SERVER_IP      300
CNAME   api     api.findapply.com   300
CNAME   admin   api.findapply.com   300 (optional)
```

### 3. Nginx Configuration

**Create `/etc/nginx/sites-available/api.findapply.com`:**
```nginx
# Main Application Server Block
server {
    listen 80;
    listen [::]:80;
    server_name api.findapply.com www.api.findapply.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.findapply.com www.api.findapply.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.findapply.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.findapply.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Main Next.js Application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Direct MCP API Access (Optional)
    location /mcp-direct/ {
        proxy_pass http://localhost:8081/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health and monitoring endpoints
    location /system-health {
        proxy_pass http://localhost:8081/health;
        proxy_set_header Host $host;
    }

    # Static files optimization
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Optional: Admin subdomain for Prisma Studio
server {
    listen 443 ssl http2;
    server_name admin.api.findapply.com;

    # SSL Configuration (same as above)
    ssl_certificate /etc/letsencrypt/live/api.findapply.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.findapply.com/privkey.pem;

    # Basic Auth for Admin Access
    auth_basic "Admin Access";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        proxy_pass http://localhost:5556;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate for your domain
sudo certbot --nginx -d api.findapply.com -d www.api.findapply.com

# Optional: Add admin subdomain
sudo certbot --nginx -d admin.api.findapply.com

# Enable auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### 5. Firewall Configuration

```bash
# Configure UFW firewall for api.findapply.com
sudo ufw allow 22         # SSH
sudo ufw allow 80         # HTTP  
sudo ufw allow 443        # HTTPS
sudo ufw allow 3000       # Next.js App (https://api.findapply.com:3000)
sudo ufw allow 8080       # MCP Server Direct (https://api.findapply.com:8080)
sudo ufw allow 5556       # Prisma Studio (optional)
sudo ufw enable

# Note: Ports 3000, 8080, and 5556 are exposed for direct access
# This allows clients to connect directly to each service
```

## 🚀 Deployment Commands

### Quick Deployment for api.findapply.com
```bash
# 1. Update environment for production
cp .env.example .env.production
# Edit with your domain settings

# 2. Deploy with your domain
DOMAIN=api.findapply.com ./deploy.sh

# 3. Configure Nginx
sudo cp nginx.conf /etc/nginx/sites-available/api.findapply.com
sudo ln -s /etc/nginx/sites-available/api.findapply.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 4. Setup SSL
sudo certbot --nginx -d api.findapply.com -d www.api.findapply.com
```

### PM2 Configuration for Production
```javascript
// ecosystem.config.js for api.findapply.com
module.exports = {
  apps: [
    {
      name: 'algerian-services-app',
      script: 'npm',
      args: 'start',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_APP_URL: 'https://api.findapply.com',
        DOMAIN: 'api.findapply.com'
      }
    },
    {
      name: 'algerian-mcp-server',
      script: 'tsx',
      args: 'scripts/mcp-server-http.ts',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        MCP_SERVER_PORT: 8081,
        CORS_ORIGIN: 'https://api.findapply.com'
      }
    }
  ]
};
```

## 🔧 Application URLs

After deployment, your services will be available at:

### 🌐 **Main Services:**
- **🤖 Chat Interface**: https://api.findapply.com:3000
- **🔧 MCP Server API**: https://api.findapply.com:8080
- **⚙️ Prisma Studio**: https://api.findapply.com:5556 (optional)

### 📡 **MCP API Endpoints:**
- **🔍 Search Services**: https://api.findapply.com:8080/search
- **📋 Service Details**: https://api.findapply.com:8080/service/:id
- **📊 Database Stats**: https://api.findapply.com:8080/stats
- **❤️ Health Check**: https://api.findapply.com:8080/health
- **🛠️ Available Tools**: https://api.findapply.com:8080/tools

### 🔗 **Next.js API Endpoints:**
- **💬 Chat API**: https://api.findapply.com:3000/api/chat
- **📊 Session API**: https://api.findapply.com:3000/api/session
- **🔌 Socket.IO**: https://api.findapply.com:3000/api/socket

## 📊 Benefits of Using api.findapply.com

### ✅ **Professional Appearance:**
- Custom domain for government services
- SSL certificate for security
- SEO-friendly subdomain structure

### ✅ **Scalability:**
- Can handle multiple services on subdomains
- Easy to add new features and APIs
- Professional API endpoints

### ✅ **Security:**
- HTTPS encryption for all communications
- Firewall protection for internal ports
- Domain-based access control

### ✅ **User Experience:**
- Easy to remember domain
- Fast global access with proper DNS
- Mobile-friendly with responsive design

## 🎯 Final Result

**Your application will be accessible at:**
**🔗 https://api.findapply.com**

**Features:**
- 🤖 ChatGPT-like interface for government services
- 🔄 Automatic RTL/LTR for Arabic/English text
- 📱 Responsive design for all devices
- 🌊 Streaming API with real-time responses
- 🇩🇿 49+ Algerian government services

Perfect for serving the Algerian community with professional, secure access to government services! 🇩🇿✨