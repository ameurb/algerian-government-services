import { PrismaClient } from '@prisma/client'
import { allBawaiticServicesComprehensive } from './bawabatic_comprehensive_seed'

const prisma = new PrismaClient()

async function enhancedSeed() {
  console.log('🌱 Starting enhanced comprehensive seed...')
  
  try {
    // Clear existing government services only
    console.log('🗑️  Clearing existing government services...')
    await prisma.governmentService.deleteMany()
    
    console.log('🏛️ Processing bawabatic.dz services...')
    
    // Process services in batches for better performance
    const batchSize = 10
    const services = allBawaiticServicesComprehensive
    
    console.log(`📊 Processing ${services.length} services in batches of ${batchSize}`)
    
    let processedCount = 0
    
    for (let i = 0; i < services.length; i += batchSize) {
      const batch = services.slice(i, i + batchSize)
      
      const mappedBatch = batch.map((service: any) => ({
        // Basic Information (Bilingual)
        name: service.name || service.nameAr || service.serviceName || 'خدمة حكومية',
        nameEn: service.nameEn || generateEnglishName(service.name) || null,
        description: service.description || service.descriptionAr || service.serviceDescription || 'وصف الخدمة',
        descriptionEn: service.descriptionEn || generateEnglishDescription(service.description) || null,
        
        // Service Details
        serviceId: service.serviceId || service.id || null,
        category: mapServiceCategory(service.category || service.categoryEn || 'OTHER'),
        subcategory: service.subcategory || extractSubcategory(service.name) || null,
        subcategoryEn: service.subcategoryEn || null,
        serviceType: service.serviceType || 'خدمة',
        serviceTypeEn: service.serviceTypeEn || 'Service',
        
        // Government Structure
        sector: service.sector || service.sectorAr || extractSector(service.description) || null,
        sectorEn: service.sectorEn || translateSector(service.sector) || null,
        structure: service.structure || service.structureAr || service.agency || null,
        structureEn: service.structureEn || translateStructure(service.structure) || null,
        ministry: service.ministry || extractMinistry(service.sector) || null,
        agency: service.agency || service.structure || null,
        
        // Target Information
        targetGroup: service.targetGroup || service.targetGroupAr || 'مواطنين',
        targetGroupEn: service.targetGroupEn || 'Citizens',
        targetGroups: Array.isArray(service.targetGroups) ? service.targetGroups : 
                     service.eligibility ? [service.eligibility] : ['Citizens'],
        
        // Service Process
        requirements: Array.isArray(service.requirements) ? service.requirements :
                     Array.isArray(service.requiredDocuments) ? service.requiredDocuments :
                     generateDefaultRequirements(service.name),
        requirementsEn: Array.isArray(service.requirementsEn) ? service.requirementsEn : [],
        process: Array.isArray(service.process) ? service.process : generateDefaultProcess(service),
        processEn: Array.isArray(service.processEn) ? service.processEn : generateDefaultProcessEn(service),
        documents: Array.isArray(service.documents) ? service.documents :
                  Array.isArray(service.requiredDocuments) ? service.requiredDocuments :
                  generateDefaultDocuments(),
        documentsEn: Array.isArray(service.documentsEn) ? service.documentsEn : 
                    ['National ID', 'Application form', 'Supporting documents'],
        
        // Service Details
        fee: service.fee || service.cost || determineFee(service.name),
        duration: service.duration || 'غير محدد',
        processingTime: service.processingTime || service.processingTimeAr || estimateProcessingTime(service.name),
        processingTimeEn: service.processingTimeEn || translateProcessingTime(service.processingTime),
        
        // Contact and Access
        office: service.office || service.agency || service.structure || 'المكتب المختص',
        contactInfo: service.contactInfo || service.contact || 'اتصل بالمكتب المختص',
        contactPhone: service.contactPhone || service.phone || null,
        contactEmail: service.contactEmail || service.email || null,
        onlineUrl: service.externalUrl || service.onlineUrl || null,
        bawabticUrl: service.bawabticUrl || service.sourceUrl || null,
        
        // Additional Information
        legalFramework: service.legalFramework || service.legalBasis || null,
        appeals: service.appeals || service.appealsProcess || 'يمكن الطعن وفقاً للقوانين المعمول بها',
        appealsEn: service.appealsEn || 'Appeals can be made according to applicable laws',
        benefits: Array.isArray(service.benefits) ? service.benefits :
                 Array.isArray(service.outcomes) ? service.outcomes :
                 generateDefaultBenefits(service.name),
        benefitsEn: Array.isArray(service.benefitsEn) ? service.benefitsEn : 
                   generateDefaultBenefitsEn(service.name),
        notes: service.notes || service.additionalInfo || null,
        
        // Location and Availability
        wilaya: service.wilaya || determineWilaya(service),
        isOnline: Boolean(service.externalUrl || service.onlineUrl || service.isOnline),
        isNational: !service.wilaya && !service.localArea,
        isActive: service.isActive !== false
      }))
      
      // Create services in batch
      await prisma.governmentService.createMany({
        data: mappedBatch
      })
      
      processedCount += mappedBatch.length
      console.log(`  ✅ Processed batch ${Math.floor(i/batchSize) + 1}: ${processedCount}/${services.length} services`)
    }
    
    console.log(`✅ Enhanced seed completed successfully!`)
    console.log(`📊 Total services created: ${processedCount}`)
    
  } catch (error) {
    console.error('❌ Enhanced seed failed:', error)
    throw error
  }
}

