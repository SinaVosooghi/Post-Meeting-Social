# LinkedIn OAuth Setup Guide

This guide outlines the steps to set up LinkedIn OAuth for production use in the Post-Meeting Social Media Generator.

## 1. Create LinkedIn OAuth Application

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Click "Create App"
3. Fill in the application details:
   - App Name: "Post-Meeting Social"
   - For Company/LinkedIn Page:
     - If you're an individual developer: Select the default "LinkedIn Developers" company page option
     - DO NOT use your personal LinkedIn profile URL
   - Privacy Policy URL: Your privacy policy URL
   - Business Email: Your business email
   - App Logo: Upload your app logo

   Note: As an individual developer, you MUST select the default company page provided by LinkedIn. This is LinkedIn's requirement for individual developers who don't have a company page.

## 2. Configure OAuth 2.0 Settings

1. In your app's settings, go to "Auth" tab
2. Configure OAuth 2.0 settings:
   - Redirect URLs:
     - Development: `http://localhost:3000/api/auth/callback/linkedin`
     - Production: `https://your-domain.com/api/auth/callback/linkedin`
   - Required Products to Add:
     1. Sign In with LinkedIn
        - This will give you access to:
          - `r_liteprofile`: Basic profile information
          - `r_emailaddress`: Email address access
     2. Share on LinkedIn (if needed later)
        - This will give you access to:
          - `w_member_social`: Ability to post updates

   Note: The `w_member_social` scope (for posting) requires additional verification and may not be available for individual developers. You'll need to:
   1. First set up basic authentication with OpenID Connect scopes
   2. Then apply for additional access to posting capabilities through LinkedIn's developer support

## 3. Get OAuth Credentials

1. In the "Auth" tab, note down:
   - Client ID
   - Client Secret

## 4. Environment Variables Setup

Create a `.env.local` file for development and set these variables in your production environment:

```bash
# LinkedIn OAuth Configuration
LINKEDIN_CLIENT_ID=your-client-id
LINKEDIN_CLIENT_SECRET=your-client-secret
```

## 5. Verify Configuration

1. The app uses these scopes in `auth.config.ts`:

   ```typescript
   scope: 'r_liteprofile r_emailaddress w_member_social';
   ```

2. The OAuth flow is configured to use:
   - Authorization endpoint: LinkedIn's OAuth 2.0 authorization endpoint
   - Token endpoint: `https://www.linkedin.com/oauth/v2/accessToken`
   - Custom token handling for LinkedIn's OAuth response

## 6. Testing

1. Start the development server
2. Try signing in with LinkedIn
3. Verify that:
   - Sign-in works
   - Profile information is accessible
   - Can post to LinkedIn

## 7. Production Deployment

1. Set up environment variables in your production environment
2. Verify the callback URL matches your production domain
3. Test the complete flow in production

## 8. Monitoring

1. Monitor OAuth errors in production logs
2. Watch for token expiration and refresh token usage
3. Set up alerts for authentication failures

## Security Notes

1. Keep Client Secret secure and never commit it to version control
2. Use HTTPS in production
3. Implement rate limiting for auth endpoints
4. Monitor for suspicious auth patterns
