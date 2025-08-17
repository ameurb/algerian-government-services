import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');
    
    const serviceCount = await prisma.governmentService.count();
    console.log(`✅ Database connected! Found ${serviceCount} government services.`);
    
    const sampleServices = await prisma.governmentService.findMany({
      take: 3,
      select: {
        name: true,
        nameEn: true,
        category: true,
        isOnline: true
      }
    });
    
    console.log('\n📋 Sample services:');
    sampleServices.forEach((service, index) => {
      console.log(`${index + 1}. ${service.name} (${service.nameEn || 'N/A'})`);
      console.log(`   Category: ${service.category}, Online: ${service.isOnline ? '✅' : '❌'}`);
    });
    
    console.log('\n🎯 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
