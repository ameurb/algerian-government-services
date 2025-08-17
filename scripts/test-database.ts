import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const testDatabase = async () => {
  console.log('🗄️ Testing Database Connection');
  console.log('='.repeat(40));

  try {
    // Test basic connection
    console.log('📡 Connecting to database...');
    
    // Count total services
    const totalServices = await prisma.governmentService.count();
    console.log(`✅ Total services: ${totalServices}`);
    
    // Count online services
    const onlineServices = await prisma.governmentService.count({
      where: { isOnline: true }
    });
    console.log(`🌐 Online services: ${onlineServices}`);
    
    // Count active services
    const activeServices = await prisma.governmentService.count({
      where: { isActive: true }
    });
    console.log(`⚡ Active services: ${activeServices}`);
    
    // Test search functionality
    console.log('\n🔍 Testing search functionality...');
    
    const passportServices = await prisma.governmentService.findMany({
      where: {
        OR: [
          { name: { contains: 'جواز', mode: 'insensitive' } },
          { nameEn: { contains: 'passport', mode: 'insensitive' } },
          { description: { contains: 'جواز', mode: 'insensitive' } },
          { descriptionEn: { contains: 'passport', mode: 'insensitive' } }
        ],
        isActive: true
      },
      take: 3
    });
    
    console.log(`📋 Found ${passportServices.length} passport-related services:`);
    passportServices.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} (${service.category})`);
      if (service.nameEn) {
        console.log(`      English: ${service.nameEn}`);
      }
    });
    
    // Test employment services
    console.log('\n💼 Testing employment services...');
    
    const employmentServices = await prisma.governmentService.findMany({
      where: {
        category: 'EMPLOYMENT',
        isActive: true
      },
      take: 3
    });
    
    console.log(`📋 Found ${employmentServices.length} employment services:`);
    employmentServices.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} (${service.category})`);
    });
    
    // Test categories breakdown
    console.log('\n📊 Services by category:');
    
    const categories = await prisma.governmentService.groupBy({
      by: ['category'],
      _count: {
        id: true
      },
      where: {
        isActive: true
      }
    });
    
    categories.forEach(cat => {
      console.log(`   ${cat.category}: ${cat._count.id} services`);
    });
    
    console.log('\n✅ Database connection and queries working perfectly!');
    console.log('💡 The database is ready for the chat application.');
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
};

testDatabase().catch(console.error);
