#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🚀 Starting Algerian Government Services in production mode...');

// Start MCP server in background
console.log('📡 Starting MCP server...');
const mcpServer = spawn('node', ['-r', 'tsx/cjs', 'scripts/mcp-server-http.ts'], {
  stdio: 'inherit',
  env: { ...process.env }
});

// Give MCP server a moment to start
setTimeout(() => {
  console.log('🌐 Starting Next.js application...');
  // Start the main Next.js application
  const nextApp = spawn('node', ['.next/standalone/server.js'], {
    stdio: 'inherit',
    env: { ...process.env }
  });

  // Handle process cleanup
  process.on('SIGTERM', () => {
    console.log('Shutting down services...');
    mcpServer.kill('SIGTERM');
    nextApp.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    console.log('Shutting down services...');
    mcpServer.kill('SIGTERM');
    nextApp.kill('SIGTERM');
  });

}, 3000);

// Keep the process alive
mcpServer.on('exit', (code) => {
  console.log(`MCP server exited with code ${code}`);
});