import { PrismaClient } from '@prisma/client';
import { AI_TEMPLATES } from '../lib/ai-templates';

const prisma = new PrismaClient();

const GOVERNMENT_SERVICES = [
  // PASSPORT SERVICES
  {
    name: 'طلب جواز السفر البيومتري',
    nameEn: 'Biometric Passport Application',
    nameFr: 'Demande de passeport biométrique',
    description: 'طلب الحصول على جواز السفر البيومتري الجزائري الجديد للمواطنين',
    descriptionEn: 'Application for new Algerian biometric passport for citizens',
    descriptionFr: 'Demande de nouveau passeport biométrique algérien pour les citoyens',
    category: 'CIVIL_STATUS',
    subcategory: 'جواز السفر',
    subcategoryEn: 'Passport',
    subcategoryFr: 'Passeport',
    ministry: 'وزارة الداخلية والجماعات المحلية والتهيئة العمرانية',
    ministryEn: 'Ministry of Interior and Local Communities and Urban Planning',
    ministryFr: 'Ministère de l\'Intérieur et des Collectivités Locales et de l\'Aménagement du Territoire',
    agency: 'مديرية الوثائق والأرشيف',
    agencyEn: 'Directorate of Documents and Archives',
    agencyFr: 'Direction des Documents et Archives',
    documents: 'شهادة الميلاد|بطاقة التعريف الوطنية|4 صور شخصية بيومترية|إثبات الإقامة|جواز السفر القديم (للتجديد)',
    documentsEn: 'Birth Certificate|National ID Card|4 Biometric Photos|Residence Proof|Old Passport (for renewal)',
    documentsFr: 'Acte de naissance|Carte d\'identité nationale|4 Photos biométriques|Justificatif de résidence|Ancien passeport (renouvellement)',
    requirements: 'سن 18 سنة فما فوق|مواطن جزائري|ليس له مانع أمني|دفع الرسوم المطلوبة',
    requirementsEn: 'Age 18 years and above|Algerian citizen|No security restrictions|Payment of required fees',
    requirementsFr: 'Âge 18 ans et plus|Citoyen algérien|Aucune restriction de sécurité|Paiement des frais requis',
    process: 'ملء الاستمارة الإلكترونية|طباعة الاستمارة|جمع الوثائق المطلوبة|الذهاب للمكتب المختص|دفع الرسوم|أخذ البصمات والصورة|انتظار المعالجة|استلام جواز السفر',
    processEn: 'Fill online form|Print form|Gather required documents|Visit relevant office|Pay fees|Take fingerprints and photo|Wait for processing|Collect passport',
    processFr: 'Remplir le formulaire en ligne|Imprimer le formulaire|Rassembler les documents requis|Visiter le bureau compétent|Payer les frais|Prendre les empreintes et photo|Attendre le traitement|Récupérer le passeport',
    fee: '6000 دج',
    feeEn: '6000 DZD',
    feeFr: '6000 DZD',
    processingTime: '15-30 يوم عمل',
    processingTimeEn: '15-30 working days',
    processingTimeFr: '15-30 jours ouvrables',
    contactPhone: '+213 21 65 25 25',
    contactEmail: 'passeport@interieur.gov.dz',
    office: 'مكتب جوازات السفر - مديرية الوثائق والأرشيف',
    officeEn: 'Passport Office - Documents and Archives Directorate',
    officeFr: 'Bureau des Passeports - Direction des Documents et Archives',
    bawabticUrl: 'https://bawabatic.dz',
    isOnline: true,
    isNational: true,
    keywords: 'جواز سفر بيومتري سفر سياحة خارج الجزائر وثيقة سفر',
    keywordsEn: 'passport biometric travel tourism abroad Algeria travel document',
    keywordsFr: 'passeport biométrique voyage tourisme étranger Algérie document voyage',
    priority: 10
  },

  {
    name: 'متابعة طلب جواز السفر',
    nameEn: 'Track Passport Application',
    nameFr: 'Suivi de demande de passeport',
    description: 'متابعة حالة ومآل طلب جواز السفر البيومتري عبر الرقم المرجعي',
    descriptionEn: 'Track the status of biometric passport application using reference number',
    descriptionFr: 'Suivre le statut de la demande de passeport biométrique avec le numéro de référence',
    category: 'CIVIL_STATUS',
    subcategory: 'جواز السفر',
    subcategoryEn: 'Passport',
    subcategoryFr: 'Passeport',
    ministry: 'وزارة الداخلية والجماعات المحلية والتهيئة العمرانية',
    agency: 'مديرية الوثائق والأرشيف',
    documents: 'رقم الطلب المرجعي|بطاقة التعريف الوطنية',
    documentsEn: 'Application Reference Number|National ID Card',
    documentsFr: 'Numéro de référence de demande|Carte d\'identité nationale',
    fee: 'مجاني',
    feeEn: 'Free',
    feeFr: 'Gratuit',
    processingTime: 'فوري',
    processingTimeEn: 'Instant',
    processingTimeFr: 'Instantané',
    contactPhone: '+213 21 65 25 25',
    onlineUrl: 'https://passport.interieur.gov.dz/track',
    isOnline: true,
    keywords: 'متابعة جواز سفر حالة طلب تتبع رقم مرجعي',
    keywordsEn: 'track passport status application follow reference number',
    keywordsFr: 'suivi passeport statut demande référence numéro',
    priority: 9
  },

  // NATIONAL ID SERVICES
  {
    name: 'طلب بطاقة التعريف الوطنية البيومترية',
    nameEn: 'Biometric National ID Card Application',
    nameFr: 'Demande de carte d\'identité nationale biométrique',
    description: 'طلب الحصول على بطاقة التعريف الوطنية البيومترية للمواطنين الجزائريين',
    descriptionEn: 'Application for biometric national identity card for Algerian citizens',
    descriptionFr: 'Demande de carte d\'identité nationale biométrique pour les citoyens algériens',
    category: 'CIVIL_STATUS',
    subcategory: 'بطاقة التعريف',
    subcategoryEn: 'Identity Card',
    subcategoryFr: 'Carte d\'identité',
    ministry: 'وزارة الداخلية والجماعات المحلية والتهيئة العمرانية',
    agency: 'مديرية الحالة المدنية',
    documents: 'شهادة الميلاد|شهادة الإقامة|4 صور شخصية بيومترية|بطاقة التعريف القديمة (للتجديد)',
    documentsEn: 'Birth Certificate|Residence Certificate|4 Biometric Photos|Old ID Card (for renewal)',
    documentsFr: 'Acte de naissance|Certificat de résidence|4 Photos biométriques|Ancienne carte d\'identité (renouvellement)',
    fee: 'مجاني',
    feeEn: 'Free',
    feeFr: 'Gratuit',
    processingTime: '15-20 يوم عمل',
    processingTimeEn: '15-20 working days',
    processingTimeFr: '15-20 jours ouvrables',
    contactPhone: '+213 21 73 25 25',
    isOnline: false,
    keywords: 'بطاقة تعريف هوية وطنية بيومترية مواطن جزائري',
    keywordsEn: 'national id identity card biometric citizen Algerian',
    keywordsFr: 'carte identité nationale biométrique citoyen algérien',
    priority: 10
  },

  // BUSINESS SERVICES
  {
    name: 'تسجيل شركة ذات مسؤولية محدودة',
    nameEn: 'Limited Liability Company Registration',
    nameFr: 'Enregistrement de société à responsabilité limitée',
    description: 'تأسيس وتسجيل شركة ذات مسؤولية محدودة في السجل التجاري الجزائري',
    descriptionEn: 'Establishment and registration of limited liability company in Algerian commercial register',
    descriptionFr: 'Création et enregistrement de société à responsabilité limitée dans le registre commercial algérien',
    category: 'BUSINESS',
    subcategory: 'تأسيس الشركات',
    subcategoryEn: 'Company Formation',
    subcategoryFr: 'Création d\'entreprise',
    ministry: 'وزارة التجارة وترقية الصادرات',
    ministryEn: 'Ministry of Trade and Export Promotion',
    ministryFr: 'Ministère du Commerce et de la Promotion des Exportations',
    agency: 'المركز الوطني لسجل التجارة',
    agencyEn: 'National Center for Commercial Register',
    agencyFr: 'Centre National du Registre de Commerce',
    documents: 'القانون الأساسي للشركة|إثبات العنوان التجاري|رأس المال المودع|تصريح شرفي للشركاء|بطاقة التعريف للشركاء|شهادة الإقامة للشركاء',
    documentsEn: 'Company Articles|Commercial Address Proof|Deposited Capital|Partners\' Declaration|Partners\' ID Cards|Partners\' Residence Certificates',
    documentsFr: 'Statuts de la société|Justificatif d\'adresse commerciale|Capital déposé|Déclaration sur l\'honneur des associés|Cartes d\'identité des associés|Certificats de résidence des associés',
    fee: '10000-25000 دج',
    feeEn: '10,000-25,000 DZD',
    feeFr: '10 000-25 000 DZD',
    processingTime: '30-45 يوم عمل',
    processingTimeEn: '30-45 working days',
    processingTimeFr: '30-45 jours ouvrables',
    contactPhone: '+213 21 98 11 11',
    contactEmail: 'cnrc@commerce.gov.dz',
    onlineUrl: 'https://cnrc.org.dz',
    isOnline: true,
    keywords: 'تسجيل شركة تأسيس أعمال تجارة سجل تجاري مسؤولية محدودة',
    keywordsEn: 'company registration business formation commerce commercial register limited liability',
    keywordsFr: 'enregistrement société création entreprise commerce registre commercial responsabilité limitée',
    priority: 8
  },

  // EDUCATION SERVICES  
  {
    name: 'طلب منحة التعليم العالي',
    nameEn: 'Higher Education Grant Application',
    nameFr: 'Demande de bourse d\'études supérieures',
    description: 'طلب الحصول على منحة جامعية للطلبة المتفوقين أو ذوي الدخل المحدود',
    descriptionEn: 'Application for university grant for excellent students or those with limited income',
    descriptionFr: 'Demande de bourse universitaire pour étudiants excellents ou à revenus limités',
    category: 'EDUCATION',
    subcategory: 'التعليم العالي',
    subcategoryEn: 'Higher Education', 
    subcategoryFr: 'Enseignement supérieur',
    ministry: 'وزارة التعليم العالي والبحث العلمي',
    ministryEn: 'Ministry of Higher Education and Scientific Research',
    ministryFr: 'Ministère de l\'Enseignement Supérieur et de la Recherche Scientifique',
    agency: 'الديوان الوطني للخدمات الجامعية',
    agencyEn: 'National Office of University Services',
    agencyFr: 'Office National des Œuvres Universitaires',
    documents: 'شهادة البكالوريا|كشف النقاط|شهادة الدخل العائلي|بطاقة التعريف|شهادة الإقامة|شهادة طبية',
    documentsEn: 'Baccalaureate Certificate|Grade Transcript|Family Income Certificate|ID Card|Residence Certificate|Medical Certificate',
    documentsFr: 'Certificat de baccalauréat|Relevé de notes|Certificat de revenus familiaux|Carte d\'identité|Certificat de résidence|Certificat médical',
    fee: 'مجاني',
    feeEn: 'Free',
    feeFr: 'Gratuit',
    processingTime: '30-60 يوم',
    processingTimeEn: '30-60 days',
    processingTimeFr: '30-60 jours',
    contactPhone: '+213 21 92 15 15',
    contactEmail: 'bourses@mesrs.dz',
    onlineUrl: 'https://progres.mesrs.dz',
    isOnline: true,
    keywords: 'منحة تعليم عالي جامعة طالب بكالوريا دراسة',
    keywordsEn: 'grant higher education university student baccalaureate study',
    keywordsFr: 'bourse enseignement supérieur université étudiant baccalauréat études',
    priority: 8
  },

  // DRIVING LICENSE
  {
    name: 'طلب رخصة السياقة',
    nameEn: 'Driving License Application',
    nameFr: 'Demande de permis de conduire',
    description: 'طلب الحصول على رخصة السياقة لقيادة المركبات في الجزائر',
    descriptionEn: 'Application for driving license to operate vehicles in Algeria',
    descriptionFr: 'Demande de permis de conduire pour conduire des véhicules en Algérie',
    category: 'TRANSPORTATION',
    subcategory: 'رخصة السياقة',
    subcategoryEn: 'Driving License',
    subcategoryFr: 'Permis de conduire',
    ministry: 'وزارة الأشغال العمومية والنقل',
    ministryEn: 'Ministry of Public Works and Transport',
    ministryFr: 'Ministère des Travaux Publics et des Transports',
    agency: 'المديرية العامة للأمن الوطني',
    agencyEn: 'General Directorate of National Security',
    agencyFr: 'Direction Générale de la Sûreté Nationale',
    documents: 'بطاقة التعريف الوطنية|شهادة الإقامة|4 صور شخصية|شهادة طبية|شهادة التكوين في مدرسة القيادة',
    documentsEn: 'National ID Card|Residence Certificate|4 Photos|Medical Certificate|Driving School Training Certificate',
    documentsFr: 'Carte d\'identité nationale|Certificat de résidence|4 Photos|Certificat médical|Certificat de formation auto-école',
    requirements: 'سن 18 سنة فما فوق|إجتياز الامتحان النظري|إجتياز الامتحان التطبيقي|شهادة طبية صالحة',
    requirementsEn: 'Age 18 years and above|Pass theoretical exam|Pass practical exam|Valid medical certificate',
    requirementsFr: 'Âge 18 ans et plus|Réussir l\'examen théorique|Réussir l\'examen pratique|Certificat médical valide',
    fee: '3000 دج',
    feeEn: '3000 DZD',
    feeFr: '3000 DZD',
    processingTime: '45-60 يوم',
    processingTimeEn: '45-60 days',
    processingTimeFr: '45-60 jours',
    contactPhone: '+213 21 71 12 12',
    isOnline: false,
    keywords: 'رخصة سياقة قيادة سيارة امتحان مدرسة قيادة',
    keywordsEn: 'driving license car driving exam driving school',
    keywordsFr: 'permis conduire voiture examen auto-école',
    priority: 7
  },

  // BIRTH CERTIFICATE
  {
    name: 'استخراج شهادة الميلاد',
    nameEn: 'Birth Certificate Issuance',
    nameFr: 'Délivrance d\'acte de naissance',
    description: 'استخراج نسخة من شهادة الميلاد من سجلات الحالة المدنية',
    descriptionEn: 'Issuance of birth certificate copy from civil status records',
    descriptionFr: 'Délivrance d\'une copie d\'acte de naissance des registres d\'état civil',
    category: 'CIVIL_STATUS',
    subcategory: 'شهادات الحالة المدنية',
    subcategoryEn: 'Civil Status Certificates',
    subcategoryFr: 'Certificats d\'état civil',
    ministry: 'وزارة الداخلية والجماعات المحلية والتهيئة العمرانية',
    agency: 'مصلحة الحالة المدنية',
    agencyEn: 'Civil Status Service',
    agencyFr: 'Service de l\'État Civil',
    documents: 'بطاقة التعريف الوطنية|طلب خطي|إثبات القرابة (إن لم يكن للشخص نفسه)',
    documentsEn: 'National ID Card|Written Request|Proof of Relationship (if not for self)',
    documentsFr: 'Carte d\'identité nationale|Demande écrite|Preuve de parenté (si pas pour soi-même)',
    fee: '200 دج',
    feeEn: '200 DZD', 
    feeFr: '200 DZD',
    processingTime: '1-3 أيام',
    processingTimeEn: '1-3 days',
    processingTimeFr: '1-3 jours',
    contactPhone: '+213 21 63 10 10',
    isOnline: false,
    keywords: 'شهادة ميلاد حالة مدنية ولادة نسخة رسمية',
    keywordsEn: 'birth certificate civil status birth official copy',
    keywordsFr: 'acte naissance état civil naissance copie officielle',
    priority: 9
  },

  // HEALTH SERVICES
  {
    name: 'التسجيل في الضمان الاجتماعي',
    nameEn: 'Social Security Registration',
    nameFr: 'Inscription à la sécurité sociale',
    description: 'تسجيل المواطنين في نظام الضمان الاجتماعي للاستفادة من الخدمات الصحية',
    descriptionEn: 'Registration of citizens in social security system for health services benefits',
    descriptionFr: 'Inscription des citoyens au système de sécurité sociale pour bénéficier des services de santé',
    category: 'HEALTH',
    subcategory: 'الضمان الاجتماعي',
    subcategoryEn: 'Social Security',
    subcategoryFr: 'Sécurité sociale',
    ministry: 'وزارة العمل والتشغيل والضمان الاجتماعي',
    ministryEn: 'Ministry of Labour, Employment and Social Security',
    ministryFr: 'Ministère du Travail, de l\'Emploi et de la Sécurité Sociale',
    agency: 'الصندوق الوطني للضمان الاجتماعي',
    agencyEn: 'National Social Security Fund',
    agencyFr: 'Caisse Nationale de Sécurité Sociale',
    documents: 'بطاقة التعريف الوطنية|شهادة العمل|كشف الراتب|شهادة الإقامة',
    documentsEn: 'National ID Card|Work Certificate|Salary Statement|Residence Certificate',
    documentsFr: 'Carte d\'identité nationale|Certificat de travail|Bulletin de salaire|Certificat de résidence',
    fee: 'مجاني',
    feeEn: 'Free',
    feeFr: 'Gratuit',
    processingTime: '7-15 يوم',
    processingTimeEn: '7-15 days',
    processingTimeFr: '7-15 jours',
    contactPhone: '+213 21 68 20 20',
    contactEmail: 'info@cnas.dz',
    onlineUrl: 'https://www.cnas.dz',
    isOnline: true,
    keywords: 'ضمان اجتماعي تأمين صحة تسجيل عامل موظف',
    keywordsEn: 'social security health insurance registration worker employee',
    keywordsFr: 'sécurité sociale assurance santé inscription travailleur employé',
    priority: 7
  }
];

