import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function exportDatabaseSummary() {
  console.log('📊 Generating comprehensive database export...')
  
  try {
    // Get all government services
    const allServices = await prisma.governmentService.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })
    
    // Get summary statistics
    const totalServices = allServices.length
    const onlineServices = allServices.filter(s => s.isOnline).length
    const offlineServices = allServices.filter(s => !s.isOnline).length
    const servicesWithUrls = allServices.filter(s => s.onlineUrl).length
    
    // Group by category
    const servicesByCategory = allServices.reduce((acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = []
      }
      acc[service.category].push(service)
      return acc
    }, {} as Record<string, typeof allServices>)
    
    // Create comprehensive export
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalServices: totalServices,
        onlineServices: onlineServices,
        offlineServices: offlineServices,
        servicesWithExternalUrls: servicesWithUrls,
        categories: Object.keys(servicesByCategory).length,
        dataSource: 'bawabatic.dz and comprehensive Algerian government services'
      },
      statistics: {
        servicesByCategory: Object.entries(servicesByCategory).map(([category, services]) => ({
          category,
          count: services.length,
          onlineCount: services.filter(s => s.isOnline).length,
          servicesWithUrls: services.filter(s => s.onlineUrl).length
        })),
        coverage: {
          employment: servicesByCategory.EMPLOYMENT?.length || 0,
          civilStatus: servicesByCategory.CIVIL_STATUS?.length || 0,
          housing: servicesByCategory.HOUSING?.length || 0,
          business: servicesByCategory.BUSINESS?.length || 0,
          health: servicesByCategory.HEALTH?.length || 0,
          education: servicesByCategory.EDUCATION?.length || 0,
          transportation: servicesByCategory.TRANSPORTATION?.length || 0,
          technology: servicesByCategory.TECHNOLOGY?.length || 0,
          agriculture: servicesByCategory.AGRICULTURE?.length || 0,
          energy: servicesByCategory.ENERGY?.length || 0,
          culture: servicesByCategory.CULTURE?.length || 0,
          socialSupport: servicesByCategory.SOCIAL_SUPPORT?.length || 0,
          lawJustice: servicesByCategory.LAW_JUSTICE?.length || 0,
          tourism: servicesByCategory.TOURISM?.length || 0,
          industry: servicesByCategory.INDUSTRY?.length || 0
        }
      },
      services: allServices.map(service => ({
        // Basic Information
        id: service.id,
        name: service.name,
        nameEn: service.nameEn,
        description: service.description,
        descriptionEn: service.descriptionEn,
        
        // Classification
        category: service.category,
        subcategory: service.subcategory,
        subcategoryEn: service.subcategoryEn,
        serviceType: service.serviceType,
        serviceTypeEn: service.serviceTypeEn,
        
        // Government Structure
        sector: service.sector,
        sectorEn: service.sectorEn,
        structure: service.structure,
        structureEn: service.structureEn,
        ministry: service.ministry,
        agency: service.agency,
        
        // Target and Process
        targetGroup: service.targetGroup,
        targetGroupEn: service.targetGroupEn,
        targetGroups: service.targetGroups,
        requirements: service.requirements,
        requirementsEn: service.requirementsEn,
        process: service.process,
        processEn: service.processEn,
        documents: service.documents,
        documentsEn: service.documentsEn,
        
        // Service Details
        fee: service.fee,
        duration: service.duration,
        processingTime: service.processingTime,
        processingTimeEn: service.processingTimeEn,
        
        // Contact and Access
        office: service.office,
        contactInfo: service.contactInfo,
        contactPhone: service.contactPhone,
        contactEmail: service.contactEmail,
        onlineUrl: service.onlineUrl,
        bawabticUrl: service.bawabticUrl,
        
        // Additional Information
        legalFramework: service.legalFramework,
        appeals: service.appeals,
        appealsEn: service.appealsEn,
        benefits: service.benefits,
        benefitsEn: service.benefitsEn,
        notes: service.notes,
        
        // Availability
        wilaya: service.wilaya,
        isOnline: service.isOnline,
        isNational: service.isNational,
        isActive: service.isActive,
        
        // Metadata
        createdAt: service.createdAt,
        updatedAt: service.updatedAt
      }))
    }
    
    // Save comprehensive export
    const exportPath = path.join(process.cwd(), 'exports')
    if (!fs.existsSync(exportPath)) {
      fs.mkdirSync(exportPath, { recursive: true })
    }
    
    const fullExportFile = path.join(exportPath, `algerian_government_services_comprehensive_${new Date().toISOString().split('T')[0]}.json`)
    fs.writeFileSync(fullExportFile, JSON.stringify(exportData, null, 2), 'utf8')
    
    // Create a simplified summary export
    const summaryExport = {
      summary: exportData.metadata,
      categorySummary: exportData.statistics.servicesByCategory,
      topServices: allServices.slice(0, 10).map(s => ({
        name: s.name,
        nameEn: s.nameEn,
        category: s.category,
        isOnline: s.isOnline,
        onlineUrl: s.onlineUrl
      })),
      onlineServices: allServices.filter(s => s.isOnline).map(s => ({
        name: s.name,
        nameEn: s.nameEn,
        category: s.category,
        onlineUrl: s.onlineUrl
      }))
    }
    
    const summaryFile = path.join(exportPath, `algerian_services_summary_${new Date().toISOString().split('T')[0]}.json`)
    fs.writeFileSync(summaryFile, JSON.stringify(summaryExport, null, 2), 'utf8')
    
    // Create CSV export for easy analysis
    const csvHeaders = [
      'Name', 'Name_EN', 'Category', 'Ministry', 'Target_Group', 'Is_Online', 
      'Processing_Time', 'Fee', 'Online_URL', 'Contact_Info'
    ]
    
    const csvData = allServices.map(s => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.nameEn?.replace(/"/g, '""') || ''}"`,
      s.category,
      `"${s.ministry?.replace(/"/g, '""') || ''}"`,
      `"${s.targetGroup?.replace(/"/g, '""') || ''}"`,
      s.isOnline ? 'Yes' : 'No',
      `"${s.processingTime?.replace(/"/g, '""') || ''}"`,
      `"${s.fee?.replace(/"/g, '""') || ''}"`,
      `"${s.onlineUrl?.replace(/"/g, '""') || ''}"`,
      `"${s.contactInfo?.replace(/"/g, '""') || ''}"`
    ].join(','))
    
    const csvContent = [csvHeaders.join(','), ...csvData].join('\n')
    const csvFile = path.join(exportPath, `algerian_services_${new Date().toISOString().split('T')[0]}.csv`)
    fs.writeFileSync(csvFile, csvContent, 'utf8')
    
    console.log('✅ Export completed successfully!')
    console.log(`📁 Files created:`)
    console.log(`   📄 Comprehensive JSON: ${fullExportFile}`)
    console.log(`   📋 Summary JSON: ${summaryFile}`)
    console.log(`   📊 CSV Data: ${csvFile}`)
    
    console.log(`\n📊 Final Database Summary:`)
    console.log(`   🏛️  Total Government Services: ${totalServices}`)
    console.log(`   🌐 Online Services: ${onlineServices}`)
    console.log(`   🏢 Offline Services: ${offlineServices}`)
    console.log(`   🔗 Services with External URLs: ${servicesWithUrls}`)
    console.log(`   📂 Categories Covered: ${Object.keys(servicesByCategory).length}`)
    
    console.log(`\n🏆 Top Categories by Service Count:`)
    const topCategories = Object.entries(servicesByCategory)
      .sort(([,a], [,b]) => b.length - a.length)
      .slice(0, 5)
    
    topCategories.forEach(([category, services], index) => {
      console.log(`   ${index + 1}. ${category}: ${services.length} services`)
    })
    
    console.log(`\n🌐 Online Services Highlights:`)
    const onlineServicesHighlight = allServices.filter(s => s.isOnline).slice(0, 5)
    onlineServicesHighlight.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} (${service.category})`)
      console.log(`      URL: ${service.onlineUrl}`)
    })
    
    console.log(`\n🎯 Data Coverage Achieved:`)
    console.log(`   ✅ Employment and Jobs: ${servicesByCategory.EMPLOYMENT?.length || 0} services`)
    console.log(`   ✅ Civil Status: ${servicesByCategory.CIVIL_STATUS?.length || 0} services`)
    console.log(`   ✅ Housing and Urban Development: ${servicesByCategory.HOUSING?.length || 0} services`)
    console.log(`   ✅ Business and Commerce: ${servicesByCategory.BUSINESS?.length || 0} services`)
    console.log(`   ✅ Health Services: ${servicesByCategory.HEALTH?.length || 0} services`)
    console.log(`   ✅ Education: ${servicesByCategory.EDUCATION?.length || 0} services`)
    console.log(`   ✅ Transportation: ${servicesByCategory.TRANSPORTATION?.length || 0} services`)
    console.log(`   ✅ Technology: ${servicesByCategory.TECHNOLOGY?.length || 0} services`)
    console.log(`   ✅ Agriculture: ${servicesByCategory.AGRICULTURE?.length || 0} services`)
    console.log(`   ✅ Energy: ${servicesByCategory.ENERGY?.length || 0} services`)
    console.log(`   ✅ Culture: ${servicesByCategory.CULTURE?.length || 0} services`)
    console.log(`   ✅ Social Support: ${servicesByCategory.SOCIAL_SUPPORT?.length || 0} services`)
    console.log(`   ✅ Law and Justice: ${servicesByCategory.LAW_JUSTICE?.length || 0} services`)
    console.log(`   ✅ Tourism: ${servicesByCategory.TOURISM?.length || 0} services`)
    console.log(`   ✅ Industry: ${servicesByCategory.INDUSTRY?.length || 0} services`)
    
  } catch (error) {
    console.error('❌ Export failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

exportDatabaseSummary()
