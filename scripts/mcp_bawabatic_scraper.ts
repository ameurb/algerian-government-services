#!/usr/bin/env tsx

/**
 * MCP-Compatible Bawabatic.dz Government Services Scraper
 * 
 * This script provides comprehensive scraping capabilities for Algerian government services
 * from https://bawabatic.dz with Model Context Protocol (MCP) compatibility.
 * 
 * Features:
 * - MongoDB connection and data management
 * - Real-time scraping with Playwright
 * - Data validation and transformation
 * - Incremental updates
 * - Export capabilities
 * - MCP server integration ready
 */

import { chromium, Browser, Page } from 'playwright';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

// Types for scraped data
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

interface ScrapingResult {
  success: boolean;
  servicesFound: number;
  newServices: number;
  updatedServices: number;
  errors: string[];
  data: BawabaticService[];
}

interface MCPRequest {
  method: string;
  params?: any;
}

interface MCPResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

class BawabaticMCPScraper {
  private prisma: PrismaClient;
  private browser: Browser | null = null;
  private page: Page | null = null;
  private baseUrl = 'http://bawabatic.dz';
  
  // Service categories mapping
  private readonly serviceCategories = [
    { id: 1, name: 'العمل والتوظيف', nameEn: 'Employment and Jobs', category: 'EMPLOYMENT' },
    { id: 2, name: 'السكن والعمران', nameEn: 'Housing and Urban Development', category: 'HOUSING' },
    { id: 3, name: 'التجارة-المالية', nameEn: 'Commerce-Finance', category: 'BUSINESS' },
    { id: 4, name: 'التربية و التعليم', nameEn: 'Education and Learning', category: 'EDUCATION' },
    { id: 5, name: 'الضمان الإجتماعي', nameEn: 'Social Security', category: 'SOCIAL_SECURITY' },
    { id: 6, name: 'تكنولوجيا-الاتصالات', nameEn: 'Technology and Communications', category: 'TECHNOLOGY' },
    { id: 7, name: 'المواصلات', nameEn: 'Transportation', category: 'TRANSPORT' },
    { id: 8, name: 'الحالة المدنية', nameEn: 'Civil Status', category: 'CIVIL_STATUS' },
    { id: 9, name: 'الصحة', nameEn: 'Health', category: 'HEALTH' },
    { id: 10, name: 'البيئة والفلاحة', nameEn: 'Environment and Agriculture', category: 'AGRICULTURE' },
    { id: 11, name: 'الثقافة والرياضة', nameEn: 'Culture and Sports', category: 'CULTURE' },
    { id: 12, name: 'الطاقة', nameEn: 'Energy', category: 'ENERGY' },
    { id: 13, name: 'الدعم الاجتماعي', nameEn: 'Social Support', category: 'SOCIAL_SUPPORT' },
    { id: 14, name: 'ذوي الاحتياجات الخاصة', nameEn: 'Special Needs', category: 'SPECIAL_NEEDS' },
    { id: 15, name: 'القانون والعدالة', nameEn: 'Law and Justice', category: 'LEGAL' },
    { id: 16, name: 'السياحة والترفيه', nameEn: 'Tourism and Entertainment', category: 'TOURISM' },
  ];

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Initialize the scraper with browser setup
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Bawabatic MCP Scraper...');
      
      // Test database connection
      await this.testDatabaseConnection();
      
      // Launch browser
      this.browser = await chromium.launch({
        headless: true, // Set to true for production
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--ignore-certificate-errors', '--ignore-ssl-errors', '--allow-running-insecure-content']
      });
      
      this.page = await this.browser.newPage();
      
      // Ignore SSL certificate errors
      await this.page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      
      // Ignore certificate errors on page level
      this.page.on('requestfailed', (request: any) => {
        if (request.failure()?.errorText?.includes('SSL') || request.failure()?.errorText?.includes('certificate')) {
          console.log('⚠️  SSL/Certificate error ignored for:', request.url());
        }
      });
      
      console.log('✅ Browser initialized successfully');
      
    } catch (error: any) {
      console.error('❌ Failed to initialize scraper:', error);
      throw error;
    }
  }

  /**
   * Test database connection
   */
  private async testDatabaseConnection(): Promise<void> {
    try {
      await this.prisma.$connect();
      console.log('✅ Database connection successful');
      
      // Test query
      const count = await this.prisma.governmentService.count();
      console.log(`📊 Current services in database: ${count}`);
      
    } catch (error: any) {
      console.error('❌ Database connection failed:', error);
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  /**
   * Scrape all services from Bawabatic.dz with improved robustness
   */
  async scrapeAllServices(): Promise<ScrapingResult> {
    const result: ScrapingResult = {
      success: false,
      servicesFound: 0,
      newServices: 0,
      updatedServices: 0,
      errors: [],
      data: []
    };

    try {
      if (!this.page) {
        throw new Error('Browser not initialized');
      }

      console.log('🔍 Starting comprehensive scraping of Bawabatic.dz...');
      
      // Navigate to main page with better error handling
      await this.page.goto(this.baseUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      console.log('📄 Loaded main page');

      // First, let's discover the actual page structure
      await this.discoverPageStructure();

      // Try different scraping strategies
      const strategies = [
        () => this.scrapeByDirectServicePages(),
        () => this.scrapeByCategoryPages(),
        () => this.scrapeBySearchResults()
      ];

      for (const strategy of strategies) {
        try {
          console.log('🔄 Trying scraping strategy...');
          const strategyData = await strategy();
          if (strategyData && strategyData.length > 0) {
            result.data.push(...strategyData);
            console.log(`✅ Strategy successful: Found ${strategyData.length} services`);
            break;
          }
        } catch (error: any) {
          console.log(`⚠️  Strategy failed: ${error.message}`);
          result.errors.push(error.message);
        }
      }

      result.servicesFound = result.data.length;
      
      // Save to database if we found any services
      if (result.data.length > 0) {
        const dbResult = await this.saveToDatabase(result.data);
        result.newServices = dbResult.created;
        result.updatedServices = dbResult.updated;
      }
      
      result.success = true;
      console.log(`\n✅ Scraping completed successfully!`);
      console.log(`📊 Total services found: ${result.servicesFound}`);
      console.log(`🆕 New services: ${result.newServices}`);
      console.log(`🔄 Updated services: ${result.updatedServices}`);

    } catch (error: any) {
      result.errors.push(error.message);
      console.error('❌ Scraping failed:', error);
    }

    return result;
  }

  /**
   * Scrape services from a specific category
   */
  private async scrapeCategoryServices(category: any): Promise<BawabaticService[]> {
    const services: BawabaticService[] = [];
    
    if (!this.page) return services;

    try {
      // Navigate to category page
      const categoryUrl = `${this.baseUrl}/ar/categories/${category.id}`;
      await this.page.goto(categoryUrl, { waitUntil: 'networkidle' });
      
      // Wait for services to load
      await this.page.waitForSelector('.service-item, .service-card, .service-list-item', { timeout: 10000 });
      
      // Extract service links
      const serviceLinks = await this.page.$$eval('a[href*="/services/"], a[href*="/service/"]', (links: any[]) => {
        return links.map((link: any) => ({
          url: link.href,
          title: link.textContent?.trim() || ''
        }));
      });

      console.log(`   🔗 Found ${serviceLinks.length} service links`);

      // Scrape each service
      for (const link of serviceLinks.slice(0, 10)) { // Limit for testing
        try {
          const service = await this.scrapeServiceDetails(link.url, category);
          if (service) {
            services.push(service);
          }
        } catch (error: any) {
          console.error(`     ❌ Failed to scrape service ${link.url}:`, error.message);
        }
      }

    } catch (error: any) {
      console.error(`Failed to scrape category ${category.nameEn}:`, error);
    }

    return services;
  }

  /**
   * Discover the actual page structure of bawabatic.dz
   */
  private async discoverPageStructure(): Promise<void> {
    if (!this.page) return;

    try {
      console.log('🔍 Analyzing page structure...');
      
      const structure = await this.page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a')).map(a => ({
          href: a.href,
          text: a.textContent?.trim()
        })).filter(link => link.href && link.text);

        const categories = links.filter(link => 
          link.href.includes('category') || 
          link.href.includes('service') ||
          (link.text && link.text.includes('خدمة')) ||
          (link.text && link.text.includes('إجراء'))
        );

        return {
          totalLinks: links.length,
          categoryLinks: categories.slice(0, 20), // First 20 relevant links
          pageTitle: document.title,
          hasSearch: !!document.querySelector('input[type="search"], .search-box, #search'),
          mainContent: document.querySelector('main, .content, .main-content, #content')?.tagName || 'NOT_FOUND'
        };
      });

      console.log('📊 Page structure:', JSON.stringify(structure, null, 2));
      
    } catch (error: any) {
      console.error('Failed to analyze page structure:', error);
    }
  }

  /**
   * Strategy 1: Try to scrape by finding direct service pages
   */
  private async scrapeByDirectServicePages(): Promise<BawabaticService[]> {
    if (!this.page) return [];

    console.log('🎯 Strategy 1: Looking for direct service pages...');
    
    const services: BawabaticService[] = [];

    try {
      // Look for service links on main page
      const serviceLinks = await this.page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a')).map(a => ({
          href: a.href,
          text: a.textContent?.trim() || ''
        })).filter(link => 
          link.href.includes('service') || 
          link.href.includes('procedure') ||
          link.href.includes('informations') ||
          (link.text && link.text.includes('خدمة')) ||
          (link.text && link.text.includes('إجراء'))
        );
        
        return links.slice(0, 50); // Limit to first 50
      });

      console.log(`🔗 Found ${serviceLinks.length} potential service links`);

      for (const link of serviceLinks.slice(0, 20)) { // Process first 20
        try {
          const service = await this.scrapeServiceFromUrl(link.href, link.text);
          if (service) {
            services.push(service);
            console.log(`  ✅ Scraped: ${service.name}`);
          }
        } catch (error: any) {
          console.log(`  ⚠️  Failed to scrape ${link.href}: ${error.message}`);
        }
      }

    } catch (error: any) {
      console.error('Strategy 1 failed:', error);
      throw error;
    }

    return services;
  }

  /**
   * Strategy 2: Try to scrape by category pages with fallback selectors
   */
  private async scrapeByCategoryPages(): Promise<BawabaticService[]> {
    if (!this.page) return [];

    console.log('📂 Strategy 2: Trying category-based scraping...');
    
    const services: BawabaticService[] = [];

    // Try different URL patterns for categories
    const categoryPatterns = [
      '/informations',
      '/services',
      '/procedures',
      '/?req=informations'
    ];

    for (const pattern of categoryPatterns) {
      try {
        const url = `${this.baseUrl}${pattern}`;
        console.log(`🔍 Trying category URL: ${url}`);
        
        await this.page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 15000 
        });

        // Try multiple selector strategies
        const selectors = [
          'a[href*="detail"]',
          'a[href*="service"]',
          'a[href*="procedure"]',
          '.service-item a',
          '.service-card a',
          '.list-item a',
          'li a',
          '.content a'
        ];

        for (const selector of selectors) {
          try {
            const links = await this.page.$$eval(selector, (elements: any[]) => 
              elements.map(el => ({
                href: el.href,
                text: el.textContent?.trim() || ''
              })).filter(link => link.href && link.text)
            );

            if (links.length > 0) {
              console.log(`  📋 Found ${links.length} links with selector: ${selector}`);
              
              for (const link of links.slice(0, 10)) {
                try {
                  const service = await this.scrapeServiceFromUrl(link.href, link.text);
                  if (service) {
                    services.push(service);
                  }
                } catch (error: any) {
                  // Continue with next link
                }
              }
              break; // Found working selector, no need to try others
            }
          } catch (error: any) {
            // Try next selector
          }
        }

        if (services.length > 0) break; // Found services, no need to try other patterns

      } catch (error: any) {
        console.log(`  ⚠️  Pattern ${pattern} failed: ${error.message}`);
      }
    }

    return services;
  }

  /**
   * Strategy 3: Try to scrape by using search functionality
   */
  private async scrapeBySearchResults(): Promise<BawabaticService[]> {
    if (!this.page) return [];

    console.log('🔍 Strategy 3: Trying search-based scraping...');
    
    const services: BawabaticService[] = [];

    try {
      // Try common search terms
      const searchTerms = ['خدمة', 'إجراء', 'وثيقة', 'ترخيص', 'شهادة'];

      for (const term of searchTerms) {
        try {
          // Look for search input
          const searchInput = await this.page.$('input[type="search"], input[name="search"], #search, .search-input');
          
          if (searchInput) {
            await searchInput.fill(term);
            
            // Try to submit search
            const submitButton = await this.page.$('button[type="submit"], .search-btn, input[type="submit"]');
            if (submitButton) {
              await submitButton.click();
              await this.page.waitForTimeout(2000);
              
              // Extract results
              const results = await this.page.$$eval('a', (links: any[]) => 
                links.map(a => ({
                  href: a.href,
                  text: a.textContent?.trim() || ''
                })).filter(link => 
                  link.href.includes('detail') || 
                  link.href.includes('service') ||
                  (link.text && link.text.includes('خدمة'))
                )
              );

              for (const result of results.slice(0, 5)) {
                try {
                  const service = await this.scrapeServiceFromUrl(result.href, result.text);
                  if (service) {
                    services.push(service);
                  }
                } catch (error: any) {
                  // Continue with next result
                }
              }
            }
          }

          if (services.length >= 10) break; // Found enough services

        } catch (error: any) {
          console.log(`  ⚠️  Search term ${term} failed: ${error.message}`);
        }
      }

    } catch (error: any) {
      console.error('Strategy 3 failed:', error);
      throw error;
    }

    return services;
  }

  /**
   * Scrape service from a specific URL with enhanced extraction
   */
  private async scrapeServiceFromUrl(serviceUrl: string, title: string): Promise<BawabaticService | null> {
    if (!this.page) return null;

    try {
      await this.page.goto(serviceUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      const serviceData = await this.page.evaluate(() => {
        function getTextContent(selectors) {
          for (let i = 0; i < selectors.length; i++) {
            const element = document.querySelector(selectors[i]);
            if (element && element.textContent && element.textContent.trim()) {
              return element.textContent.trim();
            }
          }
          return '';
        }

        function getTextArray(selectors) {
          for (let i = 0; i < selectors.length; i++) {
            const elements = document.querySelectorAll(selectors[i]);
            if (elements.length > 0) {
              const result = [];
              for (let j = 0; j < elements.length; j++) {
                const text = elements[j].textContent ? elements[j].textContent.trim() : '';
                if (text) result.push(text);
              }
              return result;
            }
          }
          return [];
        }

        return {
          title: getTextContent(['h1', '.title', '.page-title', '.service-title', '.main-title']),
          description: getTextContent(['.description', '.content', '.service-content', 'p', '.text']),
          sector: getTextContent(['.sector', '.ministry', '.department', '.organization']),
          requirements: getTextArray(['.requirements li', '.documents li', '.required li', 'ul li']),
          processingTime: getTextContent(['.time', '.duration', '.processing-time', '.deadline']),
          fee: getTextContent(['.fee', '.cost', '.price', '.tariff']),
          contact: getTextContent(['.contact', '.phone', '.email', '.address']),
          pageText: document.body.textContent?.substring(0, 1000) || ''
        };
      });

      // Generate service object
      const serviceId = this.generateServiceId(serviceData.title || title, 'GENERAL');
      
      const service: BawabaticService = {
        id: serviceId,
        name: serviceData.title || title || 'خدمة غير محددة',
        description: serviceData.description || 'لا يوجد وصف متاح',
        sector: serviceData.sector || 'غير محدد',
        sectorEn: 'Not Specified',
        structure: '',
        targetGroup: 'عام',
        targetGroupEn: 'General',
        category: this.categorizeService(serviceData.pageText),
        categoryEn: 'General',
        bawabticUrl: serviceUrl,
        requirements: serviceData.requirements,
        processingTime: serviceData.processingTime,
        fee: serviceData.fee,
        contactInfo: serviceData.contact,
        isOnline: serviceUrl.includes('online') || serviceData.pageText.includes('إلكتروني'),
        additionalInfo: serviceData.pageText.substring(0, 500)
      };

      return service;

    } catch (error: any) {
      console.error(`Failed to scrape service from ${serviceUrl}:`, error);
      return null;
    }
  }

  /**
   * Categorize service based on content
   */
  private categorizeService(content: string): string {
    const keywords = {
      'EMPLOYMENT': ['عمل', 'توظيف', 'وظيفة', 'مهنة'],
      'EDUCATION': ['تعليم', 'تربية', 'جامعة', 'مدرسة'],
      'HEALTH': ['صحة', 'طبي', 'مستشفى', 'علاج'],
      'CIVIL_STATUS': ['حالة مدنية', 'زواج', 'ميلاد', 'وفاة'],
      'BUSINESS': ['تجارة', 'أعمال', 'شركة', 'استثمار'],
      'HOUSING': ['سكن', 'عمران', 'بناء', 'عقار'],
      'TRANSPORTATION': ['نقل', 'مواصلات', 'سيارة', 'رخصة قيادة'],
      'AGRICULTURE': ['فلاحة', 'زراعة', 'بيئة'],
      'TECHNOLOGY': ['تكنولوجيا', 'اتصالات', 'انترنت']
    };

    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => content.includes(word))) {
        return category;
      }
    }

    return 'GENERAL';
  }

  /**
   * Scrape detailed information for a specific service
   */
  private async scrapeServiceDetails(serviceUrl: string, category: any): Promise<BawabaticService | null> {
    if (!this.page) return null;

    try {
      await this.page.goto(serviceUrl, { waitUntil: 'networkidle' });
      
      // Extract service information
      const serviceData = await this.page.evaluate((cat: any) => {
        const getTextContent = (selector: string): string => {
          const element = document.querySelector(selector);
          return element?.textContent?.trim() || '';
        };

        const getTextArray = (selector: string): string[] => {
          const elements = document.querySelectorAll(selector);
          return Array.from(elements).map(el => el.textContent?.trim() || '').filter(text => text);
        };

        return {
          name: getTextContent('h1, .service-title, .page-title'),
          description: getTextContent('.service-description, .description, .content p'),
          sector: getTextContent('.sector, .ministry, .department'),
          structure: getTextContent('.structure, .agency, .organization'),
          targetGroup: getTextContent('.target-group, .beneficiaries'),
          requirements: getTextArray('.requirements li, .required-documents li'),
          processingTime: getTextContent('.processing-time, .duration'),
          fee: getTextContent('.fee, .cost, .price'),
          contactInfo: getTextContent('.contact, .phone, .email'),
          additionalInfo: getTextContent('.additional-info, .notes, .remarks')
        };
      }, category);

      // Generate unique ID
      const serviceId = this.generateServiceId(serviceData.name, category.name);

      const service: BawabaticService = {
        id: serviceId,
        name: serviceData.name || 'خدمة غير محددة',
        description: serviceData.description || 'لا يوجد وصف متاح',
        sector: serviceData.sector || category.name,
        sectorEn: category.nameEn,
        structure: serviceData.structure || '',
        targetGroup: serviceData.targetGroup || 'عام',
        category: category.category,
        categoryEn: category.nameEn,
        bawabticUrl: serviceUrl,
        requirements: serviceData.requirements,
        processingTime: serviceData.processingTime,
        fee: serviceData.fee,
        contactInfo: serviceData.contactInfo,
        isOnline: serviceUrl.includes('online') || serviceData.description.includes('إلكتروني'),
        additionalInfo: serviceData.additionalInfo
      };

      return service;

    } catch (error: any) {
      console.error(`Failed to scrape service details for ${serviceUrl}:`, error);
      return null;
    }
  }

  /**
   * Save scraped data to database
   */
  private async saveToDatabase(services: BawabaticService[]): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    console.log('\n💾 Saving data to database...');

    for (const service of services) {
      try {
        // Check if service exists
        const existing = await this.prisma.governmentService.findFirst({
          where: {
            OR: [
              { serviceId: service.id },
              { 
                AND: [
                  { name: service.name },
                  { category: service.category as any }
                ]
              }
            ]
          }
        });

        const serviceData = {
          name: service.name,
          nameEn: service.nameEn,
          description: service.description,
          descriptionEn: service.descriptionEn,
          serviceId: service.id,
          category: service.category as any,
          subcategory: service.structure,
          subcategoryEn: service.structure,
          serviceType: service.serviceType || 'خدمة حكومية',
          serviceTypeEn: service.serviceType || 'Government Service',
          sector: service.sector,
          sectorEn: service.sectorEn,
          structure: service.structure,
          structureEn: service.structure,
          ministry: service.ministry,
          agency: service.agency,
          targetGroup: service.targetGroup,
          targetGroupEn: service.targetGroupEn,
          targetGroups: service.targetGroup ? [service.targetGroup] : [],
          requirements: service.requirements || [],
          requirementsEn: service.requirements || [],
          process: [],
          processEn: [],
          documents: service.requirements || [],
          documentsEn: service.requirements || [],
          processingTime: service.processingTime,
          processingTimeEn: service.processingTime,
          fee: service.fee,
          office: service.contactInfo,
          contactInfo: service.contactInfo,
          isOnline: service.isOnline || false,
          externalUrl: service.externalUrl,
          bawabticUrl: service.bawabticUrl,
          benefits: service.benefits || [],
          benefitsEn: service.benefits || [],
          additionalInfo: service.additionalInfo,
          updatedAt: new Date(),
          isActive: true,
        };

        if (existing) {
          await this.prisma.governmentService.update({
            where: { id: existing.id },
            data: serviceData
          });
          updated++;
        } else {
          await this.prisma.governmentService.create({
            data: serviceData
          });
          created++;
        }

      } catch (error: any) {
        console.error(`Failed to save service ${service.name}:`, error);
      }
    }

    console.log(`✅ Database update completed: ${created} created, ${updated} updated`);
    return { created, updated };
  }

  /**
   * Load existing scraped data from exports
   */
  async loadExistingData(): Promise<BawabaticService[]> {
    try {
      const exportPath = path.join(process.cwd(), 'exports', 'algerian_government_services_comprehensive_2025-08-03.json');
      const data = await fs.readFile(exportPath, 'utf-8');
      const parsed = JSON.parse(data);
      
      console.log(`📂 Loaded ${parsed.services?.length || 0} existing services from exports`);
      return parsed.services || [];
      
    } catch (error: any) {
      console.error('Failed to load existing data:', error);
      return [];
    }
  }

  /**
   * Export data to various formats
   */
  async exportData(format: 'json' | 'csv' | 'xml' = 'json'): Promise<string> {
    try {
      const services = await this.prisma.governmentService.findMany();
      const timestamp = new Date().toISOString().split('T')[0];
      const exportDir = path.join(process.cwd(), 'exports');
      
      // Ensure export directory exists
      await fs.mkdir(exportDir, { recursive: true });

      let filename: string;
      let content: string;

      switch (format) {
        case 'json':
          filename = `bawabatic_services_${timestamp}.json`;
          content = JSON.stringify({
            metadata: {
              exportDate: new Date().toISOString(),
              totalServices: services.length,
              source: 'bawabatic.dz via MCP Scraper'
            },
            services
          }, null, 2);
          break;

        case 'csv':
          filename = `bawabatic_services_${timestamp}.csv`;
          const headers = ['id', 'name', 'nameEn', 'description', 'category', 'sector', 'isOnline', 'bawabticUrl'];
          const rows = services.map((service: any) => 
            headers.map(header => service[header] || '').join(',')
          );
          content = [headers.join(','), ...rows].join('\n');
          break;

        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      const filepath = path.join(exportDir, filename);
      await fs.writeFile(filepath, content, 'utf-8');
      
      console.log(`📁 Data exported to: ${filepath}`);
      return filepath;

    } catch (error: any) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  /**
   * MCP Server Request Handler
   */
  async handleMCPRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case 'scrape_all':
          const result = await this.scrapeAllServices();
          return { result };

        case 'get_services':
          const services = await this.prisma.governmentService.findMany({
            take: request.params?.limit || 50,
            where: request.params?.category ? { category: request.params.category } : undefined
          });
          return { result: { services, count: services.length } };

        case 'search_services':
          const searchResults = await this.prisma.governmentService.findMany({
            where: {
              OR: [
                { name: { contains: request.params?.query } },
                { description: { contains: request.params?.query } },
                { nameEn: { contains: request.params?.query } }
              ]
            },
            take: request.params?.limit || 20
          });
          return { result: { services: searchResults, count: searchResults.length } };

        case 'export_data':
          const filepath = await this.exportData(request.params?.format || 'json');
          return { result: { filepath } };

        case 'get_statistics':
          const stats = await this.getDatabaseStats();
          return { result: stats };

        default:
          return {
            error: {
              code: -32601,
              message: `Method not found: ${request.method}`
            }
          };
      }
    } catch (error: any) {
      return {
        error: {
          code: -32603,
          message: `Internal error: ${error.message}`
        }
      };
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    const total = await this.prisma.governmentService.count();
    const online = await this.prisma.governmentService.count({ where: { isOnline: true } });
    const byCategory = await this.prisma.governmentService.groupBy({
      by: ['category'],
      _count: { category: true }
    });

    return {
      totalServices: total,
      onlineServices: online,
      offlineServices: total - online,
      categoriesBreakdown: byCategory
    };
  }

  /**
   * Generate unique service ID
   */
  private generateServiceId(name: string, category: string): string {
    const clean = (str: string) => str.replace(/[^\w\s]/g, '').replace(/\s+/g, '_').toLowerCase();
    return `${clean(category)}_${clean(name)}_${Date.now()}`;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
    await this.prisma.$disconnect();
    console.log('🧹 Cleanup completed');
  }
}

// CLI Interface
async function main() {
  const scraper = new BawabaticMCPScraper();
  
  try {
    await scraper.initialize();
    
    const command = process.argv[2];
    
    switch (command) {
      case 'scrape':
        console.log('🚀 Starting full scraping process...');
        await scraper.scrapeAllServices();
        break;
        
      case 'load':
        console.log('📂 Loading existing data to database...');
        const existingData = await scraper.loadExistingData();
        if (existingData.length > 0) {
          const dbResult = await (scraper as any).saveToDatabase(existingData);
          console.log(`✅ Loaded ${dbResult.created} new and updated ${dbResult.updated} services`);
        }
        break;
        
      case 'export':
        const format = (process.argv[3] as 'json' | 'csv') || 'json';
        await scraper.exportData(format);
        break;
        
      case 'stats':
        const stats = await scraper.getDatabaseStats();
        console.log('📊 Database Statistics:', JSON.stringify(stats, null, 2));
        break;
        
      default:
        console.log(`
🤖 Bawabatic MCP Scraper Usage:

Commands:
  scrape  - Scrape all services from bawabatic.dz
  load    - Load existing exported data to database  
  export  - Export data (json|csv)
  stats   - Show database statistics

Examples:
  npx tsx scripts/mcp_bawabatic_scraper.ts scrape
  npx tsx scripts/mcp_bawabatic_scraper.ts load
  npx tsx scripts/mcp_bawabatic_scraper.ts export json
  npx tsx scripts/mcp_bawabatic_scraper.ts stats
        `);
    }
    
  } catch (error: any) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await scraper.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { BawabaticMCPScraper, type MCPRequest, type MCPResponse, type BawabaticService };