// Helper functions for data processing
function mapServiceCategory(category: string): any {
  const categoryMap: { [key: string]: any } = {
    'Employment and Jobs': 'EMPLOYMENT',
    'العمل والتوظيف': 'EMPLOYMENT',
    'Housing and Urban Development': 'HOUSING',
    'السكن والعمران': 'HOUSING',
    'Commerce-Finance': 'BUSINESS',
    'التجارة-المالية': 'BUSINESS',
    'Education and Learning': 'EDUCATION',
    'التربية و التعليم': 'EDUCATION',
    'Social Security': 'SOCIAL_SECURITY',
    'الضمان الإجتماعي': 'SOCIAL_SECURITY',
    'Technology and Communications': 'TECHNOLOGY',
    'تكنولوجيا-الاتصالات': 'TECHNOLOGY',
    'Transportation': 'TRANSPORTATION',
    'المواصلات': 'TRANSPORTATION',
    'Civil Status': 'CIVIL_STATUS',
    'الحالة المدنية': 'CIVIL_STATUS',
    'Health': 'HEALTH',
    'الصحة': 'HEALTH',
    'Environment': 'ENVIRONMENT',
    'البيئة': 'ENVIRONMENT',
    'Agriculture': 'AGRICULTURE',
    'الفلاحة': 'AGRICULTURE'
  }
  return categoryMap[category] || 'OTHER'
}

function generateEnglishName(arabicName: string): string {
  const translations: { [key: string]: string } = {
    'رخصة السياقة': 'Driving License',
    'بطاقة التعريف': 'National ID Card',
    'جواز السفر': 'Passport',
    'شهادة الميلاد': 'Birth Certificate',
    'رخصة البناء': 'Building Permit',
    'التسجيل': 'Registration',
    'التوظيف': 'Employment',
    'الضمان': 'Insurance',
    'الصحة': 'Health'
  }
  
  for (const [arabic, english] of Object.entries(translations)) {
    if (arabicName.includes(arabic)) {
      return arabicName.replace(arabic, english)
    }
  }
  
  return arabicName
}

function generateEnglishDescription(arabicDesc: string): string {
  if (!arabicDesc) return ''
  
  // Simple keyword replacement for common terms
  let englishDesc = arabicDesc
    .replace(/خدمة/g, 'service')
    .replace(/إجراء/g, 'procedure')
    .replace(/طلب/g, 'application')
    .replace(/مواطن/g, 'citizen')
    .replace(/حكومة/g, 'government')
  
  return englishDesc
}

function extractSubcategory(serviceName: string): string | null {
  if (serviceName.includes('رخصة')) return 'تراخيص'
  if (serviceName.includes('بطاقة')) return 'بطائق'
  if (serviceName.includes('شهادة')) return 'شهادات'
  if (serviceName.includes('تسجيل')) return 'تسجيل'
  return null
}

function extractSector(description: string): string | null {
  const sectorPatterns = [
    /وزارة\s+([^،\n.]+)/,
    /قطاع\s+([^،\n.]+)/,
    /مديرية\s+([^،\n.]+)/
  ]
  
  for (const pattern of sectorPatterns) {
    const match = description.match(pattern)
    if (match) return match[1].trim()
  }
  
  return null
}

function translateSector(arabicSector: string): string | null {
  if (!arabicSector) return null
  
  const sectorTranslations: { [key: string]: string } = {
    'وزارة التعليم العالي': 'Ministry of Higher Education',
    'وزارة العمل': 'Ministry of Labor',
    'وزارة الصحة': 'Ministry of Health',
    'وزارة النقل': 'Ministry of Transport',
    'وزارة السكن': 'Ministry of Housing',
    'وزارة التجارة': 'Ministry of Commerce'
  }
  
  for (const [arabic, english] of Object.entries(sectorTranslations)) {
    if (arabicSector.includes(arabic)) {
      return english
    }
  }
  
  return arabicSector
}

function translateStructure(arabicStructure: string): string | null {
  if (!arabicStructure) return null
  
  return arabicStructure
    .replace(/مديرية/g, 'Directorate of')
    .replace(/وكالة/g, 'Agency of')
    .replace(/مصلحة/g, 'Department of')
}

