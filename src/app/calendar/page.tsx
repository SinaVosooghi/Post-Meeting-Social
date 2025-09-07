'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CalendarEvent, ApiResponse } from '@/types/master-interfaces';
import { MeetingPlatform } from '@/types/master-interfaces';

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectMeetingPlatform = (event: CalendarEvent): MeetingPlatform => {
    const text =
      `${event.summary} ${event.description || ''} ${event.location || ''}`.toLowerCase();

    if (text.includes('zoom.us') || text.includes('zoom')) {
      return MeetingPlatform.ZOOM;
    } else if (text.includes('teams.microsoft.com') || text.includes('teams')) {
      return MeetingPlatform.MICROSOFT_TEAMS;
    } else if (text.includes('meet.google.com') || text.includes('google meet')) {
      return MeetingPlatform.GOOGLE_MEET;
    } else if (text.includes('webex')) {
      return MeetingPlatform.WEBEX;
    }

    return MeetingPlatform.OTHER;
  };

  const extractMeetingUrl = (event: CalendarEvent): string | undefined => {
    const text = `${event.summary} ${event.description || ''} ${event.location || ''}`;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);

    if (urls) {
      for (const url of urls) {
        if (
          url.includes('zoom.us') ||
          url.includes('teams.microsoft.com') ||
          url.includes('meet.google.com') ||
          url.includes('webex.com')
        ) {
          return url;
        }
      }
    }

    return undefined;
  };

  const fetchCalendarEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/calendar/events');
      const result = (await response.json()) as ApiResponse<CalendarEvent[]>;

      if (result.success && result.data) {
        const processedEvents = result.data.map(event => ({
          ...event,
          platform: detectMeetingPlatform(event),
          meetingUrl: extractMeetingUrl(event),
        }));
        setEvents(processedEvents);
      } else {
        setError(result.error?.message || 'Failed to fetch calendar events');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const scheduleBot = async (eventId: string) => {
    try {
      const response = await fetch('/api/recall/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          joinMinutesBefore: 5, // Default 5 minutes before
        }),
      });

      const result = (await response.json()) as ApiResponse<{ botId: string }>;

      if (result.success) {
        // Update the event to show bot is scheduled
        setEvents(prev =>
          prev.map(event =>
            event.id === eventId
              ? { ...event, botScheduled: true, botId: result.data.botId }
              : event
          )
        );
      } else {
        setError(result.error?.message || 'Failed to schedule bot');
      }
    } catch (err) {
      setError('Failed to schedule bot');
    }
  };

  useEffect(() => {
    void fetchCalendarEvents();
  }, [fetchCalendarEvents]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">📅 Calendar Integration</h1>
          <p className="text-lg text-gray-600">Manage your meetings and schedule AI notetakers</p>
        </div>

        <div className="mb-6">
          <Button
            onClick={() => void fetchCalendarEvents()}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? 'Loading...' : 'Refresh Calendar'}
          </Button>
        </div>

        {error && (
          <Card className="p-6 border-red-200 bg-red-50 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </Card>
        )}

        <div className="grid gap-4">
          {events.map(event => (
            <Card key={event.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{event.summary}</h3>
                    <Badge variant="outline">{event.platform}</Badge>
                    {event.meetingUrl && <Badge variant="secondary">Has Meeting Link</Badge>}
                  </div>

                  <p className="text-gray-600 mb-2">
                    {new Date(event.start.dateTime).toLocaleString()}
                  </p>

                  {event.attendees && event.attendees.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-600">
                        Attendees: {event.attendees.map(a => a.displayName || a.email).join(', ')}
                      </p>
                    </div>
                  )}

                  {event.meetingUrl && (
                    <p className="text-sm text-blue-600 mb-2">
                      <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer">
                        Join Meeting →
                      </a>
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => void scheduleBot(event.id)}
                    disabled={!event.meetingUrl}
                    size="sm"
                  >
                    Schedule Bot
                  </Button>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {events.length === 0 && !isLoading && (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Events Found</h3>
            <p className="text-gray-600">
              Connect your Google Calendar to see your upcoming meetings.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
