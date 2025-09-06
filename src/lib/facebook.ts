/**
 * Facebook API Integration
 * Post-Meeting Social Media Content Generator
 *
 * Handles Facebook OAuth, token management, and content publishing
 * Aligned with SocialMediaToken and SocialMediaPost interfaces
 */

import type {
  SocialEngagement,
  FacebookTokenResponse,
  FacebookProfileResponse,
  FacebookPostResponse,
  FacebookPostStatsResponse,
} from '@/types/master-interfaces';
import { socialLogger } from './logger';

// ============================================================================
// FACEBOOK CONFIGURATION
// ============================================================================

// Validate required environment variables
const clientId = process.env.FACEBOOK_CLIENT_ID;
const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
const redirectUri = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL}/api/auth/callback/facebook`
  : '';

if (!clientId || !clientSecret || !redirectUri) {
  socialLogger.warn('Missing Facebook configuration. Some features may be disabled.');
}

const FACEBOOK_CONFIG = {
  clientId: clientId ?? '',
  clientSecret: clientSecret ?? '',
  redirectUri,
  scopes: ['public_profile', 'email', 'pages_manage_posts', 'pages_read_engagement'],
  apiBaseUrl: 'https://graph.facebook.com/v18.0',
  authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
  tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
};

const FACEBOOK_LIMITS = {
  maxPostLength: 63206, // Facebook's character limit
  maxHashtags: 30,
  rateLimitPerHour: 200,
  rateLimitPerDay: 1000,
};

// ============================================================================
// FACEBOOK OAUTH
// ============================================================================

/**
 * Generates Facebook OAuth authorization URL
 */
export function generateFacebookAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: FACEBOOK_CONFIG.clientId,
    redirect_uri: FACEBOOK_CONFIG.redirectUri,
    scope: FACEBOOK_CONFIG.scopes.join(','),
    response_type: 'code',
    state,
  });

  return `${FACEBOOK_CONFIG.authUrl}?${params.toString()}`;
}

/**
 * Exchanges authorization code for access token
 */
export async function exchangeFacebookCode(
  code: string,
  _state: string
): Promise<{
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
  scope: string;
}> {
  try {
    // mark state as intentionally unused for linting purposes
    void _state;
    const response = await fetch(FACEBOOK_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: FACEBOOK_CONFIG.clientId,
        client_secret: FACEBOOK_CONFIG.clientSecret,
        redirect_uri: FACEBOOK_CONFIG.redirectUri,
        code,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Facebook token exchange failed: ${response.status} - ${errorData}`);
    }

    const tokenData = (await response.json()) as FacebookTokenResponse;

    // Type guard for Facebook token response
    if (!tokenData || typeof tokenData !== 'object' || !('access_token' in tokenData)) {
      throw new Error('Invalid Facebook token response format');
    }

    return {
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in || 0,
      refreshToken: tokenData.refresh_token,
      scope: tokenData.scope || FACEBOOK_CONFIG.scopes.join(' '),
    };
  } catch (error) {
    socialLogger.error('Facebook token exchange error:', error as Error);
    throw new Error(
      `Failed to exchange Facebook code: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Refreshes Facebook access token
 */
export async function refreshFacebookToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
  scope: string;
}> {
  try {
    const response = await fetch(FACEBOOK_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: FACEBOOK_CONFIG.clientId,
        client_secret: FACEBOOK_CONFIG.clientSecret,
        fb_exchange_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Facebook token refresh failed: ${response.status} - ${errorData}`);
    }

    const tokenData = (await response.json()) as FacebookTokenResponse;

    // Type guard for Facebook token response
    if (!tokenData || typeof tokenData !== 'object' || !('access_token' in tokenData)) {
      throw new Error('Invalid Facebook token response format');
    }

    return {
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in || 0,
      scope: tokenData.scope || FACEBOOK_CONFIG.scopes.join(' '),
    };
  } catch (error) {
    socialLogger.error('Facebook token refresh error:', error as Error);
    throw new Error(
      `Failed to refresh Facebook token: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ============================================================================
// FACEBOOK PROFILE
// ============================================================================

/**
 * Gets Facebook user profile
 */
export async function getFacebookProfile(accessToken: string): Promise<{
  id: string;
  name: string;
  email: string;
  picture: string;
}> {
  try {
    const response = await fetch(
      `${FACEBOOK_CONFIG.apiBaseUrl}/me?fields=id,name,email,picture&access_token=${accessToken}`
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Facebook profile fetch failed: ${response.status} - ${errorData}`);
    }

    const profile = (await response.json()) as FacebookProfileResponse;

    // Type guard for Facebook profile response
    if (!profile || typeof profile !== 'object' || !('id' in profile) || !('name' in profile)) {
      throw new Error('Invalid Facebook profile response format');
    }

    return {
      id: profile.id,
      name: profile.name,
      email: profile.email || '',
      picture: profile.picture?.data?.url || '',
    };
  } catch (error) {
    socialLogger.error('Facebook profile fetch error:', error as Error);
    throw new Error(
      `Failed to fetch Facebook profile: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ============================================================================
// FACEBOOK POSTING
// ============================================================================

/**
 * Posts content to Facebook
 */
export async function postToFacebook(
  accessToken: string,
  content: {
    text: string;
    hashtags?: string[];
    linkUrl?: string;
    imageUrl?: string;
  }
): Promise<{
  postId: string;
  postUrl: string;
  publishedAt: Date;
}> {
  try {
    // Get user profile for posting
    const _profile = await getFacebookProfile(accessToken);

    // Prepare post content
    const postText = content.hashtags
      ? `${content.text}\n\n${content.hashtags.map(tag => `#${tag.replace('#', '')}`).join(' ')}`
      : content.text;

    // Create post payload
    const postPayload: Record<string, unknown> = {
      message: postText,
    };

    if (content.linkUrl) {
      postPayload.link = content.linkUrl;
    }

    if (content.imageUrl) {
      postPayload.url = content.imageUrl;
    }

    // Post to Facebook
    const response = await fetch(
      `${FACEBOOK_CONFIG.apiBaseUrl}/me/feed?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postPayload),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Facebook post failed: ${response.status} - ${errorData}`);
    }

    const postData = (await response.json()) as FacebookPostResponse;

    // Type guard for Facebook post response
    if (!postData || typeof postData !== 'object' || !('id' in postData)) {
      throw new Error('Invalid Facebook post response format');
    }

    return {
      postId: postData.id,
      postUrl: `https://facebook.com/${postData.id}`,
      publishedAt: new Date(),
    };
  } catch (error) {
    socialLogger.error('Facebook posting error:', error as Error);
    throw new Error(
      `Failed to post to Facebook: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets Facebook post analytics
 */
export async function getFacebookPostAnalytics(
  accessToken: string,
  postId: string
): Promise<SocialEngagement> {
  try {
    const response = await fetch(
      `${FACEBOOK_CONFIG.apiBaseUrl}/${postId}/insights?metric=post_impressions,post_engaged_users,post_reactions_by_type_total&access_token=${accessToken}`
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Facebook analytics fetch failed: ${response.status} - ${errorData}`);
    }

    const analytics = (await response.json()) as FacebookPostStatsResponse;

    // Type guard for Facebook analytics response
    if (!analytics || typeof analytics !== 'object') {
      throw new Error('Invalid Facebook analytics response format');
    }

    const data = analytics.data || [];
    const reactionsData = data.find(d => d.name === 'post_reactions_by_type_total');
    const engagementData = data.find(d => d.name === 'post_engaged_users');
    const impressionsData = data.find(d => d.name === 'post_impressions');

    return {
      likes: reactionsData?.values?.[0]?.value?.like || 0,
      shares: engagementData?.values?.[0]?.value || 0,
      comments: 0, // Facebook doesn't provide comment count in basic insights
      views: impressionsData?.values?.[0]?.value || 0,
      clicks: 0, // Facebook doesn't provide click count in basic insights
    };
  } catch (error) {
    socialLogger.error('Facebook analytics error:', error as Error);
    return {
      likes: 0,
      shares: 0,
      comments: 0,
      views: 0,
      clicks: 0,
    };
  }
}