function extractMinistry(sector: string): string | null {
  if (!sector) return null
  if (sector.includes('وزارة')) return sector
  return null
}

function generateDefaultRequirements(serviceName: string): string[] {
  const baseRequirements = [
    'بطاقة التعريف الوطنية',
    'استمارة الطلب مملوءة',
    'الوثائق المطلوبة'
  ]
  
  if (serviceName.includes('رخصة')) {
    return [...baseRequirements, 'شهادة طبية', 'صور شمسية']
  }
  
  if (serviceName.includes('شهادة')) {
    return [...baseRequirements, 'وثائق إثبات', 'رسوم الخدمة']
  }
  
  return baseRequirements
}

function generateDefaultProcess(service: any): string[] {
  const isOnline = Boolean(service.externalUrl)
  
  if (isOnline) {
    return [
      'الدخول إلى المنصة الإلكترونية',
      'إنشاء حساب أو تسجيل الدخول',
      'ملء البيانات المطلوبة',
      'رفع الوثائق المطلوبة',
      'تقديم الطلب إلكترونياً',
      'متابعة حالة الطلب',
      'استلام الخدمة'
    ]
  }
  
  return [
    'تحضير الوثائق المطلوبة',
    'ملء استمارة الطلب',
    'تقديم الطلب للمكتب المختص',
    'دفع الرسوم المطلوبة',
    'انتظار معالجة الطلب',
    'استلام الخدمة'
  ]
}

function generateDefaultProcessEn(service: any): string[] {
  const isOnline = Boolean(service.externalUrl)
  
  if (isOnline) {
    return [
      'Access online platform',
      'Create account or login',
      'Fill required information',
      'Upload required documents',
      'Submit application electronically',
      'Track application status',
      'Receive service'
    ]
  }
  
  return [
    'Prepare required documents',
    'Fill application form',
    'Submit application to relevant office',
    'Pay required fees',
    'Wait for processing',
    'Receive service'
  ]
}

function generateDefaultDocuments(): string[] {
  return [
    'بطاقة التعريف الوطنية',
    'استمارة الطلب',
    'صور شمسية',
    'الوثائق الداعمة'
  ]
}

function determineFee(serviceName: string): string {
  if (serviceName.includes('رخصة السياقة')) return '3000-5000 دج'
  if (serviceName.includes('جواز السفر')) return '6000 دج'
  if (serviceName.includes('بطاقة التعريف')) return '200 دج'
  if (serviceName.includes('شهادة')) return '100-500 دج'
  return 'حسب التعريفة المعمول بها'
}

function estimateProcessingTime(serviceName: string): string {
  if (serviceName.includes('رخصة السياقة')) return '1-3 أشهر'
  if (serviceName.includes('جواز السفر')) return '15-30 يوم'
  if (serviceName.includes('بطاقة التعريف')) return '7-15 يوم'
  if (serviceName.includes('شهادة')) return '3-7 أيام'
  return '7-30 يوم'
}

function translateProcessingTime(arabicTime: string): string | null {
  if (!arabicTime) return null
  
  return arabicTime
    .replace(/يوم/g, 'days')
    .replace(/أسبوع/g, 'weeks')
    .replace(/شهر/g, 'months')
    .replace(/سنة/g, 'years')
}

function generateDefaultBenefits(serviceName: string): string[] {
  if (serviceName.includes('رخصة')) return ['حق قانوني', 'تسهيل الإجراءات', 'خدمة رسمية']
  if (serviceName.includes('شهادة')) return ['إثبات رسمي', 'وثيقة معتمدة', 'صلاحية قانونية']
  return ['خدمة حكومية', 'تسهيل للمواطن', 'إجراء رسمي']
}

function generateDefaultBenefitsEn(serviceName: string): string[] {
  if (serviceName.includes('رخصة')) return ['Legal right', 'Procedure facilitation', 'Official service']
  if (serviceName.includes('شهادة')) return ['Official proof', 'Certified document', 'Legal validity']
  return ['Government service', 'Citizen facilitation', 'Official procedure']
}

function determineWilaya(service: any): string | null {
  // National services return null (available in all wilayas)
  if (service.ministry || service.sector?.includes('وزارة')) return null
  
  // Local services get assigned to major cities
  const majorWilayas = ['Alger', 'Oran', 'Constantine', 'Sétif', 'Annaba', 'Blida', 'Batna', 'Djelfa']
  return majorWilayas[Math.floor(Math.random() * majorWilayas.length)]
}

// Run the enhanced seed
if (require.main === module) {
  enhancedSeed()
    .then(() => {
      console.log('🎉 Enhanced seeding completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Enhanced seeding failed:', error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export { enhancedSeed }
