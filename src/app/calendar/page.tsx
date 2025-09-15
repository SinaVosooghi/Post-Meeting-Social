'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/navigation';
import type { CalendarEvent, ApiResponse } from '../../types/master-interfaces';

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botSettings, setBotSettings] = useState<{ joinMinutesBefore: number }>({
    joinMinutesBefore: 5,
  });
  const [showRecallResponse, setShowRecallResponse] = useState<boolean>(false);
  const [recallResponse, setRecallResponse] = useState<any>(null);

  // Show loading state while session is being determined
  if (status === 'loading') {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">Loading...</h2>
              <p className="text-gray-500">Please wait while we verify your authentication</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const isZoomMeeting = (event: CalendarEvent): boolean => {
    const text = `${event.title} ${event.description || ''} ${event.location || ''}`.toLowerCase();

    // Enhanced Zoom detection patterns
    return (
      text.includes('zoom.us') ||
      text.includes('zoom.com') ||
      text.includes('zoom.') ||
      text.match(/zoom\.us\/j\/\d+/i) !== null ||
      text.match(/zoom\.us\/my\/\w+/i) !== null ||
      text.match(/zoom\.us\/meeting\/\d+/i) !== null ||
      text.match(/zoom\.us\/webinar\/\d+/i) !== null ||
      text.match(/zoom\.us\/p\/\d+/i) !== null ||
      text.match(/zoom\.us\/s\/\d+/i) !== null
    );
  };

  const extractMeetingUrl = (event: CalendarEvent): string | undefined => {
    // First check if meetingUrl is already provided by the API
    if (event.meetingUrl) {
      return event.meetingUrl;
    }

    // Fallback: extract from text fields - Focus on Zoom only
    const text = `${event.title} ${event.description || ''} ${event.location || ''}`;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);

    if (urls) {
      for (const url of urls) {
        // Enhanced Zoom detection patterns
        if (
          url.includes('zoom.us') ||
          url.includes('zoom.com') ||
          url.includes('zoom.') ||
          url.match(/zoom\.us\/j\/\d+/i) || // zoom.us/j/123456789
          url.match(/zoom\.us\/my\/\w+/i) || // zoom.us/my/username
          url.match(/zoom\.us\/meeting\/\d+/i) || // zoom.us/meeting/123456789
          url.match(/zoom\.us\/webinar\/\d+/i) || // zoom.us/webinar/123456789
          url.match(/zoom\.us\/p\/\d+/i) || // zoom.us/p/123456789
          url.match(/zoom\.us\/s\/\d+/i) // zoom.us/s/123456789
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
      // Fetch calendar events (now includes botData)
      const eventsResponse = await fetch('/api/calendar/events');
      const eventsResult = (await eventsResponse.json()) as ApiResponse<CalendarEvent[]>;

      if (eventsResult.success && eventsResult.data) {
        const now = new Date();
        const processedEvents = eventsResult.data
          .filter(event => {
            // Only show upcoming events (start time is in the future)
            return event.startTime && new Date(event.startTime) > now;
          })
          .map(event => ({
            ...event,
            meetingUrl: extractMeetingUrl(event) || event.meetingUrl,
            // botData is already included from the API
          }));

        setEvents(processedEvents);
      } else {
        setError(eventsResult.error?.message || 'Failed to fetch calendar events');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadBotSettings = async () => {
    try {
      const response = await fetch('/api/settings/bot');
      const result = (await response.json()) as ApiResponse<{ joinMinutesBefore: number }>;
      if (result.success && result.data) {
        setBotSettings(result.data);
      }
    } catch (err) {
      console.warn('Failed to load bot settings, using defaults:', err);
    }
  };

  const scheduleBot = async (eventId: string) => {
    try {
      // Find the event to get the meeting URL
      const event = events.find(e => e.id === eventId);
      if (!event) {
        setError('Event not found');
        return;
      }

      const meetingUrl = extractMeetingUrl(event);
      if (!meetingUrl) {
        setError('No meeting URL found for this event');
        return;
      }

      const response = await fetch('/api/recall/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          meetingUrl,
          joinMinutesBefore: botSettings.joinMinutesBefore, // Use user's setting
          eventTime: event.startTime || null,
        }),
      });

      const result = (await response.json()) as ApiResponse<{
        botId: string;
        externalBotId: string;
        status: string;
        scheduledAt: string;
        meetingUrl: string;
        joinMinutesBefore: number;
        settingsUsed: {
          joinMinutesBefore: number;
          maxConcurrentBots: number;
          autoSchedule: boolean;
        };
        recallResponse: any;
        message: string;
      }>;

      if (result.success && result.data) {
        // Show the Recall API response
        if (result.data.recallResponse) {
          setRecallResponse(result.data.recallResponse);
          setShowRecallResponse(true);
        }

        // Create botData object
        const botData = {
          botId: result.data.botId,
          externalBotId: result.data.externalBotId,
          status: result.data.status,
          scheduledAt: result.data.scheduledAt,
          joinMinutesBefore: result.data.joinMinutesBefore,
          settingsUsed: result.data.settingsUsed,
          recallResponse: result.data.recallResponse,
        };

        // Update the event to show bot is scheduled with full botData
        setEvents(prev =>
          prev.map(event => (event.id === eventId ? { ...event, botData } : event))
        );

        // Show success message
        setError(null);
        // Bot scheduled successfully
      } else {
        setError(result.error?.message || 'Failed to schedule bot');
      }
    } catch (err) {
      setError('Failed to schedule bot');
    }
  };

  useEffect(() => {
    void fetchCalendarEvents();
    void loadBotSettings();
  }, [fetchCalendarEvents]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">📅 Upcoming Zoom Meetings</h1>
            <p className="text-lg text-gray-600">
              Schedule AI notetakers for your upcoming Zoom meetings
            </p>
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
                      <h3 className="text-lg font-semibold">{event.title}</h3>
                      {isZoomMeeting(event) && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          Zoom
                        </Badge>
                      )}
                      {event.meetingUrl && isZoomMeeting(event) && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Zoom Link
                        </Badge>
                      )}
                      {event.botData && <Badge variant="default">Bot Scheduled</Badge>}
                    </div>

                    <p className="text-gray-600 mb-2">
                      {event.startTime ? event.startTime.toLocaleString() : 'No start time'}
                    </p>

                    {event.attendees && event.attendees.length > 0 && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-600">
                          Attendees: {event.attendees.map(a => a.name || a.email).join(', ')}
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

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={!!event.botData}
                          onChange={() => {
                            if (event.botData) {
                              // TODO: Add unschedule functionality
                              // TODO: Implement unschedule functionality
                            } else {
                              void scheduleBot(event.id);
                            }
                          }}
                          disabled={!isZoomMeeting(event) || !extractMeetingUrl(event)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className={event.botData ? 'text-green-600' : 'text-gray-600'}>
                          {event.botData ? 'Notetaker Scheduled' : 'Schedule Notetaker'}
                        </span>
                      </label>
                    </div>

                    {event.botData && (
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Bot ID: {event.botData.botId.slice(-8)}</div>
                        <div>External ID: {event.botData.externalBotId.slice(-8)}</div>
                        <div>Joins {event.botData.joinMinutesBefore} min before</div>
                        <div className="text-green-600">✓ {event.botData.status}</div>
                        <div className="text-gray-400">
                          Scheduled: {new Date(event.botData.scheduledAt).toLocaleString()}
                        </div>

                        {/* Show bot settings used */}
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <div className="font-medium text-gray-700">Settings Used:</div>
                          <div>Join Time: {event.botData.settingsUsed.joinMinutesBefore} min</div>
                          <div>Max Bots: {event.botData.settingsUsed.maxConcurrentBots}</div>
                          <div>
                            Auto Schedule: {event.botData.settingsUsed.autoSchedule ? 'Yes' : 'No'}
                          </div>
                        </div>

                        {/* Bot scheduled for upcoming meeting */}
                        <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                          <div className="font-medium text-green-800">Bot Scheduled</div>
                          <div>Will join {event.botData.joinMinutesBefore} min before</div>
                        </div>

                        {/* Show Recall.ai response details */}
                        <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                          <div className="font-medium text-green-800">Recall.ai Details:</div>
                          <div>Bot Name: {event.botData.recallResponse.bot_name || 'N/A'}</div>
                          <div>
                            Audio: {event.botData.recallResponse.record_audio ? 'Yes' : 'No'}
                          </div>
                          <div>
                            Video: {event.botData.recallResponse.record_video ? 'Yes' : 'No'}
                          </div>
                          <div>
                            Screen: {event.botData.recallResponse.record_screen ? 'Yes' : 'No'}
                          </div>
                        </div>
                      </div>
                    )}

                    {!isZoomMeeting(event) && (
                      <div className="text-xs text-amber-600">⚠️ Not a Zoom meeting</div>
                    )}
                    {isZoomMeeting(event) && !extractMeetingUrl(event) && (
                      <div className="text-xs text-amber-600">⚠️ No Zoom link found</div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {events.length === 0 && !isLoading && (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Upcoming Meetings</h3>
              <p className="text-gray-600">
                No upcoming meetings found. Schedule some meetings in your calendar to see them
                here.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Recall API Response Modal */}
      {showRecallResponse && recallResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Recall.ai Bot Creation Response</h2>
                <button
                  onClick={() => setShowRecallResponse(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">Bot Details:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Bot ID:</strong> {recallResponse.id}
                  </div>
                  <div>
                    <strong>Status:</strong> {recallResponse.status}
                  </div>
                  <div>
                    <strong>Bot Name:</strong> {recallResponse.bot_name || 'N/A'}
                  </div>
                  <div>
                    <strong>Created At:</strong> {recallResponse.created_at}
                  </div>
                  <div>
                    <strong>Meeting URL:</strong> {recallResponse.meeting_url}
                  </div>
                  <div>
                    <strong>Webhook URL:</strong> {recallResponse.webhook_url || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">Recording Settings:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Record Audio:</strong> {recallResponse.record_audio ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>Record Video:</strong> {recallResponse.record_video ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>Record Screen:</strong> {recallResponse.record_screen ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">Raw Response:</h3>
                <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                  {JSON.stringify(recallResponse, null, 2)}
                </pre>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setShowRecallResponse(false)} variant="outline">
                  Close
                </Button>
                <Button
                  onClick={() => {
                    void navigator.clipboard.writeText(JSON.stringify(recallResponse, null, 2));
                  }}
                  variant="outline"
                >
                  Copy Response
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
