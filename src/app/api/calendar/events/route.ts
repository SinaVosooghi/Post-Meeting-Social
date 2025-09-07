import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // For demo purposes, return mock calendar events
    const mockEvents = [
      {
        id: 'event-1',
        summary: 'Client Portfolio Review - John Smith',
        description:
          'Quarterly portfolio review and investment strategy discussion. Zoom link: https://zoom.us/j/123456789',
        start: {
          dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
          timeZone: 'America/New_York',
        },
        attendees: [
          {
            email: 'advisor@example.com',
            displayName: 'Financial Advisor',
            responseStatus: 'accepted',
          },
          {
            email: 'john.smith@example.com',
            displayName: 'John Smith',
            responseStatus: 'accepted',
          },
        ],
        location: 'Zoom Meeting',
      },
      {
        id: 'event-2',
        summary: 'Investment Strategy Meeting - Sarah Johnson',
        description:
          'Discussing retirement planning and 401k optimization. Teams link: https://teams.microsoft.com/l/meetup-join/123456789',
        start: {
          dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(), // Day after tomorrow + 45 min
          timeZone: 'America/New_York',
        },
        attendees: [
          {
            email: 'advisor@example.com',
            displayName: 'Financial Advisor',
            responseStatus: 'accepted',
          },
          {
            email: 'sarah.johnson@example.com',
            displayName: 'Sarah Johnson',
            responseStatus: 'accepted',
          },
        ],
        location: 'Microsoft Teams',
      },
      {
        id: 'event-3',
        summary: 'Market Update Call - Team Meeting',
        description:
          'Weekly market analysis and client communication strategy. Google Meet: https://meet.google.com/abc-defg-hij',
        start: {
          dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), // 3 days from now + 30 min
          timeZone: 'America/New_York',
        },
        attendees: [
          {
            email: 'advisor@example.com',
            displayName: 'Financial Advisor',
            responseStatus: 'accepted',
          },
          { email: 'team@example.com', displayName: 'Team Members', responseStatus: 'accepted' },
        ],
        location: 'Google Meet',
      },
    ];

    return NextResponse.json({
      success: true,
      data: mockEvents,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        totalEvents: mockEvents.length,
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
