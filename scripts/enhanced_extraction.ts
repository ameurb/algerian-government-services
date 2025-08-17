import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

interface BawabaticService {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  sector: string;
  sectorEn?: string;
  structure: string;
  structureEn?: string;
  targetGroup: string;
  targetGroupEn?: string;
  category: string;
  categoryEn?: string;
  externalUrl?: string;
  bawabticUrl: string;
  ministry?: string;
  agency?: string;
  serviceType?: string;
  requirements?: string[];
  benefits?: string[];
  processingTime?: string;
  fee?: string;
  contactInfo?: string;
  isOnline?: boolean;
  additionalInfo?: any;
}

// Enhanced service categories mapping
const SERVICE_CATEGORIES = [
  { id: 1, name: 'العمل والتوظيف', nameEn: 'Employment and Jobs' },
  { id: 2, name: 'السكن والعمران', nameEn: 'Housing and Urban Development' },
  { id: 3, name: 'التجارة-المالية', nameEn: 'Commerce-Finance' },
  { id: 4, name: 'التربية و التعليم', nameEn: 'Education and Learning' },
  { id: 5, name: 'الضمان الإجتماعي', nameEn: 'Social Security' },
  { id: 6, name: 'تكنولوجيا-الاتصالات', nameEn: 'Technology and Communications' },
  { id: 7, name: 'المواصلات', nameEn: 'Transportation' },
  { id: 8, name: 'الحالة المدنية', nameEn: 'Civil Status' },
  { id: 9, name: 'الصحة', nameEn: 'Health' },
  { id: 10, name: 'البيئة والفلاحة', nameEn: 'Environment and Agriculture' },
  { id: 11, name: 'الثقافة والرياضة', nameEn: 'Culture and Sports' },
  { id: 12, name: 'الطاقة', nameEn: 'Energy' },
  { id: 13, name: 'الدعم الاجتماعي', nameEn: 'Social Support' },
  { id: 14, name: 'ذوي الاحتياجات الخاصة', nameEn: 'Special Needs' },
  { id: 15, name: 'القانون والعدالة', nameEn: 'Law and Justice' },
  { id: 16, name: 'السياحة والترفيه', nameEn: 'Tourism and Entertainment' },
  { id: 17, name: 'الصناعة', nameEn: 'Industry' },
  { id: 18, name: 'الإعلام', nameEn: 'Media' },
  { id: 19, name: 'الإدارة', nameEn: 'Management' },
  { id: 20, name: 'الشكاوى', nameEn: 'Complaints' }
];

