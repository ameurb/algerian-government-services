#!/usr/bin/env node

import readline from 'readline';
import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/youths_portal';
let db = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Initialize readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: `${colors.cyan}🤖 Youth Portal CLI > ${colors.reset}`
});

// Connect to MongoDB
async function connectToDatabase() {
  try {
    console.log(`${colors.yellow}🔌 Connecting to MongoDB...${colors.reset}`);
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db('youths_portal');
    console.log(`${colors.green}✅ Connected to MongoDB successfully!${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Failed to connect to MongoDB:${colors.reset}`, error.message);
    return false;
  }
}

// Intent detection (simplified)
function detectIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('passport') || lowerMessage.includes('جواز')) {
    return { intent: 'government_passport', confidence: 0.9, category: 'CIVIL_STATUS' };
  }
  if (lowerMessage.includes('id card') || lowerMessage.includes('بطاقة')) {
    return { intent: 'government_id', confidence: 0.9, category: 'CIVIL_STATUS' };
  }
  if (lowerMessage.includes('job') || lowerMessage.includes('وظيفة')) {
    return { intent: 'job_search', confidence: 0.8, category: 'EMPLOYMENT' };
  }
  if (lowerMessage.includes('education') || lowerMessage.includes('تعليم')) {
    return { intent: 'education_search', confidence: 0.8, category: 'EDUCATION' };
  }
  
  return { intent: 'general', confidence: 0.5, category: 'GENERAL' };
}

// Search government services
async function searchGovernmentServices(query) {
  try {
    if (!db) throw new Error('Database not connected');

    const services = await db.collection('government_services')
      .find({ 
        isActive: true,
        $text: { $search: query }
      })
      .limit(10)
      .toArray();

    if (services.length === 0) {
      // Fallback to regex search
      const regexServices = await db.collection('government_services')
        .find({ 
          isActive: true,
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { requirements: { $regex: query, $options: 'i' } }
          ]
        })
        .limit(10)
        .toArray();
      
      return regexServices;
    }

    return services;
  } catch (error) {
    console.error(`${colors.red}❌ Search error:${colors.reset}`, error.message);
    return [];
  }
}

// Generate response based on intent and search results
function generateResponse(intent, searchResults, query) {
  const isArabic = /[\u0600-\u06FF]/.test(query);
  
  if (intent.intent === 'government_passport' && searchResults.length > 0) {
    const passportServices = searchResults.filter(s => 
      s.name?.toLowerCase().includes('passport') || 
      s.name?.includes('جواز')
    );
    
    if (passportServices.length > 0) {
      let response = isArabic 
        ? '📘 معلومات حول خدمات جوازات السفر:\n\n'
        : '📘 Passport Services Information:\n\n';
      
      passportServices.forEach((service, index) => {
        response += `${index + 1}. ${service.name}\n`;
        if (service.description) {
          response += `   📝 ${service.description}\n`;
        }
        if (service.requirements && service.requirements.length > 0) {
          response += isArabic ? '   📋 المتطلبات:\n' : '   📋 Requirements:\n';
          service.requirements.forEach(req => {
            response += `   • ${req}\n`;
          });
        }
        if (service.fees) {
          response += isArabic ? `   💰 الرسوم: ${service.fees}\n` : `   💰 Fees: ${service.fees}\n`;
        }
        response += '\n';
      });
      
      return response;
    }
  }
  
  if (searchResults.length > 0) {
    let response = isArabic 
      ? `🔍 وجدت ${searchResults.length} خدمة متاحة:\n\n`
      : `🔍 Found ${searchResults.length} available services:\n\n`;
    
    searchResults.forEach((service, index) => {
      response += `${index + 1}. ${service.name}\n`;
      if (service.description) {
        response += `   📝 ${service.description}\n`;
      }
      response += '\n';
    });
    
    return response;
  }
  
  return isArabic 
    ? '❌ لم أجد خدمات مطابقة لطلبك. جرب كلمات مختلفة.'
    : '❌ No matching services found. Try different keywords.';
}

