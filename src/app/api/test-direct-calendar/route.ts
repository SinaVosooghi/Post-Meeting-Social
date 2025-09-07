import { NextResponse } from 'next/server';
import { getUpcomingEvents } from '@/lib/google-calendar';

export async function GET() {
  try {
    // Using environment variable for access token
    const accessToken = process.env.GOOGLE_ACCESS_TOKEN || 'test-token';
    
    console.log('Testing Google Calendar API with direct access token...');
    const events = await getUpcomingEvents(accessToken, {
      maxResults: 5,
      timeMin: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Google Calendar API test successful',
      events: events,
      count: events.length,
    });
  } catch (error) {
    console.error('Google Calendar API test failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Google Calendar API test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
