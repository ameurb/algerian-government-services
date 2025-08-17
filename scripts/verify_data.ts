import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyData() {
  console.log('📊 Verifying database content...')
  
  try {
    // Check government services
    const totalServices = await prisma.governmentService.count()
    console.log(`🏛️ Total Government Services: ${totalServices}`)
    
    // Check services by category
    const servicesByCategory = await prisma.governmentService.groupBy({
      by: ['category'],
      _count: {
        id: true
      }
    })
    
    console.log('\n📈 Services by Category:')
    servicesByCategory.forEach(item => {
      console.log(`  ${item.category}: ${item._count.id} services`)
    })
    
    // Check online vs offline services
    const onlineServices = await prisma.governmentService.count({
      where: { isOnline: true }
    })
    
    const offlineServices = await prisma.governmentService.count({
      where: { isOnline: false }
    })
    
    console.log(`\n🌐 Online Services: ${onlineServices}`)
    console.log(`🏢 Offline Services: ${offlineServices}`)
    
    // Check services with external URLs
    const servicesWithUrls = await prisma.governmentService.count({
      where: { 
        onlineUrl: { not: null }
      }
    })
    
    console.log(`🔗 Services with External URLs: ${servicesWithUrls}`)
    
    // Show sample services
    console.log('\n📋 Sample Services:')
    const sampleServices = await prisma.governmentService.findMany({
      take: 5,
      select: {
        name: true,
        nameEn: true,
        category: true,
        isOnline: true,
        onlineUrl: true
      }
    })
    
    sampleServices.forEach((service, index) => {
      console.log(`  ${index + 1}. ${service.name}`)
      console.log(`     English: ${service.nameEn || 'N/A'}`)
      console.log(`     Category: ${service.category}`)
      console.log(`     Online: ${service.isOnline ? 'Yes' : 'No'}`)
      if (service.onlineUrl) {
        console.log(`     URL: ${service.onlineUrl}`)
      }
      console.log('')
    })
    
    // Check other data types
    const userCount = await prisma.user.count()
    const jobCount = await prisma.job.count()
    const courseCount = await prisma.course.count()
    const eventCount = await prisma.event.count()
    
    console.log('📊 Other Data:')
    console.log(`  👥 Users: ${userCount}`)
    console.log(`  💼 Jobs: ${jobCount}`)
    console.log(`  📚 Courses: ${courseCount}`)
    console.log(`  🎪 Events: ${eventCount}`)
    
    console.log('\n✅ Database verification completed!')
    
  } catch (error) {
    console.error('❌ Verification failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyData()