// ============================================================================
// FACEBOOK UTILITIES
// ============================================================================

/**
 * Validates Facebook access token
 */
export async function validateFacebookToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${FACEBOOK_CONFIG.apiBaseUrl}/me?access_token=${accessToken}`);
    return response.ok;
  } catch (error) {
    socialLogger.error('Facebook token validation error:', error as Error);
    return false;
  }
}

/**
 * Checks if token should be refreshed
 */
export function shouldRefreshToken(expiresAt: Date): boolean {
  const now = new Date();
  const timeUntilExpiry = expiresAt.getTime() - now.getTime();
  return timeUntilExpiry < 24 * 60 * 60 * 1000; // Refresh if expires within 24 hours
}

/**
 * Encrypts token for storage
 */
export function encryptToken(token: string): string {
  // In production, use proper encryption
  return Buffer.from(token).toString('base64');
}

/**
 * Decrypts token from storage
 */
export function decryptToken(encryptedToken: string): string {
  // In production, use proper decryption
  return Buffer.from(encryptedToken, 'base64').toString('utf-8');
}

// ============================================================================
// FACEBOOK ERROR HANDLING
// ============================================================================

/**
 * Handles Facebook API errors
 */
export function handleFacebookError(error: unknown): {
  message: string;
  code: string;
  retryable: boolean;
} {
  if (error instanceof Error) {
    if (error.message.includes('rate limit')) {
      return {
        message: 'Facebook rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryable: true,
      };
    }

    if (error.message.includes('access token')) {
      return {
        message: 'Facebook access token is invalid or expired.',
        code: 'INVALID_TOKEN',
        retryable: false,
      };
    }

    if (error.message.includes('permission')) {
      return {
        message: 'Insufficient permissions for Facebook operation.',
        code: 'INSUFFICIENT_PERMISSIONS',
        retryable: false,
      };
    }
  }

  return {
    message: 'An unexpected error occurred with Facebook.',
    code: 'UNKNOWN_ERROR',
    retryable: true,
  };
}

// ============================================================================
// FACEBOOK CONTENT OPTIMIZATION
// ============================================================================

/**
 * Optimizes content for Facebook
 */
export function optimizeContentForFacebook(content: {
  text: string;
  hashtags?: string[];
  platform: string;
}): {
  optimizedText: string;
  hashtags: string[];
  characterCount: number;
  warnings: string[];
} {
  const warnings: string[] = [];
  let optimizedText = content.text;
  const _hashtags = content.hashtags || [];

  // Check character limit
  if (optimizedText.length > FACEBOOK_LIMITS.maxPostLength) {
    warnings.push(`Content exceeds Facebook's character limit of ${FACEBOOK_LIMITS.maxPostLength}`);
    optimizedText = optimizedText.substring(0, FACEBOOK_LIMITS.maxPostLength - 3) + '...';
  }

  // Limit hashtags
  if (_hashtags.length > FACEBOOK_LIMITS.maxHashtags) {
    warnings.push(`Too many hashtags. Facebook recommends ${FACEBOOK_LIMITS.maxHashtags} or fewer`);
    _hashtags.splice(FACEBOOK_LIMITS.maxHashtags);
  }

  // Facebook-specific optimizations
  if (optimizedText.includes('@')) {
    warnings.push('Facebook handles mentions differently than other platforms');
  }

  return {
    optimizedText,
    hashtags: _hashtags,
    characterCount: optimizedText.length,
    warnings,
  };
}

