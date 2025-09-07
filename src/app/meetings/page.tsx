'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Meeting, ApiResponse, GeneratedContent } from '@/types/master-interfaces';
import { MeetingPlatform, isGeneratedContent } from '@/types/master-interfaces';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/recall/bots');
      const result = (await response.json()) as ApiResponse<
        Array<{
          botId: string;
          eventId: string;
          status: string;
          meetingUrl: string;
          startedAt: string;
          endedAt?: string;
          duration?: number;
          participantCount?: number;
          transcriptUrl?: string;
          recordingUrl?: string;
        }>
      >;

      if (result.success && result.data) {
        // Convert bot data to meeting format
        const meetingData = result.data.map(bot => ({
          id: bot.eventId,
          summary: `Meeting ${bot.eventId}`,
          description: 'Meeting description',
          start: {
            dateTime: bot.startedAt,
            timeZone: 'America/New_York',
          },
          end: {
            dateTime: bot.endedAt || new Date().toISOString(),
            timeZone: 'America/New_York',
          },
          attendees: [
            {
              email: 'advisor@example.com',
              displayName: 'Financial Advisor',
              responseStatus: 'accepted',
            },
            {
              email: 'client@example.com',
              displayName: 'Client',
              responseStatus: 'accepted',
            },
          ],
          location: 'Virtual Meeting',
          meetingUrl: bot.meetingUrl,
          platform: MeetingPlatform.ZOOM,
          status:
            bot.status === 'completed'
              ? 'completed'
              : bot.status === 'recording'
                ? 'recording'
                : 'upcoming',
          botId: bot.botId,
          transcriptUrl: bot.transcriptUrl,
          recordingUrl: bot.recordingUrl,
          duration: bot.duration,
          participantCount: bot.participantCount,
        }));
        setMeetings(meetingData);
      } else {
        setError(result.error?.message || 'Failed to fetch meetings');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateFollowUpEmail = async (meetingId: string) => {
    try {
      const response = await fetch('/api/generate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId,
          tone: 'professional',
        }),
      });

      const result = (await response.json()) as ApiResponse<{ email: string }>;

      if (result.success) {
        // Update the meeting with generated email
        setMeetings(prev =>
          prev.map(meeting =>
            meeting.id === meetingId ? { ...meeting, followUpEmail: result.data.email } : meeting
          )
        );
      } else {
        setError(result.error?.message || 'Failed to generate follow-up email');
      }
    } catch (err) {
      setError('Failed to generate follow-up email');
    }
  };

  const generateSocialPost = async (meetingId: string) => {
    try {
      const response = await fetch('/api/generate-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId,
          platform: 'linkedin',
          tone: 'professional',
        }),
      });

      const result = (await response.json()) as ApiResponse<GeneratedContent>;

      if (result.success && result.data && isGeneratedContent(result.data)) {
        // Update the meeting with generated social post
        const socialPost = result.data;
        setMeetings(prev =>
          prev.map(meeting => (meeting.id === meetingId ? { ...meeting, socialPost } : meeting))
        );
      } else {
        const errorMessage = result.error?.message || 'Failed to generate social post';
        setError(errorMessage);
      }
    } catch (err) {
      setError('Failed to generate social post');
    }
  };

  useEffect(() => {
    void fetchMeetings();
  }, [fetchMeetings]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'recording':
        return 'bg-yellow-100 text-yellow-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformIcon = (platform: MeetingPlatform) => {
    switch (platform) {
      case MeetingPlatform.ZOOM:
        return '🔵';
      case MeetingPlatform.MICROSOFT_TEAMS:
        return '🔷';
      case MeetingPlatform.GOOGLE_MEET:
        return '🟢';
      case MeetingPlatform.WEBEX:
        return '🟠';
      default:
        return '📹';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">📋 Meeting Management</h1>
          <p className="text-lg text-gray-600">
            View past meetings, transcripts, and generate content
          </p>
        </div>

        <div className="mb-6">
          <Button
            onClick={() => void fetchMeetings()}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? 'Loading...' : 'Refresh Meetings'}
          </Button>
        </div>

        {error && (
          <Card className="p-6 border-red-200 bg-red-50 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </Card>
        )}

        <Tabs defaultValue="meetings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="meetings">All Meetings</TabsTrigger>
            <TabsTrigger value="details">Meeting Details</TabsTrigger>
          </TabsList>

          <TabsContent value="meetings" className="space-y-4">
            <div className="grid gap-4">
              {meetings.map(meeting => (
                <Card key={meeting.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{meeting.summary}</h3>
                        <Badge className={getStatusColor(meeting.status)}>{meeting.status}</Badge>
                        <Badge variant="outline">
                          {getPlatformIcon(meeting.platform || MeetingPlatform.OTHER)}{' '}
                          {meeting.platform}
                        </Badge>
                      </div>

                      <p className="text-gray-600 mb-2">
                        {new Date(meeting.start.dateTime).toLocaleString()}
                      </p>

                      {meeting.attendees && meeting.attendees.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-600">
                            Attendees:{' '}
                            {meeting.attendees.map(a => a.displayName || a.email).join(', ')}
                          </p>
                        </div>
                      )}

                      {meeting.duration && (
                        <p className="text-sm text-gray-600 mb-2">
                          Duration: {Math.floor(meeting.duration / 60)} minutes
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button onClick={() => setSelectedMeeting(meeting)} size="sm">
                        View Details
                      </Button>
                      {meeting.status === 'completed' && (
                        <Button
                          onClick={() => void generateFollowUpEmail(meeting.id)}
                          variant="outline"
                          size="sm"
                        >
                          Generate Email
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {meetings.length === 0 && !isLoading && (
              <Card className="p-8 text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Meetings Found</h3>
                <p className="text-gray-600">Schedule some meetings with bots to see them here.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {selectedMeeting ? (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">{selectedMeeting.summary}</h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Meeting Details</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Start:</strong>{' '}
                        {new Date(selectedMeeting.start.dateTime).toLocaleString()}
                      </p>
                      <p>
                        <strong>End:</strong>{' '}
                        {new Date(selectedMeeting.end.dateTime).toLocaleString()}
                      </p>
                      <p>
                        <strong>Platform:</strong> {selectedMeeting.platform}
                      </p>
                      <p>
                        <strong>Status:</strong> {selectedMeeting.status}
                      </p>
                      {selectedMeeting.duration && (
                        <p>
                          <strong>Duration:</strong> {Math.floor(selectedMeeting.duration / 60)}{' '}
                          minutes
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Actions</h3>
                    <div className="space-y-2">
                      <Button
                        onClick={() => void generateFollowUpEmail(selectedMeeting.id)}
                        className="w-full"
                      >
                        Generate Follow-up Email
                      </Button>
                      <Button
                        onClick={() => void generateSocialPost(selectedMeeting.id)}
                        variant="outline"
                        className="w-full"
                      >
                        Generate Social Post
                      </Button>
                      {selectedMeeting.transcriptUrl && (
                        <Button
                          onClick={() => window.open(selectedMeeting.transcriptUrl, '_blank')}
                          variant="outline"
                          className="w-full"
                        >
                          View Transcript
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {selectedMeeting.followUpEmail && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Generated Follow-up Email</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">
                        {selectedMeeting.followUpEmail}
                      </pre>
                    </div>
                  </div>
                )}

                {selectedMeeting.socialPost && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Generated Social Post</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">
                        {selectedMeeting.socialPost.content}
                      </pre>
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Select a Meeting</h3>
                <p className="text-gray-600">
                  Choose a meeting from the list to view its details and generate content.
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
