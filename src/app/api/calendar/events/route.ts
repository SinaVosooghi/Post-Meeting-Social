import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import type { Session } from 'next-auth';
import { getUpcomingEvents } from '@/lib/google-calendar';
import type { CalendarEvent } from '@/types/master-interfaces';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user has Google access token
    if (!session.accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Google Calendar not connected. Please sign in with Google.' },
        },
        { status: 401 }
      );
    }

    // Fetch real Google Calendar events
    console.log('Fetching real Google Calendar events...');
    const events = await getUpcomingEvents(session.accessToken, {
      maxResults: 20,
      timeMin: new Date(),
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
    });

    return NextResponse.json({
      success: true,
      data: events,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        totalEvents: events.length,
      },
    });
  } catch (error) {
    console.error('Calendar events error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch calendar events',
          code: 'CALENDAR_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
