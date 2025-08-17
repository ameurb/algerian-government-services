#!/usr/bin/env tsx

import { io } from 'socket.io-client';

async function testSocketIO() {
  console.log('🧪 Testing Socket.IO connection...\n');

  const socket = io('http://localhost:3002', {
    path: '/api/socket',
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('✅ Socket.IO connected successfully!');
    console.log('Socket ID:', socket.id);
    
    // Test joining a session
    const testSessionId = 'test-session-123';
    socket.emit('join-session', testSessionId);
    console.log(`📝 Joined session: ${testSessionId}`);
    
    // Disconnect after test
    setTimeout(() => {
      socket.disconnect();
      console.log('🔌 Disconnected from socket');
      process.exit(0);
    }, 2000);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket.IO connection failed:', error);
    process.exit(1);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected');
  });

  // Timeout after 10 seconds
  setTimeout(() => {
    console.error('❌ Socket.IO connection timeout');
    process.exit(1);
  }, 10000);
}

testSocketIO();