/**
 * LinkedIn Social Media API Endpoint
 * POST /api/social/linkedin - LinkedIn OAuth and publishing
 * 
 * Handles LinkedIn authentication, token management, and content publishing
 * Aligned with SocialMediaToken and SocialMediaPost interfaces
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
  generateLinkedInAuthUrl,
  exchangeLinkedInCode,
  getLinkedInProfile,
  optimizeContentForLinkedIn,
  validateLinkedInContent,
  createMockLinkedInPost,
  MOCK_LINKEDIN_PROFILE,
  LinkedInRateLimiter
} from '@/lib/linkedin';

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
      const authUrl = generateLinkedInAuthUrl(authState);
      
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
    console.error('LinkedIn API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'LinkedIn API error',
          code: 'LINKEDIN_API_ERROR',
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

    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'publish':
        return await handlePublishPost(params, session.user.id);
      
      case 'validate':
        return await handleValidateContent(params);
      
      case 'optimize':
        return await handleOptimizeContent(params);
        
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
    console.error('LinkedIn POST API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to process LinkedIn request',
          code: 'LINKEDIN_POST_ERROR',
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
 * Handles OAuth callback from LinkedIn
 */
async function handleOAuthCallback(code: string, state: string) {
  try {
    // For demo purposes, use mock data
    const useMockData = !process.env.LINKEDIN_CLIENT_ID || process.env.NODE_ENV === 'development';
    
    if (useMockData) {
      return NextResponse.json({
        success: true,
        data: {
          profile: MOCK_LINKEDIN_PROFILE,
          token: {
            accessToken: 'mock-linkedin-token',
            expiresIn: 5184000, // 60 days
            scope: 'openid profile email w_member_social',
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
    const tokenData = await exchangeLinkedInCode(code, state);
    const profile = await getLinkedInProfile(tokenData.accessToken);

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
    console.error('LinkedIn OAuth callback error:', error);
    
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

/**
 * Handles getting LinkedIn profile
 */
async function handleGetProfile(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const useMockData = searchParams.get('mock') === 'true' || !process.env.LINKEDIN_CLIENT_ID;

  if (useMockData) {
    return NextResponse.json({
      success: true,
      data: MOCK_LINKEDIN_PROFILE,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        usingMockData: true,
      },
    });
  }

  // Real profile fetching would require stored access token
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'LinkedIn profile access not implemented yet',
        code: 'FEATURE_NOT_IMPLEMENTED',
        timestamp: new Date().toISOString(),
      },
    },
    { status: 501 }
  );
}

/**
 * Handles publishing content to LinkedIn
 */
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
  const rateLimiter = LinkedInRateLimiter.getInstance();
  if (!rateLimiter.canMakeRequest(userId)) {
    const resetTime = rateLimiter.getResetTime(userId);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Rate limit exceeded for LinkedIn posting',
          code: 'RATE_LIMIT_EXCEEDED',
          timestamp: new Date().toISOString(),
          retryAfter: Math.ceil(resetTime / 1000), // in seconds
        },
      },
      { status: 429 }
    );
  }

  // Content validation
  const validation = validateLinkedInContent(content);
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
  const optimized = optimizeContentForLinkedIn({
    text: content,
    hashtags,
    platform: 'linkedin',
  });

  // For demo purposes, use mock publishing
  const useMockData = !process.env.LINKEDIN_CLIENT_ID || process.env.NODE_ENV === 'development';
  
  if (useMockData) {
    const mockResult = await createMockLinkedInPost(optimized.optimizedText, optimized.hashtags);
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

  // Real LinkedIn posting would go here
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'LinkedIn publishing not fully configured - using mock data',
        code: 'FEATURE_DEMO_MODE',
        timestamp: new Date().toISOString(),
      },
    },
    { status: 501 }
  );
}

/**
 * Handles content validation
 */
async function handleValidateContent(params: { content: string }) {
  const validation = validateLinkedInContent(params.content);
  
  return NextResponse.json({
    success: true,
    data: validation,
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  });
}

/**
 * Handles content optimization
 */
async function handleOptimizeContent(params: { 
  content: string; 
  hashtags?: string[];
}) {
  const optimized = optimizeContentForLinkedIn({
    text: params.content,
    hashtags: params.hashtags || [],
    platform: 'linkedin',
  });
  
  return NextResponse.json({
    success: true,
    data: optimized,
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  });
}
