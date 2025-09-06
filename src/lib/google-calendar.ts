/**
 * Google Calendar API Integration
 * Post-Meeting Social Media Content Generator
 *
 * Handles Google Calendar OAuth, event fetching, and meeting management
 */

import { google } from 'googleapis';
import type { CalendarEvent, GoogleCalendarConfig } from '@/types/master-interfaces';
import { CalendarProvider } from '@/types/master-interfaces';

interface GoogleCalendarAttendee {
  email?: string;
  displayName?: string;
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  organizer?: boolean;
  optional?: boolean;
}
import { calendarLogger } from './logger';

// ============================================================================
// GOOGLE CALENDAR CONFIGURATION
// ============================================================================

const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

// Validate required environment variables
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
  : '';

if (!clientId || !clientSecret || !redirectUri) {
  calendarLogger.warn('Missing Google Calendar configuration. Some features may be disabled.');
}

const GOOGLE_CALENDAR_CONFIG: GoogleCalendarConfig = {
  clientId: clientId ?? '',
  clientSecret: clientSecret ?? '',
  redirectUri,
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

  return google.calendar.calendar({ version: 'v3', auth });
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

    const { maxResults = 20, timeMin = new Date(), timeMax, calendarId = 'primary' } = options;

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

    const events = response.data.items ?? [];

    return events.map(
      (event: {
        id?: string;
        summary?: string;
        description?: string;
        start?: { dateTime?: string; date?: string; timeZone?: string };
        end?: { dateTime?: string; date?: string; timeZone?: string };
        attendees?: Array<{
          email?: string;
          displayName?: string;
          responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
          organizer?: boolean;
          optional?: boolean;
        }>;
        location?: string;
        organizer?: { email?: string; displayName?: string };
        recurringEventId?: string;
        status?: 'confirmed' | 'tentative' | 'cancelled';
        visibility?: 'default' | 'public' | 'private';
        created?: string;
        updated?: string;
        maxParticipants?: number;
        maxAttendees?: number;
        recurrence?: string[];
      }) => {
        if (!event.id) {
          throw new Error('Event ID is missing');
        }

        const organizer = event.organizer
          ? {
              email: event.organizer.email ?? '',
              name:
                event.organizer.displayName ??
                (event.organizer.email ? event.organizer.email.split('@')[0] : 'Unknown'),
              responseStatus: 'accepted' as 'needsAction' | 'declined' | 'tentative' | 'accepted',
              isOrganizer: true,
              isOptional: false,
              role: 'advisor' as
                | 'advisor'
                | 'client'
                | 'prospect'
                | 'colleague'
                | 'compliance_officer',
            }
          : {
              email: 'unknown@example.com',
              name: 'Unknown Organizer',
              responseStatus: 'accepted' as 'needsAction' | 'declined' | 'tentative' | 'accepted',
              isOrganizer: true,
              isOptional: false,
              role: 'advisor' as
                | 'advisor'
                | 'client'
                | 'prospect'
                | 'colleague'
                | 'compliance_officer',
            };

        const result: CalendarEvent = {
          id: event.id,
          title: event.summary ?? 'Untitled Meeting',
          description: event.description ?? '',
          startTime: parseGoogleDate(event.start),
          endTime: parseGoogleDate(event.end),
          timeZone: event.start?.timeZone ?? 'UTC',
          location: event.location ?? '',
          meetingUrl: extractMeetingUrl(event.description ?? ''),
          provider: CalendarProvider.GOOGLE,
          calendarId: event.organizer?.email ?? calendarId,
          attendees:
            event.attendees?.map((attendee: GoogleCalendarAttendee) => ({
              email: attendee.email ?? '',
              name: ((): string => {
                const displayName = attendee.displayName;
                if (displayName) {
                  return displayName;
                }
                const email = attendee.email;
                if (email) {
                  return email.split('@')[0];
                }
                return 'Unknown';
              })() as const,
              responseStatus: attendee.responseStatus ?? 'needsAction',
              isOrganizer: attendee.organizer ?? false,
              isOptional: attendee.optional ?? false,
              role: 'colleague' as
                | 'advisor'
                | 'client'
                | 'prospect'
                | 'colleague'
                | 'compliance_officer', // Default role, should be determined by your system
            })) ?? [],
          organizer,
          maxAttendees: event.maxParticipants ?? event.maxAttendees ?? undefined,
          isRecurring: Boolean(event.recurringEventId),
          recurrencePattern: event.recurrence
            ? {
                frequency: 'monthly', // Default, should be parsed from recurrence rule
                interval: 1,
                daysOfWeek: [], // Should be parsed from recurrence rule
              }
            : undefined,
          status: event.status as 'confirmed' | 'tentative' | 'cancelled',
          visibility: event.visibility as 'default' | 'public' | 'private',
          botSettings: {
            enableBot: true,
            botJoinMinutesBefore: 5,
            recordingEnabled: true,
            transcriptionEnabled: true,
            autoGenerateContent: true,
          },
          clientContext: {
            isClientMeeting: false,
            clientIds: [],
            meetingType: 'consultation',
            confidentialityLevel: 'standard',
          },
          createdAt: event.created ? new Date(event.created) : new Date(),
          updatedAt: event.updated ? new Date(event.updated) : new Date(),
        };
        return result;
      }
    );
  } catch (error) {
    calendarLogger.error(
      'Error fetching Google Calendar events',
      error instanceof Error ? error : new Error(String(error))
    );
    throw new Error(
      `Failed to fetch calendar events: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
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
      calendarId = 'primary',
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
    if (!event.id) {
      throw new Error('Created event ID is missing');
    }

    const organizer = event.organizer
      ? {
          email: event.organizer.email ?? '',
          name:
            event.organizer.displayName ??
            (event.organizer.email ? event.organizer.email.split('@')[0] : 'Unknown'),
          responseStatus: 'accepted',
          isOrganizer: true,
          isOptional: false,
          role: 'advisor',
        }
      : {
          email: 'unknown@example.com',
          name: 'Unknown Organizer',
          responseStatus: 'accepted',
          isOrganizer: true,
          isOptional: false,
          role: 'advisor',
        };

    return {
      id: event.id,
      title: event.summary ?? title,
      description: event.description ?? description,
      startTime: parseGoogleDate(event.start),
      endTime: parseGoogleDate(event.end),
      timeZone: event.start?.timeZone ?? 'UTC',
      location: event.location ?? location,
      meetingUrl: extractMeetingUrl(event.description ?? ''),
      provider: CalendarProvider.GOOGLE,
      calendarId: event.organizer?.email ?? calendarId,
      attendees:
        event.attendees?.map((attendee: GoogleCalendarAttendee) => ({
          email: attendee.email ?? '',
          name:
            attendee.displayName ??
            (attendee.email ? attendee.email.split('@')[0] : 'Unknown') ??
            'Unknown',
          responseStatus: attendee.responseStatus ?? 'needsAction',
          isOrganizer: attendee.organizer ?? false,
          isOptional: attendee.optional ?? false,
          role: 'colleague', // Default role, should be determined by your system
        })) ?? [],
      organizer,
      maxAttendees: event.maxParticipants ?? event.maxAttendees ?? undefined,
      isRecurring: false,
      status: 'confirmed',
      visibility: 'default',
      botSettings: {
        enableBot: true,
        botJoinMinutesBefore: 5,
        recordingEnabled: true,
        transcriptionEnabled: true,
        autoGenerateContent: true,
      },
      clientContext: {
        isClientMeeting: false,
        clientIds: [],
        meetingType: 'consultation',
        confidentialityLevel: 'standard',
      },
      createdAt: event.created ? new Date(event.created) : new Date(),
      updatedAt: event.updated ? new Date(event.updated) : new Date(),
    };
  } catch (error) {
    calendarLogger.error(
      'Error creating Google Calendar event',
      error instanceof Error ? error : new Error(String(error))
    );
    throw new Error(
      `Failed to create calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
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

    if (updates.title !== undefined) {
      updateData.summary = updates.title;
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }
    if (updates.location !== undefined) {
      updateData.location = updates.location;
    }

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
    if (!event.id) {
      throw new Error('Updated event ID is missing');
    }

    const organizer = event.organizer
      ? {
          email: event.organizer.email ?? '',
          name:
            event.organizer.displayName ??
            (event.organizer.email ? event.organizer.email.split('@')[0] : 'Unknown'),
          responseStatus: 'accepted',
          isOrganizer: true,
          isOptional: false,
          role: 'advisor',
        }
      : {
          email: 'unknown@example.com',
          name: 'Unknown Organizer',
          responseStatus: 'accepted',
          isOrganizer: true,
          isOptional: false,
          role: 'advisor',
        };

    return {
      id: event.id,
      title: event.summary ?? updates.title ?? 'Untitled Meeting',
      description: event.description ?? updates.description ?? '',
      startTime: parseGoogleDate(event.start),
      endTime: parseGoogleDate(event.end),
      timeZone: event.start?.timeZone ?? 'UTC',
      location: event.location ?? updates.location ?? '',
      meetingUrl: extractMeetingUrl(event.description ?? ''),
      provider: CalendarProvider.GOOGLE,
      calendarId: event.organizer?.email ?? calendarId,
      attendees:
        event.attendees?.map((attendee: GoogleCalendarAttendee) => ({
          email: attendee.email ?? '',
          name:
            attendee.displayName ??
            (attendee.email ? attendee.email.split('@')[0] : 'Unknown') ??
            'Unknown',
          responseStatus: attendee.responseStatus ?? 'needsAction',
          isOrganizer: attendee.organizer ?? false,
          isOptional: attendee.optional ?? false,
          role: 'colleague', // Default role, should be determined by your system
        })) ?? [],
      organizer,
      maxAttendees: event.maxParticipants ?? event.maxAttendees ?? undefined,
      isRecurring: Boolean(event.recurringEventId),
      recurrencePattern: event.recurrence
        ? {
            frequency: 'monthly', // Default, should be parsed from recurrence rule
            interval: 1,
            daysOfWeek: [], // Should be parsed from recurrence rule
          }
        : undefined,
      status: event.status as 'confirmed' | 'tentative' | 'cancelled',
      visibility: event.visibility as 'default' | 'public' | 'private',
      botSettings: {
        enableBot: true,
        botJoinMinutesBefore: 5,
        recordingEnabled: true,
        transcriptionEnabled: true,
        autoGenerateContent: true,
      },
      clientContext: {
        isClientMeeting: false,
        clientIds: [],
        meetingType: 'consultation',
        confidentialityLevel: 'standard',
      },
      createdAt: event.created ? new Date(event.created) : new Date(),
      updatedAt: event.updated ? new Date(event.updated) : new Date(),
    };
  } catch (error) {
    calendarLogger.error(
      'Error updating Google Calendar event',
      error instanceof Error ? error : new Error(String(error))
    );
    throw new Error(
      `Failed to update calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
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
    calendarLogger.error(
      'Error deleting Google Calendar event',
      error instanceof Error ? error : new Error(String(error))
    );
    throw new Error(
      `Failed to delete calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
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
function parseGoogleDate(
  dateField: { dateTime?: string | null; date?: string | null } | undefined
): Date {
  if (!dateField) {
    throw new Error('Missing date field');
  }
  const iso = dateField.dateTime ?? dateField.date;
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
    calendarLogger.error(
      'Google Calendar access validation failed',
      error instanceof Error ? error : new Error(String(error))
    );
    return false;
  }
}

interface GoogleCalendarItem {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole?: 'freeBusyReader' | 'reader' | 'writer' | 'owner';
  backgroundColor?: string;
  foregroundColor?: string;
}

/**
 * Gets user's calendar list
 */
export async function getUserCalendars(accessToken: string) {
  try {
    const calendar = createGoogleCalendarClient(accessToken);

    const response = await calendar.calendarList.list();

    return (
      response.data.items?.map((cal: GoogleCalendarItem) => {
        if (!cal.id) {
          throw new Error('Calendar ID is missing');
        }
        if (!cal.summary) {
          throw new Error('Calendar summary is missing');
        }

        return {
          id: cal.id,
          name: cal.summary,
          description: cal.description ?? '',
          primary: cal.primary ?? false,
          accessRole: cal.accessRole ?? 'reader',
          backgroundColor: cal.backgroundColor ?? '#1976D2',
          foregroundColor: cal.foregroundColor ?? '#FFFFFF',
        };
      }) ?? []
    );
  } catch (error) {
    calendarLogger.error(
      'Error fetching user calendars',
      error instanceof Error ? error : new Error(String(error))
    );
    throw new Error(
      `Failed to fetch calendars: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
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
    description:
      'Quarterly portfolio review meeting to discuss performance, rebalancing, and strategy adjustments.',
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
    timeZone: 'UTC',
    location: 'Conference Room A',
    meetingUrl: 'https://zoom.us/j/1234567890',
    provider: CalendarProvider.GOOGLE,
    calendarId: 'primary',
    attendees: [
      {
        email: 'john.smith@example.com',
        name: 'John Smith',
        responseStatus: 'accepted',
        isOrganizer: true,
        isOptional: false,
        role: 'advisor',
      },
      {
        email: 'sarah.johnson@example.com',
        name: 'Sarah Johnson',
        responseStatus: 'accepted',
        isOrganizer: false,
        isOptional: false,
        role: 'client',
        clientId: 'client-123',
      },
    ],
    organizer: {
      email: 'john.smith@example.com',
      name: 'John Smith',
      responseStatus: 'accepted',
      isOrganizer: true,
      isOptional: false,
      role: 'advisor',
    },
    maxAttendees: 10,
    isRecurring: false,
    status: 'confirmed',
    visibility: 'default',
    botSettings: {
      enableBot: true,
      botJoinMinutesBefore: 5,
      recordingEnabled: true,
      transcriptionEnabled: true,
      autoGenerateContent: true,
    },
    clientContext: {
      isClientMeeting: true,
      clientIds: ['client-123'],
      meetingType: 'review',
      confidentialityLevel: 'standard',
    },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    updatedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
  },
  {
    id: 'mock-event-2',
    title: 'Financial Planning Workshop',
    description: 'Group session covering retirement planning strategies and tax optimization.',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    endTime: new Date(Date.now() + 25.5 * 60 * 60 * 1000), // Tomorrow + 1.5 hours
    timeZone: 'UTC',
    location: 'Main Conference Room',
    meetingUrl: 'https://meet.google.com/abc-def-ghi',
    provider: CalendarProvider.GOOGLE,
    calendarId: 'primary',
    attendees: [
      {
        email: 'john.smith@example.com',
        name: 'John Smith',
        responseStatus: 'accepted',
        isOrganizer: true,
        isOptional: false,
        role: 'advisor',
      },
      {
        email: 'client1@example.com',
        name: 'Client One',
        responseStatus: 'tentative',
        isOrganizer: false,
        isOptional: false,
        role: 'client',
        clientId: 'client-456',
      },
      {
        email: 'client2@example.com',
        name: 'Client Two',
        responseStatus: 'accepted',
        isOrganizer: false,
        isOptional: false,
        role: 'client',
        clientId: 'client-789',
      },
    ],
    organizer: {
      email: 'john.smith@example.com',
      name: 'John Smith',
      responseStatus: 'accepted',
      isOrganizer: true,
      isOptional: false,
      role: 'advisor',
    },
    maxAttendees: 20,
    isRecurring: true,
    recurrencePattern: {
      frequency: 'monthly',
      interval: 1,
      daysOfWeek: [2], // Tuesday
      occurrences: 6,
    },
    status: 'confirmed',
    visibility: 'default',
    botSettings: {
      enableBot: true,
      botJoinMinutesBefore: 5,
      recordingEnabled: true,
      transcriptionEnabled: true,
      autoGenerateContent: true,
    },
    clientContext: {
      isClientMeeting: true,
      clientIds: ['client-456', 'client-789'],
      meetingType: 'planning',
      confidentialityLevel: 'standard',
    },
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
