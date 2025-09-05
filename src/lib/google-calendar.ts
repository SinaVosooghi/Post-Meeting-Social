/**
 * Google Calendar API Integration
 * Post-Meeting Social Media Content Generator
 * 
 * Handles Google Calendar OAuth, event fetching, and meeting management
 */

import { google } from 'googleapis';
import type { 
  CalendarEvent, 
  GoogleCalendarConfig 
} from '@/types';
import { CalendarProvider } from '@/types';

// ============================================================================
// GOOGLE CALENDAR CONFIGURATION
// ============================================================================

const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

const GOOGLE_CALENDAR_CONFIG: GoogleCalendarConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: process.env.NEXTAUTH_URL + '/api/auth/callback/google',
  scopes: GOOGLE_CALENDAR_SCOPES,
};

// ============================================================================
// GOOGLE CALENDAR CLIENT
// ============================================================================

/**
 * Creates authenticated Google Calendar client
 */
export function createGoogleCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2(
    GOOGLE_CALENDAR_CONFIG.clientId,
    GOOGLE_CALENDAR_CONFIG.clientSecret,
    GOOGLE_CALENDAR_CONFIG.redirectUri
  );

  auth.setCredentials({
    access_token: accessToken,
  });

  return google.calendar({ version: 'v3', auth });
}

// ============================================================================
// CALENDAR OPERATIONS
// ============================================================================

/**
 * Fetches upcoming calendar events from Google Calendar
 */
