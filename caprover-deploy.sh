#!/bin/bash

# 🐳 CapRover Deployment Script for dzservices.findapply.com
# Automated deployment to CapRover

set -e

echo "🇩🇿 Deploying Algerian Government Services to CapRover..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if CapRover CLI is installed
if ! command -v caprover &> /dev/null; then
    print_error "CapRover CLI not found. Installing..."
    npm install -g caprover
    print_status "CapRover CLI installed"
fi

# Check if logged in to CapRover
print_info "Checking CapRover authentication..."
if ! caprover list &> /dev/null; then
    print_warning "Not logged in to CapRover. Please login first:"
    echo "Run: caprover login"
    echo "Then run this script again."
    exit 1
fi

print_status "CapRover authentication verified"

# Build and deploy
print_info "Building and deploying to CapRover..."
print_info "App name: dzservices"
print_info "Domain: dzservices.findapply.com"

# Deploy to CapRover
print_info "Starting deployment..."
caprover deploy -t captain-definition -a dzservices

if [ $? -eq 0 ]; then
    print_status "🎉 Deployment successful!"
    echo
    print_info "📱 Your application is now available at:"
    echo "  🤖 Main Chat: https://dzservices.findapply.com"
    echo "  📊 Dashboard: https://dzservices.findapply.com/dashboard"
    echo "  📡 API: https://dzservices.findapply.com/api"
    echo "  🗄️ Database: https://dzservices.findapply.com/prisma"
    echo
    print_info "🔧 Don't forget to:"
    echo "  1. Set environment variables in CapRover dashboard"
    echo "  2. Configure custom domain (dzservices.findapply.com)"
    echo "  3. Enable HTTPS and Force HTTPS"
    echo "  4. Test all endpoints"
    echo
    print_info "📚 Environment variables template available in:"
    echo "  📄 caprover.env - Copy to CapRover dashboard"
    echo
    print_status "🇩🇿 Algerian Government Services deployed successfully!"
else
    print_error "Deployment failed. Check CapRover logs for details."
    echo "Debug commands:"
    echo "  caprover logs -a dzservices"
    echo "  caprover deploy -t captain-definition -a dzservices"
    exit 1
fi