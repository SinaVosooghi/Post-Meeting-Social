# 🚀 **Deployment Guide - Post-meeting Social**

## **Quick Start (Yarn Edition)**

### **1. Prerequisites**
```bash
# Install Yarn (if not already installed)
npm install -g yarn

# Install Vercel CLI
yarn global add vercel

# Or for Netlify
yarn global add netlify-cli
```

### **2. Environment Setup**

#### **2.1 Create Environment Files**
```bash
# Copy your local environment
cp .env copy.local .env.local

# Create production environment file
cp .env.example .env.production
```

#### **2.2 Update OAuth Redirect URIs**

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Edit your OAuth 2.0 Client ID
4. Add authorized redirect URIs:
   - `https://your-domain.vercel.app/api/auth/callback/google`

**LinkedIn OAuth:**
1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Navigate to your app settings
3. Add authorized redirect URIs:
   - `https://your-domain.vercel.app/api/auth/callback/linkedin`

**Facebook OAuth:**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Navigate to your app settings
3. Add authorized redirect URIs:
   - `https://your-domain.vercel.app/api/auth/callback/facebook`

### **3. Deploy to Vercel (Recommended)**

#### **3.1 One-Command Deployment**
```bash
# Deploy everything with one command
yarn deploy:vercel
```

#### **3.2 Manual Deployment**
```bash
# 1. Login to Vercel
vercel login

# 2. Deploy
vercel

# 3. Set environment variables
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add LINKEDIN_CLIENT_ID production
vercel env add LINKEDIN_CLIENT_SECRET production
vercel env add OPENAI_API_KEY production
vercel env add RECALL_AI_API_KEY production

# 4. Deploy to production
vercel --prod
```

### **4. Deploy to Netlify (Alternative)**

#### **4.1 One-Command Deployment**
```bash
# Deploy to Netlify
yarn deploy:netlify
```

#### **4.2 Manual Deployment**
```bash
# 1. Login to Netlify
netlify login

# 2. Deploy
netlify deploy --prod

# 3. Set environment variables in Netlify dashboard
# Go to Site settings > Environment variables
```

### **5. Environment Variables Reference**

#### **Required Variables:**
```bash
# Authentication
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-key

# Google OAuth (Required for Calendar)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# LinkedIn OAuth (Required for Publishing)
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# AI Services
OPENAI_API_KEY=your-openai-api-key
RECALL_AI_API_KEY=your-recall-ai-api-key

# Public Variables (for client-side)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_RECALL_AI_API_KEY=your-recall-ai-api-key
```

#### **Optional Variables:**
```bash
# Facebook OAuth (Currently Mocked)
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
```

### **6. Post-Deployment Testing**

#### **6.1 Health Check**
```bash
# Test health endpoint
curl https://your-domain.vercel.app/api/health
```

#### **6.2 Test URLs**
1. **Home Page:** `https://your-domain.vercel.app/`
2. **Auth Page:** `https://your-domain.vercel.app/api/auth/signin`
3. **Calendar:** `https://your-domain.vercel.app/calendar`
4. **Settings:** `https://your-domain.vercel.app/settings`

#### **6.3 OAuth Flow Testing**
1. ✅ Sign in with Google (Calendar access)
2. ✅ Sign in with LinkedIn (Publishing - mocked)
3. ✅ Sign in with Facebook (Publishing - mocked)
4. ✅ Generate content
5. ✅ Test email generation

### **7. Production Configuration**

#### **7.1 Security Headers**
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Referrer-Policy: origin-when-cross-origin
- ✅ X-XSS-Protection: 1; mode=block

#### **7.2 CORS Configuration**
- ✅ API routes configured for production domain
- ✅ OAuth callbacks properly configured

### **8. Monitoring & Maintenance**

#### **8.1 Health Monitoring**
```bash
# Check application health
curl https://your-domain.vercel.app/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-12-01T12:00:00Z",
  "environment": "production",
  "services": {
    "google": "healthy",
    "linkedin": "healthy",
    "facebook": "healthy",
    "openai": "healthy",
    "recall": "healthy"
  },
  "features": {
    "calendarIntegration": "active",
    "contentGeneration": "active",
    "socialPublishing": "mocked",
    "botScheduling": "active",
    "emailGeneration": "active"
  }
}
```

#### **8.2 Logs & Debugging**
```bash
# View Vercel logs
vercel logs

# View Netlify logs
netlify logs
```

### **9. Troubleshooting**

#### **9.1 Common Issues**

**OAuth Redirect Errors:**
- ✅ Check redirect URIs in OAuth providers
- ✅ Verify NEXTAUTH_URL matches domain
- ✅ Ensure HTTPS is configured

**Environment Variable Issues:**
- ✅ Check all required variables are set
- ✅ Verify variable names match exactly
- ✅ Check for typos in values

**Build Errors:**
- ✅ Run `yarn type-check` locally
- ✅ Run `yarn lint` locally
- ✅ Check for missing dependencies

#### **9.2 Debug Commands**
```bash
# Check build locally
yarn build:prod

# Run all tests
yarn test && yarn test:e2e

# Check types
yarn type-check

# Check linting
yarn lint
```

### **10. Scaling Considerations**

#### **10.1 Current Architecture**
- ✅ **Storage:** In-memory (suitable for MVP)
- ✅ **Sessions:** JWT-based (stateless)
- ✅ **Database:** None (in-memory storage)

#### **10.2 Future Scaling**
- 🔄 **Redis:** For session storage
- 🔄 **PostgreSQL:** For persistent data
- 🔄 **CDN:** For static assets
- 🔄 **Rate Limiting:** For API protection

### **11. Deployment Checklist**

- [ ] Environment variables configured
- [ ] OAuth redirect URIs updated
- [ ] Health check endpoint working
- [ ] All tests passing
- [ ] Security headers applied
- [ ] HTTPS configured
- [ ] Domain configured
- [ ] Monitoring set up

### **12. Quick Commands Reference**

```bash
# Development
yarn dev                    # Start development server
yarn build                  # Build for production
yarn start                  # Start production server

# Testing
yarn test                   # Run unit tests
yarn test:e2e              # Run E2E tests
yarn type-check            # Check TypeScript types
yarn lint                  # Run linting

# Deployment
yarn deploy:vercel         # Deploy to Vercel
yarn deploy:netlify        # Deploy to Netlify
yarn vercel:deploy         # Direct Vercel deployment

# Environment
yarn vercel:env            # Add environment variables to Vercel
```

---

## **🎯 Ready to Deploy?**

Run this command to deploy everything:
```bash
yarn deploy:vercel
```

This will:
1. ✅ Install dependencies
2. ✅ Run type checking
3. ✅ Run linting
4. ✅ Run tests
5. ✅ Build the application
6. ✅ Deploy to Vercel
7. ✅ Provide next steps for environment variables