export async function getUpcomingEvents(
  accessToken: string,
  options: {
    maxResults?: number;
    timeMin?: Date;
    timeMax?: Date;
    calendarId?: string;
  } = {}
): Promise<CalendarEvent[]> {
  try {
    const calendar = createGoogleCalendarClient(accessToken);
    
    const {
      maxResults = 20,
      timeMin = new Date(),
      timeMax,
      calendarId = 'primary'
    } = options;

    const listParams: {
      calendarId: string;
      timeMin: string;
      timeMax?: string;
      maxResults: number;
      singleEvents: boolean;
      orderBy: 'startTime';
    } = {
      calendarId,
      timeMin: timeMin.toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    };
    
    if (timeMax) {
      listParams.timeMax = timeMax.toISOString();
    }

    const response = await calendar.events.list(listParams);

    const events = response.data.items || [];

    return events.map(event => ({
      id: event.id!,
      title: event.summary || 'Untitled Meeting',
      description: event.description || '',
      startTime: parseGoogleDate(event.start),
      endTime: parseGoogleDate(event.end),
      attendees: event.attendees?.map(attendee => ({
        email: attendee.email || '',
        name: attendee.displayName || (attendee.email ? attendee.email.split('@')[0] : 'Unknown'),
        responseStatus: attendee.responseStatus as 'needsAction' | 'declined' | 'tentative' | 'accepted',
        isOrganizer: attendee.organizer || false,
      })) || [],
      location: event.location || '',
      meetingUrl: extractMeetingUrl(event.description || ''),
      provider: CalendarProvider.GOOGLE,
      calendarId: event.organizer?.email || calendarId,
      isRecurring: !!event.recurringEventId,
      status: event.status as 'confirmed' | 'tentative' | 'cancelled',
      visibility: event.visibility as 'default' | 'public' | 'private',
      createdAt: new Date(event.created!),
      updatedAt: new Date(event.updated!),
    }));
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    throw new Error(`Failed to fetch calendar events: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Creates a new calendar event in Google Calendar
 */
export async function createCalendarEvent(
  accessToken: string,
  eventData: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    attendees?: string[];
    location?: string;
    calendarId?: string;
  }
): Promise<CalendarEvent> {
  try {
    const calendar = createGoogleCalendarClient(accessToken);
    
    const {
      title,
      description = '',
      startTime,
      endTime,
      attendees = [],
      location = '',
      calendarId = 'primary'
    } = eventData;

    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: title,
        description,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'UTC',
        },
        attendees: attendees.map(email => ({ email })),
        location,
      },
    });

    const event = response.data;

    return {
      id: event.id!,
      title: event.summary!,
      description: event.description || '',
      startTime: parseGoogleDate(event.start),
      endTime: parseGoogleDate(event.end),
      attendees: event.attendees?.map(attendee => ({
        email: attendee.email || '',
        name: attendee.displayName || (attendee.email ? attendee.email.split('@')[0] : 'Unknown'),
        responseStatus: attendee.responseStatus as 'needsAction' | 'declined' | 'tentative' | 'accepted',
        isOrganizer: attendee.organizer || false,
      })) || [],
      location: event.location || '',
      meetingUrl: extractMeetingUrl(event.description || ''),
      provider: CalendarProvider.GOOGLE,
      calendarId: event.organizer?.email || calendarId,
      isRecurring: false,
      status: 'confirmed',
      visibility: 'default',
      createdAt: new Date(event.created!),
      updatedAt: new Date(event.updated!),
    };
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    throw new Error(`Failed to create calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Updates an existing calendar event
 */
export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  updates: Partial<{
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    attendees: string[];
    location: string;
  }>,
  calendarId = 'primary'
): Promise<CalendarEvent> {
  try {
    const calendar = createGoogleCalendarClient(accessToken);
    
    // Prepare update data
    const updateData: {
      summary?: string;
      description?: string;
      location?: string;
      start?: { dateTime: string; timeZone: string };
      end?: { dateTime: string; timeZone: string };
      attendees?: { email: string }[];
    } = {};
    
    if (updates.title !== undefined) updateData.summary = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.location !== undefined) updateData.location = updates.location;
    
    if (updates.startTime) {
      updateData.start = {
        dateTime: updates.startTime.toISOString(),
        timeZone: 'UTC',
      };
    }
    
    if (updates.endTime) {
      updateData.end = {
        dateTime: updates.endTime.toISOString(),
        timeZone: 'UTC',
      };
    }
    
    if (updates.attendees) {
      updateData.attendees = updates.attendees.map(email => ({ email }));
    }

    const response = await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: updateData,
    });

    const event = response.data;

    return {
      id: event.id!,
      title: event.summary!,
      description: event.description || '',
      startTime: parseGoogleDate(event.start),
      endTime: parseGoogleDate(event.end),
      attendees: event.attendees?.map(attendee => ({
        email: attendee.email || '',
        name: attendee.displayName || (attendee.email ? attendee.email.split('@')[0] : 'Unknown'),
        responseStatus: attendee.responseStatus as 'needsAction' | 'declined' | 'tentative' | 'accepted',
        isOrganizer: attendee.organizer || false,
      })) || [],
      location: event.location || '',
      meetingUrl: extractMeetingUrl(event.description || ''),
      provider: CalendarProvider.GOOGLE,
      calendarId: event.organizer?.email || calendarId,
      isRecurring: !!event.recurringEventId,
      status: event.status as 'confirmed' | 'tentative' | 'cancelled',
      visibility: event.visibility as 'default' | 'public' | 'private',
      createdAt: new Date(event.created!),
      updatedAt: new Date(event.updated!),
    };
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    throw new Error(`Failed to update calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Deletes a calendar event
 */
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string,
  calendarId = 'primary'
): Promise<void> {
  try {
    const calendar = createGoogleCalendarClient(accessToken);
    
    await calendar.events.delete({
      calendarId,
      eventId,
    });
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    throw new Error(`Failed to delete calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extracts meeting URL from event description
 */
function extractMeetingUrl(description: string): string {
  // Common meeting URL patterns
  const patterns = [
    /https:\/\/(?:us\d+\.)?zoom\.us\/j\/\d+(?:\?[^\s]*)?/gi,
    /https:\/\/meet\.google\.com\/[a-z-]+/gi,
    /https:\/\/teams\.microsoft\.com\/[^\s]*/gi,
    /https:\/\/[^\s]*\.webex\.com\/[^\s]*/gi,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return '';
}

/**
 * Parses Google Calendar API date fields safely
 */
function parseGoogleDate(dateField: { dateTime?: string | null; date?: string | null } | undefined): Date {
  if (!dateField) {
    throw new Error('Missing date field');
  }
  const iso = dateField.dateTime || dateField.date;
  if (!iso) {
    throw new Error('Missing date value');
  }
  return new Date(iso);
}

/**
 * Checks if user has valid Google Calendar access
 */
export async function validateGoogleCalendarAccess(accessToken: string): Promise<boolean> {
  try {
    const calendar = createGoogleCalendarClient(accessToken);
    
    // Try to fetch calendar list to validate access
    const response = await calendar.calendarList.list({
      maxResults: 1,
    });

    return response.status === 200;
  } catch (error) {
    console.error('Google Calendar access validation failed:', error);
    return false;
  }
}

/**
 * Gets user's calendar list
 */
export async function getUserCalendars(accessToken: string) {
  try {
    const calendar = createGoogleCalendarClient(accessToken);
    
    const response = await calendar.calendarList.list();
    
    return response.data.items?.map(cal => ({
      id: cal.id!,
      name: cal.summary!,
      description: cal.description || '',
      primary: cal.primary || false,
      accessRole: cal.accessRole as 'freeBusyReader' | 'reader' | 'writer' | 'owner',
      backgroundColor: cal.backgroundColor || '#1976D2',
      foregroundColor: cal.foregroundColor || '#FFFFFF',
    })) || [];
  } catch (error) {
    console.error('Error fetching user calendars:', error);
    throw new Error(`Failed to fetch calendars: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// MOCK DATA FOR DEVELOPMENT
// ============================================================================

/**
 * Mock calendar events for development and testing
 */
export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'mock-event-1',
    title: 'Q4 Portfolio Review with Sarah Johnson',
    description: 'Quarterly portfolio review meeting to discuss performance, rebalancing, and strategy adjustments.',
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
    attendees: [
      {
        email: 'john.smith@example.com',
        name: 'John Smith',
        responseStatus: 'accepted',
        isOrganizer: true,
      },
      {
        email: 'sarah.johnson@example.com',
        name: 'Sarah Johnson',
        responseStatus: 'accepted',
        isOrganizer: false,
      },
    ],
    location: 'Conference Room A',
    meetingUrl: 'https://zoom.us/j/1234567890',
    provider: CalendarProvider.GOOGLE,
    calendarId: 'primary',
    isRecurring: false,
    status: 'confirmed',
    visibility: 'default',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    updatedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
  },
  {
    id: 'mock-event-2',
    title: 'Financial Planning Workshop',
    description: 'Group session covering retirement planning strategies and tax optimization.',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    endTime: new Date(Date.now() + 25.5 * 60 * 60 * 1000), // Tomorrow + 1.5 hours
    attendees: [
      {
        email: 'john.smith@example.com',
        name: 'John Smith',
        responseStatus: 'accepted',
        isOrganizer: true,
      },
      {
        email: 'client1@example.com',
        name: 'Client One',
        responseStatus: 'tentative',
        isOrganizer: false,
      },
      {
        email: 'client2@example.com',
        name: 'Client Two',
        responseStatus: 'accepted',
        isOrganizer: false,
      },
    ],
    location: 'Main Conference Room',
    meetingUrl: 'https://meet.google.com/abc-def-ghi',
    provider: CalendarProvider.GOOGLE,
    calendarId: 'primary',
    isRecurring: true,
    status: 'confirmed',
    visibility: 'default',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
];

/**
 * Returns mock calendar events for development
 */
export async function getMockCalendarEvents(): Promise<CalendarEvent[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return MOCK_CALENDAR_EVENTS;
}
