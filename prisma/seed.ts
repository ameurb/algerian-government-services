import { PrismaClient } from '@prisma/client'
import { allBawaiticServicesComprehensive } from './bawabatic_comprehensive_seed'

const prisma = new PrismaClient()

// Algerian Wilayas (provinces)
const ALGERIAN_WILAYAS = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra',
  'Béchar', 'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret',
  'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda',
  'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem',
  'M\'Sila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arréridj',
  'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela',
  'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent',
  'Ghardaïa', 'Relizane', 'Timimoun', 'Bordj Badji Mokhtar', 'Ouled Djellal',
  'Béni Abbès', 'In Salah', 'In Guezzam', 'Touggourt', 'Djanet', 'El M\'Ghair', 'El Meniaa'
]

async function main() {
  console.log('🌱 Starting seed process...')

  // Clear existing data
  console.log('🗑️  Clearing existing data...')
  await prisma.like.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.post.deleteMany()
  await prisma.eventRegistration.deleteMany()
  await prisma.event.deleteMany()
  await prisma.healthRecord.deleteMany()
  await prisma.certificate.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.course.deleteMany()
  await prisma.jobApplication.deleteMany()
  await prisma.job.deleteMany()
  await prisma.chatMessage.deleteMany()
  await prisma.session.deleteMany()
  await prisma.governmentService.deleteMany()
  await prisma.user.deleteMany()

  // Create sample users
  console.log('👥 Creating users...')
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'ahmed.benali@email.dz',
        firstName: 'Ahmed',
        lastName: 'Benali',
        phone: '+213555123456',
        dateOfBirth: new Date('1995-03-15'),
        gender: 'MALE',
        wilaya: 'Alger',
        commune: 'Bab El Oued',
        education: 'BACHELOR',
        profession: 'Software Developer',
        bio: 'Passionate about technology and helping young Algerians find opportunities.',
        language: 'ar',
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'fatima.salem@email.dz',
        firstName: 'Fatima',
        lastName: 'Salem',
        phone: '+213556789012',
        dateOfBirth: new Date('1997-07-22'),
        gender: 'FEMALE',
        wilaya: 'Oran',
        commune: 'Oran Centre',
        education: 'MASTER',
        profession: 'Marketing Specialist',
        bio: 'Digital marketing enthusiast working to connect brands with youth.',
        language: 'fr',
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'karim.messaoud@email.dz',
        firstName: 'Karim',
        lastName: 'Messaoud',
        phone: '+213557345678',
        dateOfBirth: new Date('1996-11-08'),
        gender: 'MALE',
        wilaya: 'Constantine',
        commune: 'Constantine Centre',
        education: 'BACHELOR',
        profession: 'Graphic Designer',
        bio: 'Creative designer passionate about Algerian culture and modern design.',
        language: 'ar',
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'amina.boudiaf@email.dz',
        firstName: 'Amina',
        lastName: 'Boudiaf',
        phone: '+213558901234',
        dateOfBirth: new Date('1998-02-14'),
        gender: 'FEMALE',
        wilaya: 'Sétif',
        commune: 'Sétif Centre',
        education: 'SECONDARY',
        profession: 'Student',
        bio: 'Medical student interested in public health and community service.',
        language: 'ar',
        isVerified: false,
      },
    }),
    prisma.user.create({
      data: {
        email: 'youcef.hadj@email.dz',
        firstName: 'Youcef',
        lastName: 'Hadj',
        phone: '+213559567890',
        dateOfBirth: new Date('1994-09-30'),
        gender: 'MALE',
        wilaya: 'Tizi Ouzou',
        commune: 'Tizi Ouzou Centre',
        education: 'MASTER',
        profession: 'Civil Engineer',
        bio: 'Engineer working on sustainable development projects in Algeria.',
        language: 'ar',
        isVerified: true,
      },
    }),
  ])

  // Create job postings
  console.log('💼 Creating job postings...')
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: 'مطور تطبيقات الهاتف المحمول - Mobile App Developer',
        company: 'شركة التكنولوجيا الجزائرية - Algerian Tech Solutions',
        description: 'نبحث عن مطور تطبيقات محترف للعمل على تطبيقات Android و iOS. يجب أن يكون لديه خبرة في React Native أو Flutter.',
        requirements: [
          'خبرة 2+ سنوات في تطوير التطبيقات',
          'معرفة بـ React Native أو Flutter',
          'خبرة في REST APIs',
          'إجادة اللغة العربية والإنجليزية'
        ],
        location: 'الجزائر العاصمة',
        wilaya: 'Alger',
        salary: '80,000 - 120,000 DA',
        type: 'FULL_TIME',
        category: 'TECHNOLOGY',
        experience: 'MID_LEVEL',
        contactEmail: 'jobs@algeriantech.dz',
        contactPhone: '+213021123456',
        deadline: new Date('2025-09-01'),
      },
    }),
    prisma.job.create({
      data: {
        title: 'معلم اللغة الإنجليزية - English Teacher',
        company: 'معهد اللغات الحديثة - Modern Languages Institute',
        description: 'مطلوب معلم/ة لغة إنجليزية للعمل مع الشباب والبالغين في بيئة تعليمية حديثة.',
        requirements: [
          'شهادة في اللغة الإنجليزية أو التعليم',
          'خبرة في التدريس',
          'مهارات تواصل ممتازة',
          'شغف بالتعليم'
        ],
        location: 'وهران',
        wilaya: 'Oran',
        salary: '60,000 - 80,000 DA',
        type: 'FULL_TIME',
        category: 'EDUCATION',
        experience: 'JUNIOR',
        contactEmail: 'hr@modernlanguages.dz',
        contactPhone: '+213041234567',
        deadline: new Date('2025-08-15'),
      },
    }),
    prisma.job.create({
      data: {
        title: 'مصمم جرافيك - Graphic Designer',
        company: 'وكالة الإبداع الرقمي - Digital Creative Agency',
        description: 'فرصة للمصممين الموهوبين للعمل على مشاريع متنوعة للعلامات التجارية الجزائرية والدولية.',
        requirements: [
          'خبرة في Adobe Creative Suite',
          'محفظة أعمال قوية',
          'إبداع وحس فني عالي',
          'القدرة على العمل تحت الضغط'
        ],
        location: 'قسنطينة',
        wilaya: 'Constantine',
        salary: '70,000 - 100,000 DA',
        type: 'FULL_TIME',
        category: 'ARTS',
        experience: 'MID_LEVEL',
        contactEmail: 'careers@digitalcreative.dz',
        contactPhone: '+213031345678',
        deadline: new Date('2025-08-30'),
      },
    }),
    prisma.job.create({
      data: {
        title: 'مهندس مدني - Civil Engineer',
        company: 'شركة البناء والتطوير - Construction & Development Co.',
        description: 'مطلوب مهندس مدني للعمل على مشاريع البنية التحتية والإسكان في الجزائر.',
        requirements: [
          'شهادة في الهندسة المدنية',
          'خبرة في إدارة المشاريع',
          'معرفة بالمعايير الجزائرية للبناء',
          'مهارات AutoCAD و Excel'
        ],
        location: 'سطيف',
        wilaya: 'Sétif',
        salary: '90,000 - 130,000 DA',
        type: 'FULL_TIME',
        category: 'ENGINEERING',
        experience: 'SENIOR',
        contactEmail: 'recruitment@construction.dz',
        contactPhone: '+213036456789',
        deadline: new Date('2025-09-15'),
      },
    }),
    prisma.job.create({
      data: {
        title: 'متدرب في التسويق الرقمي - Digital Marketing Intern',
        company: 'وكالة النمو الرقمي - Digital Growth Agency',
        description: 'فرصة تدريب ممتازة للطلاب والخريجين الجدد لتعلم التسويق الرقمي من الخبراء.',
        requirements: [
          'طالب أو خريج حديث',
          'اهتمام بالتسويق الرقمي',
          'مهارات أساسية في الكمبيوتر',
          'استعداد للتعلم'
        ],
        location: 'تيزي وزو',
        wilaya: 'Tizi Ouzou',
        salary: '25,000 - 35,000 DA',
        type: 'INTERNSHIP',
        category: 'BUSINESS',
        experience: 'ENTRY_LEVEL',
        contactEmail: 'internships@digitalgrowth.dz',
        contactPhone: '+213026567890',
        deadline: new Date('2025-08-20'),
      },
    }),
  ])

  // Create courses
  console.log('📚 Creating courses...')
  const courses = await Promise.all([
    prisma.course.create({
      data: {
        title: 'تطوير المواقع باستخدام React - React Web Development',
        description: 'دورة شاملة لتعلم تطوير المواقع الحديثة باستخدام React و JavaScript.',
        content: 'تتضمن الدورة: أساسيات JavaScript، React Components، State Management، API Integration، والنشر.',
        category: 'TECHNOLOGY',
        level: 'BACHELOR',
        duration: 40,
        instructor: 'أحمد بن علي - Ahmed Ben Ali',
        price: 0,
        thumbnail: '/images/react-course.jpg',
        videoUrl: 'https://youtube.com/playlist/react-course',
        materials: [
          '/materials/react-basics.pdf',
          '/materials/react-exercises.zip',
          '/materials/project-templates.zip'
        ],
      },
    }),
    prisma.course.create({
      data: {
        title: 'اللغة الإنجليزية للأعمال - Business English',
        description: 'تعلم اللغة الإنجليزية المتخصصة في مجال الأعمال والمراسلات التجارية.',
        content: 'المحادثات التجارية، كتابة الإيميلات، العروض التقديمية، والمقابلات الوظيفية.',
        category: 'LANGUAGES',
        level: 'SECONDARY',
        duration: 30,
        instructor: 'فاطمة سالم - Fatima Salem',
        price: 15000,
        thumbnail: '/images/business-english.jpg',
        videoUrl: 'https://youtube.com/playlist/business-english',
        materials: [
          '/materials/business-vocabulary.pdf',
          '/materials/email-templates.pdf',
          '/materials/audio-lessons.zip'
        ],
      },
    }),
    prisma.course.create({
      data: {
        title: 'التصميم الجرافيكي للمبتدئين - Graphic Design for Beginners',
        description: 'تعلم أساسيات التصميم الجرافيكي وبرامج Adobe Creative Suite.',
        content: 'Photoshop، Illustrator، InDesign، نظرية الألوان، والتصميم الإبداعي.',
        category: 'ARTS',
        level: 'SECONDARY',
        duration: 35,
        instructor: 'كريم مسعود - Karim Messaoud',
        price: 20000,
        thumbnail: '/images/graphic-design.jpg',
        videoUrl: 'https://youtube.com/playlist/graphic-design',
        materials: [
          '/materials/design-principles.pdf',
          '/materials/photoshop-exercises.zip',
          '/materials/design-resources.zip'
        ],
      },
    }),
    prisma.course.create({
      data: {
        title: 'إدارة المشاريع الهندسية - Engineering Project Management',
        description: 'تعلم إدارة المشاريع الهندسية والبناء وفقاً للمعايير الدولية.',
        content: 'تخطيط المشاريع، إدارة الموارد، مراقبة الجودة، والسلامة في العمل.',
        category: 'BUSINESS',
        level: 'BACHELOR',
        duration: 25,
        instructor: 'يوسف حاج - Youcef Hadj',
        price: 25000,
        thumbnail: '/images/project-management.jpg',
        videoUrl: 'https://youtube.com/playlist/project-management',
        materials: [
          '/materials/pm-methodology.pdf',
          '/materials/project-templates.zip',
          '/materials/case-studies.pdf'
        ],
      },
    }),
    prisma.course.create({
      data: {
        title: 'الصحة النفسية للشباب - Mental Health for Youth',
        description: 'دورة توعوية حول الصحة النفسية وطرق التعامل مع ضغوط الحياة.',
        content: 'إدارة القلق والتوتر، بناء الثقة بالنفس، والتواصل الصحي.',
        category: 'HEALTH',
        level: 'SECONDARY',
        duration: 15,
        instructor: 'د. أمينة بوضياف - Dr. Amina Boudiaf',
        price: 0,
        thumbnail: '/images/mental-health.jpg',
        videoUrl: 'https://youtube.com/playlist/mental-health',
        materials: [
          '/materials/mental-health-guide.pdf',
          '/materials/relaxation-techniques.pdf',
          '/materials/self-assessment.pdf'
        ],
      },
    }),
  ])

  // Create enrollments
  console.log('📝 Creating enrollments...')
  await Promise.all([
    prisma.enrollment.create({
      data: {
        userId: users[0].id,
        courseId: courses[0].id,
        progress: 75,
      },
    }),
    prisma.enrollment.create({
      data: {
        userId: users[1].id,
        courseId: courses[1].id,
        progress: 100,
        isCompleted: true,
        completedAt: new Date(),
      },
    }),
    prisma.enrollment.create({
      data: {
        userId: users[2].id,
        courseId: courses[2].id,
        progress: 50,
      },
    }),
    prisma.enrollment.create({
      data: {
        userId: users[3].id,
        courseId: courses[4].id,
        progress: 30,
      },
    }),
    prisma.enrollment.create({
      data: {
        userId: users[4].id,
        courseId: courses[3].id,
        progress: 90,
      },
    }),
  ])

  // Create certificate for completed course
  console.log('🏆 Creating certificates...')
  await prisma.certificate.create({
    data: {
      userId: users[1].id,
      courseId: courses[1].id,
      certificateUrl: '/certificates/fatima-salem-business-english.pdf',
    },
  })

  // Create events
  console.log('🎪 Creating events...')
  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: 'ملتقى الشباب للتكنولوجيا - Youth Tech Summit',
        description: 'ملتقى سنوي يجمع الشباب المهتم بالتكنولوجيا والابتكار في الجزائر.',
        category: 'CONFERENCE',
        startDate: new Date('2025-09-15T09:00:00'),
        endDate: new Date('2025-09-15T17:00:00'),
        location: 'قصر المعارض، الجزائر العاصمة',
        wilaya: 'Alger',
        organizer: 'وزارة الشباب والرياضة',
        maxAttendees: 500,
        price: 0,
        image: '/images/tech-summit.jpg',
      },
    }),
    prisma.event.create({
      data: {
        title: 'ورشة عمل: التصميم الجرافيكي - Graphic Design Workshop',
        description: 'ورشة عمل تطبيقية لتعلم أساسيات التصميم الجرافيكي.',
        category: 'WORKSHOP',
        startDate: new Date('2025-08-20T14:00:00'),
        endDate: new Date('2025-08-20T18:00:00'),
        location: 'مركز الفنون، وهران',
        wilaya: 'Oran',
        organizer: 'بيت الشباب وهران',
        maxAttendees: 30,
        price: 2000,
        image: '/images/design-workshop.jpg',
      },
    }),
    prisma.event.create({
      data: {
        title: 'مؤتمر ريادة الأعمال - Entrepreneurship Conference',
        description: 'مؤتمر لتشجيع ريادة الأعمال بين الشباب الجزائري.',
        category: 'CONFERENCE',
        startDate: new Date('2025-10-05T08:30:00'),
        endDate: new Date('2025-10-06T16:00:00'),
        location: 'جامعة قسنطينة',
        wilaya: 'Constantine',
        organizer: 'غرفة التجارة قسنطينة',
        maxAttendees: 200,
        price: 0,
        image: '/images/entrepreneurship.jpg',
      },
    }),
  ])

  // Create event registrations
  console.log('🎫 Creating event registrations...')
  await Promise.all([
    prisma.eventRegistration.create({
      data: {
        userId: users[0].id,
        eventId: events[0].id,
      },
    }),
    prisma.eventRegistration.create({
      data: {
        userId: users[2].id,
        eventId: events[1].id,
      },
    }),
    prisma.eventRegistration.create({
      data: {
        userId: users[4].id,
        eventId: events[2].id,
      },
    }),
  ])

  // Create government services (comprehensive data from bawabatic.dz)
  console.log('🏛️ Creating comprehensive government services from bawabatic.dz...')
  
  // Map the extracted services to our database schema
  const mappedServices = allBawaiticServicesComprehensive.map((service: any) => ({
    // Basic Information (Bilingual)
    name: service.name || service.nameAr || service.serviceName || 'خدمة حكومية',
    nameEn: service.nameEn || service.serviceNameEn || null,
    description: service.description || service.descriptionAr || service.serviceDescription || 'وصف الخدمة',
    descriptionEn: service.descriptionEn || service.serviceDescriptionEn || null,
    
    // Service Details
    serviceId: service.serviceId || service.id || null,
    category: mapServiceCategory(service.category || service.categoryEn || 'OTHER'),
    subcategory: service.subcategory || service.subcategoryAr || null,
    subcategoryEn: service.subcategoryEn || null,
    serviceType: service.serviceType || service.serviceTypeAr || null,
    serviceTypeEn: service.serviceTypeEn || null,
    
    // Government Structure
    sector: service.sector || service.sectorAr || null,
    sectorEn: service.sectorEn || null,
    structure: service.structure || service.structureAr || null,
    structureEn: service.structureEn || null,
    ministry: service.ministry || service.agency || null,
    agency: service.agency || service.structure || null,
    
    // Target Information
    targetGroup: service.targetGroup || service.targetGroupAr || null,
    targetGroupEn: service.targetGroupEn || null,
    targetGroups: service.targetGroups || service.eligibility || [],
    
    // Service Process
    requirements: service.requirements || service.requiredDocuments || service.eligibility || [],
    requirementsEn: service.requirementsEn || service.requiredDocumentsEn || [],
    process: generateProcessSteps(service),
    processEn: generateProcessStepsEn(service),
    documents: service.requiredDocuments || service.documents || service.requirements || [],
    documentsEn: service.requiredDocumentsEn || service.documentsEn || [],
    
    // Service Details
    fee: service.fee || service.cost || 'غير محدد',
    duration: service.duration || 'غير محدد',
    processingTime: service.processingTime || service.processingTimeAr || 'غير محدد',
    processingTimeEn: service.processingTimeEn || null,
    
    // Contact and Access
    office: service.office || service.agency || service.structure || service.ministry || 'غير محدد',
    contactInfo: service.contactInfo || service.contact || 'غير محدد',
    contactPhone: service.contactPhone || service.phone || null,
    contactEmail: service.contactEmail || service.email || null,
    onlineUrl: service.externalUrl || service.onlineUrl || null,
    bawabticUrl: service.bawabticUrl || service.sourceUrl || null,
    
    // Additional Information
    legalFramework: service.legalFramework || service.legalBasis || null,
    appeals: service.appeals || service.appealsProcess || null,
    appealsEn: service.appealsEn || null,
    benefits: service.benefits || service.outcomes || [],
    benefitsEn: service.benefitsEn || service.outcomesEn || [],
    notes: service.notes || service.additionalInfo || null,
    
    // Location and Availability
    wilaya: determineWilaya(service),
    isOnline: Boolean(service.externalUrl || service.onlineUrl || service.isOnline),
    isNational: !service.wilaya && !service.localArea,
    isActive: true
  }))

  // Helper function to map service categories to our enum
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

  // Helper function to generate process steps in Arabic
  function generateProcessSteps(service: any): string[] {
    if (service.process && Array.isArray(service.process)) return service.process
    
    const defaultSteps = [
      'ملء الاستمارة المطلوبة',
      'تحضير الوثائق المطلوبة',
      'تقديم الطلب',
      'انتظار المعالجة',
      'استلام الخدمة'
    ]
    
    if (service.externalUrl) {
      return [
        'الدخول إلى المنصة الإلكترونية',
        'إنشاء حساب أو تسجيل الدخول',
        'ملء البيانات المطلوبة',
        'رفع الوثائق',
        'تقديم الطلب إلكترونياً',
        'متابعة حالة الطلب'
      ]
    }
    
    return defaultSteps
  }

  // Helper function to generate process steps in English
  function generateProcessStepsEn(service: any): string[] {
    if (service.processEn && Array.isArray(service.processEn)) return service.processEn
    
    const defaultStepsEn = [
      'Fill the required form',
      'Prepare required documents',
      'Submit the application',
      'Wait for processing',
      'Receive the service'
    ]
    
    if (service.externalUrl) {
      return [
        'Access the online platform',
        'Create account or login',
        'Fill required information',
        'Upload documents',
        'Submit application electronically',
        'Track application status'
      ]
    }
    
    return defaultStepsEn
  }

  // Helper function to determine wilaya
  function determineWilaya(service: any): string | null {
    // If it's a national service, return null for all wilayas
    if (service.ministry || service.sector) return null
    
    // Otherwise assign to major cities
    const wilayas = ['Alger', 'Oran', 'Constantine', 'Sétif', 'Annaba']
    return wilayas[Math.floor(Math.random() * wilayas.length)]
  }

  // Create all services
  await Promise.all(
    mappedServices.map(service =>
      prisma.governmentService.create({ data: service })
    )
  )

  console.log(`✅ Created ${mappedServices.length} comprehensive government services from bawabatic.dz`)
  
  // Also create the original basic services for local examples
  const basicGovernmentServices = [
    {
      // Basic Information (Bilingual)
      name: 'رخصة السياقة',
      nameEn: 'Driving License',
      description: 'خدمة الحصول على رخصة السياقة أو تجديدها.',
      descriptionEn: 'Service to obtain or renew a driving license.',
      
      // Service Details
      category: 'TRANSPORTATION' as const,
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
        'امتحان نظري وعملي',
        'دورة تدريبية'
      ],
      requirementsEn: [
        'Age 18 or above',
        'Medical certificate',
        'Theory and practical exam',
        'Training course'
      ],
      process: [
        'التسجيل في مدرسة السياقة',
        'الحصول على الشهادة الطبية',
        'اجتياز الامتحان النظري',
        'اجتياز الامتحان العملي',
        'استلام الرخصة'
      ],
      processEn: [
        'Register at driving school',
        'Obtain medical certificate',
        'Pass theory exam',
        'Pass practical exam',
        'Receive license'
      ],
      documents: [
        'بطاقة التعريف الوطنية',
        'شهادة الميلاد',
        'شهادة طبية',
        '6 صور شمسية'
      ],
      documentsEn: [
        'National ID card',
        'Birth certificate',
        'Medical certificate',
        '6 passport photos'
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
  ]

  await Promise.all(
    basicGovernmentServices.map(service =>
      prisma.governmentService.create({ data: service })
    )
  )

  // Create health records
  console.log('🏥 Creating health records...')
  await Promise.all([
    prisma.healthRecord.create({
      data: {
        userId: users[3].id,
        type: 'VACCINATION',
        title: 'تطعيم كوفيد-19 - COVID-19 Vaccination',
        description: 'الجرعة الأولى من لقاح كوفيد-19',
        date: new Date('2024-06-15'),
        doctor: 'د. محمد الأمين',
        hospital: 'مستشفى الجامعي سطيف',
        notes: 'لا توجد أعراض جانبية'
      },
    }),
    prisma.healthRecord.create({
      data: {
        userId: users[1].id,
        type: 'CHECKUP',
        title: 'فحص دوري - Regular Checkup',
        description: 'فحص طبي شامل سنوي',
        date: new Date('2024-12-20'),
        doctor: 'د. سارة بلعباس',
        hospital: 'عيادة الصحة النفسية وهران',
        notes: 'الحالة العامة جيدة'
      },
    }),
  ])

  // Create community posts
  console.log('💬 Creating community posts...')
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        userId: users[0].id,
        title: 'نصائح للمطورين الجدد في الجزائر',
        content: 'مرحباً بكم! أريد مشاركة بعض النصائح للمطورين الجدد:\n\n1. ابدأ بتعلم الأساسيات جيداً\n2. اعمل على مشاريع شخصية\n3. انضم للمجتمعات التقنية\n4. لا تتوقف عن التعلم\n\nما رأيكم؟ هل لديكم نصائح أخرى؟',
        category: 'DISCUSSION',
        tags: ['برمجة', 'تطوير', 'نصائح', 'تكنولوجيا'],
      },
    }),
    prisma.post.create({
      data: {
        userId: users[1].id,
        title: 'فرصة عمل في شركة جديدة',
        content: 'السلام عليكم، أعمل في شركة تسويق رقمي وننتج متدربين في:\n- إدارة وسائل التواصل الاجتماعي\n- تحليل البيانات\n- التصميم الجرافيكي\n\nلمن يهمه الأمر، يرجى المراسلة على الخاص.',
        category: 'OPPORTUNITY',
        tags: ['وظائف', 'تدريب', 'تسويق', 'فرص'],
      },
    }),
    prisma.post.create({
      data: {
        userId: users[2].id,
        title: 'معرض التصميم في قسنطينة',
        content: 'يسرني دعوتكم لحضور معرض التصميم الجرافيكي الذي سيقام في قسنطينة الشهر القادم. سيضم المعرض أعمال أكثر من 50 مصمم جزائري موهوب.\n\nالتاريخ: 15 سبتمبر\nالمكان: قصر الثقافة قسنطينة\nالدخول مجاني!',
        category: 'EVENT',
        tags: ['تصميم', 'معرض', 'قسنطينة', 'فن'],
      },
    }),
  ])

  // Create comments
  console.log('💭 Creating comments...')
  await Promise.all([
    prisma.comment.create({
      data: {
        userId: users[2].id,
        postId: posts[0].id,
        content: 'نصائح ممتازة! أضيف أيضاً ضرورة إتقان اللغة الإنجليزية والمشاركة في المشاريع مفتوحة المصدر.',
      },
    }),
    prisma.comment.create({
      data: {
        userId: users[4].id,
        postId: posts[0].id,
        content: 'شكراً على المشاركة. هل يمكنك ترشيح بعض المصادر المفيدة للتعلم؟',
      },
    }),
    prisma.comment.create({
      data: {
        userId: users[0].id,
        postId: posts[1].id,
        content: 'فرصة رائعة! هل يمكن للطلاب الجامعيين التقديم؟',
      },
    }),
  ])

  // Create likes
  console.log('👍 Creating likes...')
  await Promise.all([
    prisma.like.create({
      data: {
        userId: users[1].id,
        postId: posts[0].id,
      },
    }),
    prisma.like.create({
      data: {
        userId: users[3].id,
        postId: posts[0].id,
      },
    }),
    prisma.like.create({
      data: {
        userId: users[4].id,
        postId: posts[1].id,
      },
    }),
    prisma.like.create({
      data: {
        userId: users[0].id,
        postId: posts[2].id,
      },
    }),
  ])

  // Create job applications
  console.log('📋 Creating job applications...')
  await Promise.all([
    prisma.jobApplication.create({
      data: {
        userId: users[0].id,
        jobId: jobs[0].id,
        status: 'PENDING',
        coverLetter: 'أتقدم بطلب للعمل كمطور تطبيقات محمول. لدي خبرة واسعة في React Native وقد عملت على عدة مشاريع ناجحة.',
        resume: '/resumes/ahmed-benali-resume.pdf',
      },
    }),
    prisma.jobApplication.create({
      data: {
        userId: users[3].id,
        jobId: jobs[4].id,
        status: 'ACCEPTED',
        coverLetter: 'مهتمة جداً بالتدريب في مجال التسويق الرقمي وأتطلع للتعلم من فريقكم المميز.',
        resume: '/resumes/amina-boudiaf-resume.pdf',
      },
    }),
  ])

  // Create sample chat messages
  console.log('💬 Creating chat messages...')
  await Promise.all([
    prisma.chatMessage.create({
      data: {
        sessionId: 'session_' + users[0].id,
        userId: users[0].id,
        role: 'USER',
        content: 'مرحباً، أريد المساعدة في العثور على وظيفة في مجال التكنولوجيا',
      },
    }),
    prisma.chatMessage.create({
      data: {
        sessionId: 'session_' + users[0].id,
        userId: users[0].id,
        role: 'ASSISTANT',
        content: 'أهلاً وسهلاً! سأساعدك في العثور على فرص عمل مناسبة في مجال التكنولوجيا. يمكنني أن أقترح عليك عدة وظائف متاحة حالياً في الجزائر.',
      },
    }),
    prisma.chatMessage.create({
      data: {
        sessionId: 'session_' + users[1].id,
        userId: users[1].id,
        role: 'USER',
        content: 'هل توجد دورات تدريبية في التسويق الرقمي؟',
      },
    }),
    prisma.chatMessage.create({
      data: {
        sessionId: 'session_' + users[1].id,
        userId: users[1].id,
        role: 'ASSISTANT',
        content: 'نعم، توجد عدة دورات ممتازة في التسويق الرقمي. يمكنني ترشيح دورات مجانية ومدفوعة حسب مستواك واهتمامك.',
      },
    }),
  ])

  console.log('✅ Seed completed successfully!')
  console.log(`📊 Created:
  - ${users.length} users
  - ${jobs.length} jobs  
  - ${courses.length} courses
  - ${events.length} events
  - ${mappedServices.length + basicGovernmentServices.length} government services (including ${mappedServices.length} from bawabatic.dz)
  - ${posts.length} community posts
  - Sample health records, enrollments, applications, and chat messages`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
