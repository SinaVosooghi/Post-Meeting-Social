/**
 * Facebook Social Media API Endpoint
 * POST /api/social/facebook - Facebook OAuth and publishing
 *
 * Handles Facebook authentication, token management, and content publishing
 * Aligned with SocialMediaToken and SocialMediaPost interfaces
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
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
import { storeSocialToken, getSocialToken } from '@/lib/social-tokens';
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

    // Get connection status
    if (action === 'status') {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Authentication required',
              code: 'UNAUTHORIZED',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 401 }
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const hasAccess = (await hasValidToken(session.user.id, SocialPlatform.FACEBOOK)) as boolean;

      return NextResponse.json({
        success: true,
        data: {
          connected: hasAccess,
          platform: 'FACEBOOK',
          userId: session.user.id,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      });
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
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Authentication required',
            code: 'UNAUTHORIZED',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      action: 'publish' | 'validate' | 'optimize';
      content: string;
      hashtags?: string[];
      linkUrl?: string;
      meetingId?: string;
    };
    const { action, ...params } = body;

    switch (action) {
      case 'publish': {
        return await handlePublishPost(params, session.user.id);
      }

      case 'validate': {
        return await handleValidateContent(params);
      }

      case 'optimize': {
        return await handleOptimizeContent(params);
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              message: `Unknown action: ${action}`,
              code: 'INVALID_ACTION',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Facebook POST API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to process Facebook request',
          code: 'FACEBOOK_POST_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// OAUTH CALLBACK HANDLER
// ============================================================================

async function handleOAuthCallback(code: string, state: string) {
  try {
    // For demo purposes, use mock data
    const useMockData = !process.env.FACEBOOK_CLIENT_ID || process.env.NODE_ENV === 'development';

    if (useMockData) {
      return NextResponse.json({
        success: true,
        data: {
          profile: MOCK_FACEBOOK_PROFILE,
          token: {
            accessToken: 'mock-facebook-token',
            expiresIn: 5184000, // 60 days
            scope: 'public_profile email pages_manage_posts pages_read_engagement',
          },
          mock: true,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          usingMockData: true,
        },
      });
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

    return NextResponse.json({
      success: true,
      data: {
        profile,
        token: tokenData,
        mock: false,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        usingMockData: false,
      },
    });
  } catch (error) {
    console.error('Facebook OAuth callback error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'OAuth callback failed',
          code: 'OAUTH_CALLBACK_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// CONTENT HANDLERS
// ============================================================================

async function handlePublishPost(
  params: {
    content: string;
    hashtags?: string[];
    linkUrl?: string;
    meetingId?: string;
  },
  userId: string
) {
  const { content, hashtags = [] } = params;

  // Rate limiting check
  const rateLimiter = FacebookRateLimiter.getInstance();
  if (!rateLimiter.canMakeRequest(userId)) {
    const resetTime = rateLimiter.getResetTime(userId);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Rate limit exceeded for Facebook posting',
          code: 'RATE_LIMIT_EXCEEDED',
          timestamp: new Date().toISOString(),
          retryAfter: Math.ceil(resetTime / 1000), // in seconds
        },
      },
      { status: 429 }
    );
  }

  // Content validation
  const validation = validateFacebookContent(content);
  if (!validation.isValid) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Content validation failed',
          code: 'CONTENT_VALIDATION_FAILED',
          details: validation.issues,
          riskScore: validation.riskScore,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 400 }
    );
  }

  // Content optimization
  const optimized = optimizeContentForFacebook({
    text: content,
    hashtags,
    platform: 'facebook',
  });

  // Check if we have Facebook credentials for real publishing
  const useMockData = !process.env.FACEBOOK_CLIENT_ID || !process.env.FACEBOOK_CLIENT_SECRET;

  if (useMockData) {
    const mockResult = await createMockFacebookPost(optimized.optimizedText, optimized.hashtags);
    rateLimiter.recordRequest(userId);

    return NextResponse.json({
      success: true,
      data: {
        postId: mockResult.postId,
        postUrl: mockResult.postUrl,
        publishedAt: mockResult.publishedAt,
        engagement: mockResult.engagement,
        optimizations: {
          characterCount: optimized.characterCount,
          warnings: optimized.warnings,
        },
        validation: {
          riskScore: validation.riskScore,
          issues: validation.issues,
        },
        mock: true,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        usingMockData: true,
      },
    });
  }

  // Real Facebook posting
  try {
    // Get stored Facebook access token for user
    const accessToken = await getSocialToken(userId, SocialPlatform.FACEBOOK);

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Facebook account not connected. Please authenticate first.',
            code: 'FACEBOOK_NOT_CONNECTED',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const postResult = (await postToFacebook(accessToken, {
      text: optimized.optimizedText,
      hashtags: optimized.hashtags,
      linkUrl: params.linkUrl,
    })) as {
      success: boolean;
      postId?: string;
      postUrl?: string;
      publishedAt?: string;
      error?: string;
    };

    rateLimiter.recordRequest(userId);

    return NextResponse.json({
      success: true,
      data: {
        postId: postResult.postId,
        postUrl: postResult.postUrl,
        publishedAt: postResult.publishedAt,
        optimizations: {
          characterCount: optimized.characterCount,
          warnings: optimized.warnings,
        },
        validation: {
          riskScore: validation.riskScore,
          issues: validation.issues,
        },
        mock: false,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        usingMockData: false,
      },
    });
  } catch (error) {
    console.error('Facebook posting error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to publish to Facebook',
          code: 'FACEBOOK_PUBLISH_FAILED',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Handles content validation
 */
async function handleValidateContent(params: { content: string }) {
  const validation = validateFacebookContent(params.content);

  return NextResponse.json({
    success: true,
    data: {
      isValid: validation.isValid,
      issues: validation.issues,
      riskScore: validation.riskScore,
      characterCount: params.content.length,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  });
}

/**
 * Handles content optimization
 */
async function handleOptimizeContent(params: { content: string; hashtags?: string[] }) {
  const optimized = optimizeContentForFacebook({
    text: params.content,
    hashtags: params.hashtags || [],
    platform: 'facebook',
  });

  return NextResponse.json({
    success: true,
    data: {
      optimizedText: optimized.optimizedText,
      hashtags: optimized.hashtags,
      characterCount: optimized.characterCount,
      warnings: optimized.warnings,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  });
}
