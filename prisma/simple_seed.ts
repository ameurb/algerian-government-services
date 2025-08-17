import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting simple seed process...')

  // Clear existing data
  console.log('🗑️  Clearing government services...')
  await prisma.governmentService.deleteMany()

  // Create a test government service with new schema
  console.log('🏛️ Creating test government service...')
  const testService = await prisma.governmentService.create({
    data: {
      // Basic Information (Bilingual)
      name: 'رخصة السياقة',
      nameEn: 'Driving License',
      description: 'خدمة الحصول على رخصة السياقة أو تجديدها.',
      descriptionEn: 'Service to obtain or renew a driving license.',
      
      // Service Details
      category: 'TRANSPORTATION',
      subcategory: 'رخص المركبات',
      subcategoryEn: 'Vehicle Licenses',
      serviceType: 'خدمة',
      serviceTypeEn: 'Service',
      
      // Government Structure
      sector: 'وزارة النقل',
      sectorEn: 'Ministry of Transport',
      structure: 'مديرية النقل',
      structureEn: 'Transport Directorate',
      ministry: 'Ministry of Transport',
      agency: 'Transport Directorate',
      
      // Target Information
      targetGroup: 'المواطنون من عمر 18 سنة فما فوق',
      targetGroupEn: 'Citizens aged 18 and above',
      targetGroups: ['Citizens', 'Adults', 'Drivers'],
      
      // Service Process
      requirements: [
        'العمر 18 سنة أو أكثر',
        'شهادة طبية',
        'امتحان نظري وعملي'
      ],
      requirementsEn: [
        'Age 18 or above',
        'Medical certificate',
        'Theory and practical exam'
      ],
      process: [
        'التسجيل في مدرسة السياقة',
        'الحصول على الشهادة الطبية',
        'اجتياز الامتحان النظري'
      ],
      processEn: [
        'Register at driving school',
        'Obtain medical certificate',
        'Pass theory exam'
      ],
      documents: [
        'بطاقة التعريف الوطنية',
        'شهادة الميلاد',
        'شهادة طبية'
      ],
      documentsEn: [
        'National ID card',
        'Birth certificate',
        'Medical certificate'
      ],
      
      // Service Details
      fee: '3000-5000 دج',
      duration: '1-3 أشهر',
      processingTime: '1-3 أشهر',
      processingTimeEn: '1-3 months',
      
      // Contact and Access
      office: 'مديرية النقل',
      contactInfo: 'الهاتف: 021-234-567',
      contactPhone: '021-234-567',
      onlineUrl: 'https://transport.gov.dz/license',
      
      // Additional Information
      benefits: ['حرية التنقل', 'القدرة على قيادة المركبات'],
      benefitsEn: ['Freedom of movement', 'Ability to drive vehicles'],
      
      // Location and Availability
      wilaya: null, // National service
      isOnline: true,
      isNational: true,
      isActive: true
    }
  })

  console.log('✅ Simple seed completed successfully!')
  console.log(`📊 Created test service: ${testService.name}`)
}

main()
  .catch((e) => {
    console.error('❌ Simple seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