// Process user query
async function processQuery(query) {
  console.log(`${colors.dim}🤔 Processing: "${query}"${colors.reset}`);
  
  // Detect intent
  const intent = detectIntent(query);
  console.log(`${colors.blue}🎯 Intent: ${intent.intent} (${Math.round(intent.confidence * 100)}%)${colors.reset}`);
  
  // Search database
  const searchResults = await searchGovernmentServices(query);
  console.log(`${colors.magenta}📊 Found ${searchResults.length} results${colors.reset}`);
  
  // Generate response
  const response = generateResponse(intent, searchResults, query);
  
  return response;
}

// CLI Commands
const commands = {
  help: () => {
    console.log(`${colors.bright}📚 Available Commands:${colors.reset}
${colors.green}help${colors.reset}     - Show this help message
${colors.green}stats${colors.reset}    - Show database statistics  
${colors.green}search${colors.reset}   - Search government services
${colors.green}clear${colors.reset}    - Clear the screen
${colors.green}quit${colors.reset}     - Exit the CLI

${colors.bright}💬 Chat Examples:${colors.reset}
• "كيف يمكنني الحصول على جواز السفر؟" (Arabic)
• "How can I get a passport?" (English)
• "What documents do I need for ID card?"
• "Show me available jobs"
    `);
  },
  
  stats: async () => {
    try {
      if (!db) throw new Error('Database not connected');
      
      const collections = await db.listCollections().toArray();
      console.log(`${colors.bright}📊 Database Statistics:${colors.reset}`);
      
      for (const collection of collections) {
        const count = await db.collection(collection.name).countDocuments();
        console.log(`${colors.cyan}  ${collection.name}:${colors.reset} ${count} documents`);
      }
      
      const activeServices = await db.collection('government_services').countDocuments({ isActive: true });
      console.log(`${colors.green}  Active Services:${colors.reset} ${activeServices}`);
      
    } catch (error) {
      console.error(`${colors.red}❌ Stats error:${colors.reset}`, error.message);
    }
  },
  
  search: async (args) => {
    const query = args.join(' ');
    if (!query) {
      console.log(`${colors.yellow}💡 Usage: search <your query>${colors.reset}`);
      return;
    }
    
    const response = await processQuery(query);
    console.log(`${colors.green}🤖 Response:${colors.reset}\n${response}`);
  },
  
  clear: () => {
    console.clear();
    console.log(`${colors.cyan}🚀 Youth Portal CLI - Database Chat Interface${colors.reset}`);
    console.log(`${colors.dim}Type 'help' for available commands${colors.reset}\n`);
  },
  
  quit: () => {
    console.log(`${colors.yellow}👋 Goodbye!${colors.reset}`);
    process.exit(0);
  }
};

// Handle user input
rl.on('line', async (input) => {
  const trimmed = input.trim();
  
  if (!trimmed) {
    rl.prompt();
    return;
  }
  
  const [command, ...args] = trimmed.split(' ');
  
  if (commands[command]) {
    await commands[command](args);
  } else {
    // Treat as chat query
    try {
      const response = await processQuery(trimmed);
      console.log(`${colors.green}🤖 Response:${colors.reset}\n${response}`);
    } catch (error) {
      console.error(`${colors.red}❌ Error:${colors.reset}`, error.message);
    }
  }
  
  console.log(); // Empty line
  rl.prompt();
});

rl.on('close', () => {
  console.log(`${colors.yellow}👋 Goodbye!${colors.reset}`);
  process.exit(0);
});

// Initialize CLI
async function init() {
  console.clear();
  console.log(`${colors.cyan}${colors.bright}🚀 Youth Portal CLI - Database Chat Interface${colors.reset}`);
  console.log(`${colors.dim}Connecting to database and initializing...${colors.reset}\n`);
  
  const connected = await connectToDatabase();
  
  if (!connected) {
    console.log(`${colors.red}❌ Cannot start CLI without database connection${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.dim}Type 'help' for available commands or just start chatting!${colors.reset}\n`);
  rl.prompt();
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}👋 Goodbye!${colors.reset}`);
  process.exit(0);
});

// Start the CLI
init().catch(error => {
  console.error(`${colors.red}❌ Failed to initialize CLI:${colors.reset}`, error);
  process.exit(1);
});
