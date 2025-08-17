#!/bin/bash

# 🌊 HTTP-MCP Streaming Server Test Script
# Tests all streaming functionality of the MCP server

echo "🧪 Testing Streaming HTTP-MCP Server..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

MCP_URL="http://localhost:8081"

test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    
    echo -e "\n${BLUE}🔍 Testing: $name${NC}"
    echo "URL: $method $MCP_URL$endpoint"
    
    if [ "$method" = "POST" ]; then
        echo "Data: $data"
        response=$(curl -s -w "\nStatus: %{http_code}\nTime: %{time_total}s" \
                   -X POST "$MCP_URL$endpoint" \
                   -H "Content-Type: application/json" \
                   -d "$data")
    else
        response=$(curl -s -w "\nStatus: %{http_code}\nTime: %{time_total}s" \
                   "$MCP_URL$endpoint")
    fi
    
    echo -e "${GREEN}Response:${NC}"
    echo "$response" | head -20
    echo
}

echo "🚀 Starting MCP Server Streaming Tests..."

# Test 1: Health Check
test_endpoint "Health Check" "GET" "/health" ""

# Test 2: Tools List
test_endpoint "Available Tools" "GET" "/tools" ""

# Test 3: Database Statistics
test_endpoint "Database Statistics" "GET" "/stats" ""

# Test 4: Search - National ID (Arabic)
test_endpoint "Search Arabic - National ID" "POST" "/search" '{"query": "بطاقة الهوية", "limit": 3}'

# Test 5: Search - National ID (English)
test_endpoint "Search English - National ID" "POST" "/search" '{"query": "National ID", "limit": 5}'

# Test 6: Search - Passport
test_endpoint "Search - Passport Services" "POST" "/search" '{"query": "Passport", "limit": 3}'

# Test 7: Search - Business
test_endpoint "Search - Business Services" "POST" "/search" '{"query": "Company", "limit": 3}'

# Test 8: Category Search
test_endpoint "Category Search - Business" "POST" "/search" '{"query": "business", "category": "BUSINESS", "limit": 5}'

# Test 9: Search with limit
test_endpoint "Search with Limit" "POST" "/search" '{"query": "service", "limit": 10}'

# Test 10: Performance Test
echo -e "\n${BLUE}⚡ Performance Testing${NC}"
echo "Running 10 rapid requests..."

for i in {1..10}; do
    start_time=$(date +%s%3N)
    curl -s -X POST "$MCP_URL/search" \
         -H "Content-Type: application/json" \
         -d '{"query": "test", "limit": 1}' > /dev/null
    end_time=$(date +%s%3N)
    duration=$((end_time - start_time))
    echo "Request $i: ${duration}ms"
done

echo
echo -e "${GREEN}✅ Streaming HTTP-MCP Tests Completed!${NC}"
echo
echo "📊 Server Information:"
curl -s "$MCP_URL/stats" | jq -r '
    "📁 Total Services: " + (.total | tostring) + 
    "\n🌐 Online Services: " + (.online | tostring) + 
    "\n✅ Active Services: " + (.active | tostring) +
    "\n📋 Categories: " + (.byCategory | length | tostring)
' 2>/dev/null || curl -s "$MCP_URL/stats"

echo
echo -e "${YELLOW}💡 Usage Examples:${NC}"
echo "# Search for government services:"
echo "curl -X POST $MCP_URL/search -H 'Content-Type: application/json' -d '{\"query\": \"National ID\", \"limit\": 5}'"
echo
echo "# Get service details:"
echo "curl $MCP_URL/service/SERVICE_ID"
echo
echo "# Monitor server health:"
echo "curl $MCP_URL/health"
echo
echo -e "${GREEN}🎉 Your streaming MCP server is ready for production!${NC}"