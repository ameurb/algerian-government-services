#!/usr/bin/env tsx

/**
 * Simple Direct Bawabatic.dz Scraper
 * Based on discovered URL patterns: ?req=themes&op=services&id=X
 */

import { chromium, Browser, Page } from 'playwright';
import { prisma } from '../lib/prisma';

interface ServiceData {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  content: string;
}

class SimpleBawabaticScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private baseUrl = 'https://bawabatic.dz';

  constructor() {
    // We'll use the imported prisma instance
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Simple Bawabatic Scraper...');
    
    await prisma.$connect();
    console.log('✅ Database connected');

    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--ignore-certificate-errors']
    });

    this.page = await this.browser.newPage();
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    console.log('✅ Browser initialized');
  }

  async scrapeByDirectServiceIDs(): Promise<ServiceData[]> {
    if (!this.page) throw new Error('Browser not initialized');

    const services: ServiceData[] = [];
    console.log('🔍 Scraping services by direct ID approach...');

    // Try service IDs from 1 to 50 (we discovered some exist)
    for (let id = 1; id <= 50; id++) {
      try {
        const url = `${this.baseUrl}/?req=themes&op=services&id=${id}`;
        console.log(`  📄 Checking service ID ${id}...`);

        await this.page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });

        // Simple check if page has content
        const pageContent = await this.page.textContent('body');
        
        if (pageContent && pageContent.length > 200 && !pageContent.includes('404') && !pageContent.includes('not found')) {
          const title = await this.page.textContent('title') || `Service ${id}`;
          
          console.log(`    ✅ Found service: ${title}`);
          
          services.push({
            id: `service_${id}`,
            name: title,
            description: pageContent.substring(0, 500),
            category: this.categorizeByContent(pageContent),
            url: url,
            content: pageContent.substring(0, 2000)
          });
        } else {
          console.log(`    ❌ No content for service ID ${id}`);
        }

        // Small delay to be respectful
        await this.page.waitForTimeout(500);

      } catch (error: any) {
        console.log(`    ⚠️  Error checking service ID ${id}: ${error.message}`);
      }
    }

    return services;
  }

  async scrapeByDetailPages(): Promise<ServiceData[]> {
    if (!this.page) throw new Error('Browser not initialized');

    const services: ServiceData[] = [];
    console.log('🔍 Scraping by detail pages approach...');

    // Try different detail page patterns
    for (let id = 1; id <= 100; id++) {
      try {
        const url = `${this.baseUrl}/?req=informations&op=detail&id=${id}`;
        console.log(`  📄 Checking detail ID ${id}...`);

        await this.page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 8000 
        });

        const pageContent = await this.page.textContent('body');
        
        if (pageContent && pageContent.length > 200 && !pageContent.includes('404')) {
          const title = await this.page.textContent('title') || `Detail ${id}`;
          
          console.log(`    ✅ Found detail: ${title}`);
          
          services.push({
            id: `detail_${id}`,
            name: title,
            description: pageContent.substring(0, 500),
            category: this.categorizeByContent(pageContent),
            url: url,
            content: pageContent.substring(0, 2000)
          });
        }

        await this.page.waitForTimeout(300);

      } catch (error: any) {
        console.log(`    ⚠️  Error checking detail ID ${id}: ${error.message}`);
      }
    }

    return services;
  }

  private categorizeByContent(content: string): string {
    const keywords = {
      'EMPLOYMENT': ['عمل', 'توظيف', 'وظيفة'],
      'EDUCATION': ['تعليم', 'تربية', 'جامعة'],
      'HEALTH': ['صحة', 'طبي', 'مستشفى'],
      'CIVIL_STATUS': ['حالة مدنية', 'زواج', 'ميلاد'],
      'BUSINESS': ['تجارة', 'أعمال', 'شركة'],
      'HOUSING': ['سكن', 'عمران', 'بناء'],
      'TRANSPORTATION': ['نقل', 'مواصلات', 'سيارة']
    };

    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => content.includes(word))) {
        return category;
      }
    }

    return 'GENERAL';
  }

  async saveToDatabase(services: ServiceData[]): Promise<void> {
    console.log(`💾 Saving ${services.length} services to database...`);

    for (const service of services) {
      try {
        const existing = await prisma.governmentService.findFirst({
          where: { 
            OR: [
              { serviceId: service.id },
              { bawabticUrl: service.url }
            ]
          }
        });

        const serviceData = {
          name: service.name,
          nameEn: service.name,
          description: service.description,
          descriptionEn: service.description,
          serviceId: service.id,
          category: service.category as any,
          serviceType: 'خدمة حكومية',
          serviceTypeEn: 'Government Service',
          sector: 'غير محدد',
          sectorEn: 'Not Specified',
          targetGroup: 'عام',
          targetGroupEn: 'General',
          targetGroups: ['عام'],
          requirements: [],
          requirementsEn: [],
          process: [],
          processEn: [],
          documents: [],
          documentsEn: [],
          processingTime: 'غير محدد',
          processingTimeEn: 'Not Specified',
          fee: 'غير محدد',
          office: 'غير محدد',
          contactInfo: 'غير محدد',
          isOnline: false,
          bawabticUrl: service.url,
          benefits: [],
          benefitsEn: [],
          isActive: true,
        };

        if (existing) {
          await prisma.governmentService.update({
            where: { id: existing.id },
            data: serviceData
          });
          console.log(`  🔄 Updated: ${service.name}`);
        } else {
          await prisma.governmentService.create({
            data: serviceData
          });
          console.log(`  🆕 Created: ${service.name}`);
        }

      } catch (error: any) {
        console.error(`  ❌ Failed to save ${service.name}: ${error.message}`);
      }
    }
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
    await prisma.$disconnect();
    console.log('🧹 Cleanup completed');
  }
}

async function main() {
  const scraper = new SimpleBawabaticScraper();
  
  try {
    await scraper.initialize();
    
    // Try both approaches
    const serviceResults = await scraper.scrapeByDirectServiceIDs();
    const detailResults = await scraper.scrapeByDetailPages();
    
    const allServices = [...serviceResults, ...detailResults];
    console.log(`\n📊 Total services found: ${allServices.length}`);
    
    if (allServices.length > 0) {
      await scraper.saveToDatabase(allServices);
      console.log('✅ Scraping completed successfully!');
    } else {
      console.log('⚠️  No services found');
    }
    
  } catch (error: any) {
    console.error('❌ Scraping failed:', error);
  } finally {
    await scraper.cleanup();
  }
}

if (require.main === module) {
  main();
}

export { SimpleBawabaticScraper };
