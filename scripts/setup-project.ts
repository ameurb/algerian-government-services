#!/usr/bin/env tsx

import 'dotenv/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaClient } from '@prisma/client';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

async function setupProject() {
  console.log('🚀 Setting up Algerian Youth Chat App...\n');

  try {
    // Step 1: Install dependencies
    console.log('📦 Installing dependencies...');
    await execAsync('npm install');
    console.log('✅ Dependencies installed\n');

    // Step 2: Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    await execAsync('npx prisma generate');
    console.log('✅ Prisma client generated\n');

    // Step 3: Test database connection
    console.log('🔍 Testing database connection...');
    const serviceCount = await prisma.governmentService.count();
    console.log(`✅ Database connected! Found ${serviceCount} services\n`);

    // Step 4: Check environment variables
    console.log('🔐 Checking environment variables...');
    const requiredEnvVars = [
      'DATABASE_URL',
      'OPENAI_API_KEY',
      'NEXTAUTH_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('⚠️  Missing environment variables:');
      missingVars.forEach(varName => {
        console.log(`   - ${varName}`);
      });
      console.log('\nPlease add these to your .env.local file\n');
    } else {
      console.log('✅ All environment variables configured\n');
    }

    // Step 5: Test OpenAI connection (if API key is present)
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      console.log('🤖 Testing OpenAI connection...');
      try {
        const { openai } = await import('../lib/openai');
        const testCompletion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test connection' }],
          max_tokens: 5,
        });
        console.log('✅ OpenAI connection successful\n');
      } catch (error) {
        console.log('❌ OpenAI connection failed:', (error as Error).message);
        console.log('   App will use fallback responses\n');
      }
    }

    console.log('🎉 Setup complete! You can now run:');
    console.log('   npm run dev    - Start development server');
    console.log('   npm run build  - Build for production');
    console.log('   npm start      - Start production server\n');

    console.log('📱 The chat app will be available at: http://localhost:3000');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupProject();