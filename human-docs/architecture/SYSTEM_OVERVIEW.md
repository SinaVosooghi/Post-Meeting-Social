# 🏗️ **System Overview**

## **What This System Does**

Transforms financial advisor meetings into social media content automatically:

1. **Meeting Capture** - Google Calendar integration
2. **Recording** - Recall.ai bot management
3. **AI Processing** - OpenAI content generation
4. **Compliance** - ⚠️ Type definitions complete, implementation deferred
5. **Publishing** - LinkedIn social media posting (authentication real, publishing mocked)

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

### **Storage (In-Memory for Development)**
- **Users**: User accounts and profiles (in-memory)
- **Meetings**: Meeting data and transcripts (in-memory)
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
6. Content validation (type definitions ready, implementation deferred)
7. User publishes to LinkedIn (publishing mocked)
```

## **Compliance Layer**

**Status:** ⚠️ **Designed but not implemented due to time constraints**

**Completed:**
- Complete TypeScript type definitions
- Comprehensive compliance validation interfaces
- FINRA/SEC rule structure definitions
- Audit trail and risk assessment types

**Not Implemented:**
- Actual validation logic
- Risk scoring algorithms
- Disclaimer injection
- Rule engine execution

**Production Path:** Use existing type definitions to implement full compliance engine

## **Security Features**

- **OAuth 2.0** - Secure authentication
- **Token Encryption** - Encrypted token storage
- **Type Safety** - 100% TypeScript coverage
- **Input Validation** - Zod schema validation
- **Error Handling** - Comprehensive error management

## **Performance Features**

- **In-Memory Storage** - Fast development storage
- **API Optimization** - Efficient external API calls
- **Rate Limiting** - API rate limit protection
- **Error Recovery** - Circuit breaker patterns
- **Monitoring** - Health checks and alerts
