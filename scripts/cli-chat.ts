#!/usr/bin/env ts-node

import readline from 'readline';
import { MongoClient, Db } from 'mongodb';
import fetch from 'node-fetch';

// Environment setup
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/youths_portal';
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8000';

interface ChatSession {
  sessionId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

interface Intent {
  intent: string;
  confidence: number;
  category: string;
}

class YouthPortalCLI {
  private db: Db | null = null;
  private rl: readline.Interface;
  private session: ChatSession;

  // Colors for console output
  private colors = {
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

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: `${this.colors.cyan}🤖 Youth Portal AI > ${this.colors.reset}`
    });

    this.session = {
      sessionId: `cli-${Date.now()}`,
      messages: []
    };

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.rl.on('line', this.handleInput.bind(this));
    this.rl.on('close', this.handleClose.bind(this));
    process.on('SIGINT', this.handleClose.bind(this));
  }

  async init(): Promise<void> {
    console.clear();
    this.printHeader();
    
    const connected = await this.connectToDatabase();
    if (!connected) {
      console.log(`${this.colors.red}❌ Cannot start CLI without database connection${this.colors.reset}`);
      process.exit(1);
    }

    const mcpHealthy = await this.checkMCPServer();
    if (mcpHealthy) {
      console.log(`${this.colors.green}✅ MCP Server is healthy and ready${this.colors.reset}`);
    } else {
      console.log(`${this.colors.yellow}⚠️ MCP Server not available - using direct database access${this.colors.reset}`);
    }
    
    console.log(`${this.colors.dim}Type 'help' for commands or start chatting in Arabic or English!${this.colors.reset}\n`);
    this.rl.prompt();
  }

  private printHeader() {
    console.log(`${this.colors.cyan}${this.colors.bright}`);
    console.log(`┌─────────────────────────────────────────────────┐`);
    console.log(`│  🚀 Youth Portal CLI - AI Database Chat        │`);
    console.log(`│  البوابة الرقمية للشباب الجزائري              │`);
    console.log(`└─────────────────────────────────────────────────┘`);
    console.log(`${this.colors.reset}`);
    console.log(`${this.colors.dim}Session ID: ${this.session.sessionId}${this.colors.reset}\n`);
  }

  private async connectToDatabase(): Promise<boolean> {
    try {
      console.log(`${this.colors.yellow}🔌 Connecting to MongoDB...${this.colors.reset}`);
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      this.db = client.db('youths_portal');
      console.log(`${this.colors.green}✅ Connected to MongoDB successfully!${this.colors.reset}`);
      return true;
    } catch (error: any) {
      console.error(`${this.colors.red}❌ Failed to connect to MongoDB:${this.colors.reset}`, error.message);
      return false;
    }
  }

  private async checkMCPServer(): Promise<boolean> {
    try {
      const response = await fetch(`${MCP_SERVER_URL}/health`, { timeout: 5000 });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async handleInput(input: string): Promise<void> {
    const trimmed = input.trim();
    
    if (!trimmed) {
      this.rl.prompt();
      return;
    }

    // Check for commands
    const [command, ...args] = trimmed.split(' ');
    
    if (this.isCommand(command)) {
      await this.executeCommand(command, args);
    } else {
      // Treat as chat query
      await this.processChatQuery(trimmed);
    }
    
    console.log(); // Empty line
    this.rl.prompt();
  }

  private isCommand(input: string): boolean {
    return ['help', 'stats', 'history', 'clear', 'quit', 'exit', 'test', 'search'].includes(input);
  }

  private async executeCommand(command: string, args: string[]): Promise<void> {
    switch (command) {
      case 'help':
        this.showHelp();
        break;
      case 'stats':
        await this.showStats();
        break;
      case 'history':
        this.showHistory();
        break;
      case 'clear':
        this.clearScreen();
        break;
      case 'quit':
      case 'exit':
        this.handleClose();
        break;
      case 'test':
        await this.runTests();
        break;
      case 'search':
        await this.directSearch(args.join(' '));
        break;
      default:
        console.log(`${this.colors.red}❌ Unknown command: ${command}${this.colors.reset}`);
    }
  }

  private showHelp(): void {
    console.log(`${this.colors.bright}📚 Youth Portal CLI Commands:${this.colors.reset}

${this.colors.green}Chat Commands:${this.colors.reset}
  • Just type your question in Arabic or English
  • "كيف يمكنني الحصول على جواز السفر؟"
  • "What documents do I need for passport?"
  • "Show me available jobs"

${this.colors.green}CLI Commands:${this.colors.reset}
  help      - Show this help message
  stats     - Show database statistics
  history   - Show chat history
  search    - Direct database search
  test      - Run connection tests
  clear     - Clear the screen
  quit/exit - Exit the CLI

${this.colors.bright}🎯 Features:${this.colors.reset}
  • Real-time AI-powered responses
  • MongoDB database integration
  • MCP server communication
  • Multi-language support (Arabic/English)
  • Intent detection and smart responses
    `);
  }

  private async showStats(): Promise<void> {
    try {
      if (!this.db) throw new Error('Database not connected');
      
      console.log(`${this.colors.bright}📊 Database Statistics:${this.colors.reset}`);
      
      const collections = await this.db.listCollections().toArray();
      
      for (const collection of collections) {
        const count = await this.db.collection(collection.name).countDocuments();
        console.log(`${this.colors.cyan}  ${collection.name}:${this.colors.reset} ${count} documents`);
      }
      
      // Special stats for government services
      if (collections.some(c => c.name === 'government_services')) {
        const activeServices = await this.db.collection('government_services').countDocuments({ isActive: true });
        const passportServices = await this.db.collection('government_services').countDocuments({ 
          isActive: true, 
          $or: [
            { name: { $regex: 'passport', $options: 'i' } },
            { name: { $regex: 'جواز', $options: 'i' } }
          ]
        });
        
        console.log(`${this.colors.green}  Active Services:${this.colors.reset} ${activeServices}`);
        console.log(`${this.colors.blue}  Passport Services:${this.colors.reset} ${passportServices}`);
      }
      
    } catch (error: any) {
      console.error(`${this.colors.red}❌ Stats error:${this.colors.reset}`, error.message);
    }
  }

  private showHistory(): void {
    if (this.session.messages.length === 0) {
      console.log(`${this.colors.yellow}📝 No chat history yet${this.colors.reset}`);
      return;
    }

    console.log(`${this.colors.bright}📝 Chat History (${this.session.messages.length} messages):${this.colors.reset}\n`);
    
    this.session.messages.forEach((msg, index) => {
      const timestamp = msg.timestamp.toLocaleTimeString();
      const role = msg.role === 'user' ? '👤 You' : '🤖 AI';
      const color = msg.role === 'user' ? this.colors.blue : this.colors.green;
      
      console.log(`${color}[${timestamp}] ${role}:${this.colors.reset}`);
      console.log(`  ${msg.content}\n`);
    });
  }

  private clearScreen(): void {
    console.clear();
    this.printHeader();
    console.log(`${this.colors.dim}Screen cleared. Type 'help' for commands.${this.colors.reset}\n`);
  }

  private async runTests(): Promise<void> {
    console.log(`${this.colors.yellow}🧪 Running connection tests...${this.colors.reset}\n`);
    
    // Test MongoDB
    try {
      if (this.db) {
        await this.db.admin().ping();
        console.log(`${this.colors.green}✅ MongoDB connection: OK${this.colors.reset}`);
      }
    } catch (error: any) {
      console.log(`${this.colors.red}❌ MongoDB connection: FAILED - ${error.message}${this.colors.reset}`);
    }
    
    // Test MCP Server
    try {
      const response = await fetch(`${MCP_SERVER_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        console.log(`${this.colors.green}✅ MCP Server: OK - ${data.status}${this.colors.reset}`);
      } else {
        console.log(`${this.colors.red}❌ MCP Server: HTTP ${response.status}${this.colors.reset}`);
      }
    } catch (error: any) {
      console.log(`${this.colors.red}❌ MCP Server connection: FAILED - ${error.message}${this.colors.reset}`);
    }
    
    // Test AI processing
    console.log(`${this.colors.yellow}🔍 Testing AI processing...${this.colors.reset}`);
    await this.processChatQuery('test connection');
  }

  private async directSearch(query: string): Promise<void> {
    if (!query) {
      console.log(`${this.colors.yellow}💡 Usage: search <your query>${this.colors.reset}`);
      return;
    }
    
    try {
      if (!this.db) throw new Error('Database not connected');
      
      console.log(`${this.colors.dim}🔍 Searching database for: "${query}"${this.colors.reset}`);
      
      const services = await this.db.collection('government_services')
        .find({ 
          isActive: true,
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { requirements: { $regex: query, $options: 'i' } }
          ]
        })
        .limit(5)
        .toArray();
      
      if (services.length === 0) {
        console.log(`${this.colors.yellow}❌ No services found matching "${query}"${this.colors.reset}`);
        return;
      }
      
      console.log(`${this.colors.green}📊 Found ${services.length} services:${this.colors.reset}\n`);
      
      services.forEach((service, index) => {
        console.log(`${this.colors.cyan}${index + 1}. ${service.name}${this.colors.reset}`);
        if (service.description) {
          console.log(`   📝 ${service.description}`);
        }
        if (service.fees) {
          console.log(`   💰 Fees: ${service.fees}`);
        }
        console.log();
      });
      
    } catch (error: any) {
      console.error(`${this.colors.red}❌ Search error:${this.colors.reset}`, error.message);
    }
  }

  private async processChatQuery(query: string): Promise<void> {
    console.log(`${this.colors.dim}🤔 Processing: "${query}"${this.colors.reset}`);
    
    // Add user message to history
    this.session.messages.push({
      role: 'user',
      content: query,
      timestamp: new Date()
    });

    try {
      let response: string;

      // Try MCP server first
      try {
        response = await this.queryMCPServer(query);
        console.log(`${this.colors.blue}🔗 Used MCP Server${this.colors.reset}`);
      } catch (mcpError) {
        console.log(`${this.colors.yellow}⚠️ MCP Server unavailable, using direct database access${this.colors.reset}`);
        response = await this.queryDatabaseDirect(query);
        console.log(`${this.colors.magenta}🔗 Used Direct Database Access${this.colors.reset}`);
      }

      // Add AI response to history
      this.session.messages.push({
        role: 'assistant',
        content: response,
        timestamp: new Date()
      });

      console.log(`${this.colors.green}🤖 AI Response:${this.colors.reset}\n${response}`);
      
    } catch (error: any) {
      console.error(`${this.colors.red}❌ Error processing query:${this.colors.reset}`, error.message);
    }
  }

  private async queryMCPServer(query: string): Promise<string> {
    const response = await fetch(`${MCP_SERVER_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: query,
        language: this.detectLanguage(query),
        sessionId: this.session.sessionId,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`MCP Server error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.response === 'RAW_DATA_FOR_AI_ANALYSIS') {
      // Process raw data like the web interface does
      return this.processRawMCPData(data.rawData, query);
    }
    
    return data.response || data.message || 'No response available';
  }

  private async queryDatabaseDirect(query: string): Promise<string> {
    if (!this.db) throw new Error('Database not connected');
    
    const services = await this.db.collection('government_services')
      .find({ 
        isActive: true,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { requirements: { $regex: query, $options: 'i' } }
        ]
      })
      .limit(5)
      .toArray();
    
    if (services.length === 0) {
      return this.detectLanguage(query) === 'ar' 
        ? '❌ لم أجد خدمات مطابقة لطلبك. جرب كلمات مختلفة.'
        : '❌ No matching services found. Try different keywords.';
    }
    
    const isArabic = this.detectLanguage(query) === 'ar';
    let response = isArabic 
      ? `🔍 وجدت ${services.length} خدمة متاحة:\n\n`
      : `🔍 Found ${services.length} available services:\n\n`;
    
    services.forEach((service, index) => {
      response += `${index + 1}. ${service.name}\n`;
      if (service.description) {
        response += `   📝 ${service.description}\n`;
      }
      if (service.fees) {
        response += `   💰 ${isArabic ? 'الرسوم' : 'Fees'}: ${service.fees}\n`;
      }
      response += '\n';
    });
    
    return response;
  }

  private processRawMCPData(rawData: any, query: string): string {
    const isArabic = this.detectLanguage(query) === 'ar';
    const services = rawData.allGovernmentServices || [];
    
    if (services.length === 0) {
      return isArabic 
        ? '❌ لم أجد خدمات مطابقة لطلبك.'
        : '❌ No matching services found.';
    }
    
    let response = isArabic 
      ? `🔍 وجدت ${services.length} خدمة من قاعدة البيانات:\n\n`
      : `🔍 Found ${services.length} services from database:\n\n`;
    
    services.slice(0, 5).forEach((service: any, index: number) => {
      response += `${index + 1}. ${service.name}\n`;
      if (service.description) {
        response += `   📝 ${service.description}\n`;
      }
      if (service.requirements && service.requirements.length > 0) {
        response += isArabic ? '   📋 المتطلبات:\n' : '   📋 Requirements:\n';
        service.requirements.slice(0, 3).forEach((req: string) => {
          response += `   • ${req}\n`;
        });
      }
      response += '\n';
    });
    
    return response;
  }

  private detectLanguage(text: string): 'ar' | 'en' {
    return /[\u0600-\u06FF]/.test(text) ? 'ar' : 'en';
  }

  private handleClose(): void {
    console.log(`\n${this.colors.yellow}📊 Session Summary:${this.colors.reset}`);
    console.log(`Messages exchanged: ${this.session.messages.length}`);
    console.log(`Session ID: ${this.session.sessionId}`);
    console.log(`${this.colors.cyan}👋 شكراً لاستخدامك البوابة الرقمية! Thank you for using Youth Portal!${this.colors.reset}`);
    process.exit(0);
  }
}

// Initialize and start the CLI
const cli = new YouthPortalCLI();
cli.init().catch(error => {
  console.error('❌ Failed to initialize CLI:', error);
  process.exit(1);
});
