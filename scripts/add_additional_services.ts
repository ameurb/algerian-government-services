import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Additional comprehensive government services for missing categories
const additionalGovernmentServices = [
  // Health Services
  {
    name: 'التأمين الصحي الوطني',
    nameEn: 'National Health Insurance',
    description: 'خدمة التسجيل في نظام التأمين الصحي الوطني للحصول على التغطية الصحية.',
    descriptionEn: 'Service for registering in the national health insurance system to receive health coverage.',
    category: 'HEALTH' as const,
    subcategory: 'التأمين الصحي',
    subcategoryEn: 'Health Insurance',
    sector: 'وزارة الصحة والسكان وإصلاح المستشفيات',
    sectorEn: 'Ministry of Health, Population and Hospital Reform',
    ministry: 'Ministry of Health',
    targetGroup: 'جميع المواطنين',
    targetGroupEn: 'All Citizens',
    targetGroups: ['Citizens', 'Employees', 'Self-employed'],
    requirements: [
      'بطاقة التعريف الوطنية',
      'شهادة العمل أو إثبات النشاط',
      'صور شمسية',
      'شهادة طبية'
    ],
    requirementsEn: [
      'National ID card',
      'Work certificate or proof of activity',
      'Passport photos',
      'Medical certificate'
    ],
    process: [
      'تحضير الوثائق المطلوبة',
      'التوجه إلى مكتب الضمان الاجتماعي',
      'ملء استمارة التسجيل',
      'تقديم الطلب',
      'استلام بطاقة التأمين'
    ],
    processEn: [
      'Prepare required documents',
      'Go to social security office',
      'Fill registration form',
      'Submit application',
      'Receive insurance card'
    ],
    documents: [
      'بطاقة التعريف الوطنية',
      'استمارة التسجيل',
      'شهادة العمل',
      'صور شمسية'
    ],
    documentsEn: [
      'National ID card',
      'Registration form',
      'Work certificate',
      'Passport photos'
    ],
    fee: 'مجاني',
    processingTime: '15-30 يوم',
    processingTimeEn: '15-30 days',
    office: 'صندوق الضمان الاجتماعي',
    contactInfo: 'الهاتف: 021-123-456',
    benefits: ['تغطية صحية شاملة', 'تعويض نفقات العلاج', 'أدوية مجانية'],
    benefitsEn: ['Comprehensive health coverage', 'Treatment cost reimbursement', 'Free medications'],
    isOnline: false,
    isNational: true,
    isActive: true
  },
  
  // Agriculture and Environment
  {
    name: 'رخصة الاستغلال الفلاحي',
    nameEn: 'Agricultural Exploitation License',
    description: 'رخصة لاستغلال الأراضي الفلاحية وممارسة النشاط الزراعي.',
    descriptionEn: 'License for exploiting agricultural land and practicing farming activities.',
    category: 'AGRICULTURE' as const,
    subcategory: 'التراخيص الفلاحية',
    subcategoryEn: 'Agricultural Licenses',
    sector: 'وزارة الفلاحة والتنمية الريفية',
    sectorEn: 'Ministry of Agriculture and Rural Development',
    ministry: 'Ministry of Agriculture',
    targetGroup: 'المزارعون والمستثمرون الفلاحيون',
    targetGroupEn: 'Farmers and Agricultural Investors',
    targetGroups: ['Farmers', 'Agricultural investors', 'Rural entrepreneurs'],
    requirements: [
      'بطاقة التعريف الوطنية',
      'عقد ملكية أو إيجار الأرض',
      'دراسة جدوى المشروع',
      'خطة الاستغلال'
    ],
    requirementsEn: [
      'National ID card',
      'Land ownership or lease contract',
      'Project feasibility study',
      'Exploitation plan'
    ],
    process: [
      'إعداد ملف الطلب',
      'تقديم الطلب لمديرية الفلاحة',
      'معاينة الأرض',
      'دراسة الملف',
      'إصدار الرخصة'
    ],
    processEn: [
      'Prepare application file',
      'Submit to Agriculture Directorate',
      'Land inspection',
      'File review',
      'License issuance'
    ],
    documents: [
      'بطاقة التعريف الوطنية',
      'عقد ملكية الأرض',
      'خطة الاستغلال',
      'صور للموقع'
    ],
    documentsEn: [
      'National ID card',
      'Land ownership contract',
      'Exploitation plan',
      'Site photos'
    ],
    fee: '5000-15000 دج',
    processingTime: '30-60 يوم',
    processingTimeEn: '30-60 days',
    office: 'مديرية الفلاحة بالولاية',
    contactInfo: 'مديرية الفلاحة المحلية',
    benefits: ['حق الاستغلال الفلاحي', 'إمكانية الحصول على الدعم', 'تسهيلات قروض فلاحية'],
    benefitsEn: ['Agricultural exploitation rights', 'Possibility of support', 'Agricultural loan facilities'],
    isOnline: false,
    isNational: false,
    isActive: true
  },

  // Energy Services
  {
    name: 'طلب توصيل الكهرباء',
    nameEn: 'Electricity Connection Request',
    description: 'خدمة طلب توصيل التيار الكهربائي للمنازل والمؤسسات الجديدة.',
    descriptionEn: 'Service for requesting electricity connection for new homes and institutions.',
    category: 'ENERGY' as const,
    subcategory: 'توصيل الكهرباء',
    subcategoryEn: 'Electricity Connection',
    sector: 'وزارة الطاقة',
    sectorEn: 'Ministry of Energy',
    ministry: 'Ministry of Energy',
    agency: 'شركة توزيع الكهرباء والغاز',
    targetGroup: 'أصحاب المنازل والمؤسسات',
    targetGroupEn: 'Homeowners and Institutions',
    targetGroups: ['Homeowners', 'Businesses', 'Institutions'],
    requirements: [
      'بطاقة التعريف الوطنية',
      'عقد ملكية أو إيجار',
      'رخصة البناء',
      'مخطط الموقع'
    ],
    requirementsEn: [
      'National ID card',
      'Ownership or lease contract',
      'Building permit',
      'Site plan'
    ],
    process: [
      'تقديم طلب التوصيل',
      'دفع رسوم الدراسة',
      'معاينة الموقع',
      'تنفيذ التوصيل',
      'تسليم العداد'
    ],
    processEn: [
      'Submit connection request',
      'Pay study fees',
      'Site inspection',
      'Execute connection',
      'Meter delivery'
    ],
    documents: [
      'بطاقة التعريف الوطنية',
      'عقد الملكية',
      'رخصة البناء',
      'استمارة الطلب'
    ],
    documentsEn: [
      'National ID card',
      'Ownership contract',
      'Building permit',
      'Application form'
    ],
    fee: '10000-50000 دج حسب القدرة',
    processingTime: '15-45 يوم',
    processingTimeEn: '15-45 days',
    office: 'وكالة توزيع الكهرباء والغاز',
    contactInfo: 'وكالة سونلغاز المحلية',
    onlineUrl: 'https://www.sonelgaz.dz',
    benefits: ['إمداد كهربائي مستمر', 'أمان في التوصيل', 'خدمة ما بعد البيع'],
    benefitsEn: ['Continuous power supply', 'Safe connection', 'After-sales service'],
    isOnline: true,
    isNational: true,
    isActive: true
  },

  // Culture and Sports
  {
    name: 'ترخيص النشاط الثقافي',
    nameEn: 'Cultural Activity License',
    description: 'ترخيص لتنظيم الفعاليات والأنشطة الثقافية والفنية.',
    descriptionEn: 'License for organizing cultural and artistic events and activities.',
    category: 'CULTURE' as const,
    subcategory: 'التراخيص الثقافية',
    subcategoryEn: 'Cultural Licenses',
    sector: 'وزارة الثقافة والفنون',
    sectorEn: 'Ministry of Culture and Arts',
    ministry: 'Ministry of Culture',
    targetGroup: 'الجمعيات الثقافية والفنانون',
    targetGroupEn: 'Cultural Associations and Artists',
    targetGroups: ['Cultural associations', 'Artists', 'Event organizers'],
    requirements: [
      'بطاقة التعريف الوطنية',
      'برنامج النشاط الثقافي',
      'إثبات المؤهلات',
      'موافقة أمنية'
    ],
    requirementsEn: [
      'National ID card',
      'Cultural activity program',
      'Proof of qualifications',
      'Security clearance'
    ],
    process: [
      'تحضير ملف الطلب',
      'تقديم الطلب لمديرية الثقافة',
      'دراسة الملف',
      'الموافقة الأمنية',
      'إصدار الترخيص'
    ],
    processEn: [
      'Prepare application file',
      'Submit to Culture Directorate',
      'File review',
      'Security approval',
      'License issuance'
    ],
    documents: [
      'بطاقة التعريف الوطنية',
      'برنامج الفعالية',
      'إثبات الكفاءة',
      'استمارة الطلب'
    ],
    documentsEn: [
      'National ID card',
      'Event program',
      'Competency proof',
      'Application form'
    ],
    fee: '2000-10000 دج',
    processingTime: '15-30 يوم',
    processingTimeEn: '15-30 days',
    office: 'مديرية الثقافة بالولاية',
    contactInfo: 'مديرية الثقافة المحلية',
    benefits: ['تنظيم قانوني للأنشطة', 'دعم من الوزارة', 'إمكانية التمويل'],
    benefitsEn: ['Legal activity organization', 'Ministry support', 'Funding possibility'],
    isOnline: false,
    isNational: false,
    isActive: true
  },

  // Social Support Services
  {
    name: 'المنحة الجامعية',
    nameEn: 'University Scholarship',
    description: 'منحة مالية لدعم الطلاب الجامعيين من الأسر ذات الدخل المحدود.',
    descriptionEn: 'Financial grant to support university students from low-income families.',
    category: 'SOCIAL_SUPPORT' as const,
    subcategory: 'المنح التعليمية',
    subcategoryEn: 'Educational Grants',
    sector: 'وزارة التعليم العالي والبحث العلمي',
    sectorEn: 'Ministry of Higher Education and Scientific Research',
    ministry: 'Ministry of Higher Education',
    agency: 'الديوان الوطني للخدمات الجامعية',
    targetGroup: 'الطلاب الجامعيون',
    targetGroupEn: 'University Students',
    targetGroups: ['University students', 'Low-income families', 'Academic achievers'],
    requirements: [
      'بطاقة التعريف الوطنية',
      'شهادة التسجيل الجامعي',
      'إثبات الدخل العائلي',
      'كشف النقاط'
    ],
    requirementsEn: [
      'National ID card',
      'University enrollment certificate',
      'Family income proof',
      'Academic transcript'
    ],
    process: [
      'تقديم طلب المنحة',
      'دراسة الملف الاجتماعي',
      'تقييم النتائج الدراسية',
      'اتخاذ القرار',
      'صرف المنحة'
    ],
    processEn: [
      'Submit scholarship application',
      'Social file review',
      'Academic performance evaluation',
      'Decision making',
      'Scholarship disbursement'
    ],
    documents: [
      'بطاقة التعريف الوطنية',
      'شهادة التسجيل',
      'إثبات الدخل',
      'كشف النقاط'
    ],
    documentsEn: [
      'National ID card',
      'Enrollment certificate',
      'Income proof',
      'Academic transcript'
    ],
    fee: 'مجاني',
    processingTime: '30-60 يوم',
    processingTimeEn: '30-60 days',
    office: 'الديوان الوطني للخدمات الجامعية',
    contactInfo: 'مصالح المنح الجامعية',
    onlineUrl: 'https://www.ons.dz',
    benefits: ['دعم مالي شهري', 'إعانة السكن الجامعي', 'تخفيضات في الخدمات'],
    benefitsEn: ['Monthly financial support', 'University housing assistance', 'Service discounts'],
    isOnline: true,
    isNational: true,
    isActive: true
  },

  // Law and Justice
  {
    name: 'استخراج السجل العدلي',
    nameEn: 'Criminal Record Extract',
    description: 'خدمة استخراج نسخة من السجل العدلي للمواطنين.',
    descriptionEn: 'Service for obtaining a copy of criminal record for citizens.',
    category: 'LAW_JUSTICE' as const,
    subcategory: 'الوثائق القضائية',
    subcategoryEn: 'Judicial Documents',
    sector: 'وزارة العدل',
    sectorEn: 'Ministry of Justice',
    ministry: 'Ministry of Justice',
    agency: 'المحكمة المختصة',
    targetGroup: 'جميع المواطنين',
    targetGroupEn: 'All Citizens',
    targetGroups: ['Citizens', 'Job applicants', 'Legal procedures'],
    requirements: [
      'بطاقة التعريف الوطنية',
      'طلب خطي',
      'دفع الرسوم',
      'إثبات الحاجة'
    ],
    requirementsEn: [
      'National ID card',
      'Written request',
      'Fee payment',
      'Proof of need'
    ],
    process: [
      'تقديم الطلب',
      'دفع الرسوم',
      'التحقق من الهوية',
      'إصدار الوثيقة',
      'استلام السجل'
    ],
    processEn: [
      'Submit request',
      'Pay fees',
      'Identity verification',
      'Document issuance',
      'Record collection'
    ],
    documents: [
      'بطاقة التعريف الوطنية',
      'طلب استخراج السجل',
      'إيصال دفع الرسوم'
    ],
    documentsEn: [
      'National ID card',
      'Record extraction request',
      'Fee payment receipt'
    ],
    fee: '200 دج',
    processingTime: '1-3 أيام',
    processingTimeEn: '1-3 days',
    office: 'المحكمة أو كتابة الضبط',
    contactInfo: 'كتابة ضبط المحكمة',
    benefits: ['وثيقة رسمية', 'مطلوبة للوظائف', 'إجراءات قانونية'],
    benefitsEn: ['Official document', 'Required for jobs', 'Legal procedures'],
    isOnline: false,
    isNational: true,
    isActive: true
  },

  // Tourism and Entertainment
  {
    name: 'ترخيص وكالة السياحة',
    nameEn: 'Tourism Agency License',
    description: 'ترخيص لإنشاء وتشغيل وكالة سياحية لتنظيم الرحلات والخدمات السياحية.',
    descriptionEn: 'License for establishing and operating a tourism agency for organizing trips and tourist services.',
    category: 'TOURISM' as const,
    subcategory: 'تراخيص سياحية',
    subcategoryEn: 'Tourism Licenses',
    sector: 'وزارة السياحة والصناعات التقليدية',
    sectorEn: 'Ministry of Tourism and Traditional Industries',
    ministry: 'Ministry of Tourism',
    targetGroup: 'المستثمرون في القطاع السياحي',
    targetGroupEn: 'Tourism Sector Investors',
    targetGroups: ['Tourism investors', 'Business owners', 'Entrepreneurs'],
    requirements: [
      'بطاقة التعريف الوطنية',
      'رأس المال المطلوب',
      'مقر العمل مناسب',
      'موظفون مؤهلون'
    ],
    requirementsEn: [
      'National ID card',
      'Required capital',
      'Suitable business premises',
      'Qualified staff'
    ],
    process: [
      'تحضير ملف الطلب',
      'تقديم الطلب لمديرية السياحة',
      'معاينة المقر',
      'دراسة الملف',
      'إصدار الترخيص'
    ],
    processEn: [
      'Prepare application file',
      'Submit to Tourism Directorate',
      'Premises inspection',
      'File review',
      'License issuance'
    ],
    documents: [
      'بطاقة التعريف الوطنية',
      'عقد كراء المقر',
      'شهادات الموظفين',
      'إيداع رأس المال'
    ],
    documentsEn: [
      'National ID card',
      'Premises lease contract',
      'Staff certificates',
      'Capital deposit'
    ],
    fee: '50000-100000 دج',
    processingTime: '45-90 يوم',
    processingTimeEn: '45-90 days',
    office: 'مديرية السياحة بالولاية',
    contactInfo: 'مديرية السياحة المحلية',
    benefits: ['حق تشغيل وكالة سياحية', 'إمكانية الحصول على دعم', 'انضمام للاتحادات المهنية'],
    benefitsEn: ['Right to operate tourism agency', 'Possibility of support', 'Professional association membership'],
    isOnline: false,
    isNational: false,
    isActive: true
  },

  // Industry Services
  {
    name: 'رخصة النشاط الصناعي',
    nameEn: 'Industrial Activity License',
    description: 'رخصة لممارسة النشاط الصناعي وإنشاء المصانع والوحدات الإنتاجية.',
    descriptionEn: 'License for practicing industrial activity and establishing factories and production units.',
    category: 'INDUSTRY' as const,
    subcategory: 'التراخيص الصناعية',
    subcategoryEn: 'Industrial Licenses',
    sector: 'وزارة الصناعة',
    sectorEn: 'Ministry of Industry',
    ministry: 'Ministry of Industry',
    targetGroup: 'المستثمرون الصناعيون',
    targetGroupEn: 'Industrial Investors',
    targetGroups: ['Industrial investors', 'Manufacturers', 'Factory owners'],
    requirements: [
      'بطاقة التعريف الوطنية',
      'دراسة جدوى المشروع',
      'رأس المال المطلوب',
      'موافقة بيئية'
    ],
    requirementsEn: [
      'National ID card',
      'Project feasibility study',
      'Required capital',
      'Environmental approval'
    ],
    process: [
      'إعداد دراسة الجدوى',
      'تقديم الطلب',
      'دراسة الأثر البيئي',
      'الموافقة النهائية',
      'إصدار الرخصة'
    ],
    processEn: [
      'Prepare feasibility study',
      'Submit application',
      'Environmental impact study',
      'Final approval',
      'License issuance'
    ],
    documents: [
      'بطاقة التعريف الوطنية',
      'دراسة الجدوى',
      'الموافقة البيئية',
      'عقد الأرض الصناعية'
    ],
    documentsEn: [
      'National ID card',
      'Feasibility study',
      'Environmental approval',
      'Industrial land contract'
    ],
    fee: '100000-500000 دج حسب حجم المشروع',
    processingTime: '60-120 يوم',
    processingTimeEn: '60-120 days',
    office: 'مديرية الصناعة بالولاية',
    contactInfo: 'مديرية الصناعة المحلية',
    benefits: ['حق الاستثمار الصناعي', 'تسهيلات ضريبية', 'دعم الدولة'],
    benefitsEn: ['Industrial investment rights', 'Tax facilities', 'State support'],
    isOnline: false,
    isNational: false,
    isActive: true
  }
]

async function addAdditionalServices() {
  console.log('🌱 Adding comprehensive additional government services...')
  
  try {
    // Add services in batches
    const batchSize = 5
    let addedCount = 0
    
    for (let i = 0; i < additionalGovernmentServices.length; i += batchSize) {
      const batch = additionalGovernmentServices.slice(i, i + batchSize)
      
      await prisma.governmentService.createMany({
        data: batch
      })
      
      addedCount += batch.length
      console.log(`  ✅ Added batch ${Math.floor(i/batchSize) + 1}: ${addedCount}/${additionalGovernmentServices.length} services`)
    }
    
    console.log(`✅ Successfully added ${addedCount} additional government services!`)
    
    // Verify total count
    const totalServices = await prisma.governmentService.count()
    console.log(`📊 Total government services in database: ${totalServices}`)
    
    // Show services by category
    const servicesByCategory = await prisma.governmentService.groupBy({
      by: ['category'],
      _count: {
        id: true
      }
    })
    
    console.log('\n📈 Updated Services by Category:')
    servicesByCategory.forEach(item => {
      console.log(`  ${item.category}: ${item._count.id} services`)
    })
    
  } catch (error) {
    console.error('❌ Failed to add additional services:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addAdditionalServices()
