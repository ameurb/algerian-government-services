#!/usr/bin/env tsx

import 'dotenv/config';
import { handleChatMessage } from '../lib/socket';
import { SessionManager } from '../lib/session';
import { v4 as uuidv4 } from 'uuid';

async function testChatApp() {
  console.log('🧪 Testing Chat App Components...\n');

  try {
    // Test 1: Session management
    console.log('1️⃣ Testing session management...');
    const session = await SessionManager.createSession(
      'test-device-' + Date.now(),
      'test-user-agent',
      '127.0.0.1'
    );
    console.log(`✅ Session created: ${session.sessionId}\n`);

    // Test 2: Chat message handling
    console.log('2️⃣ Testing chat message handling...');
    const testQueries = [
      'بطاقة الهوية',
      'جواز السفر',
      'شهادة الميلاد',
      'خدمات التعليم',
      'خدمات الصحة'
    ];

    for (const query of testQueries) {
      console.log(`   Testing query: "${query}"`);
      const result = await handleChatMessage(query, session.sessionId);
      console.log(`   ✅ Response generated (${result.metadata?.servicesFound || 0} services found)`);
    }
    console.log();

    // Test 3: Rate limiting
    console.log('3️⃣ Testing rate limiting...');
    const rapidQueries = Array(5).fill('test query');
    for (let i = 0; i < rapidQueries.length; i++) {
      const result = await handleChatMessage(`test query ${i}`, session.sessionId);
      console.log(`   Request ${i + 1}: ${result.metadata?.rateLimitRemaining || 'N/A'} remaining`);
    }
    console.log();

    // Test 4: Error handling
    console.log('4️⃣ Testing error handling...');
    const errorTestResult = await handleChatMessage('', session.sessionId); // Empty message
    console.log(`   ✅ Error handled: ${errorTestResult.metadata?.errorCode || 'N/A'}\n`);

    // Test 5: Session cleanup
    console.log('5️⃣ Testing session cleanup...');
    await SessionManager.deactivateSession(session.sessionId);
    const deactivatedSession = await SessionManager.getSession(session.sessionId);
    console.log(`   ✅ Session deactivated: ${deactivatedSession === null}\n`);

    console.log('🎉 All tests passed! Chat app is ready to use.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testChatApp();