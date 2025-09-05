/**
 * Google Calendar Events API Endpoint
 * POST /api/calendar/events - Fetch calendar events
 * 
 * Handles fetching calendar events from Google Calendar API
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
  getUpcomingEvents, 
  getMockCalendarEvents,
  validateGoogleCalendarAccess 
} from '@/lib/google-calendar';
// CalendarEvent type imported but not used in this demo version

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const maxResults = parseInt(searchParams.get('maxResults') || '20');
    const useMockData = searchParams.get('mock') === 'true' || !process.env.GOOGLE_CLIENT_ID;

    // For development/demo - use mock data
    if (useMockData) {
      const mockEvents = await getMockCalendarEvents();
      
      return NextResponse.json({
        success: true,
        data: {
          events: mockEvents,
          totalCount: mockEvents.length,
          source: 'mock',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          usingMockData: true,
        },
      });
    }

    // Get user's Google access token
    // Note: In a real implementation, you'd fetch this from your database
    // For now, we'll return mock data as we don't have OAuth set up yet
    const accessToken = 'mock-access-token';

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Google Calendar access not configured. Please connect your Google account.',
            code: 'GOOGLE_AUTH_REQUIRED',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate access token
    const hasValidAccess = await validateGoogleCalendarAccess(accessToken);
    if (!hasValidAccess) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Google Calendar access expired. Please reconnect your account.',
            code: 'GOOGLE_AUTH_EXPIRED',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    // Fetch calendar events
    const timeMin = new Date();
    const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    const events = await getUpcomingEvents(accessToken, {
      maxResults,
      timeMin,
      timeMax,
    });

    return NextResponse.json({
      success: true,
      data: {
        events,
        totalCount: events.length,
        source: 'google_calendar',
        timeRange: {
          start: timeMin.toISOString(),
          end: timeMax.toISOString(),
        },
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        usingMockData: false,
      },
    });

  } catch (error) {
    console.error('Calendar events API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch calendar events',
          code: 'CALENDAR_FETCH_ERROR',
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
      case 'fetch':
        // Same logic as GET request
        const useMockData = params.useMockData || !process.env.GOOGLE_CLIENT_ID;

        if (useMockData) {
          const mockEvents = await getMockCalendarEvents();
          
          return NextResponse.json({
            success: true,
            data: {
              events: mockEvents,
              totalCount: mockEvents.length,
              source: 'mock',
            },
            metadata: {
              timestamp: new Date().toISOString(),
              requestId: crypto.randomUUID(),
              usingMockData: true,
            },
          });
        }

        // Real Google Calendar integration would go here
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Google Calendar integration not fully configured',
              code: 'FEATURE_NOT_IMPLEMENTED',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 501 }
        );

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
    console.error('Calendar events API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to process calendar request',
          code: 'CALENDAR_API_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
