#!/bin/bash

# 🇩🇿 Deployment Verification Script
# Checks if all 3 servers are running correctly

echo "🔍 Verifying Algerian Government Services Deployment..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_service() {
    local service_name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "Checking $service_name... "
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

echo
echo "🌐 Testing Web Services:"

# Check Next.js App
check_service "Next.js App" "http://localhost:3000" "200"

# Check MCP Server Health
check_service "MCP Server Health" "http://localhost:8081/health" "200"

# Check MCP Server Tools
check_service "MCP Server Tools" "http://localhost:8081/tools" "200"

# Check MCP Server Stats
check_service "MCP Server Stats" "http://localhost:8081/stats" "200"

echo
echo "🧪 Testing Core Functionality:"

# Test search functionality
echo -n "Testing search functionality... "
search_result=$(curl -s -X POST http://localhost:8081/search -H "Content-Type: application/json" -d '{"query": "National ID", "limit": 1}')
if echo "$search_result" | grep -q '"count"'; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

# Test chat API
echo -n "Testing chat API... "
chat_result=$(curl -s -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"message": "test", "sessionId": "verify-test"}')
if echo "$chat_result" | grep -q '"success"'; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

echo
echo "📊 Service Statistics:"

# Get database stats
stats=$(curl -s http://localhost:8081/stats)
if [ $? -eq 0 ]; then
    echo "$stats" | jq -r '
        "📁 Total Services: " + (.total | tostring) + 
        "\n🌐 Online Services: " + (.online | tostring) + 
        "\n✅ Active Services: " + (.active | tostring)
    ' 2>/dev/null || echo "$stats"
else
    echo -e "${RED}❌ Could not retrieve statistics${NC}"
fi

echo
echo "🔧 Process Status:"

# Check PM2 processes
if command -v pm2 &> /dev/null; then
    pm2 status
else
    echo -e "${YELLOW}⚠️  PM2 not found. Services may be running manually.${NC}"
fi

echo
echo "🎉 Verification Complete!"
echo
echo -e "${GREEN}✅ Access your application at:${NC}"
echo "  📱 Web App: http://localhost:3000"
echo "  🔧 MCP API: http://localhost:8081"
echo "  📊 Health Check: http://localhost:8081/health"
echo "  📈 Statistics: http://localhost:8081/stats"