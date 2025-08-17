import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ExtractedService {
  name: string;
  description: string;
  category: string;
  categoryEn?: string;
  externalUrl?: string;
  bawabticUrl: string;
  sector?: string;
  targetGroup?: string;
  serviceId?: string;
}

async function extractAdditionalData() {
  console.log('🔍 Starting additional data extraction from bawabatic.dz...');
  
  const browser = await chromium.launch({
    headless: false,
    timeout: 60000
  });
  
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  
  try {
    // Categories to extract from (focusing on ones we might have missed)
    const categories = [
      { id: 9, name: 'الصحة', nameEn: 'Health' },
      { id: 10, name: 'البيئة والفلاحة', nameEn: 'Environment and Agriculture' },
      { id: 11, name: 'الثقافة والرياضة', nameEn: 'Culture and Sports' },
      { id: 12, name: 'الطاقة', nameEn: 'Energy' },
      { id: 13, name: 'الدعم الاجتماعي', nameEn: 'Social Support' },
      { id: 14, name: 'ذوي الاحتياجات الخاصة', nameEn: 'Special Needs' },
      { id: 15, name: 'القانون والعدالة', nameEn: 'Law and Justice' },
      { id: 16, name: 'السياحة والترفيه', nameEn: 'Tourism and Entertainment' },
      { id: 17, name: 'الصناعة', nameEn: 'Industry' }
    ];
    
    const allNewServices: ExtractedService[] = [];
    
    for (const category of categories) {
      console.log(`📂 Extracting ${category.name} (${category.nameEn})...`);
      
      try {
        // Navigate to category page
        await page.goto(`https://bawabatic.dz?req=informations&op=list&idC=${category.id}`, {
          waitUntil: 'domcontentloaded'
        });
        
        await page.waitForTimeout(2000);
        
        // Extract service links
        const services = await page.evaluate((categoryInfo) => {
          const extractedServices: any[] = [];
          
          // Look for service links
          const serviceLinks = document.querySelectorAll('a[href*="detail"][href*="id="]');
          
          serviceLinks.forEach((link: any) => {
            const href = link.href;
            const text = link.textContent?.trim();
            
            if (text && href) {
              const urlParams = new URLSearchParams(href.split('?')[1]);
              const serviceId = urlParams.get('id');
              
              if (serviceId) {
                extractedServices.push({
                  serviceId: serviceId,
                  name: text,
                  bawabticUrl: href,
                  category: categoryInfo.name,
                  categoryEn: categoryInfo.nameEn
                });
              }
            }
          });
          
          return extractedServices;
        }, category);
        
        console.log(`  Found ${services.length} services`);
        
        // Extract details for each service (limit to 5 per category for efficiency)
        for (const service of services.slice(0, 5)) {
          try {
            console.log(`    Extracting: ${service.name}`);
            
            await page.goto(service.bawabticUrl, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1000);
            
            const details = await page.evaluate((baseService) => {
              const enhanced = { ...baseService };
              
              // Extract description
              const contentElements = document.querySelectorAll('p, div, td');
              for (const el of contentElements) {
                const text = el.textContent?.trim();
                if (text && text.length > 50 && !enhanced.description) {
                  enhanced.description = text;
                  break;
                }
              }
              
              // Extract external URLs
              const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="bawabatic.dz"])');
              if (externalLinks.length > 0) {
                enhanced.externalUrl = (externalLinks[0] as HTMLAnchorElement).href;
              }
              
              // Extract sector information
              const bodyText = document.body.textContent || '';
              const sectorMatch = bodyText.match(/وزارة\s+([^،\n.]+)/);
              if (sectorMatch) {
                enhanced.sector = sectorMatch[1].trim();
              }
              
              // Extract target group
              const targetMatch = bodyText.match(/(مواطن|طالب|شركة|مقاول)/);
              if (targetMatch) {
                enhanced.targetGroup = targetMatch[1];
              } else {
                enhanced.targetGroup = 'مواطنين';
              }
              
              return enhanced;
            }, service);
            
            allNewServices.push(details);
            
          } catch (error) {
            console.error(`    Error extracting ${service.name}:`, error);
          }
        }
        
      } catch (error) {
        console.error(`  Error extracting category ${category.name}:`, error);
      }
    }
    
    console.log(`✅ Extraction completed! Found ${allNewServices.length} new services`);
    
    // Save extracted services to database
    if (allNewServices.length > 0) {
      console.log('💾 Saving new services to database...');
      
      const mappedServices = allNewServices.map(service => ({
        // Basic Information
        name: service.name,
        nameEn: translateServiceName(service.name),
        description: service.description || 'خدمة حكومية',
        descriptionEn: translateDescription(service.description),
        
        // Service Details
        serviceId: service.serviceId,
        category: mapCategoryToEnum(service.categoryEn || service.category),
        
        // Government Structure
        sector: service.sector,
        sectorEn: translateSector(service.sector || ''),
        targetGroup: service.targetGroup || 'مواطنين',
        targetGroupEn: 'Citizens',
        
        // Process and Requirements
        requirements: generateRequirements(service.name),
        requirementsEn: ['Valid ID', 'Application form', 'Required documents'],
        process: generateProcess(service.externalUrl),
        processEn: generateProcessEn(service.externalUrl),
        documents: ['بطاقة التعريف الوطنية', 'استمارة الطلب'],
        documentsEn: ['National ID', 'Application form'],
        
        // Service Details
        fee: 'حسب التعريفة',
        processingTime: '7-30 يوم',
        processingTimeEn: '7-30 days',
        
        // Contact and Access
        office: 'المكتب المختص',
        contactInfo: 'اتصل بالمكتب المختص',
        onlineUrl: service.externalUrl,
        bawabticUrl: service.bawabticUrl,
        
        // Additional Information
        benefits: ['خدمة حكومية', 'تسهيل للمواطن'],
        benefitsEn: ['Government service', 'Citizen facilitation'],
        
        // Location and Availability
        isOnline: Boolean(service.externalUrl),
        isNational: true,
        isActive: true
      }));
      
      // Insert new services
      await prisma.governmentService.createMany({
        data: mappedServices
      });
      
      console.log(`✅ Successfully added ${mappedServices.length} new services to database!`);
    }
    
  } catch (error) {
    console.error('❌ Extraction failed:', error);
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

// Helper functions
function translateServiceName(arabicName: string): string {
  const translations: { [key: string]: string } = {
    'رخصة': 'License',
    'بطاقة': 'Card',
    'شهادة': 'Certificate',
    'تسجيل': 'Registration',
    'طلب': 'Application',
    'إنشاء': 'Creation',
    'تجديد': 'Renewal',
    'استعلام': 'Inquiry',
    'حجز': 'Booking',
    'دفع': 'Payment'
  };
  
  let englishName = arabicName;
  for (const [arabic, english] of Object.entries(translations)) {
    englishName = englishName.replace(new RegExp(arabic, 'g'), english);
  }
  
  return englishName;
}

function translateDescription(arabicDesc: string): string {
  if (!arabicDesc) return '';
  
  return arabicDesc
    .replace(/خدمة/g, 'service')
    .replace(/إجراء/g, 'procedure')
    .replace(/مواطن/g, 'citizen');
}

function translateSector(arabicSector: string): string | null {
  if (!arabicSector) return null;
  
  const sectorTranslations: { [key: string]: string } = {
    'التعليم العالي': 'Higher Education',
    'العمل والتشغيل': 'Labor and Employment',
    'الصحة': 'Health',
    'النقل': 'Transport',
    'السكن': 'Housing',
    'التجارة': 'Commerce',
    'الداخلية': 'Interior',
    'العدل': 'Justice',
    'المالية': 'Finance'
  };
  
  for (const [arabic, english] of Object.entries(sectorTranslations)) {
    if (arabicSector.includes(arabic)) {
      return `Ministry of ${english}`;
    }
  }
  
  return arabicSector;
}

function mapCategoryToEnum(category: string): any {
  const mapping: { [key: string]: any } = {
    'Health': 'HEALTH',
    'Environment and Agriculture': 'AGRICULTURE',
    'Culture and Sports': 'CULTURE_SPORTS',
    'Energy': 'ENERGY',
    'Social Support': 'SOCIAL_SUPPORT',
    'Special Needs': 'SPECIAL_NEEDS',
    'Law and Justice': 'LAW_JUSTICE',
    'Tourism and Entertainment': 'TOURISM',
    'Industry': 'INDUSTRY'
  };
  
  return mapping[category] || 'OTHER';
}

function generateRequirements(serviceName: string): string[] {
  const base = ['بطاقة التعريف الوطنية', 'استمارة الطلب'];
  
  if (serviceName.includes('رخصة')) {
    return [...base, 'شهادة طبية', 'صور شمسية'];
  }
  
  if (serviceName.includes('شهادة')) {
    return [...base, 'وثائق إثبات'];
  }
  
  return base;
}

function generateProcess(hasExternalUrl?: string): string[] {
  if (hasExternalUrl) {
    return [
      'الدخول إلى المنصة الإلكترونية',
      'تسجيل الدخول أو إنشاء حساب',
      'ملء البيانات المطلوبة',
      'رفع الوثائق',
      'تقديم الطلب',
      'متابعة الحالة'
    ];
  }
  
  return [
    'تحضير الوثائق',
    'ملء الاستمارة',
    'تقديم الطلب',
    'دفع الرسوم',
    'انتظار المعالجة',
    'استلام الخدمة'
  ];
}

function generateProcessEn(hasExternalUrl?: string): string[] {
  if (hasExternalUrl) {
    return [
      'Access online platform',
      'Login or create account',
      'Fill required information',
      'Upload documents',
      'Submit application',
      'Track status'
    ];
  }
  
  return [
    'Prepare documents',
    'Fill application',
    'Submit request',
    'Pay fees',
    'Wait for processing',
    'Receive service'
  ];
}

// Run extraction
extractAdditionalData();
