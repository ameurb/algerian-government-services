#!/usr/bin/env tsx

// 🌐 MongoDB Atlas Connection Test Script
// Tests connection to Atlas and basic operations

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function testAtlasConnection() {
  console.log('🌐 Testing MongoDB Atlas Connection...');
  console.log('Database URL:', process.env.DATABASE_URL?.split('@')[1]?.split('?')[0] || 'Not configured');
  
  try {
    // Test basic connection
    console.log('\n1. 🔌 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Connected to MongoDB Atlas successfully!');
    
    // Test read operation
    console.log('\n2. 📊 Testing read operations...');
    const serviceCount = await prisma.governmentService.count();
    console.log(`✅ Found ${serviceCount} government services in database`);
    
    // Test query performance
    console.log('\n3. ⚡ Testing query performance...');
    const startTime = Date.now();
    const sampleServices = await prisma.governmentService.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        nameEn: true,
        category: true,
      }
    });
    const queryTime = Date.now() - startTime;
    console.log(`✅ Query completed in ${queryTime}ms`);
    
    // Display sample services
    console.log('\n4. 📋 Sample services:');
    sampleServices.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} (${service.nameEn || 'N/A'}) - ${service.category}`);
    });
    
    // Test aggregation
    console.log('\n5. 📈 Testing aggregation queries...');
    const categoryStats = await prisma.governmentService.groupBy({
      by: ['category'],
      _count: {
        category: true
      }
    });
    
    console.log('✅ Services by category:');
    categoryStats.forEach(stat => {
      console.log(`   • ${stat.category}: ${stat._count.category} services`);
    });
    
    // Test write operation (safe)
    console.log('\n6. ✍️  Testing write operations...');
    const testSession = await prisma.session.create({
      data: {
        sessionId: `test-${Date.now()}`,
        deviceId: 'atlas-test-device',
        ipAddress: '127.0.0.1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });
    console.log(`✅ Created test session: ${testSession.sessionId}`);
    
    // Clean up test data
    await prisma.session.delete({
      where: { id: testSession.id }
    });
    console.log('✅ Cleaned up test data');
    
    console.log('\n🎉 MongoDB Atlas connection test completed successfully!');
    console.log('\n📊 Connection Summary:');
    console.log(`   • Database: MongoDB Atlas`);
    console.log(`   • Services: ${serviceCount} government services`);
    console.log(`   • Categories: ${categoryStats.length} categories`);
    console.log(`   • Query Performance: ${queryTime}ms average`);
    console.log(`   • Status: ✅ Ready for production`);
    
  } catch (error) {
    console.error('\n❌ Atlas connection test failed:');
    console.error('Error:', error instanceof Error ? error.message : error);
    
    if (error instanceof Error) {
      if (error.message.includes('authentication')) {
        console.error('\n🔑 Authentication Error:');
        console.error('   • Check your username and password in DATABASE_URL');
        console.error('   • Verify user has read/write permissions');
      } else if (error.message.includes('network')) {
        console.error('\n🌐 Network Error:');
        console.error('   • Check your internet connection');
        console.error('   • Verify Atlas cluster is running');
        console.error('   • Check IP whitelist in Atlas Network Access');
      } else if (error.message.includes('timeout')) {
        console.error('\n⏱️ Timeout Error:');
        console.error('   • Connection timeout - check network latency');
        console.error('   • Try increasing timeout values in connection string');
      }
    }
    
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Verify your DATABASE_URL in .env file');
    console.error('   2. Check Atlas Network Access settings');
    console.error('   3. Ensure cluster is running (not paused)');
    console.error('   4. Test connection from MongoDB Compass');
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAtlasConnection().catch(console.error);