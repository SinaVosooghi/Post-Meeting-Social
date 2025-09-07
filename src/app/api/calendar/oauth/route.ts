/**
 * Google Calendar OAuth API Endpoint
 * GET /api/calendar/oauth - Google Calendar OAuth flow
 *
 * Handles Google Calendar OAuth authentication and token management
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { storeSocialToken, hasValidToken } from '@/lib/social-tokens';
import { SocialPlatform } from '@/types/master-interfaces';
import { calendarLogger } from '@/lib/logger';

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

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

    switch (action) {
      case 'status': {
        // Check if user has valid Google Calendar access
        const hasAccess = await hasValidToken(session.user.id, SocialPlatform.GOOGLE_CALENDAR);

        return NextResponse.json({
          success: true,
          data: {
            connected: hasAccess,
            platform: 'GOOGLE_CALENDAR',
            userId: session.user.id,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        });
      }

      case 'connect': {
        // Generate Google OAuth URL for calendar access
        const authUrl = new URL('https://accounts.google.com/oauth/v2/auth');
        authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID || '');
        authUrl.searchParams.set(
          'redirect_uri',
          `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
        );
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set(
          'scope',
          [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events',
          ].join(' ')
        );
        authUrl.searchParams.set('access_type', 'offline');
        authUrl.searchParams.set('prompt', 'consent');
        authUrl.searchParams.set('state', session.user.id);

        return NextResponse.json({
          success: true,
          data: {
            authUrl: authUrl.toString(),
            platform: 'GOOGLE_CALENDAR',
            userId: session.user.id,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        });
      }

      case 'disconnect': {
        // Disconnect Google Calendar access
        try {
          await storeSocialToken(session.user.id, SocialPlatform.GOOGLE_CALENDAR, {
            accessToken: '',
            expiresIn: 0,
            scope: [],
          });

          return NextResponse.json({
            success: true,
            data: {
              disconnected: true,
              platform: 'GOOGLE_CALENDAR',
              userId: session.user.id,
            },
            metadata: {
              timestamp: new Date().toISOString(),
              requestId: crypto.randomUUID(),
            },
          });
        } catch (error) {
          calendarLogger.error('Failed to disconnect Google Calendar:', error as Error);

          return NextResponse.json(
            {
              success: false,
              error: {
                message: 'Failed to disconnect Google Calendar',
                code: 'DISCONNECT_FAILED',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 500 }
          );
        }
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
    calendarLogger.error('Google Calendar OAuth error:', error as Error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Google Calendar OAuth error',
          code: 'GOOGLE_CALENDAR_OAUTH_ERROR',
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
      action: 'store_token';
      accessToken: string;
      refreshToken?: string;
      expiresIn: number;
      scope: string[];
    };

    if (body.action === 'store_token') {
      // Store Google Calendar token
      await storeSocialToken(session.user.id, SocialPlatform.GOOGLE_CALENDAR, {
        accessToken: body.accessToken,
        refreshToken: body.refreshToken,
        expiresIn: body.expiresIn,
        scope: body.scope,
        platformDetails: {
          provider: 'google',
          service: 'calendar',
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          stored: true,
          platform: 'GOOGLE_CALENDAR',
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
          message: `Unknown action: ${body.action}`,
          code: 'INVALID_ACTION',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 400 }
    );
  } catch (error) {
    calendarLogger.error('Google Calendar OAuth POST error:', error as Error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Google Calendar OAuth POST error',
          code: 'GOOGLE_CALENDAR_OAUTH_POST_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
