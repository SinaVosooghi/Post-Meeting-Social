# 📡 **API Documentation**

## **Authentication Endpoints**

### **GET /api/auth/signin**
- **Purpose**: Sign in page
- **Method**: GET
- **Auth**: None required
- **Response**: Sign-in page HTML

### **GET /api/auth/callback/google**
- **Purpose**: Google OAuth callback
- **Method**: GET
- **Auth**: Google OAuth
- **Response**: Redirect to dashboard

### **GET /api/auth/callback/linkedin**
- **Purpose**: LinkedIn OAuth callback
- **Method**: GET
- **Auth**: LinkedIn OAuth
- **Response**: Redirect to dashboard

## **Calendar Endpoints**

### **GET /api/calendar/events**
- **Purpose**: Get upcoming calendar events
- **Method**: GET
- **Auth**: Google OAuth required
- **Response**: Array of calendar events

```json
{
  "success": true,
  "data": [
    {
      "id": "event_id",
      "title": "Meeting with Client",
      "start": "2024-12-01T10:00:00Z",
      "end": "2024-12-01T11:00:00Z",
      "attendees": ["client@email.com"],
      "meetingUrl": "https://zoom.us/j/123456789"
    }
  ]
}
```

### **POST /api/calendar/events**
- **Purpose**: Create calendar event
- **Method**: POST
- **Auth**: Google OAuth required
- **Body**: Event creation data
- **Response**: Created event

## **Content Generation Endpoints**

### **POST /api/generate-posts**
- **Purpose**: Generate social media posts
- **Method**: POST
- **Auth**: Session required
- **Body**: Transcript and settings
- **Response**: Generated content

```json
{
  "success": true,
  "data": {
    "linkedin": {
      "content": "Great discussion about portfolio diversification...",
      "hashtags": ["#FinancialPlanning", "#Investment"]
    },
    "facebook": {
      "content": "Excited to share insights from today's meeting...",
      "hashtags": ["#Finance", "#Planning"]
    }
  }
}
```

## **Social Media Endpoints**

### **POST /api/social/linkedin/publish**
- **Purpose**: Publish to LinkedIn
- **Method**: POST
- **Auth**: LinkedIn OAuth required
- **Body**: Content to publish
- **Response**: Publishing status

```json
{
  "success": true,
  "data": {
    "postId": "linkedin_post_id",
    "url": "https://linkedin.com/posts/...",
    "publishedAt": "2024-12-01T12:00:00Z"
  }
}
```

## **Recall.ai Endpoints**

### **GET /api/recall/bots**
- **Purpose**: Get bot list
- **Method**: GET
- **Auth**: Session required
- **Response**: Array of bots

### **POST /api/recall/bots**
- **Purpose**: Create new bot
- **Method**: POST
- **Auth**: Session required
- **Body**: Bot configuration
- **Response**: Created bot

```json
{
  "success": true,
  "data": {
    "id": "bot_id",
    "meetingId": "meeting_id",
    "status": "scheduled",
    "scheduledAt": "2024-12-01T09:45:00Z"
  }
}
```

## **Error Responses**

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

## **Rate Limits**

- **Google Calendar**: 1,000 requests/day
- **LinkedIn**: 100 posts/day
- **OpenAI**: 10 requests/minute
- **Recall.ai**: 5 bots/hour

## **Authentication**

All protected endpoints require:
- Valid session cookie
- Appropriate OAuth tokens
- Proper scopes for the operation

## **Testing**

```bash
# Test calendar endpoint
curl -H "Cookie: session=your_session" \
  "http://localhost:3000/api/calendar/events"

# Test content generation
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: session=your_session" \
  -d '{"transcript": "Meeting transcript..."}' \
  "http://localhost:3000/api/generate-posts"
```