/**
 * Validates content for Facebook
 */
export function validateFacebookContent(content: string): {
  isValid: boolean;
  issues: string[];
  riskScore: number;
} {
  const issues: string[] = [];
  let riskScore = 0;

  // Check length
  if (content.length > FACEBOOK_LIMITS.maxPostLength) {
    issues.push(`Content exceeds Facebook's character limit of ${FACEBOOK_LIMITS.maxPostLength}`);
    riskScore += 50;
  }

  // Check for potentially problematic content
  const problematicWords = ['spam', 'scam', 'fake', 'clickbait'];
  const lowerContent = content.toLowerCase();

  for (const word of problematicWords) {
    if (lowerContent.includes(word)) {
      issues.push(`Content may be flagged for containing "${word}"`);
      riskScore += 20;
    }
  }

  // Check for excessive hashtags
  const hashtagCount = (content.match(/#\w+/g) || []).length;
  if (hashtagCount > FACEBOOK_LIMITS.maxHashtags) {
    issues.push(`Too many hashtags. Facebook recommends ${FACEBOOK_LIMITS.maxHashtags} or fewer`);
    riskScore += 10;
  }

  return {
    isValid: issues.length === 0,
    issues,
    riskScore: Math.min(riskScore, 100),
  };
}

// ============================================================================
// MOCK DATA FOR DEVELOPMENT
// ============================================================================

export const MOCK_FACEBOOK_PROFILE = {
  id: 'mock-facebook-user',
  name: 'Mock Facebook User',
  email: 'mock@facebook.com',
  picture: 'https://via.placeholder.com/150',
};

/**
 * Creates mock Facebook post for development
 */
export async function createMockFacebookPost(
  content: string,
  _hashtags: string[] = []
): Promise<{
  postId: string;
  postUrl: string;
  publishedAt: Date;
  engagement: SocialEngagement;
}> {
  const postId = `mock-facebook-post-${Date.now()}`;

  return {
    postId,
    postUrl: `https://facebook.com/${postId}`,
    publishedAt: new Date(),
    engagement: {
      likes: Math.floor(Math.random() * 100),
      shares: Math.floor(Math.random() * 50),
      comments: Math.floor(Math.random() * 25),
      views: Math.floor(Math.random() * 1000),
      clicks: Math.floor(Math.random() * 100),
    },
  };
}

// ============================================================================
// RATE LIMITING
// ============================================================================

export class FacebookRateLimiter {
  private static instance: FacebookRateLimiter;
  private requests: Map<string, number[]> = new Map();

  static getInstance(): FacebookRateLimiter {
    if (!FacebookRateLimiter.instance) {
      FacebookRateLimiter.instance = new FacebookRateLimiter();
    }
    return FacebookRateLimiter.instance;
  }

  canMakeRequest(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Remove requests older than 1 hour
    const recentRequests = userRequests.filter(time => now - time < 60 * 60 * 1000);

    // Check if under rate limit
    if (recentRequests.length >= FACEBOOK_LIMITS.rateLimitPerHour) {
      return false;
    }

    this.requests.set(userId, recentRequests);
    return true;
  }

  recordRequest(userId: string): void {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    userRequests.push(now);
    this.requests.set(userId, userRequests);
  }

  getResetTime(userId: string): number {
    const userRequests = this.requests.get(userId) || [];
    if (userRequests.length === 0) {
      return 0;
    }

    const oldestRequest = Math.min(...userRequests);
    return oldestRequest + 60 * 60 * 1000; // 1 hour from oldest request
  }
}
