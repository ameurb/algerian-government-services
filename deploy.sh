#!/bin/bash

# 🇩🇿 Algerian Government Services - Ubuntu Deployment Script
# This script automates the deployment of all 3 servers

set -e

echo "🇩🇿 Starting Algerian Government Services Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

print_info "Step 1: System Prerequisites"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_warning "Node.js not found. Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_status "Node.js installed"
else
    print_status "Node.js found: $(node --version)"
fi

# Check if using Atlas or local MongoDB
if grep -q "mongodb+srv://" .env 2>/dev/null || grep -q "mongodb+srv://" .env.example 2>/dev/null; then
    print_info "Using MongoDB Atlas (cloud database)"
    print_status "MongoDB Atlas configured - no local installation needed"
else
    # Check MongoDB for local installation
    if ! command -v mongod &> /dev/null; then
        print_warning "MongoDB not found. Installing MongoDB locally..."
        wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
        echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
        sudo apt-get update
        sudo apt-get install -y mongodb-org
        sudo systemctl start mongod
        sudo systemctl enable mongod
        print_status "MongoDB installed and started"
    else
        print_status "MongoDB found"
    fi
fi

# Check PM2
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not found. Installing PM2..."
    sudo npm install -g pm2
    print_status "PM2 installed"
else
    print_status "PM2 found: $(pm2 --version)"
fi

print_info "Step 2: Project Setup"

# Install dependencies
print_info "Installing NPM dependencies..."
npm install
print_status "Dependencies installed"

# Check for .env file
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_warning "Please edit .env file with your configuration:"
        print_warning "- Add your OPENAI_API_KEY"
        print_warning "- Configure DATABASE_URL if needed"
        read -p "Press Enter after updating .env file..."
    else
        print_error ".env.example not found. Please create .env manually"
        exit 1
    fi
else
    print_status ".env file found"
fi

print_info "Step 3: Database Setup"

# Handle Atlas vs Local MongoDB
if grep -q "mongodb+srv://" .env; then
    print_info "Using MongoDB Atlas - testing connection..."
    # Test Atlas connection
    if npx prisma db push --accept-data-loss > /dev/null 2>&1; then
        print_status "MongoDB Atlas connected successfully"
    else
        print_error "Failed to connect to MongoDB Atlas. Please check your connection string."
        exit 1
    fi
else
    # Start local MongoDB if not using Atlas
    sudo systemctl start mongod
    print_status "Local MongoDB started"
fi

# Generate Prisma client
print_info "Generating Prisma client..."
npx prisma generate
print_status "Prisma client generated"

# Seed database
print_info "Seeding database with Algerian government services..."
tsx prisma/enhanced_seed.ts
print_status "Database seeded with comprehensive data"

print_info "Step 4: Build Application"

# Build Next.js app
print_info "Building Next.js application..."
npm run build
print_status "Application built successfully"

print_info "Step 5: Starting Services with PM2"

# Get domain from environment or use default
DOMAIN=${DOMAIN:-"dzservices.findapply.com"}
print_info "Configuring for domain: $DOMAIN"

# Create PM2 ecosystem config for api.findapply.com
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'algerian-nextjs',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_APP_URL: 'https://$DOMAIN',
        DOMAIN: '$DOMAIN',
        CORS_ORIGIN: 'https://$DOMAIN'
      }
    },
    {
      name: 'algerian-mcp',
      script: 'tsx',
      args: 'scripts/mcp-server-http.ts',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        MCP_SERVER_PORT: 8080,
        CORS_ORIGIN: 'https://$DOMAIN',
        DOMAIN: '$DOMAIN'
      }
    }
  ]
};
EOF

# Start services
pm2 start ecosystem.config.js
print_status "Services started with PM2"

# Save PM2 configuration
pm2 save
print_status "PM2 configuration saved"

print_info "Step 6: Verification"

# Wait for services to start
sleep 5

# Test Next.js app
if curl -s http://localhost:3000 > /dev/null; then
    print_status "Next.js app is running on http://localhost:3000"
else
    print_error "Next.js app is not responding"
fi

# Test MCP server
if curl -s http://localhost:8081/health > /dev/null; then
    print_status "MCP server is running on http://localhost:8081"
else
    print_error "MCP server is not responding"
fi

# Show PM2 status
echo
print_info "Current PM2 Status:"
pm2 status

echo
print_status "🎉 Deployment completed successfully!"
echo
print_info "Access your application at:"
echo "  📱 Web Application: http://localhost:3000"
echo "  🔧 MCP Server API: http://localhost:8081"
echo "  📊 Database Stats: http://localhost:8081/stats"
echo
print_info "Useful commands:"
echo "  📊 Check status: pm2 status"
echo "  📝 View logs: pm2 logs"
echo "  🔄 Restart: pm2 restart all"
echo "  🛑 Stop: pm2 stop all"
echo
print_status "Your Algerian Government Services Chat Application is ready! 🇩🇿✨"