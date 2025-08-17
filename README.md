# Algerian Youth Government Services Chat App 🇩🇿

A real-time chat application that connects to an MCP (Model Context Protocol) server and MongoDB database to provide intelligent assistance for Algerian government services. Features OpenAI integration for humanized responses and real-time communication via Socket.IO.

## Features ✨

- **Real-time Chat**: WebSocket-based communication with typing indicators
- **AI-Powered Responses**: OpenAI integration with Arabic language support
- **MCP Integration**: Connects to existing Model Context Protocol server
- **MongoDB Database**: Stores government services and chat history
- **Session Management**: Persistent chat sessions with user context
- **Rate Limiting**: Prevents abuse with configurable limits
- **Error Handling**: Comprehensive error handling with fallback responses
- **Responsive UI**: Mobile-friendly chat interface with RTL support

## Tech Stack 🛠️

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Socket.IO, Prisma ORM
- **Database**: MongoDB with comprehensive government services schema
- **AI**: OpenAI GPT-4 for response humanization and summarization
- **MCP**: Model Context Protocol for service integration
- **Language**: Arabic (primary) with English support

## Quick Start 🚀

### Prerequisites

- Node.js 18+ and npm
- MongoDB running on localhost:27017
- OpenAI API key

### Installation

1. **Clone and setup**:
   ```bash
   cd data_data
   npm run setup
   ```

2. **Configure environment variables** in `.env.local`:
   ```env
   DATABASE_URL=mongodb://localhost:27017/youths_portal
   OPENAI_API_KEY=your_openai_api_key_here
   NEXTAUTH_SECRET=your_secret_here
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Visit the app**: http://localhost:3000

## Available Scripts 📜

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm run setup       # Initial project setup
npm run test:chat   # Test chat functionality
npm run db:migrate  # Run database migrations
npm run db:studio   # Open Prisma Studio
npm run mcp:server  # Start MCP server
```

## Architecture 🏗️

### Components Structure
```
components/
├── ChatContainer.tsx    # Main chat interface
├── ChatMessage.tsx      # Individual message component
├── ChatInput.tsx        # Message input with voice support
└── TypingIndicator.tsx  # Typing animation
```

### API Routes
```
pages/api/
├── socket.ts           # Socket.IO initialization
├── chat.ts             # Chat message handling
├── session.ts          # Session management
└── mcp/
    ├── search.ts       # Service search endpoint
    ├── stats.ts        # Database statistics
    └── service/[id].ts # Individual service details
```

### Libraries
```
lib/
├── prisma.ts           # Database client
├── socket.ts           # Socket.IO server logic
├── openai.ts           # OpenAI integration
├── mcp-client.ts       # MCP client
├── session.ts          # Session management
├── error-handler.ts    # Error handling
└── rate-limiter.ts     # Rate limiting
```

## Features Details 📋

### Real-time Chat
- Socket.IO for instant messaging
- Typing indicators and message status
- Session-based chat history
- Mobile-responsive design

### AI Integration
- OpenAI GPT-4 for response humanization
- Arabic language optimization
- Fallback responses when AI is unavailable
- Context-aware service recommendations

### MCP Server Integration
- Direct database access through MCP protocol
- Service search and filtering
- Statistics and analytics
- Extensible for additional tools

### Database Schema
- **GovernmentService**: Comprehensive service data
- **ChatMessage**: Chat history storage
- **Session**: User session management
- **User**: User profiles (optional)

### Error Handling
- Comprehensive error catching and logging
- User-friendly error messages in Arabic
- Fallback mechanisms for service failures
- Rate limiting to prevent abuse

## Government Services Data 🏛️

The app provides access to various Algerian government services:

- **Civil Status** (الحالة المدنية): ID cards, birth certificates, passports
- **Education** (التعليم): University services, certificates
- **Health** (الصحة): Medical services, health records
- **Employment** (التشغيل): Job services, labor documentation
- **Business** (التجارة): Business registration, commercial services
- **And many more...**

## Chat Features 💬

### User Experience
- Arabic RTL interface with English support
- Voice input support (Web Speech API)
- Quick suggestion buttons
- Service result cards with direct links
- Real-time typing indicators

### Assistant Capabilities
- Natural language understanding in Arabic
- Service search and recommendations
- Step-by-step guidance for procedures
- Document requirements explanation
- Online service availability status

## Development 👨‍💻

### Adding New Features

1. **New MCP Tools**: Add to `scripts/mcp-server.ts`
2. **UI Components**: Add to `components/` directory
3. **API Endpoints**: Add to `pages/api/` directory
4. **Database Models**: Update `prisma/schema.prisma`

### Testing

```bash
npm run test:chat    # Test chat functionality
npm run test:db      # Test database connection
npm run test:mcp     # Test MCP integration
```

### Deployment

1. Build the application: `npm run build`
2. Configure production environment variables
3. Ensure MongoDB is accessible
4. Start with: `npm start`

## Environment Variables 🔧

Required variables:
- `DATABASE_URL`: MongoDB connection string
- `OPENAI_API_KEY`: OpenAI API key for AI responses
- `NEXTAUTH_SECRET`: Secret for session encryption

Optional variables:
- `NEXTAUTH_URL`: Application URL (for production)
- `MCP_SERVER_URL`: Custom MCP server URL
- `NODE_ENV`: Environment mode (development/production)

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License 📄

This project is part of the Algerian Youth Portal initiative to improve access to government services through technology.

## Support 📞

For technical support or questions about government services:
- Check the chat app's built-in help
- Review the API documentation
- Contact the development team

---

Built with ❤️ for the Algerian youth community