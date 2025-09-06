/**
 * LinkedIn API Integration
 * Post-Meeting Social Media Content Generator
 *
 * Handles LinkedIn OAuth, token management, and content publishing
 * Aligned with SocialMediaToken and SocialMediaPost interfaces
 */

import type {
  SocialMediaToken,
  SocialEngagement,
  _LinkedInTokenResponse,
  _LinkedInProfileResponse,
  _LinkedInPostResponse,
  _LinkedInPostStatsResponse,
} from '@/types/master-interfaces';
import { SocialPlatform } from '@/types/master-interfaces';
import { socialLogger } from './logger';

// ============================================================================
// LINKEDIN CONFIGURATION
// ============================================================================

// Validate required environment variables
const clientId = process.env.LINKEDIN_CLIENT_ID;
const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
const redirectUri = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL}/api/auth/callback/linkedin`
  : '';

if (!clientId || !clientSecret || !redirectUri) {
  socialLogger.warn('Missing LinkedIn configuration. Some features may be disabled.');
}

const LINKEDIN_CONFIG = {
  clientId: clientId ?? '',
  clientSecret: clientSecret ?? '',
  redirectUri,
  scopes: [
    'openid',
    'profile',
    'email',
    'w_member_social', // Post to LinkedIn feed
  ],
  apiBaseUrl: 'https://api.linkedin.com/v2',
  authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
  tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
};

const LINKEDIN_LIMITS = {
  postsPerDay: 100,
  postsPerHour: 25,
  maxContentLength: 3000,
  maxHashtags: 10,
  rateLimitWindow: 60 * 60 * 1000, // 1 hour in ms
};

// ============================================================================
// OAUTH FLOW MANAGEMENT
// ============================================================================

/**
 * Generates LinkedIn OAuth authorization URL
 */
export function generateLinkedInAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINKEDIN_CONFIG.clientId,
    redirect_uri: LINKEDIN_CONFIG.redirectUri,
    scope: LINKEDIN_CONFIG.scopes.join(' '),
    state,
  });

  return `${LINKEDIN_CONFIG.authUrl}?${params.toString()}`;
}

/**
 * Exchanges authorization code for access token
 */
export async function exchangeLinkedInCode(
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
    const response = await fetch(LINKEDIN_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: LINKEDIN_CONFIG.clientId,
        client_secret: LINKEDIN_CONFIG.clientSecret,
        redirect_uri: LINKEDIN_CONFIG.redirectUri,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`LinkedIn token exchange failed: ${response.status} - ${errorData}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
      scope: string;
    };

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      refreshToken: data.refresh_token,
      scope: data.scope,
    };
  } catch (error) {
    socialLogger.error(
      'LinkedIn OAuth error',
      error instanceof Error ? error : new Error(String(error))
    );
    throw new Error(
      `Failed to exchange LinkedIn authorization code: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Refreshes LinkedIn access token
 */
export async function refreshLinkedInToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
}> {
  try {
    const response = await fetch(LINKEDIN_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: LINKEDIN_CONFIG.clientId,
        client_secret: LINKEDIN_CONFIG.clientSecret,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`LinkedIn token refresh failed: ${response.status} - ${errorData}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
    };

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      refreshToken: data.refresh_token ?? refreshToken, // Use new or keep existing
    };
  } catch (error) {
    socialLogger.error(
      'LinkedIn token refresh error',
      error instanceof Error ? error : new Error(String(error))
    );
    throw new Error(
      `Failed to refresh LinkedIn token: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ============================================================================
// LINKEDIN API OPERATIONS
// ============================================================================

/**
 * Gets LinkedIn user profile information
 */
export async function getLinkedInProfile(accessToken: string): Promise<{
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
}> {
  try {
    const [profileResponse, emailResponse] = await Promise.all([
      fetch(
        `${LINKEDIN_CONFIG.apiBaseUrl}/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      ),
      fetch(
        `${LINKEDIN_CONFIG.apiBaseUrl}/emailAddress?q=members&projection=(elements*(handle~))`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      ),
    ]);

    if (!profileResponse.ok || !emailResponse.ok) {
      throw new Error(
        `LinkedIn API error: Profile ${profileResponse.status}, Email ${emailResponse.status}`
      );
    }

    const profileData = (await profileResponse.json()) as {
      id: string;
      firstName: { localized: { en_US: string } };
      lastName: { localized: { en_US: string } };
      profilePicture?: {
        'displayImage~'?: {
          elements?: Array<{
            identifiers?: Array<{
              identifier?: string;
            }>;
          }>;
        };
      };
    };

    const emailData = (await emailResponse.json()) as {
      elements: Array<{
        'handle~': {
          emailAddress: string;
        };
      }>;
    };

    return {
      id: profileData.id,
      firstName: profileData.firstName.localized.en_US,
      lastName: profileData.lastName.localized.en_US,
      email: emailData.elements[0]['handle~'].emailAddress,
      profilePicture:
        profileData.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier,
    };
  } catch (error) {
    socialLogger.error(
      'LinkedIn profile fetch error',
      error instanceof Error ? error : new Error(String(error))
    );
    throw new Error(
      `Failed to get LinkedIn profile: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Posts content to LinkedIn feed
 */
export async function postToLinkedIn(
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
    const profile = await getLinkedInProfile(accessToken);

    // Prepare post content
    const postText = content.hashtags
      ? `${content.text}\n\n${content.hashtags.map(tag => `#${tag.replace('#', '')}`).join(' ')}`
      : content.text;

    // Create post payload
    const postPayload = {
      author: `urn:li:person:${profile.id}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: postText,
          },
          shareMediaCategory: 'NONE',
          ...(content.linkUrl && {
            media: [
              {
                status: 'READY',
                originalUrl: content.linkUrl,
              },
            ],
          }),
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const response = await fetch(`${LINKEDIN_CONFIG.apiBaseUrl}/ugcPosts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postPayload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`LinkedIn posting failed: ${response.status} - ${errorData}`);
    }

    const responseData = (await response.json()) as {
      id: string;
    };

    return {
      postId: responseData.id,
      postUrl: `https://www.linkedin.com/feed/update/${responseData.id}`,
      publishedAt: new Date(),
    };
  } catch (error) {
    socialLogger.error(
      'LinkedIn posting error',
      error instanceof Error ? error : new Error(String(error))
    );
    throw new Error(
      `Failed to post to LinkedIn: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets post analytics from LinkedIn
 */
export async function getLinkedInPostAnalytics(
  accessToken: string,
  postId: string
): Promise<SocialEngagement> {
  try {
    const response = await fetch(
      `${LINKEDIN_CONFIG.apiBaseUrl}/socialActions/${postId}/statistics`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // Return default engagement if analytics not available
      return {
        likes: 0,
        comments: 0,
        shares: 0,
        clicks: 0,
        saves: 0,
      };
    }

    const data = (await response.json()) as {
      numLikes?: number;
      numComments?: number;
      numShares?: number;
      numClicks?: number;
      numSaves?: number;
    };

    return {
      likes: data.numLikes ?? 0,
      comments: data.numComments ?? 0,
      shares: data.numShares ?? 0,
      clicks: data.numClicks ?? 0,
      saves: data.numSaves ?? 0,
    };
  } catch (error) {
    socialLogger.error(
      'LinkedIn analytics error:',
      error instanceof Error ? error : new Error(String(error))
    );
    // Return default engagement on error
    return {
      likes: 0,
      comments: 0,
      shares: 0,
      clicks: 0,
      saves: 0,
    };
  }
}

// ============================================================================
// TOKEN MANAGEMENT & VALIDATION
// ============================================================================

/**
 * Validates LinkedIn token health
 */
export async function validateLinkedInToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${LINKEDIN_CONFIG.apiBaseUrl}/people/~:(id)`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    socialLogger.error(
      'LinkedIn token validation error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return false;
  }
}

/**
 * Checks if token needs refresh (expires within 7 days)
 */
export function shouldRefreshToken(expiresAt: Date): boolean {
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return expiresAt < sevenDaysFromNow;
}

/**
 * Encrypts token for secure storage
 */
export function encryptToken(token: string): string {
  // In production, use proper encryption (AES-256)
  // For demo, use base64 encoding
  return Buffer.from(token).toString('base64');
}

/**
 * Decrypts token from storage
 */
export function decryptToken(encryptedToken: string): string {
  // In production, use proper decryption
  // For demo, decode base64
  return Buffer.from(encryptedToken, 'base64').toString('utf-8');
}

// ============================================================================
// RATE LIMITING & ERROR HANDLING
// ============================================================================

/**
 * Rate limiter for LinkedIn API calls
 */
export class LinkedInRateLimiter {
  private static instance: LinkedInRateLimiter;
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  static getInstance(): LinkedInRateLimiter {
    if (!this.instance) {
      this.instance = new LinkedInRateLimiter();
    }
    return this.instance;
  }

  /**
   * Checks if request is within rate limits
   */
  canMakeRequest(userId: string): boolean {
    const now = Date.now();
    const userLimits = this.requestCounts.get(userId);

    if (!userLimits || now > userLimits.resetTime) {
      // Reset or initialize limits
      this.requestCounts.set(userId, {
        count: 0,
        resetTime: now + LINKEDIN_LIMITS.rateLimitWindow,
      });
      return true;
    }

    return userLimits.count < LINKEDIN_LIMITS.postsPerHour;
  }

  /**
   * Records a successful request
   */
  recordRequest(userId: string): void {
    const userLimits = this.requestCounts.get(userId);
    if (userLimits) {
      userLimits.count += 1;
    }
  }

  /**
   * Gets time until rate limit reset
   */
  getResetTime(userId: string): number {
    const userLimits = this.requestCounts.get(userId);
    if (!userLimits) {
      return 0;
    }

    const now = Date.now();
    return Math.max(0, userLimits.resetTime - now);
  }
}

/**
 * Handles LinkedIn API errors with retry logic
 */
export function handleLinkedInError(
  error: unknown,
  attempt: number
): {
  shouldRetry: boolean;
  retryAfter: number; // in milliseconds
  errorType: 'rate_limit' | 'auth_error' | 'content_rejected' | 'network_error' | 'unknown';
} {
  const errorMessage = (error as Error)?.message ?? '';
  const statusCode = (error as { response?: { status?: number } })?.response?.status;

  // Rate limiting
  if (statusCode === 429) {
    return {
      shouldRetry: attempt < 3,
      retryAfter: Math.pow(2, attempt) * 1000 * 60, // Exponential backoff in minutes
      errorType: 'rate_limit',
    };
  }

  // Authentication errors
  if (statusCode === 401 || statusCode === 403) {
    return {
      shouldRetry: false,
      retryAfter: 0,
      errorType: 'auth_error',
    };
  }

  // Content policy violations
  if (statusCode === 400 && errorMessage.includes('content')) {
    return {
      shouldRetry: false,
      retryAfter: 0,
      errorType: 'content_rejected',
    };
  }

  // Network errors (temporary)
  if ((statusCode && statusCode >= 500) || !statusCode) {
    return {
      shouldRetry: attempt < 3,
      retryAfter: Math.pow(2, attempt) * 1000, // Exponential backoff
      errorType: 'network_error',
    };
  }

  return {
    shouldRetry: false,
    retryAfter: 0,
    errorType: 'unknown',
  };
}

// ============================================================================
// CONTENT OPTIMIZATION
// ============================================================================

/**
 * Optimizes content for LinkedIn platform
 */
export function optimizeContentForLinkedIn(content: {
  text: string;
  hashtags?: string[];
  platform: 'linkedin';
}): {
  optimizedText: string;
  hashtags: string[];
  characterCount: number;
  warnings: string[];
} {
  const warnings: string[] = [];
  let optimizedText = content.text;
  let hashtags = content.hashtags ?? [];

  // Check character limit
  if (optimizedText.length > LINKEDIN_LIMITS.maxContentLength) {
    optimizedText = optimizedText.substring(0, LINKEDIN_LIMITS.maxContentLength - 3) + '...';
    warnings.push(`Content truncated to ${LINKEDIN_LIMITS.maxContentLength} characters`);
  }

  // Limit hashtags
  if (hashtags.length > LINKEDIN_LIMITS.maxHashtags) {
    hashtags = hashtags.slice(0, LINKEDIN_LIMITS.maxHashtags);
    warnings.push(`Hashtags limited to ${LINKEDIN_LIMITS.maxHashtags}`);
  }

  // Clean hashtags
  hashtags = hashtags.map(tag => tag.replace(/[^a-zA-Z0-9]/g, ''));

  // Add professional LinkedIn formatting
  if (!optimizedText.includes('\n\n')) {
    // Add line breaks for better readability
    const sentences = optimizedText.split('. ');
    if (sentences.length > 2) {
      optimizedText = sentences.slice(0, 2).join('. ') + '.\n\n' + sentences.slice(2).join('. ');
    }
  }

  return {
    optimizedText,
    hashtags,
    characterCount: optimizedText.length,
    warnings,
  };
}

/**
 * Validates LinkedIn content for compliance
 */
export function validateLinkedInContent(content: string): {
  isValid: boolean;
  issues: string[];
  riskScore: number; // 0-100
} {
  const issues: string[] = [];
  let riskScore = 0;

  // Check for investment advice (high risk)
  const investmentAdviceKeywords = ['buy', 'sell', 'invest in', 'guaranteed returns', 'stock tip'];
  const hasInvestmentAdvice = investmentAdviceKeywords.some(keyword =>
    content.toLowerCase().includes(keyword.toLowerCase())
  );

  if (hasInvestmentAdvice) {
    issues.push('Content may contain investment advice - requires compliance review');
    riskScore += 40;
  }

  // Check for specific financial products (medium risk)
  const productKeywords = ['401k', 'ira', 'mutual fund', 'etf', 'bond', 'stock'];
  const mentionsProducts = productKeywords.some(keyword =>
    content.toLowerCase().includes(keyword.toLowerCase())
  );

  if (mentionsProducts) {
    riskScore += 20;
  }

  // Check for client-specific information (high risk)
  const clientInfoPattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/; // Name patterns
  if (clientInfoPattern.test(content)) {
    issues.push('Content may contain client names - requires privacy review');
    riskScore += 30;
  }

  // Check for required disclaimers
  const hasDisclaimer =
    content.toLowerCase().includes('investment') &&
    (content.toLowerCase().includes('advice') || content.toLowerCase().includes('recommendation'));

  if (hasDisclaimer && !content.toLowerCase().includes('not investment advice')) {
    issues.push('Investment-related content requires disclaimer');
    riskScore += 25;
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

/**
 * Mock LinkedIn token for development
 */
export const MOCK_LINKEDIN_TOKEN: Partial<SocialMediaToken> = {
  id: 'mock-linkedin-token',
  platform: SocialPlatform.LINKEDIN,
  tokenType: 'access',
  encryptedToken: encryptToken('mock-access-token-linkedin'),
  tokenScope: ['openid', 'profile', 'email', 'w_member_social'],
  expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
  platformDetails: {
    userId: 'mock-linkedin-user-id',
    username: 'john.smith.advisor',
    permissions: ['w_member_social'],
  },
  healthStatus: 'healthy',
  lastValidated: new Date(),
  refreshCount: 0,
};

/**
 * Mock LinkedIn post for development
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export async function createMockLinkedInPost(
  _content: string,
  _hashtags: string[] = []
): Promise<{
  postId: string;
  postUrl: string;
  publishedAt: Date;
  engagement: SocialEngagement;
}> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const postId = `mock-linkedin-post-${Date.now()}`;

  return {
    postId,
    postUrl: `https://www.linkedin.com/feed/update/urn:li:activity:${postId}`,
    publishedAt: new Date(),
    engagement: {
      likes: Math.floor(Math.random() * 50) + 10,
      comments: Math.floor(Math.random() * 10) + 2,
      shares: Math.floor(Math.random() * 20) + 5,
      clicks: Math.floor(Math.random() * 100) + 20,
      saves: Math.floor(Math.random() * 15) + 3,
    },
  };
}
/* eslint-enable @typescript-eslint/no-unused-vars */

/**
 * Mock LinkedIn profile for development
 */
export const MOCK_LINKEDIN_PROFILE = {
  id: 'mock-linkedin-user',
  firstName: 'John',
  lastName: 'Smith',
  email: 'john.smith@example.com',
  profilePicture: 'https://via.placeholder.com/150x150?text=JS',
};
