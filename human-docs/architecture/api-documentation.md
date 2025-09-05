# 🔥 API Documentation

## Authentication Endpoints

### `POST /api/auth/[...nextauth]`
NextAuth.js authentication handler
- **Google OAuth** for calendar access
- **LinkedIn OAuth** for social publishing
- **Session management** and token refresh

## Calendar Management

### `GET /api/calendar/events`
Fetch upcoming calendar events
- **Query Parameters:**
  - `maxResults`: Number of events (default: 20)
  - `mock`: Use mock data (default: false)
- **Response:** Array of CalendarEvent objects

### `POST /api/calendar/events`
Create or manage calendar events
- **Actions:** `fetch`, `create`, `update`, `delete`
- **Authentication:** Required

## Meeting Bot Management

### `GET /api/recall/bots`
List meeting bots
- **Query Parameters:**
  - `botId`: Specific bot ID
  - `action`: `transcript` for transcript retrieval
  - `limit`: Number of results
  - `status`: Filter by bot status

### `POST /api/recall/bots`
Manage meeting bots
- **Actions:**
  - `schedule`: Create new bot
  - `cancel`: Cancel existing bot
  - `status`: Get bot status
  - `transcript`: Get meeting transcript

### `DELETE /api/recall/bots`
Delete meeting bot
- **Query Parameters:**
  - `botId`: Bot ID to delete

## AI Content Generation

### `POST /api/generate-posts`
Generate social media posts from meeting transcript
- **Request Body:**
  ```json
  {
    "transcript": "Meeting transcript text",
    "meetingContext": {
      "title": "Meeting title",
      "attendees": ["attendee1", "attendee2"],
      "duration": 45,
      "platform": "zoom"
    },
    "automationSettings": {
      "maxPosts": 3,
      "tone": "professional",
      "length": "medium",
      "includeHashtags": true,
      "includeEmojis": false
    }
  }
  ```

### `POST /api/generate-email`
Generate follow-up email from meeting transcript
- **Request Body:**
  ```json
  {
    "transcript": "Meeting transcript text",
    "attendees": ["attendee1", "attendee2"],
    "meetingTitle": "Meeting title"
  }
  ```

## Response Format

All API endpoints return standardized responses:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "metadata": {
    "timestamp": "2025-09-05T19:00:00.000Z",
    "requestId": "uuid",
    "usingMockData": false
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "timestamp": "2025-09-05T19:00:00.000Z"
  }
}
```

## Authentication

Most endpoints require authentication via NextAuth.js session:
- Session cookie automatically handled by NextAuth.js
- API routes use `getServerSession()` for authentication
- Unauthorized requests return 401 status

## Mock Data Support

All endpoints support mock data for development and demo:
- Calendar events: Mock Google Calendar data
- Meeting bots: Simulated Recall.ai responses  
- AI generation: OpenAI integration with mock fallbacks

## Rate Limiting

- OpenAI API: Respects OpenAI rate limits
- Google Calendar: Standard OAuth rate limits
- Recall.ai: API-specific rate limits
- Mock endpoints: No rate limiting

## Error Handling

Comprehensive error handling with:
- Input validation using Zod schemas
- External API error handling
- Proper HTTP status codes
- Detailed error messages for debugging
