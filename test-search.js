require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSearch() {
  try {
    console.log('🔍 Testing database content and search...\n');
    
    // Test 1: Count all services
    const totalServices = await prisma.governmentService.count();
    console.log(`📊 Total services in database: ${totalServices}`);
    
    // Test 2: Search by categories
    const civilStatusServices = await prisma.governmentService.findMany({
      where: { category: 'CIVIL_STATUS' },
      select: { id: true, name: true, nameEn: true }
    });
    console.log(`\n🆔 Civil Status services (${civilStatusServices.length}):`);
    civilStatusServices.forEach(service => {
      console.log(`  - ${service.name} (${service.nameEn})`);
    });
    
    // Test 3: Search for "بطاقة الهوية" using the same logic as the app
    const searchTerms = ['بطاقة الهوية', 'بطاقة التعريف', 'National ID', 'ID card'];
    
    for (const term of searchTerms) {
      console.log(`\n🔎 Searching for "${term}":`);
      
      const results = await prisma.governmentService.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { nameEn: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
            { descriptionEn: { contains: term, mode: 'insensitive' } },
          ]
        },
        take: 5,
        select: {
          id: true,
          name: true,
          nameEn: true,
          description: true,
          category: true
        }
      });
      
      console.log(`  Results found: ${results.length}`);
      results.forEach(service => {
        console.log(`    - ${service.name} (${service.category})`);
      });
    }
    
    // Test 4: Sample of all service names
    console.log('\n📋 Sample of all service names:');
    const sampleServices = await prisma.governmentService.findMany({
      take: 10,
      select: { name: true, nameEn: true, category: true }
    });
    sampleServices.forEach(service => {
      console.log(`  - ${service.name} (${service.category})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSearch();