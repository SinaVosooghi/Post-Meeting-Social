/**
 * Google Calendar Events API Endpoint
 * POST /api/calendar/events - Fetch calendar events
 *
 * Handles fetching calendar events from Google Calendar API
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getUpcomingEvents,
  getMockCalendarEvents,
  validateGoogleCalendarAccess,
} from '@/lib/google-calendar';
import type {
  ApiResponse,
  CalendarEventsRequest,
  CalendarEventsResponse,
} from '@/types/master-interfaces';

// Type guard for CalendarEventsRequest
function isCalendarEventsRequest(obj: unknown): obj is CalendarEventsRequest {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'action' in obj &&
    typeof (obj as Record<string, unknown>).action === 'string'
  );
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            message: 'Authentication required',
            code: 'UNAUTHORIZED',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
            processingTimeMs: 0,
            version: '1.0.0',
            complianceChecked: false,
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
      const requestId = crypto.randomUUID();

      return NextResponse.json<ApiResponse<CalendarEventsResponse>>({
        success: true,
        data: {
          events: mockEvents,
          totalCount: mockEvents.length,
          source: 'mock',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          processingTimeMs: 0,
          version: '1.0.0',
          complianceChecked: false,
        },
      });
    }

    // Get user's Google access token
    // Note: In a real implementation, you'd fetch this from your database
    // For now, we'll return mock data as we don't have OAuth set up yet
    const accessToken = 'mock-access-token';

    if (!accessToken) {
      const requestId = crypto.randomUUID();
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            message: 'Google Calendar access not configured. Please connect your Google account.',
            code: 'GOOGLE_AUTH_REQUIRED',
            timestamp: new Date().toISOString(),
            requestId,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId,
            processingTimeMs: 0,
            version: '1.0.0',
            complianceChecked: false,
          },
        },
        { status: 400 }
      );
    }

    // Validate access token
    const hasValidAccess = await validateGoogleCalendarAccess(accessToken);
    if (!hasValidAccess) {
      const requestId = crypto.randomUUID();
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            message: 'Google Calendar access expired. Please reconnect your account.',
            code: 'GOOGLE_AUTH_EXPIRED',
            timestamp: new Date().toISOString(),
            requestId,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId,
            processingTimeMs: 0,
            version: '1.0.0',
            complianceChecked: false,
          },
        },
        { status: 401 }
      );
    }

    // Fetch calendar events
    const timeMin = new Date();
    const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    const startTime = Date.now();

    const events = await getUpcomingEvents(accessToken, {
      maxResults,
      timeMin,
      timeMax,
    });

    const processingTime = Date.now() - startTime;
    const requestId = crypto.randomUUID();

    return NextResponse.json<ApiResponse<CalendarEventsResponse>>({
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
        requestId,
        processingTimeMs: processingTime,
        version: '1.0.0',
        complianceChecked: false,
      },
    });
  } catch (error) {
    const requestId = crypto.randomUUID();
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch calendar events',
          code: 'CALENDAR_FETCH_ERROR',
          timestamp: new Date().toISOString(),
          requestId,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          processingTimeMs: 0,
          version: '1.0.0',
          complianceChecked: false,
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
      const requestId = crypto.randomUUID();
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            message: 'Authentication required',
            code: 'UNAUTHORIZED',
            timestamp: new Date().toISOString(),
            requestId,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId,
            processingTimeMs: 0,
            version: '1.0.0',
            complianceChecked: false,
          },
        },
        { status: 401 }
      );
    }

    let body: CalendarEventsRequest;
    try {
      const jsonData: unknown = await request.json();
      if (isCalendarEventsRequest(jsonData)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        body = jsonData;
      } else {
        throw new Error('Invalid request body structure');
      }
    } catch (error) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            message: 'Invalid JSON in request body',
            code: 'INVALID_JSON',
            details: { error: String(error) },
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
            version: '1.0.0',
          },
        },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const action = body.action;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const useMockData = body.useMockData;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const _params: Record<string, unknown> = { ...body };
    delete _params.action;
    delete _params.useMockData;

    switch (action) {
      case 'fetch': {
        // Same logic as GET request
        const shouldUseMockData = Boolean(useMockData) || !process.env.GOOGLE_CLIENT_ID;
        const requestId = crypto.randomUUID();

        if (shouldUseMockData) {
          const mockEvents = await getMockCalendarEvents();

          return NextResponse.json<ApiResponse<CalendarEventsResponse>>({
            success: true,
            data: {
              events: mockEvents,
              totalCount: mockEvents.length,
              source: 'mock',
            },
            metadata: {
              timestamp: new Date().toISOString(),
              requestId,
              processingTimeMs: 0,
              version: '1.0.0',
              complianceChecked: false,
            },
          });
        }

        // Real Google Calendar integration would go here
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: {
              message: 'Google Calendar integration not fully configured',
              code: 'FEATURE_NOT_IMPLEMENTED',
              timestamp: new Date().toISOString(),
              requestId,
            },
            metadata: {
              timestamp: new Date().toISOString(),
              requestId,
              processingTimeMs: 0,
              version: '1.0.0',
              complianceChecked: false,
            },
          },
          { status: 501 }
        );
      }

      default: {
        const requestId = crypto.randomUUID();
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: {
              message: `Unknown action: ${action}`,
              code: 'INVALID_ACTION',
              timestamp: new Date().toISOString(),
              requestId,
            },
            metadata: {
              timestamp: new Date().toISOString(),
              requestId,
              processingTimeMs: 0,
              version: '1.0.0',
              complianceChecked: false,
            },
          },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    const requestId = crypto.randomUUID();
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to process calendar request',
          code: 'CALENDAR_API_ERROR',
          timestamp: new Date().toISOString(),
          requestId,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          processingTimeMs: 0,
          version: '1.0.0',
          complianceChecked: false,
        },
      },
      { status: 500 }
    );
  }
}
