import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Test different search scenarios
const testQueries = [
  {
    name: 'Arabic Passport Search',
    query: 'جواز السفر',
    expectedCategory: 'CIVIL_STATUS'
  },
  {
    name: 'Arabic Employment Search',
    query: 'عمل',
    expectedCategory: 'EMPLOYMENT'
  },
  {
    name: 'Arabic Business Search',
    query: 'تجارة',
    expectedCategory: 'BUSINESS'
  },
  {
    name: 'English Employment Search',
    query: 'employment',
    expectedCategory: 'EMPLOYMENT'
  },
  {
    name: 'English Business Search',
    query: 'business',
    expectedCategory: 'BUSINESS'
  },
  {
    name: 'Mixed Query',
    query: 'registration',
    expectedResults: 'any'
  }
];

// Simulate MCP search_services tool
async function searchServices(query: string, category?: string, limit: number = 10) {
  try {
    const searchConditions: any = {
      isActive: true
    };

    if (query) {
      searchConditions.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { nameEn: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { descriptionEn: { contains: query, mode: 'insensitive' } }
      ];
    }

    if (category) {
      searchConditions.category = category;
    }

    const services = await prisma.governmentService.findMany({
      where: searchConditions,
      take: limit,
      select: {
        id: true,
        name: true,
        nameEn: true,
        description: true,
        descriptionEn: true,
        category: true,
        isOnline: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return services;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

// Enhanced natural language understanding test
async function testNaturalLanguageQueries() {
  console.log('🧠 Testing Natural Language Understanding & MCP Server Responses');
  console.log('='.repeat(70));

  const naturalQueries = [
    {
      userInput: 'أريد جواز سفر',
      expectedIntent: 'search for passport services',
      extractedKeywords: ['جواز', 'سفر']
    },
    {
      userInput: 'كيف أحصل على رخصة قيادة؟',
      expectedIntent: 'search for driving license',
      extractedKeywords: ['رخصة', 'قيادة']
    },
    {
      userInput: 'ابحث عن وظيفة',
      expectedIntent: 'search for employment',
      extractedKeywords: ['وظيفة', 'عمل']
    },
    {
      userInput: 'I need employment services',
      expectedIntent: 'search for employment',
      extractedKeywords: ['employment', 'services']
    },
    {
      userInput: 'بطاقة تعريف بيومترية',
      expectedIntent: 'search for ID card',
      extractedKeywords: ['بطاقة', 'تعريف', 'بيومترية']
    }
  ];

  for (const test of naturalQueries) {
    console.log(`\n🔍 Testing: "${test.userInput}"`);
    console.log(`Expected Intent: ${test.expectedIntent}`);
    
    // Test each keyword
    for (const keyword of test.extractedKeywords) {
      console.log(`\n   🔎 Searching for keyword: "${keyword}"`);
      const results = await searchServices(keyword);
      
      if (results.length > 0) {
        console.log(`   ✅ Found ${results.length} results:`);
        results.slice(0, 3).forEach((service, index) => {
          console.log(`      ${index + 1}. ${service.name} (${service.category})`);
          if (service.nameEn) {
            console.log(`         EN: ${service.nameEn}`);
          }
        });
      } else {
        console.log(`   ❌ No results for "${keyword}"`);
      }
    }
  }
}

// Test MCP server response formulation
async function testMCPResponseFormulation() {
  console.log('\n\n🤖 Testing MCP Server Response Formulation');
  console.log('='.repeat(50));

  for (const test of testQueries) {
    console.log(`\n📋 Test: ${test.name}`);
    console.log(`Query: "${test.query}"`);
    
    const results = await searchServices(test.query);
    
    // Simulate MCP response formulation
    let response = '';
    if (results.length === 0) {
      response = `لم يتم العثور على خدمات تطابق "${test.query}". جرب كلمات مختلفة أو فئة معينة.`;
    } else {
      response = `تم العثور على ${results.length} خدمة تطابق "${test.query}":`;
      results.slice(0, 3).forEach((service, index) => {
        response += `\n${index + 1}. ${service.name} (${service.category})`;
        if (service.nameEn) {
          response += `\n   EN: ${service.nameEn}`;
        }
      });
    }
    
    console.log(`📝 MCP Response:`);
    console.log(response);
    console.log(`📊 Results Count: ${results.length}`);
  }
}

// Test category detection
async function testCategoryDetection() {
  console.log('\n\n🏷️ Testing Category Detection');
  console.log('='.repeat(40));

  const categoryTests = [
    { query: 'جواز', expectedCategory: 'CIVIL_STATUS' },
    { query: 'بطاقة', expectedCategory: 'CIVIL_STATUS' },
    { query: 'وظيفة', expectedCategory: 'EMPLOYMENT' },
    { query: 'عمل', expectedCategory: 'EMPLOYMENT' },
    { query: 'تجارة', expectedCategory: 'BUSINESS' },
    { query: 'شركة', expectedCategory: 'BUSINESS' },
    { query: 'passport', expectedCategory: 'CIVIL_STATUS' },
    { query: 'employment', expectedCategory: 'EMPLOYMENT' },
    { query: 'business', expectedCategory: 'BUSINESS' }
  ];

  for (const test of categoryTests) {
    console.log(`\n🔍 Query: "${test.query}" → Expected: ${test.expectedCategory}`);
    
    // Test with and without category filter
    const generalResults = await searchServices(test.query);
    const categoryResults = await searchServices(test.query, test.expectedCategory);
    
    console.log(`   📊 General search: ${generalResults.length} results`);
    console.log(`   🏷️ Category search: ${categoryResults.length} results`);
    
    if (categoryResults.length > 0) {
      console.log(`   ✅ Category detection working!`);
      categoryResults.slice(0, 2).forEach((service, index) => {
        console.log(`      ${index + 1}. ${service.name}`);
      });
    } else {
      console.log(`   ⚠️ No results in ${test.expectedCategory} category`);
    }
  }
}

async function runComprehensiveTest() {
  try {
    await testNaturalLanguageQueries();
    await testMCPResponseFormulation();
    await testCategoryDetection();
    
    console.log('\n\n🎉 Comprehensive MCP Testing Complete!');
    console.log('💡 Use these insights to improve the chat interface and MCP server responses.');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runComprehensiveTest().catch(console.error);
