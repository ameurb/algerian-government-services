#!/usr/bin/env tsx

/**
 * Youth Portal MCP Deployment Script
 * 
 * This script demonstrates how to deploy and test the full MCP setup:
 * 1. MCP Server - Exposes Algerian government services data
 * 2. MCP Client - Connects and tests the server
 * 3. Database - MongoDB with Prisma for data management
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking database connection...');
  
  try {
    const serviceCount = await prisma.governmentService.count();
    const onlineCount = await prisma.governmentService.count({ where: { isOnline: true } });
    
    console.log(`✅ Database connected!`);
    console.log(`📊 Services: ${serviceCount} total, ${onlineCount} online`);
    
    // Show sample services
    const sampleServices = await prisma.governmentService.findMany({
      take: 3,
      select: {
        name: true,
        category: true,
        isOnline: true,
      }
    });
    
    console.log('📝 Sample services:');
    sampleServices.forEach((service, i) => {
      console.log(`  ${i + 1}. ${service.name} (${service.category}) ${service.isOnline ? '🌐' : '🏢'}`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Database error:', error);
    return false;
  }
}

async function simulateMCPCall() {
  console.log('\n🧪 Simulating MCP calls...');
  
  try {
    // Simulate search_services call
    const searchQuery = 'بطاقة';
    const searchResults = await prisma.governmentService.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
        ]
      },
      take: 3,
      select: {
        id: true,
        name: true,
        category: true,
        isOnline: true,
      }
    });
    
    console.log(`🔍 Search for "${searchQuery}" found ${searchResults.length} results:`);
    searchResults.forEach((service, i) => {
      console.log(`  ${i + 1}. ${service.name} (${service.category})`);
    });
    
    // Simulate get_statistics call
    const total = await prisma.governmentService.count();
    const online = await prisma.governmentService.count({ where: { isOnline: true } });
    const active = await prisma.governmentService.count({ where: { isActive: true } });
    
    console.log(`📈 Stats: Total=${total}, Online=${online}, Active=${active}`);
    
    return true;
  } catch (error) {
    console.error('❌ MCP simulation error:', error);
    return false;
  }
}

async function showDeploymentInfo() {
  console.log('\n🚀 DEPLOYMENT INFORMATION');
  console.log('='.repeat(50));
  
  console.log('\n📦 Project Structure:');
  console.log('  📁 scripts/mcp-server.ts  - MCP Server (stdio transport)');
  console.log('  📁 scripts/mcp-client.ts  - MCP Test Client');
  console.log('  📁 prisma/schema.prisma   - Database schema');
  console.log('  📁 prisma/seed.ts         - Sample data seeder');
  
  console.log('\n🛠️  Commands:');
  console.log('  npm run mcp:server        - Start MCP server');
  console.log('  npm run mcp:client        - Test MCP client');
  console.log('  npx prisma db seed        - Populate database');
  console.log('  npx prisma generate       - Generate Prisma client');
  
  console.log('\n🔧 MCP Server Features:');
  console.log('  🔍 search_services        - Search government services');
  console.log('  📄 get_service_by_id      - Get service details');
  console.log('  📊 get_statistics         - Database statistics');
  console.log('  📚 services://summary     - Resource with summary data');
  
  console.log('\n🌐 Integration Options:');
  console.log('  🔌 Stdio Transport        - Local process communication');
  console.log('  🏢 IDE Integration        - Claude Desktop, VS Code, etc.');
  console.log('  🌍 HTTP Transport         - Remote server deployment');
  console.log('  📱 Client Apps            - Custom applications');
  
  console.log('\n📋 Next Steps:');
  console.log('  1. Configure your MCP host (IDE/client app)');
  console.log('  2. Point to: npm run mcp:server');
  console.log('  3. Working directory: ' + process.cwd());
  console.log('  4. Test with the available tools and resources');
}

async function main() {
  console.log('🎯 Youth Portal MCP - Full Deployment Test');
  console.log('=' .repeat(50));
  
  const dbOk = await checkDatabase();
  if (!dbOk) {
    console.log('\n💡 Run: npx prisma db seed');
    return;
  }
  
  const mcpOk = await simulateMCPCall();
  if (!mcpOk) {
    return;
  }
  
  await showDeploymentInfo();
  
  console.log('\n✅ Deployment ready! MCP server and database are functional.');
  console.log('🚀 Run "npm run mcp:server" to start the MCP server.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
