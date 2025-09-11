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
  LinkedInTokenResponse,
  LinkedInProfileResponse,
  LinkedInPostResponse,
  LinkedInPostStatsResponse,
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
  ? `${process.env.NEXTAUTH_URL}/api/linkedin/callback`
  : 'http://localhost:3000/api/linkedin/callback';

if (!clientId || !clientSecret) {
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
    'w_member_social', // Post to LinkedIn feed - this is the only authorized scope for posting
  ],
  apiBaseUrl: 'https://api.linkedin.com/v2',
  authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
  tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
};

const LINKEDIN_LIMITS = {
  postsPerDay: 100,
  postsPerHour: 25,
  maxContentLength: 3000,
  maxHashtags: 5,
  maxImages: 9,
};

// ============================================================================
// RATE LIMITING
// ============================================================================

class LinkedInRateLimiter {
  private posts: number[] = [];
  private readonly maxPostsPerDay = LINKEDIN_LIMITS.postsPerDay;
  private readonly maxPostsPerHour = LINKEDIN_LIMITS.postsPerHour;

  canPost(): boolean {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    // Remove old posts
    this.posts = this.posts.filter(timestamp => timestamp > oneDayAgo);

    // Check daily limit
    if (this.posts.length >= this.maxPostsPerDay) {
      return false;
    }

    // Check hourly limit
    const recentPosts = this.posts.filter(timestamp => timestamp > oneHourAgo);
    if (recentPosts.length >= this.maxPostsPerHour) {
      return false;
    }

    return true;
  }

  recordPost(): void {
    this.posts.push(Date.now());
  }

  getRemainingPosts(): { daily: number; hourly: number } {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    const dailyPosts = this.posts.filter(timestamp => timestamp > oneDayAgo);
    const hourlyPosts = this.posts.filter(timestamp => timestamp > oneHourAgo);

    return {
      daily: Math.max(0, this.maxPostsPerDay - dailyPosts.length),
      hourly: Math.max(0, this.maxPostsPerHour - hourlyPosts.length),
    };
  }
}

// ============================================================================
// OAUTH FUNCTIONS
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
export async function exchangeLinkedInCode(code: string, state: string): Promise<LinkedInTokenResponse> {
  try {
    const response = await fetch(LINKEDIN_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: LINKEDIN_CONFIG.redirectUri,
        client_id: LINKEDIN_CONFIG.clientId,
        client_secret: LINKEDIN_CONFIG.clientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LinkedIn token exchange failed: ${error}`);
    }

    const tokenData = (await response.json()) as LinkedInTokenResponse;
    socialLogger.info('LinkedIn token exchange successful');

    return tokenData;
  } catch (error) {
    socialLogger.error('LinkedIn token exchange failed', error as Error | undefined);
    throw error;
  }
}

// ============================================================================
// PROFILE FUNCTIONS
// ============================================================================

/**
 * Gets LinkedIn user profile information
 */
export async function getLinkedInProfile(accessToken: string): Promise<LinkedInProfileResponse> {
  try {
    const response = await fetch(`${LINKEDIN_CONFIG.apiBaseUrl}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LinkedIn profile fetch failed: ${error}`);
    }

    const profile = (await response.json()) as LinkedInProfileResponse;
    socialLogger.info('LinkedIn profile fetched successfully');

    return profile;
  } catch (error) {
    socialLogger.error('LinkedIn profile fetch failed', error as Error | undefined);
    throw error;
  }
}

// ============================================================================
// POSTING FUNCTIONS
// ============================================================================

/**
 * Posts content to LinkedIn
 */
export async function postToLinkedIn(
  accessToken: string,
  content: {
    content: string;
    hashtags: string[];
    linkUrl?: string;
    imageUrl?: string;
  }
): Promise<LinkedInPostResponse> {
  try {
    // Validate content
    const validation = await validateLinkedInContent(content.content);
    if (!validation.isValid) {
      throw new Error(`Content validation failed: ${validation.suggestions.join(', ')}`);
    }

    // Prepare post data
    const postData = {
      author: `urn:li:person:${accessToken}`, // This will be replaced with actual user ID
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content.content,
          },
          shareMediaCategory: content.imageUrl ? 'IMAGE' : 'NONE',
          ...(content.imageUrl && {
            media: [
              {
                status: 'READY',
                description: {
                  text: content.content,
                },
                media: content.imageUrl,
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
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LinkedIn post failed: ${error}`);
    }

    const postResult = (await response.json()) as LinkedInPostResponse;
    socialLogger.info('LinkedIn post published successfully');

    return postResult;
  } catch (error) {
    socialLogger.error('LinkedIn post failed', error as Error | undefined);
    throw error;
  }
}

