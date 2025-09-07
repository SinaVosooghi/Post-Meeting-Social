/**
 * Tests for Google Calendar Integration
 * Post-Meeting Social Media Content Generator
 */

import {
  createGoogleCalendarClient,
  getUpcomingEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  validateGoogleCalendarAccess,
  getUserCalendars,
  getMockCalendarEvents,
} from '../google-calendar';
// Types imported for future use when implementing full Google Calendar tests
// import type {
//   CalendarEvent,
//   CalendarAttendee,
//   CalendarProvider,
//   MeetingPlatform,
// } from '@/types/master-interfaces';

// Mock googleapis
jest.mock('googleapis', () => ({
  google: {
    calendar: {
      calendar: jest.fn(() => ({
        events: {
          list: jest.fn(),
          insert: jest.fn(),
          update: jest.fn(),
          patch: jest.fn(),
          delete: jest.fn(),
        },
        calendarList: {
          list: jest.fn(),
        },
      })),
    },
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: jest.fn(),
        getAccessToken: jest.fn().mockResolvedValue({ token: 'test-token' }),
      })),
    },
  },
}));

describe('Google Calendar Integration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      GOOGLE_CLIENT_ID: 'test-google-client-id',
      GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
      NEXTAUTH_URL: 'http://localhost:3000',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('createGoogleCalendarClient', () => {
    it('should create a Google Calendar client', () => {
      const accessToken = 'test-access-token';
      const client = createGoogleCalendarClient(accessToken);

      expect(client).toBeDefined();
      expect(client).toHaveProperty('events');
      expect(client).toHaveProperty('calendarList');
    });
  });

  describe('getUpcomingEvents', () => {
    it('should fetch upcoming events', async () => {
      const mockEvents = {
        data: {
          items: [
            {
              id: 'event-1',
              summary: 'Test Meeting',
              description: 'Test meeting description',
              start: {
                dateTime: '2025-09-06T10:00:00Z',
                timeZone: 'UTC',
              },
              end: {
                dateTime: '2025-09-06T11:00:00Z',
                timeZone: 'UTC',
              },
              attendees: [],
              location: 'Test Location',
              meetingUrl: 'https://meet.google.com/test',
              status: 'confirmed',
              visibility: 'default',
            },
          ],
        },
      };

      const { google } = jest.requireMock('googleapis');
      const mockCalendar = {
        events: {
          list: jest.fn().mockResolvedValue(mockEvents),
        },
      };
      google.calendar.calendar.mockReturnValue(mockCalendar);

      const result = await getUpcomingEvents('test-token');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('title');
    });

    it('should handle empty calendar', async () => {
      const mockEvents = {
        data: {
          items: [],
        },
      };

      const { google } = jest.requireMock('googleapis');
      const mockCalendar = {
        events: {
          list: jest.fn().mockResolvedValue(mockEvents),
        },
      };
      google.calendar.calendar.mockReturnValue(mockCalendar);

      const result = await getUpcomingEvents('test-token');

      expect(result).toHaveLength(0);
    });

    it('should handle API errors', async () => {
      const { google } = jest.requireMock('googleapis');
      const mockCalendar = {
        events: {
          list: jest.fn().mockRejectedValue(new Error('API error')),
        },
      };
      google.calendar.calendar.mockReturnValue(mockCalendar);

      await expect(getUpcomingEvents('test-token')).rejects.toThrow(
        'Failed to fetch calendar events'
      );
    });
  });

  describe('createCalendarEvent', () => {
    it('should create a new calendar event', async () => {
      const eventData = {
        title: 'New Meeting',
        description: 'Test meeting',
        startTime: new Date('2025-09-06T10:00:00Z'),
        endTime: new Date('2025-09-06T11:00:00Z'),
        attendees: ['test@example.com'],
        location: 'Test Location',
      };

      const mockResponse = {
        data: {
          id: 'event-123',
          summary: 'New Meeting',
          description: 'Test meeting',
          start: {
            dateTime: '2025-09-06T10:00:00Z',
            timeZone: 'UTC',
          },
          end: {
            dateTime: '2025-09-06T11:00:00Z',
            timeZone: 'UTC',
          },
          attendees: [],
          location: 'Test Location',
          status: 'confirmed',
          visibility: 'default',
        },
      };

      const { google } = jest.requireMock('googleapis');
      const mockCalendar = {
        events: {
          insert: jest.fn().mockResolvedValue(mockResponse),
        },
      };
      google.calendar.calendar.mockReturnValue(mockCalendar);

      const result = await createCalendarEvent('test-token', eventData);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
    });

    it('should handle event creation errors', async () => {
      const eventData = {
        title: 'Invalid Event',
        description: 'Invalid event',
        startTime: new Date('invalid-date'),
        endTime: new Date('invalid-date'),
        attendees: [],
        location: '',
      };

      const { google } = jest.requireMock('googleapis');
      const mockCalendar = {
        events: {
          insert: jest.fn().mockRejectedValue(new Error('Invalid event data')),
        },
      };
      google.calendar.calendar.mockReturnValue(mockCalendar);

      await expect(createCalendarEvent('test-token', eventData)).rejects.toThrow(
        'Failed to create calendar event'
      );
    });
  });

  describe('updateCalendarEvent', () => {
    it('should update an existing calendar event', async () => {
      const updates = {
        title: 'Updated Meeting',
        description: 'Updated meeting description',
        startTime: new Date('2025-09-06T10:00:00Z'),
        endTime: new Date('2025-09-06T11:00:00Z'),
        attendees: ['test@example.com'],
        location: 'Updated Location',
      };

      const mockResponse = {
        data: {
          id: 'event-123',
          summary: 'Updated Meeting',
          description: 'Updated meeting description',
          start: {
            dateTime: '2025-09-06T10:00:00Z',
            timeZone: 'UTC',
          },
          end: {
            dateTime: '2025-09-06T11:00:00Z',
            timeZone: 'UTC',
          },
          attendees: [],
          location: 'Updated Location',
          status: 'confirmed',
          visibility: 'default',
        },
      };

      const { google } = jest.requireMock('googleapis');
      const mockCalendar = {
        events: {
          patch: jest.fn().mockResolvedValue(mockResponse),
        },
      };
      google.calendar.calendar.mockReturnValue(mockCalendar);

      const result = await updateCalendarEvent('test-token', 'event-123', updates);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
    });

    it('should handle event update errors', async () => {
      const updates = {
        title: 'Updated Meeting',
        description: 'Updated meeting description',
      };

      const { google } = jest.requireMock('googleapis');
      const mockCalendar = {
        events: {
          patch: jest.fn().mockRejectedValue(new Error('Event not found')),
        },
      };
      google.calendar.calendar.mockReturnValue(mockCalendar);

      await expect(updateCalendarEvent('test-token', 'nonexistent-event', updates)).rejects.toThrow(
        'Failed to update calendar event'
      );
    });
  });

  describe('deleteCalendarEvent', () => {
    it('should delete a calendar event', async () => {
      const { google } = jest.requireMock('googleapis');
      const mockCalendar = {
        events: {
          delete: jest.fn().mockResolvedValue({}),
        },
      };
      google.calendar.calendar.mockReturnValue(mockCalendar);

      await expect(deleteCalendarEvent('test-token', 'event-123')).resolves.not.toThrow();
    });

    it('should handle event deletion errors', async () => {
      const { google } = jest.requireMock('googleapis');
      const mockCalendar = {
        events: {
          delete: jest.fn().mockRejectedValue(new Error('Event not found')),
        },
      };
      google.calendar.calendar.mockReturnValue(mockCalendar);

      await expect(deleteCalendarEvent('test-token', 'nonexistent-event')).rejects.toThrow(
        'Failed to delete calendar event'
      );
    });
  });

  describe('validateGoogleCalendarAccess', () => {
    it('should validate access token', async () => {
      const { google } = jest.requireMock('googleapis');
      const mockCalendar = {
        calendarList: {
          list: jest.fn().mockResolvedValue({ status: 200 }),
        },
      };
      google.calendar.calendar.mockReturnValue(mockCalendar);

      const result = await validateGoogleCalendarAccess('test-token');

      expect(result).toBe(true);
    });

    it('should handle invalid access token', async () => {
      const { google } = jest.requireMock('googleapis');
      const mockCalendar = {
        calendarList: {
          list: jest.fn().mockRejectedValue(new Error('Invalid token')),
        },
      };
      google.calendar.calendar.mockReturnValue(mockCalendar);

      const result = await validateGoogleCalendarAccess('invalid-token');

      expect(result).toBe(false);
    });
  });

  describe('getUserCalendars', () => {
    it('should get user calendars', async () => {
      const mockCalendars = {
        data: {
          items: [
            {
              id: 'primary',
              summary: 'Primary Calendar',
              primary: true,
            },
          ],
        },
      };

      const { google } = jest.requireMock('googleapis');
      const mockCalendar = {
        calendarList: {
          list: jest.fn().mockResolvedValue(mockCalendars),
        },
      };
      google.calendar.calendar.mockReturnValue(mockCalendar);

      const result = await getUserCalendars('test-token');

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('primary');
    });
  });

  describe('getMockCalendarEvents', () => {
    it('should return mock calendar events', async () => {
      const result = await getMockCalendarEvents();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
