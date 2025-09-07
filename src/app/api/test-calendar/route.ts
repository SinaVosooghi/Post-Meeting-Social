import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import type { Session } from 'next-auth';
import { getUpcomingEvents } from '@/lib/google-calendar';

export async function GET() {
  try {
    const session = (await auth()) as Session | null;
    
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required. Please sign in first.',
        signedIn: false
      });
    }

    const googleToken = session.providerTokens?.google?.accessToken;
    
    if (!googleToken) {
      return NextResponse.json({
        success: false,
        message: 'Google Calendar not connected. Please sign in with Google.',
        signedIn: true,
        hasGoogleToken: false,
        providerTokens: session.providerTokens
      });
    }

    // Test real Google Calendar API
    console.log('Testing real Google Calendar API with user session...');
    const events = await getUpcomingEvents(googleToken, {
      maxResults: 5,
      timeMin: new Date(),
      refreshToken: session.providerTokens?.google?.refreshToken,
      expiresAt: session.providerTokens?.google?.expiresAt,
    });

    return NextResponse.json({
      success: true,
      message: 'Google Calendar API working!',
      signedIn: true,
      hasGoogleToken: true,
      eventsCount: events.length,
      events: events.map(event => ({
        id: event.id,
        title: event.title,
        startTime: event.startTime,
        location: event.location,
        meetingUrl: event.meetingUrl,
        attendeesCount: event.attendees.length
      })),
      providerTokens: {
        google: {
          connected: !!session.providerTokens?.google?.accessToken,
          hasRefreshToken: !!session.providerTokens?.google?.refreshToken
        }
      }
    });
  } catch (error) {
    console.error('Calendar test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test calendar API',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
