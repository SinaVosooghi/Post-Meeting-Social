# 🚀 **Deployment Guide**

## **Production Deployment**

### **Vercel (Recommended)**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add LINKEDIN_CLIENT_ID
vercel env add LINKEDIN_CLIENT_SECRET
vercel env add OPENAI_API_KEY
vercel env add RECALL_AI_API_KEY
```

### **Manual Deployment**

```bash
# Build application
yarn build

# Start production server
yarn start

# Or use PM2 for process management
pm2 start yarn --name "post-meeting-social" -- start
```

## **Environment Configuration**

### **Required Environment Variables**

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"

# AI Services
OPENAI_API_KEY="your-openai-api-key"
RECALL_AI_API_KEY="your-recall-ai-api-key"
```

### **Production Database Setup**

```bash
# Create production database
createdb post_meeting_prod

# Run migrations
yarn prisma migrate deploy

# Generate Prisma client
yarn prisma generate
```

## **Monitoring & Health Checks**

### **Health Check Endpoint**

```bash
# Check application health
curl https://your-domain.com/api/health

# Response
{
  "status": "healthy",
  "timestamp": "2024-12-01T12:00:00Z",
  "services": {
    "database": "healthy",
    "google": "healthy",
    "linkedin": "healthy",
    "openai": "healthy",
    "recall": "healthy"
  }
}
```

### **Monitoring Setup**

```bash
# Install monitoring tools
yarn add @vercel/analytics
yarn add @sentry/nextjs

# Configure Sentry
SENTRY_DSN="your-sentry-dsn"
```

## **Security Configuration**

### **HTTPS Setup**
- Use Vercel's built-in HTTPS
- Or configure SSL certificates
- Redirect HTTP to HTTPS

### **CORS Configuration**
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://your-domain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}
```

### **Rate Limiting**
```typescript
// lib/rate-limit.ts
export const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
}
```

## **Database Management**

### **Backup Strategy**
```bash
# Create database backup
pg_dump post_meeting_prod > backup_$(date +%Y%m%d).sql

# Restore from backup
psql post_meeting_prod < backup_20241201.sql
```

### **Migration Strategy**
```bash
# Run migrations in production
yarn prisma migrate deploy

# Rollback if needed
yarn prisma migrate resolve --rolled-back migration_name
```

## **Performance Optimization**

### **Caching Strategy**
```typescript
// lib/cache.ts
export const cache = {
  ttl: 3600, // 1 hour
  maxSize: 1000, // 1000 items
}
```

### **CDN Configuration**
- Use Vercel's global CDN
- Or configure CloudFlare
- Optimize static assets

## **Troubleshooting**

### **Common Issues**

**Database Connection Errors**
```bash
# Check connection string
echo $DATABASE_URL

# Test connection
yarn prisma db pull
```

**OAuth Redirect Errors**
- Check redirect URIs in OAuth providers
- Verify NEXTAUTH_URL matches domain
- Check HTTPS configuration

**API Rate Limits**
- Monitor API usage
- Implement exponential backoff
- Add circuit breakers

### **Logs and Debugging**

```bash
# View Vercel logs
vercel logs

# View application logs
yarn dev 2>&1 | tee app.log

# Check database logs
tail -f /var/log/postgresql/postgresql.log
```

## **Scaling Considerations**

### **Horizontal Scaling**
- Use Vercel's auto-scaling
- Or configure load balancer
- Implement session storage

### **Database Scaling**
- Use read replicas
- Implement connection pooling
- Monitor query performance

### **API Scaling**
- Implement rate limiting
- Use caching layers
- Monitor response times