async function extractComprehensiveData() {
  console.log('🚀 Starting comprehensive data extraction from bawabatic.dz...');
  
  const browser = await chromium.launch({ 
    headless: false,
    timeout: 60000
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  // Set longer timeout for page operations
  page.setDefaultTimeout(30000);
  
  const allServices: BawabaticService[] = [];
  
  try {
    for (const category of SERVICE_CATEGORIES) {
      console.log(`📂 Extracting category: ${category.name} (${category.nameEn})`);
      
      try {
        // Navigate to category page
        const categoryUrl = `https://bawabatic.dz?req=informations&op=list&idC=${category.id}`;
        await page.goto(categoryUrl, { waitUntil: 'networkidle' });
        
        // Wait for content to load
        await page.waitForTimeout(2000);
        
        // Extract service links from the category page
        const serviceLinks = await page.evaluate(() => {
          const links: { id: string; url: string; title: string }[] = [];
          
          // Look for service links in various possible selectors
          const linkSelectors = [
            'a[href*="detail"]',
            'a[href*="id="]',
            '.service-link',
            '.service-item a',
            'table a',
            'tr a'
          ];
          
          for (const selector of linkSelectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach((el: any) => {
              const href = el.href;
              const title = el.textContent?.trim() || '';
              
              if (href && href.includes('detail') && href.includes('id=')) {
                const urlParams = new URLSearchParams(href.split('?')[1]);
                const id = urlParams.get('id');
                if (id && title) {
                  links.push({ id, url: href, title });
                }
              }
            });
          }
          
          return links;
        });
        
        console.log(`  Found ${serviceLinks.length} services in category ${category.name}`);
        
        // Extract details for each service
        for (const link of serviceLinks.slice(0, 10)) { // Limit to 10 services per category for now
          try {
            console.log(`    Extracting service: ${link.title}`);
            
            await page.goto(link.url, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            
            const serviceDetails = await page.evaluate((linkInfo: any, categoryInfo: any) => {
              const service: any = {
                id: linkInfo.id,
                name: linkInfo.title,
                bawabticUrl: linkInfo.url,
                category: categoryInfo.name,
                categoryEn: categoryInfo.nameEn
              };
              
              // Extract description from various possible selectors
              const descriptionSelectors = [
                '.description',
                '.service-description',
                '.content',
                'p',
                '.details p',
                'td'
              ];
              
              for (const selector of descriptionSelectors) {
                const elements = document.querySelectorAll(selector);
                for (const el of elements) {
                  const text = el.textContent?.trim();
                  if (text && text.length > 50 && !service.description) {
                    service.description = text;
                    break;
                  }
                }
                if (service.description) break;
              }
              
              // Extract sector/ministry information
              const textContent = document.body.textContent || '';
              const sectorPatterns = [
                /وزارة\s+([^،\n]+)/g,
                /القطاع:\s*([^،\n]+)/g,
                /الجهة:\s*([^،\n]+)/g
              ];
              
              for (const pattern of sectorPatterns) {
                const match = pattern.exec(textContent);
                if (match && !service.sector) {
                  service.sector = match[1].trim();
                  break;
                }
              }
              
              // Extract target group
              const targetPatterns = [
                /الفئة المستهدفة:\s*([^،\n]+)/g,
                /موجه لـ:\s*([^،\n]+)/g,
                /المستفيدون:\s*([^،\n]+)/g
              ];
              
              for (const pattern of targetPatterns) {
                const match = pattern.exec(textContent);
                if (match && !service.targetGroup) {
                  service.targetGroup = match[1].trim();
                  break;
                }
              }
              
              // Extract external URL
              const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="bawabatic.dz"])');
              if (externalLinks.length > 0) {
                service.externalUrl = (externalLinks[0] as HTMLAnchorElement).href;
                service.isOnline = true;
              }
              
              // Extract additional structured data
              const tables = document.querySelectorAll('table');
              tables.forEach(table => {
                const rows = table.querySelectorAll('tr');
                rows.forEach(row => {
                  const cells = row.querySelectorAll('td');
                  if (cells.length >= 2) {
                    const key = cells[0].textContent?.trim().toLowerCase();
                    const value = cells[1].textContent?.trim();
                    
                    if (key && value) {
                      if (key.includes('وزارة') || key.includes('قطاع')) {
                        service.sector = service.sector || value;
                      } else if (key.includes('هيكل') || key.includes('مديرية')) {
                        service.structure = value;
                      } else if (key.includes('رسوم') || key.includes('تكلفة')) {
                        service.fee = value;
                      } else if (key.includes('مدة') || key.includes('وقت')) {
                        service.processingTime = value;
                      }
                    }
                  }
                });
              });
              
              return service;
            }, link, category);
            
            // Set default values
            serviceDetails.nameEn = translateToEnglish(serviceDetails.name);
            serviceDetails.descriptionEn = serviceDetails.description ? translateToEnglish(serviceDetails.description) : undefined;
            serviceDetails.targetGroup = serviceDetails.targetGroup || 'مواطنين';
            serviceDetails.targetGroupEn = 'Citizens';
            serviceDetails.structure = serviceDetails.structure || 'غير محدد';
            serviceDetails.structureEn = 'Not specified';
            
            allServices.push(serviceDetails);
            
          } catch (error) {
            console.error(`    Error extracting service ${link.title}:`, error);
          }
        }
        
      } catch (error) {
        console.error(`  Error extracting category ${category.name}:`, error);
      }
      
      // Add delay between categories
      await page.waitForTimeout(2000);
    }
    
  } catch (error) {
    console.error('Error during extraction:', error);
  } finally {
    await browser.close();
  }
  
  console.log(`✅ Extraction completed! Found ${allServices.length} total services`);
  
  // Save the extracted data
  const outputPath = path.join(__dirname, 'bawabatic_enhanced_extraction.ts');
  const fileContent = `// Enhanced comprehensive extraction from bawabatic.dz
// Generated on ${new Date().toISOString()}
// Total services extracted: ${allServices.length}

export const enhancedBawabaticServices = ${JSON.stringify(allServices, null, 2)};

export default enhancedBawabaticServices;
`;
  
  fs.writeFileSync(outputPath, fileContent, 'utf8');
  console.log(`📁 Data saved to: ${outputPath}`);
  
  return allServices;
}

// Simple translation helper (in real scenario, use proper translation service)
function translateToEnglish(arabicText: string): string {
  const translations: { [key: string]: string } = {
    'رخصة السياقة': 'Driving License',
    'بطاقة التعريف': 'National ID Card',
    'جواز السفر': 'Passport',
    'شهادة الميلاد': 'Birth Certificate',
    'رخصة البناء': 'Building Permit',
    'التسجيل في الجامعة': 'University Registration',
    'التأمين الصحي': 'Health Insurance',
    'إنشاء شركة': 'Company Registration',
    'رخصة التجارة': 'Trade License',
    'البطاقة الذهبية': 'Golden Card',
    'مواطنين': 'Citizens',
    'طلاب': 'Students',
    'أرباب العمل': 'Employers',
    'المقاولين': 'Contractors',
    'الشركات': 'Companies'
  };
  
  // Check for exact matches first
  if (translations[arabicText]) {
    return translations[arabicText];
  }
  
  // For longer texts, try to find key terms
  for (const [arabic, english] of Object.entries(translations)) {
    if (arabicText.includes(arabic)) {
      return arabicText.replace(arabic, english);
    }
  }
  
  // Return original if no translation found
  return arabicText;
}

// Run the extraction
if (require.main === module) {
  extractComprehensiveData()
    .then((services) => {
      console.log(`🎉 Successfully extracted ${services.length} services!`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Extraction failed:', error);
      process.exit(1);
    });
}

export { extractComprehensiveData };
