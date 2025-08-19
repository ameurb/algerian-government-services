#!/bin/sh

# Start production services for Algerian Government Services
echo "🚀 Starting Algerian Government Services in production mode..."

# Start MCP server in background
echo "📡 Starting MCP server..."
tsx scripts/mcp-server-http.ts &

# Wait a moment for MCP server to start
sleep 3

# Start the main Next.js application
echo "🌐 Starting Next.js application..."
node .next/standalone/server.js