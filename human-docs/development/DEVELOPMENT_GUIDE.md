# 👨‍💻 **Development Guide**

## **Getting Started**

```bash
# Clone and setup
git clone https://github.com/SinaVosooghi/Post-Meeting-Social.git
cd Post-Meeting-Social
yarn install

# Start development environment
docker-compose -f docker-compose.dev.yml up -d
yarn prisma migrate dev
yarn prisma generate
yarn dev
```

## **Project Structure**

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── calendar/          # Calendar page
│   ├── meetings/          # Meetings page
│   └── settings/          # Settings page
├── components/            # Reusable UI components
├── lib/                   # Core utilities
│   ├── auth.ts           # Authentication utilities
│   ├── google-calendar.ts # Google Calendar integration
│   ├── linkedin.ts       # LinkedIn integration
│   ├── openai.ts         # OpenAI integration
│   └── recall-ai.ts      # Recall.ai integration
└── types/                 # TypeScript definitions
    └── master-interfaces.ts # All type definitions
```

## **Development Workflow**

### **1. Feature Development**
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# Run tests
yarn test:e2e

# Commit changes
git commit -m "feat: add new feature"
```

### **2. Database Changes**
```bash
# Modify schema in prisma/schema.prisma
# Create migration
yarn prisma migrate dev --name add_new_field

# Generate Prisma client
yarn prisma generate
```

### **3. API Development**
```bash
# Create new API route
touch src/app/api/new-endpoint/route.ts

# Test API endpoint
curl -X POST http://localhost:3000/api/new-endpoint
```

## **Code Standards**

### **TypeScript**
- Use strict mode
- Define all types in `master-interfaces.ts`
- Use proper error handling
- Document complex functions

### **API Routes**
- Use proper HTTP methods
- Implement error handling
- Return consistent response format
- Add authentication checks

### **Components**
- Use functional components
- Implement proper TypeScript types
- Add error boundaries
- Use Tailwind CSS for styling

## **Testing**

### **Unit Tests**
```bash
yarn test                    # Run unit tests
yarn test:watch             # Watch mode
yarn test:coverage          # Coverage report
```

### **E2E Tests**
```bash
yarn test:e2e               # Run all E2E tests
yarn test:e2e:ui            # Run with UI
yarn test:e2e:headed        # Run in headed mode
```

### **Test Structure**
```
tests/
├── e2e/
│   ├── basic-page-tests.spec.ts
│   ├── auth-flow-tests.spec.ts
│   ├── content-generation-tests.spec.ts
│   ├── demo-page-tests.spec.ts
│   ├── error-handling-tests.spec.ts
│   └── real-integration-tests.spec.ts
└── __tests__/
    └── unit/
        ├── auth.test.ts
        ├── calendar.test.ts
        └── content.test.ts
```

## **Debugging**

### **Database Issues**
```bash
# Reset database
yarn prisma reset

# View database
yarn prisma studio

# Check migrations
yarn prisma migrate status
```

### **API Issues**
```bash
# Check logs
yarn dev

# Test specific endpoint
curl -X POST http://localhost:3000/api/endpoint
```

### **OAuth Issues**
- Check redirect URIs
- Verify client IDs
- Check scopes
- Clear browser cookies

## **Performance**

### **Database Optimization**
- Use Prisma query optimization
- Implement proper indexing
- Use connection pooling
- Monitor query performance

### **API Optimization**
- Implement caching
- Use rate limiting
- Add circuit breakers
- Monitor response times

## **Deployment**

### **Local Testing**
```bash
yarn build
yarn start
```

### **Production Deployment**
```bash
# Deploy to Vercel
vercel

# Set environment variables
vercel env add GOOGLE_CLIENT_ID
vercel env add LINKEDIN_CLIENT_ID
vercel env add OPENAI_API_KEY
vercel env add RECALL_AI_API_KEY
```

## **Common Issues**

### **Type Errors**
- Check `master-interfaces.ts`
- Verify imports
- Run `yarn type-check`

### **OAuth Errors**
- Check redirect URIs
- Verify client secrets
- Check API quotas

### **Database Errors**
- Run migrations
- Check connection string
- Verify Prisma client

### **Test Failures**
- Check test data
- Verify API responses
- Check timing issues
