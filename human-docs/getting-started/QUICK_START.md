# 🚀 **Quick Start Guide**

## **What You Need**

- **Node.js 18+** and **Yarn**
- **Docker & Docker Compose**
- **API Keys** (Google, LinkedIn, OpenAI, Recall.ai)

## **5-Minute Setup**

```bash
# 1. Clone and install
git clone https://github.com/SinaVosooghi/Post-Meeting-Social.git
cd Post-Meeting-Social
yarn install

# 2. Start infrastructure
docker-compose -f docker-compose.dev.yml up -d

# 3. Setup database
yarn prisma migrate dev
yarn prisma generate

# 4. Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# 5. Start development
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000)

## **First Steps**

1. **Sign in with Google** - For calendar access
2. **Sign in with LinkedIn** - For publishing
3. **Go to Calendar** - See your meetings
4. **Schedule a bot** - Toggle bot attendance
5. **Generate content** - AI-powered posts
6. **Publish to LinkedIn** - One-click publishing

## **Troubleshooting**

**Database issues?**
```bash
yarn prisma reset
yarn prisma migrate dev
```

**Port conflicts?**
```bash
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

**API errors?**
- Check your `.env.local` file
- Verify API keys are correct
- Check API quotas and limits
