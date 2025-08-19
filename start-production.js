#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🚀 Starting Algerian Government Services in production mode...');

// Start Next.js application directly - AI semantic search works without MCP server
console.log('🌐 Starting Next.js application with integrated AI...');
const nextApp = spawn('node', ['.next/standalone/server.js'], {
  stdio: 'inherit',
  env: { 
    ...process.env,
    // Ensure required environment variables
    NODE_ENV: 'production',
    PORT: process.env.PORT || '3030'
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down application...');
  nextApp.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down application...');
  nextApp.kill('SIGTERM');
  process.exit(0);
});

// Keep the process alive and handle Next.js app exit
nextApp.on('exit', (code) => {
  console.log(`Next.js application exited with code ${code}`);
  process.exit(code);
});

console.log('✅ Production services started successfully!');