const AI_TEMPLATE_SEEDS = [
  {
    name: 'system_template',
    description: 'Main system template for AI assistant',
    template: AI_TEMPLATES.SYSTEM_TEMPLATE,
    language: 'multilingual',
    category: 'system'
  },
  {
    name: 'passport_template',
    description: 'Template for passport-related services',
    template: AI_TEMPLATES.PASSPORT_TEMPLATE,
    language: 'multilingual', 
    category: 'passport'
  },
  {
    name: 'id_card_template',
    description: 'Template for ID card services',
    template: AI_TEMPLATES.ID_CARD_TEMPLATE,
    language: 'multilingual',
    category: 'id_card'
  },
  {
    name: 'business_template',
    description: 'Template for business services',
    template: AI_TEMPLATES.BUSINESS_TEMPLATE,
    language: 'multilingual',
    category: 'business'
  }
];

async function main() {
  console.log('🌱 Starting SQLite database seed...');
  
  try {
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await prisma.serviceAnalytics.deleteMany();
    await prisma.chatMessage.deleteMany();
    await prisma.chatSession.deleteMany();
    await prisma.governmentService.deleteMany();
    await prisma.aITemplate.deleteMany();
    
    // Seed government services
    console.log('🏛️ Seeding government services...');
    for (const service of GOVERNMENT_SERVICES) {
      await prisma.governmentService.create({
        data: service
      });
    }
    console.log(`✅ Created ${GOVERNMENT_SERVICES.length} government services`);
    
    // Seed AI templates
    console.log('🤖 Seeding AI templates...');
    for (const template of AI_TEMPLATE_SEEDS) {
      await prisma.aITemplate.create({
        data: template
      });
    }
    console.log(`✅ Created ${AI_TEMPLATE_SEEDS.length} AI templates`);
    
    // Create sample chat session
    console.log('💬 Creating sample chat session...');
    await prisma.chatSession.create({
      data: {
        sessionId: 'demo_session_001',
        language: 'ar',
        contextData: 'Demo session for testing',
        isActive: true
      }
    });
    console.log('✅ Sample chat session created');
    
    console.log('🎉 SQLite database seeded successfully!');
    
    // Display statistics
    const serviceCount = await prisma.governmentService.count();
    const templateCount = await prisma.aITemplate.count();
    const sessionCount = await prisma.chatSession.count();
    
    console.log('📊 Database Statistics:');
    console.log(`  - Government Services: ${serviceCount}`);
    console.log(`  - AI Templates: ${templateCount}`);
    console.log(`  - Chat Sessions: ${sessionCount}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });