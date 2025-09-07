# 🏗️ **System Overview**

## **What This System Does**

Transforms financial advisor meetings into compliant social media content automatically:

1. **Meeting Capture** - Google Calendar integration
2. **Recording** - Recall.ai bot management
3. **AI Processing** - OpenAI content generation
4. **Compliance** - FINRA/SEC validation
5. **Publishing** - LinkedIn social media posting

## **Core Components**

### **Frontend (Next.js 14)**
- **Pages**: Demo, Calendar, Meetings, Settings
- **Components**: Reusable UI components
- **Authentication**: NextAuth.js OAuth flows
- **Styling**: Tailwind CSS + Shadcn/ui

### **Backend (Next.js API Routes)**
- **Authentication**: `/api/auth/*` - OAuth providers
- **Calendar**: `/api/calendar/*` - Google Calendar integration
- **Content**: `/api/generate-posts` - AI content generation
- **Social**: `/api/social/*` - LinkedIn publishing
- **Recall**: `/api/recall/*` - Bot management

### **Database (PostgreSQL + Prisma)**
- **Users**: User accounts and profiles
- **Meetings**: Meeting data and transcripts
- **Content**: Generated posts and compliance
- **Bots**: Recall.ai bot management
- **Tokens**: OAuth token storage

### **External APIs**
- **Google Calendar**: Event synchronization
- **LinkedIn**: Social media publishing
- **OpenAI**: AI content generation
- **Recall.ai**: Meeting bot management

## **Data Flow**

```
1. User signs in with Google + LinkedIn
2. Calendar events sync from Google
3. User schedules Recall.ai bots for meetings
4. Bots join meetings and record transcripts
5. AI generates social media content
6. Content goes through compliance validation
7. User publishes to LinkedIn
```

## **Security Features**

- **OAuth 2.0** - Secure authentication
- **Token Encryption** - Encrypted token storage
- **Type Safety** - 100% TypeScript coverage
- **Input Validation** - Zod schema validation
- **Error Handling** - Comprehensive error management

## **Performance Features**

- **Caching** - Redis for session storage
- **Database Optimization** - Prisma query optimization
- **Rate Limiting** - API rate limit protection
- **Error Recovery** - Circuit breaker patterns
- **Monitoring** - Health checks and alerts
