declare module 'googleapis' {
  export namespace google {
    export namespace auth {
      export class OAuth2 {
        constructor(
          clientId: string | null | undefined,
          clientSecret: string | null | undefined,
          redirectUri: string | null | undefined
        );
        setCredentials(credentials: { access_token: string }): void;
      }
    }

    export namespace calendar_v3 {
      export interface Calendar {
        events: {
          list: (params: {
            calendarId: string;
            timeMin: string;
            timeMax?: string;
            maxResults: number;
            singleEvents: boolean;
            orderBy: 'startTime';
          }) => Promise<{
            data: {
              items?: Array<{
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
                organizer?: {
                  email?: string;
                  displayName?: string;
                };
                recurringEventId?: string;
                status?: 'confirmed' | 'tentative' | 'cancelled';
                visibility?: 'default' | 'public' | 'private';
                created?: string;
                updated?: string;
                maxAttendees?: number;
                maxParticipants?: number;
                recurrence?: string[];
              }>;
            };
          }>;
          insert: (params: {
            calendarId: string;
            requestBody: {
              summary: string;
              description?: string;
              start: { dateTime: string; timeZone: string };
              end: { dateTime: string; timeZone: string };
              attendees?: Array<{ email: string }>;
              location?: string;
            };
          }) => Promise<{
            data: {
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
              organizer?: {
                email?: string;
                displayName?: string;
              };
              status?: 'confirmed' | 'tentative' | 'cancelled';
              visibility?: 'default' | 'public' | 'private';
              created?: string;
              updated?: string;
              maxParticipants?: number;
              maxAttendees?: number;
              recurrence?: string[];
            };
          }>;
          patch: (params: {
            calendarId: string;
            eventId: string;
            requestBody: {
              summary?: string;
              description?: string;
              start?: { dateTime: string; timeZone: string };
              end?: { dateTime: string; timeZone: string };
              attendees?: Array<{ email: string }>;
              location?: string;
            };
          }) => Promise<{
            data: {
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
              organizer?: {
                email?: string;
                displayName?: string;
              };
              recurringEventId?: string;
              status?: 'confirmed' | 'tentative' | 'cancelled';
              visibility?: 'default' | 'public' | 'private';
              created?: string;
              updated?: string;
              maxParticipants?: number;
              maxAttendees?: number;
              recurrence?: string[];
            };
          }>;
          delete: (params: { calendarId: string; eventId: string }) => Promise<void>;
        };
        calendarList: {
          list: (params?: { maxResults?: number }) => Promise<{
            status?: number;
            data: {
              items?: Array<{
                id?: string;
                summary?: string;
                description?: string;
                primary?: boolean;
                accessRole?: 'freeBusyReader' | 'reader' | 'writer' | 'owner';
                backgroundColor?: string;
                foregroundColor?: string;
              }>;
            };
          }>;
        };
      }
    }

    export namespace calendar {
      export function calendar(options: { version: 'v3'; auth: OAuth2 }): calendar_v3.Calendar;
    }
  }
}
