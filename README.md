# 🇩🇿 Algerian Government Services Chat Application

A **ChatGPT-like intelligent assistant** for accessing Algerian government services with **automatic RTL/LTR support**, **MongoDB Atlas integration**, and **streaming HTTP-MCP server**.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)

## 🌟 Features

### 🤖 **ChatGPT-like Interface**
- Natural conversational AI in Arabic, English, and French
- Intelligent responses using real government data
- Interactive sample questions for easy discovery
- Real-time typing indicators with processing stages

### 🔄 **Automatic RTL/LTR Support** 
- Detects Arabic text → displays Right-to-Left (RTL)
- Detects English/French → displays Left-to-Right (LTR)  
- Smart text direction switching in real-time
- Language-aware typography and fonts

### 🌊 **Streaming HTTP-MCP Server**
- Real-time API for government services
- 49+ comprehensive Algerian services from bawabatic.dz
- AI-powered search and categorization
- RESTful endpoints with streaming support

### 📱 **Responsive Design**
- Mobile-first design with touch-friendly interface
- Beautiful gradients and modern UI components
- Works perfectly on all screen sizes
- ChatGPT-style message bubbles

### 🌐 **MongoDB Atlas Integration**
- Cloud-hosted database with global availability
- High performance with automatic scaling
- Enterprise-grade security and backups
- Zero-maintenance managed service

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier available)
- OpenAI API key

### Installation
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/algerian-government-services.git
cd algerian-government-services

# Install dependencies  
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB Atlas and OpenAI credentials

# Generate Prisma client
npx prisma generate

# Seed database with Algerian services
tsx prisma/enhanced_seed.ts

# Start development servers
npm run dev          # Next.js (port 3000)
npm run mcp:http     # MCP Server (port 8081)
```

## 🏗️ Architecture

```
User Query → Next.js App → OpenAI API → MCP HTTP Server → MongoDB Atlas → Response
     ↓              ↓           ↓            ↓                ↓           ↓
[Frontend]    [API Proxy]  [AI Tools]  [HTTP Stream]    [Cloud DB]  [Stream Back]
```

### 🔧 **Components:**

1. **Next.js Frontend** (Port 3000)
   - ChatGPT-like interface with RTL/LTR support
   - Responsive design for all devices
   - Interactive sample questions

2. **HTTP-MCP Server** (Port 8081)
   - Streaming API for government services
   - Real-time database access
   - Health monitoring endpoints

3. **MongoDB Atlas** (Cloud)
   - 49+ Algerian government services
   - Bilingual content (Arabic/English)
   - Automatic scaling and backups

## 📊 Available Services

- **Civil Status** (11 services): National ID, Birth certificates
- **Business** (9 services): Company registration, Commercial certificates  
- **Employment** (8 services): Job platforms, Support programs
- **Housing** (10 services): Housing services and support
- **Education** (4 services): Grants, University services
- **Transportation** (3 services): Driving licenses, Vehicle registration
- **Technology** (2 services): Digital services
- **Social Security** (2 services): Social support programs

## 🧪 Testing

```bash
# Test MongoDB Atlas connection
npm run test:atlas

# Test streaming MCP server
npm run test:streaming

# Run comprehensive test scenarios
npm run test:mcp:scenarios

# Verify deployment
npm run verify:deployment
```

## 🌐 Production Deployment

### Ubuntu Server Deployment
```bash
# One-command deployment
./deploy.sh

# Manual deployment
npm run production:setup
pm2 start ecosystem.config.js
```

### Docker Deployment
```bash
docker-compose up -d
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.

## 📱 Usage Examples

### Chat Interface
- **Arabic**: "بطاقة الهوية الوطنية" → RTL response with Arabic typography
- **English**: "National ID requirements" → LTR response with Latin typography
- **Mixed**: "كيف أحصل على National ID?" → Smart direction detection

### API Usage
```bash
# Search services
curl -X POST http://localhost:8081/search \
  -H "Content-Type: application/json" \
  -d '{"query": "National ID", "limit": 5}'

# Get service details  
curl http://localhost:8081/service/SERVICE_ID

# Database statistics
curl http://localhost:8081/stats
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

- 📧 **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/algerian-government-services/issues)
- 📖 **Documentation**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- 🧪 **Testing**: Run `npm run test:streaming`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**🎉 Built with ❤️ for the Algerian community** 🇩🇿

*Empowering citizens with intelligent access to government services through modern technology.*