# 🔑 **API Keys Setup**

## **Required API Keys**

| **Service** | **Purpose** | **Required** | **Status** |
|-------------|-------------|--------------|------------|
| **Google Calendar** | Calendar integration | ✅ Yes | Working |
| **LinkedIn** | Social publishing | ✅ Yes | Working |
| **OpenAI** | AI content generation | ✅ Yes | Ready |
| **Recall.ai** | Meeting bots | ✅ Yes | Working |

## **Google Calendar Setup**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env.local`

```bash
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## **LinkedIn Setup**

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Create a new app
3. Add OAuth 2.0 redirect URI: `http://localhost:3000/api/auth/callback/linkedin`
4. Request `w_member_social` scope
5. Copy Client ID and Secret to `.env.local`

```bash
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"
```

## **OpenAI Setup**

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create API key
3. Add billing information
4. Copy API key to `.env.local`

```bash
OPENAI_API_KEY="your-openai-api-key"
```

## **Recall.ai Setup**

1. Go to [Recall.ai](https://recall.ai/)
2. Sign up for account
3. Get API key from dashboard
4. Copy API key to `.env.local`

```bash
RECALL_AI_API_KEY="your-recall-ai-api-key"
```

## **Testing Your Setup**

```bash
# Test Google Calendar
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "https://www.googleapis.com/calendar/v3/calendars/primary/events"

# Test LinkedIn
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "https://api.linkedin.com/v2/me"

# Test OpenAI
curl -H "Authorization: Bearer YOUR_OPENAI_KEY" \
  "https://api.openai.com/v1/models"

# Test Recall.ai
curl -H "Authorization: Token YOUR_RECALL_KEY" \
  "https://api.recall.ai/api/v1/bots"
```

## **Common Issues**

**OAuth redirect errors?**
- Check redirect URIs match exactly
- Ensure HTTPS in production
- Verify client IDs are correct

**API quota exceeded?**
- Check usage in service dashboards
- Upgrade plans if needed
- Implement rate limiting

**Permission denied?**
- Verify scopes are correct
- Re-authorize OAuth flows
- Check API key permissions
