import { NextResponse } from 'next/server';
import type { CalendarEvent } from '@/types/master-interfaces';

export async function GET() {
  try {
    console.log('Calendar demo API called - returning mock data');
    
    // Mock calendar events for demo
    const mockEvents: CalendarEvent[] = [
      {
        id: 'event-1',
        summary: 'Client Portfolio Review - John Smith',
        description: 'Quarterly portfolio review and investment strategy discussion. Zoom link: https://zoom.us/j/123456789',
        start: {
          dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
          timeZone: 'America/New_York',
        },
        attendees: [
          {
            email: 'john.smith@example.com',
            displayName: 'John Smith',
            responseStatus: 'accepted',
            role: 'client',
          },
          {
            email: 'advisor@firm.com',
            displayName: 'Financial Advisor',
            responseStatus: 'accepted',
            role: 'advisor',
          },
        ],
        meetingUrl: 'https://zoom.us/j/123456789',
        location: 'Zoom Meeting',
      },
      {
        id: 'event-2',
        summary: 'Investment Strategy Meeting - Sarah Johnson',
        description: 'Discussing ESG investment opportunities and sustainable finance options. Teams link: https://teams.microsoft.com/l/meetup-join/987654321',
        start: {
          dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
          timeZone: 'America/New_York',
        },
        attendees: [
          {
            email: 'sarah.johnson@example.com',
            displayName: 'Sarah Johnson',
            responseStatus: 'accepted',
            role: 'client',
          },
          {
            email: 'advisor@firm.com',
            displayName: 'Financial Advisor',
            responseStatus: 'accepted',
            role: 'advisor',
          },
        ],
        meetingUrl: 'https://teams.microsoft.com/l/meetup-join/987654321',
        location: 'Microsoft Teams',
      },
      {
        id: 'event-3',
        summary: 'Risk Assessment Call - Mike Wilson',
        description: 'Risk tolerance evaluation and portfolio rebalancing discussion. Google Meet: https://meet.google.com/abc-defg-hij',
        start: {
          dateTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString(), // Day after tomorrow + 1 hour
          timeZone: 'America/New_York',
        },
        attendees: [
          {
            email: 'mike.wilson@example.com',
            displayName: 'Mike Wilson',
            responseStatus: 'accepted',
            role: 'client',
          },
          {
            email: 'advisor@firm.com',
            displayName: 'Financial Advisor',
            responseStatus: 'accepted',
            role: 'advisor',
          },
        ],
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
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
        demoMode: true,
      },
    });
  } catch (error) {
    console.error('Calendar demo error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch calendar events',
          code: 'CALENDAR_DEMO_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