// ============================================================================
// CONTENT OPTIMIZATION
// ============================================================================

/**
 * Optimizes content for LinkedIn
 */
export async function optimizeContentForLinkedIn(content: string): Promise<string> {
  try {
    // Basic LinkedIn optimization
    let optimized = content.trim();

    // Ensure proper length
    if (optimized.length > LINKEDIN_LIMITS.maxContentLength) {
      optimized = optimized.substring(0, LINKEDIN_LIMITS.maxContentLength - 3) + '...';
    }

    // Add professional tone indicators
    if (!optimized.includes('I') && !optimized.includes('we') && !optimized.includes('our')) {
      optimized = `I'm excited to share: ${optimized}`;
    }

    // Ensure it ends with a call to action or question
    if (!optimized.endsWith('?') && !optimized.endsWith('!') && !optimized.endsWith('.')) {
      optimized += '. What are your thoughts?';
    }

    socialLogger.info('Content optimized for LinkedIn');
    return optimized;
  } catch (error) {
    socialLogger.error('Content optimization failed', error as Error | undefined);
    return content; // Return original content if optimization fails
  }
}

/**
 * Validates content for LinkedIn
 */
export async function validateLinkedInContent(content: string): Promise<{
  isValid: boolean;
  suggestions: string[];
}> {
  const suggestions: string[] = [];

  // Check length
  if (content.length > LINKEDIN_LIMITS.maxContentLength) {
    suggestions.push(`Content too long (${content.length}/${LINKEDIN_LIMITS.maxContentLength} characters)`);
  }

  // Check for empty content
  if (!content.trim()) {
    suggestions.push('Content cannot be empty');
  }

  // Check for excessive hashtags
  const hashtagCount = (content.match(/#\w+/g) || []).length;
  if (hashtagCount > LINKEDIN_LIMITS.maxHashtags) {
    suggestions.push(`Too many hashtags (${hashtagCount}/${LINKEDIN_LIMITS.maxHashtags})`);
  }

  // Check for professional tone
  if (content.includes('!!!') || content.includes('???')) {
    suggestions.push('Consider using more professional punctuation');
  }

  const isValid = suggestions.length === 0;

  return {
    isValid,
    suggestions,
  };
}

// ============================================================================
// MOCK DATA FOR DEVELOPMENT
// ============================================================================

export const MOCK_LINKEDIN_PROFILE: LinkedInProfileResponse = {
  id: 'mock-linkedin-user-id',
  firstName: {
    localized: {
      en_US: 'John',
    },
    preferredLocale: {
      country: 'US',
      language: 'en',
    },
  },
  lastName: {
    localized: {
      en_US: 'Doe',
    },
    preferredLocale: {
      country: 'US',
      language: 'en',
    },
  },
  email: 'john.doe@example.com',
  profilePicture: {
    'displayImage~': {
      elements: [
        {
          identifiers: [
            {
              identifier: 'https://via.placeholder.com/400x400/0077b5/ffffff?text=JD',
            },
          ],
        },
      ],
    },
  },
};

export function createMockLinkedInPost(content: {
  content: string;
  hashtags: string[];
  linkUrl?: string;
  imageUrl?: string;
}): LinkedInPostResponse {
  return {
    id: `mock-post-${Date.now()}`,
    author: 'urn:li:person:mock-user-id',
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: content.content,
        },
        shareMediaCategory: content.imageUrl ? 'IMAGE' : 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
    created: {
      time: Date.now(),
    },
    lastModified: {
      time: Date.now(),
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { LinkedInRateLimiter };
export { LINKEDIN_CONFIG, LINKEDIN_LIMITS };