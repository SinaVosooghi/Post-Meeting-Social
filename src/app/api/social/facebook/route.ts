/**
 * Facebook Social Media API Endpoint
 * POST /api/social/facebook - Facebook OAuth and publishing
 *
 * Handles Facebook authentication, token management, and content publishing
 * Aligned with SocialMediaToken and SocialMediaPost interfaces
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import type { Session } from 'next-auth';
import {
  generateFacebookAuthUrl,
  exchangeFacebookCode,
  getFacebookProfile,
  optimizeContentForFacebook,
  validateFacebookContent,
  createMockFacebookPost,
  MOCK_FACEBOOK_PROFILE,
  FacebookRateLimiter,
} from '@/lib/facebook';
import { storeSocialToken, getSocialToken, hasValidToken } from '@/lib/social-tokens';
import { postToFacebook } from '@/lib/facebook';
import { SocialPlatform } from '@/types/master-interfaces';

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // Handle OAuth callback
    if (action === 'callback' && code && state) {
      return handleOAuthCallback(code, state);
    }

    // Generate OAuth URL
    if (action === 'auth') {
      const authState = crypto.randomUUID();
      const authUrl = generateFacebookAuthUrl(authState);

      return NextResponse.json({
        success: true,
        data: {
          authUrl,
          state: authState,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      });
    }

    // Get profile information
    if (action === 'profile') {
      return await handleGetProfile(request);
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Invalid action parameter',
          code: 'INVALID_ACTION',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Facebook API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Facebook API error',
          code: 'FACEBOOK_API_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = (await auth()) as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      action: string;
      content?: string;
      hashtags?: string[];
      linkUrl?: string;
      imageUrl?: string;
    };

    const { action, content, hashtags, linkUrl, imageUrl } = body;

    switch (action) {
      case 'post':
        return await handlePostContent(session.user.email, {
          content: content || '',
          hashtags: hashtags || [],
          linkUrl: linkUrl || '',
          imageUrl: imageUrl || '',
        });

      case 'optimize':
        return await handleOptimizeContent(content || '');

      case 'validate':
        return await handleValidateContent(content || '');

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Invalid action parameter',
              code: 'INVALID_ACTION',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Facebook API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Facebook API error',
          code: 'FACEBOOK_API_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HANDLER FUNCTIONS
// ============================================================================

/**
 * Handles OAuth callback from Facebook
 */
async function handleOAuthCallback(code: string, state: string) {
  try {
    // For demo purposes, use mock data
    const useMockData = !process.env.FACEBOOK_CLIENT_ID || process.env.NODE_ENV === 'development';

    if (useMockData) {
      // Redirect to settings page with success status
      const redirectUrl = new URL('/settings', process.env.NEXTAUTH_URL || 'http://localhost:3000');
      redirectUrl.searchParams.set('oauth_success', 'true');
      redirectUrl.searchParams.set('platform', 'facebook');
      
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Real OAuth flow
    const tokenData = await exchangeFacebookCode(code, state);
    const profile = await getFacebookProfile(tokenData.accessToken);

    // Store the token in the database
    const userId = 'oauth-callback-user'; // TODO: Get actual user ID from session or state

    await storeSocialToken(userId, SocialPlatform.FACEBOOK, {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresIn: tokenData.expiresIn,
      scope: tokenData.scope.split(' '),
      platformDetails: {
        profileId: profile.id,
        profileName: profile.name,
        profileEmail: profile.email,
      },
    });

    // Redirect to settings page with success status
    const redirectUrl = new URL('/settings', process.env.NEXTAUTH_URL || 'http://localhost:3000');
    redirectUrl.searchParams.set('oauth_success', 'true');
    redirectUrl.searchParams.set('platform', 'facebook');
    
    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Facebook OAuth callback error:', error);

    // Redirect to settings page with error status
    const redirectUrl = new URL('/settings', process.env.NEXTAUTH_URL || 'http://localhost:3000');
    redirectUrl.searchParams.set('oauth_error', 'true');
    redirectUrl.searchParams.set('platform', 'facebook');
    redirectUrl.searchParams.set('error', error instanceof Error ? error.message : 'OAuth callback failed');
    
    return NextResponse.redirect(redirectUrl.toString());
  }
}

/**
 * Handles getting Facebook profile information
 */
async function handleGetProfile(request: NextRequest) {
  try {
    const session = (await auth()) as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get stored token
    const token = await getSocialToken(session.user.email, SocialPlatform.FACEBOOK);
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Facebook not connected. Please connect your Facebook account first.',
            code: 'FACEBOOK_NOT_CONNECTED',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // For demo purposes, use mock data
    const useMockData = !process.env.FACEBOOK_CLIENT_ID || process.env.NODE_ENV === 'development';

    if (useMockData) {
      return NextResponse.json({
        success: true,
        data: {
          profile: MOCK_FACEBOOK_PROFILE,
          mock: true,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          usingMockData: true,
        },
      });
    }

    // Real API call
    const profile = await getFacebookProfile(token.accessToken);

    return NextResponse.json({
      success: true,
      data: {
        profile,
        mock: false,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        usingMockData: false,
      },
    });
  } catch (error) {
    console.error('Facebook profile fetch error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch Facebook profile',
          code: 'FACEBOOK_PROFILE_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Handles posting content to Facebook
 */
async function handlePostContent(
  userId: string,
  content: {
    content: string;
    hashtags: string[];
    linkUrl: string;
    imageUrl: string;
  }
) {
  try {
    // Get stored token
    const token = await getSocialToken(userId, SocialPlatform.FACEBOOK);
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Facebook not connected. Please connect your Facebook account first.',
            code: 'FACEBOOK_NOT_CONNECTED',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Check rate limits
    const rateLimiter = new FacebookRateLimiter();
    if (!rateLimiter.canPost()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Rate limit exceeded. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 429 }
      );
    }

    // For demo purposes, use mock data
    const useMockData = !process.env.FACEBOOK_CLIENT_ID || process.env.NODE_ENV === 'development';

    if (useMockData) {
      const mockPost = createMockFacebookPost(content);
      rateLimiter.recordPost();

      return NextResponse.json({
        success: true,
        data: {
          post: mockPost,
          mock: true,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          usingMockData: true,
        },
      });
    }

    // Real API call
    const postResult = await postToFacebook(token.accessToken, content);
    rateLimiter.recordPost();

    return NextResponse.json({
      success: true,
      data: {
        post: postResult,
        mock: false,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        usingMockData: false,
      },
    });
  } catch (error) {
    console.error('Facebook post error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to post to Facebook',
          code: 'FACEBOOK_POST_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Handles content optimization for Facebook
 */
async function handleOptimizeContent(content: string) {
  try {
    const optimizedContent = await optimizeContentForFacebook(content);

    return NextResponse.json({
      success: true,
      data: {
        originalContent: content,
        optimizedContent,
        improvements: [
          'Added engaging tone',
          'Optimized for Facebook algorithm',
          'Enhanced shareability',
        ],
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    console.error('Facebook content optimization error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to optimize content',
          code: 'FACEBOOK_OPTIMIZATION_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Handles content validation for Facebook
 */
async function handleValidateContent(content: string) {
  try {
    const validation = await validateFacebookContent(content);

    return NextResponse.json({
      success: true,
      data: {
        content,
        validation,
        isValid: validation.isValid,
        suggestions: validation.suggestions,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    console.error('Facebook content validation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to validate content',
          code: 'FACEBOOK_VALIDATION_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}