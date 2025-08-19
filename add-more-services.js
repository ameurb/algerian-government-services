require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addMoreServices() {
  try {
    console.log('🌱 Adding more comprehensive government services...\n');
    
    const newServices = [
      // Education Grants and Scholarships
      {
        name: 'منح التعليم العالي للطلبة المتفوقين',
        nameEn: 'Higher Education Scholarships for Outstanding Students',
        description: 'منح دراسية للطلبة المتفوقين أكاديمياً للدراسة في الجامعات الجزائرية والأجنبية',
        descriptionEn: 'Academic scholarships for outstanding students to study in Algerian and foreign universities',
        category: 'EDUCATION',
        subcategory: 'منح التعليم',
        subcategoryEn: 'Education Grants',
        serviceType: 'منحة',
        serviceTypeEn: 'Grant',
        sector: 'وزارة التعليم العالي والبحث العلمي',
        sectorEn: 'Ministry of Higher Education and Scientific Research',
        targetGroup: 'الطلبة',
        targetGroupEn: 'Students',
        requirements: [
          'معدل عالي في البكالوريا أو الليسانس',
          'استمارة طلب المنحة',
          'شهادة الميلاد',
          'بطاقة التعريف الوطنية'
        ],
        requirementsEn: [
          'High GPA in Baccalaureate or Bachelor degree',
          'Scholarship application form',
          'Birth certificate',
          'National ID card'
        ],
        process: [
          'ملء استمارة طلب المنحة',
          'تحضير الوثائق المطلوبة',
          'تقديم الطلب للوزارة',
          'انتظار النتائج',
          'استلام المنحة'
        ],
        processEn: [
          'Fill scholarship application form',
          'Prepare required documents',
          'Submit application to ministry',
          'Wait for results',
          'Receive scholarship'
        ],
        fee: 'مجاني',
        duration: '3-6 أشهر',
        processingTime: '3-6 أشهر',
        processingTimeEn: '3-6 months',
        office: 'وزارة التعليم العالي',
        contactInfo: 'الهاتف: 021-123-456',
        benefits: ['تغطية الرسوم الدراسية', 'مصروف شهري', 'تأمين صحي'],
        benefitsEn: ['Tuition coverage', 'Monthly allowance', 'Health insurance'],
        isOnline: false,
        isNational: true,
        isActive: true
      },
      
      // Social Grants
      {
        name: 'منحة التضامن الاجتماعي للعائلات المحتاجة',
        nameEn: 'Social Solidarity Grant for Needy Families',
        description: 'مساعدة مالية للعائلات ذات الدخل المحدود والمحتاجة',
        descriptionEn: 'Financial assistance for low-income and needy families',
        category: 'SOCIAL_SUPPORT',
        subcategory: 'المساعدات الاجتماعية',
        subcategoryEn: 'Social Assistance',
        serviceType: 'مساعدة مالية',
        serviceTypeEn: 'Financial Aid',
        sector: 'وزارة التضامن الوطني والأسرة',
        sectorEn: 'Ministry of National Solidarity and Family',
        targetGroup: 'العائلات المحتاجة',
        targetGroupEn: 'Needy Families',
        requirements: [
          'إثبات الحالة الاجتماعية',
          'شهادة الدخل',
          'بطاقة التعريف الوطنية',
          'شهادة الميلاد للأطفال'
        ],
        fee: 'مجاني',
        duration: 'فوري',
        processingTime: '15-30 يوم',
        isOnline: false,
        isNational: true,
        isActive: true
      },
      
      // Improved ID Card Service
      {
        name: 'استخراج بطاقة الهوية الوطنية',
        nameEn: 'National ID Card Issuance',
        description: 'إصدار بطاقة الهوية الوطنية للمواطنين الجزائريين',
        descriptionEn: 'Issuance of national ID card for Algerian citizens',
        category: 'CIVIL_STATUS',
        subcategory: 'بطاقة الهوية',
        subcategoryEn: 'ID Card',
        serviceType: 'وثيقة رسمية',
        serviceTypeEn: 'Official Document',
        sector: 'وزارة الداخلية',
        sectorEn: 'Ministry of Interior',
        targetGroup: 'المواطنون',
        targetGroupEn: 'Citizens',
        requirements: [
          'شهادة الميلاد',
          'صورتان شمسيتان',
          'شهادة الإقامة',
          'رسم الطابع'
        ],
        requirementsEn: [
          'Birth certificate',
          'Two passport photos',
          'Residence certificate',
          'Stamp fee'
        ],
        process: [
          'التوجه إلى مصلحة الحالة المدنية',
          'ملء استمارة الطلب',
          'تقديم الوثائق المطلوبة',
          'دفع الرسوم',
          'استلام البطاقة'
        ],
        fee: '200 دج',
        duration: '7-15 يوم',
        processingTime: '7-15 يوم',
        office: 'مصلحة الحالة المدنية',
        contactInfo: 'البلدية المحلية',
        isOnline: false,
        isNational: true,
        isActive: true
      },
      
      // Business Registration Enhancement
      {
        name: 'تسجيل المؤسسات الصغيرة والمتوسطة',
        nameEn: 'Small and Medium Enterprise Registration',
        description: 'تسجيل وإنشاء المؤسسات الصغيرة والمتوسطة في الجزائر',
        descriptionEn: 'Registration and establishment of small and medium enterprises in Algeria',
        category: 'BUSINESS',
        subcategory: 'تأسيس الشركات',
        subcategoryEn: 'Company Formation',
        serviceType: 'تسجيل تجاري',
        serviceTypeEn: 'Commercial Registration',
        sector: 'وزارة التجارة وترقية الصادرات',
        sectorEn: 'Ministry of Commerce and Export Promotion',
        targetGroup: 'أصحاب الأعمال',
        targetGroupEn: 'Business Owners',
        requirements: [
          'بطاقة التعريف الوطنية',
          'شهادة الإقامة',
          'رأس المال المطلوب',
          'عقد التأسيس'
        ],
        fee: '5000-15000 دج',
        duration: '15-30 يوم',
        isOnline: true,
        isNational: true,
        isActive: true
      }
    ];
    
    console.log(`📊 Adding ${newServices.length} new services...`);
    
    for (const service of newServices) {
      await prisma.governmentService.create({
        data: service
      });
      console.log(`✅ Added: ${service.name}`);
    }
    
    console.log('\n✅ Successfully added all new services!');
    
    // Test search for the problematic terms
    console.log('\n🔍 Testing searches for previously missing terms:');
    
    const testTerms = ['بطاقة الهوية', 'منح التعليم', 'تأسيس شركة'];
    
    for (const term of testTerms) {
      const results = await prisma.governmentService.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { nameEn: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
            { subcategory: { contains: term, mode: 'insensitive' } },
          ]
        },
        take: 3,
        select: { name: true, category: true }
      });
      
      console.log(`  "${term}": ${results.length} results`);
      results.forEach(r => console.log(`    - ${r.name} (${r.category})`));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMoreServices();