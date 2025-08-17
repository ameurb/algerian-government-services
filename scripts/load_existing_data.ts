#!/usr/bin/env tsx

/**
 * Load Existing Comprehensive Data to Database
 * 
 * This script loads the existing comprehensive JSON export data 
 * into the database to enrich it with real Algerian government services.
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

interface ExportedService {
  id?: string;
  serviceId?: string;
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  category: string;
  subcategory?: string;
  subcategoryEn?: string;
  serviceType?: string;
  serviceTypeEn?: string;
  sector?: string;
  sectorEn?: string;
  structure?: string;
  structureEn?: string;
  ministry?: string;
  agency?: string;
  targetGroup?: string;
  targetGroupEn?: string;
  targetGroups?: string[];
  requirements?: string[];
  requirementsEn?: string[];
  process?: string[];
  processEn?: string[];
  documents?: string[];
  documentsEn?: string[];
  processingTime?: string;
  processingTimeEn?: string;
  fee?: string;
  office?: string;
  contactInfo?: string;
  isOnline?: boolean;
  externalUrl?: string;
  bawabticUrl?: string;
  benefits?: string[];
  benefitsEn?: string[];
  additionalInfo?: any;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ExportData {
  metadata: {
    exportDate: string;
    totalServices: number;
    onlineServices: number;
    offlineServices: number;
    servicesWithExternalUrls: number;
    categories: number;
    dataSource: string;
  };
  statistics: {
    servicesByCategory: Array<{
      category: string;
      count: number;
      onlineCount: number;
      servicesWithUrls: number;
    }>;
  };
  services: ExportedService[];
}

class DataLoader {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async initialize(): Promise<void> {
    await this.prisma.$connect();
    console.log('✅ Database connected');
  }

  async loadComprehensiveData(): Promise<void> {
    try {
      const exportPath = path.join(process.cwd(), 'exports', 'algerian_government_services_comprehensive_2025-08-03.json');
      
      console.log('📂 Loading comprehensive data from:', exportPath);
      const fileContent = await fs.readFile(exportPath, 'utf-8');
      const data: ExportData = JSON.parse(fileContent);

      console.log('📊 Export metadata:');
      console.log(`  - Export date: ${data.metadata.exportDate}`);
      console.log(`  - Total services: ${data.metadata.totalServices}`);
      console.log(`  - Online services: ${data.metadata.onlineServices}`);
      console.log(`  - Categories: ${data.metadata.categories}`);
      console.log(`  - Data source: ${data.metadata.dataSource}`);

      console.log('\n📋 Categories breakdown:');
      data.statistics.servicesByCategory.forEach(cat => {
        console.log(`  - ${cat.category}: ${cat.count} services (${cat.onlineCount} online)`);
      });

      console.log(`\n💾 Loading ${data.services.length} services to database...`);

      let created = 0;
      let updated = 0;
      let errors = 0;

      for (const service of data.services) {
        try {
          await this.saveService(service);
          
          // Check if it was created or updated
          const existing = await this.prisma.governmentService.findFirst({
            where: {
              OR: [
                { serviceId: service.serviceId || service.id },
                { name: service.name }
              ]
            }
          });

          if (existing?.createdAt && new Date(existing.createdAt).getTime() > Date.now() - 10000) {
            created++;
          } else {
            updated++;
          }

          console.log(`  ✅ ${service.name} (${service.category})`);

        } catch (error: any) {
          errors++;
          console.error(`  ❌ Failed to save ${service.name}: ${error.message}`);
        }
      }

      console.log('\n📊 Loading Results:');
      console.log(`  🆕 Created: ${created} services`);
      console.log(`  🔄 Updated: ${updated} services`);
      console.log(`  ❌ Errors: ${errors} services`);
      console.log(`  ✅ Total processed: ${created + updated + errors} services`);

    } catch (error: any) {
      console.error('❌ Failed to load comprehensive data:', error);
      throw error;
    }
  }

  private async saveService(service: ExportedService): Promise<void> {
    // Check if service already exists
    const existing = await this.prisma.governmentService.findFirst({
      where: {
        OR: [
          { serviceId: service.serviceId || service.id },
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
      nameEn: service.nameEn || service.name,
      description: service.description || 'لا يوجد وصف متاح',
      descriptionEn: service.descriptionEn || service.description || 'No description available',
      serviceId: service.serviceId || service.id || this.generateServiceId(service.name, service.category),
      category: service.category as any,
      subcategory: service.subcategory,
      subcategoryEn: service.subcategoryEn,
      serviceType: service.serviceType || 'خدمة حكومية',
      serviceTypeEn: service.serviceTypeEn || 'Government Service',
      sector: service.sector || 'غير محدد',
      sectorEn: service.sectorEn || 'Not Specified',
      structure: service.structure,
      structureEn: service.structureEn,
      ministry: service.ministry,
      agency: service.agency,
      targetGroup: service.targetGroup || 'عام',
      targetGroupEn: service.targetGroupEn || 'General',
      targetGroups: service.targetGroups || [service.targetGroup || 'عام'],
      requirements: service.requirements || [],
      requirementsEn: service.requirementsEn || service.requirements || [],
      process: service.process || [],
      processEn: service.processEn || service.process || [],
      documents: service.documents || service.requirements || [],
      documentsEn: service.documentsEn || service.documents || service.requirements || [],
      processingTime: service.processingTime || 'غير محدد',
      processingTimeEn: service.processingTimeEn || service.processingTime || 'Not Specified',
      fee: service.fee || 'غير محدد',
      office: service.office || 'غير محدد',
      contactInfo: service.contactInfo || 'غير محدد',
      isOnline: service.isOnline || false,
      externalUrl: service.externalUrl,
      bawabticUrl: service.bawabticUrl,
      benefits: service.benefits || [],
      benefitsEn: service.benefitsEn || service.benefits || [],
      additionalInfo: service.additionalInfo,
      isActive: service.isActive !== false, // Default to true
      updatedAt: new Date(),
    };

    if (existing) {
      await this.prisma.governmentService.update({
        where: { id: existing.id },
        data: serviceData
      });
    } else {
      await this.prisma.governmentService.create({
        data: serviceData
      });
    }
  }

  private generateServiceId(name: string, category: string): string {
    const clean = (str: string) => str.replace(/[^\w\s]/g, '').replace(/\s+/g, '_').toLowerCase();
    return `${clean(category)}_${clean(name)}_${Date.now()}`;
  }

  async getStats(): Promise<void> {
    const total = await this.prisma.governmentService.count();
    const online = await this.prisma.governmentService.count({ where: { isOnline: true } });
    const byCategory = await this.prisma.governmentService.groupBy({
      by: ['category'],
      _count: { category: true }
    });

    console.log('\n📊 Current Database Statistics:');
    console.log(`  📋 Total services: ${total}`);
    console.log(`  🌐 Online services: ${online}`);
    console.log(`  🏢 Offline services: ${total - online}`);
    console.log('\n📂 By Category:');
    
    byCategory.forEach(cat => {
      console.log(`  - ${cat.category}: ${cat._count.category} services`);
    });
  }

  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
    console.log('🧹 Cleanup completed');
  }
}

async function main() {
  const loader = new DataLoader();
  
  try {
    await loader.initialize();
    
    const command = process.argv[2];
    
    switch (command) {
      case 'load':
        await loader.loadComprehensiveData();
        await loader.getStats();
        break;
        
      case 'stats':
        await loader.getStats();
        break;
        
      default:
        console.log(`
🚀 Data Loader Usage:

Commands:
  load  - Load comprehensive data from exports
  stats - Show current database statistics

Examples:
  npx tsx scripts/load_existing_data.ts load
  npx tsx scripts/load_existing_data.ts stats
        `);
    }
    
  } catch (error: any) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await loader.cleanup();
  }
}

if (require.main === module) {
  main();
}

export { DataLoader };