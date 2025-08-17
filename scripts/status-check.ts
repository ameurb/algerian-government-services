#!/usr/bin/env tsx

/**
 * Quick Status Check - Verify MCP setup is ready
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function checkStatus() {
  console.log('🔍 Youth Portal MCP - Status Check');
  console.log('=' .repeat(40));

  const checks = [];

  // Check 1: Database connection
  try {
    await prisma.$connect();
    const serviceCount = await prisma.governmentService.count();
    checks.push({
      name: 'Database Connection',
      status: 'PASS',
      detail: `${serviceCount} services available`
    });
  } catch (error) {
    checks.push({
      name: 'Database Connection',
      status: 'FAIL',
      detail: 'Cannot connect to MongoDB'
    });
  }

  // Check 2: MCP Server file
  const serverPath = path.join(process.cwd(), 'scripts', 'mcp-server.ts');
  checks.push({
    name: 'MCP Server File',
    status: fs.existsSync(serverPath) ? 'PASS' : 'FAIL',
    detail: fs.existsSync(serverPath) ? 'Server file exists' : 'Server file missing'
  });

  // Check 3: Dependencies
  const packagePath = path.join(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const hasMCP = pkg.dependencies?.['@modelcontextprotocol/sdk'];
  checks.push({
    name: 'MCP Dependencies',
    status: hasMCP ? 'PASS' : 'FAIL',
    detail: hasMCP ? `SDK v${hasMCP}` : 'MCP SDK not installed'
  });

  // Check 4: Prisma setup
  const prismaPath = path.join(process.cwd(), 'node_modules', '.prisma', 'client');
  checks.push({
    name: 'Prisma Client',
    status: fs.existsSync(prismaPath) ? 'PASS' : 'FAIL',
    detail: fs.existsSync(prismaPath) ? 'Generated' : 'Run: npx prisma generate'
  });

  // Display results
  console.log('\n📋 Status Checks:');
  checks.forEach(check => {
    const icon = check.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${check.name}: ${check.detail}`);
  });

  const allPassed = checks.every(check => check.status === 'PASS');
  
  console.log('\n📊 Overall Status:', allPassed ? '✅ READY' : '❌ NEEDS ATTENTION');

  if (allPassed) {
    console.log('\n🚀 Ready to use! Commands:');
    console.log('  npm start          - Start MCP server');
    console.log('  npm test           - Test functionality');
    console.log('  npm run deploy:test - Full deployment test');
  } else {
    console.log('\n🔧 Fix the failed checks above, then run this status check again.');
  }

  return allPassed;
}

checkStatus()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
