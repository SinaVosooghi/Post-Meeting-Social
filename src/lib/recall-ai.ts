/**
 * Recall.ai Integration
 * Post-Meeting Social Media Content Generator
 *
 * Handles meeting bot scheduling, transcript retrieval, and recording management
 */

import type {
  RecallBot,
  BotStatus,
  BotConfig,
  MeetingTranscript,
  RecallApiResponse,
} from '@/types';
import type { RecallBotApi, RecallTranscriptApi } from '@/types/master-interfaces';
import { recallLogger } from './logger';

// ============================================================================
// RECALL.AI CONFIGURATION
// ============================================================================

const RECALL_API_CONFIG = {
  baseUrl: 'https://us-east-1.recall.ai/api/v1',
  apiKey: process.env.RECALL_AI_API_KEY,
  defaultConfig: {
    record_audio: true,
    record_video: false,
    record_screen: false,
    transcription: {
      provider: 'assembly_ai',
      language: 'en',
      detect_language: true,
      format_text: true,
      include_speaker_labels: true,
    },
    // webhook_url: process.env.NEXTAUTH_URL + '/api/webhooks/recall', // Commented out - localhost URLs are blocked by Recall.ai WAF
  },
};

// ============================================================================
// RECALL.AI CLIENT
// ============================================================================

/**
 * Makes authenticated request to Recall.ai API
 */
async function recallApiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${RECALL_API_CONFIG.baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Token ${RECALL_API_CONFIG.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Recall.ai API error (${response.status}): ${error}`);
  }

  const jsonResponse = (await response.json()) as T;
  return jsonResponse;
}

// ============================================================================
// BOT MANAGEMENT
// ============================================================================

/**
 * Creates and schedules a meeting bot for a specific meeting
 */
export async function scheduleMeetingBot(
  meetingUrl: string,
  config: Partial<BotConfig> = {}
): Promise<RecallBot> {
  try {
    // For development/demo - return mock bot only if no API key
    // if (!RECALL_API_CONFIG.apiKey || RECALL_API_CONFIG.apiKey === 'your-recall-ai-api-key') {
    //   return createMockBot(meetingUrl, config);
    // }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const botConfig = {
      ...RECALL_API_CONFIG.defaultConfig,
      meeting_url: meetingUrl,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      bot_name: config.botName ?? 'Post-Meeting Content Bot',
      ...config,
    };

    // Try real API first, fall back to mock on error
    try {
      const response = await recallApiRequest<RecallBotApi>('/bot/', {
        method: 'POST',
        body: JSON.stringify(botConfig),
      });

      return {
        id: response.id,
        meetingUrl,
        status: response.status,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        botName: botConfig.bot_name,
        scheduledAt: new Date(response.created_at as string | number | Date),
        startedAt: response.started_at
          ? new Date(response.started_at as string | number | Date)
          : null,
        endedAt: response.ended_at ? new Date(response.ended_at as string | number | Date) : null,
        recordingUrl: (response.recording_url as string) || null,
        transcriptUrl: (response.transcript_url as string) || null,
        config: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          recordAudio: botConfig.record_audio,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          recordVideo: botConfig.record_video,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          recordScreen: botConfig.record_screen,
          transcriptionEnabled: true,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          botName: botConfig.bot_name,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          webhookUrl: botConfig.webhook_url,
        },
        metadata: {
          meetingPlatform: detectMeetingPlatform(meetingUrl),
          duration: null,
          participantCount: null,
          transcriptWordCount: null,
        },
      };
    } catch (apiError) {
      console.log('Recall.ai bot scheduling API failed:', apiError);
      // TODO: Fix real API instead of falling back to mock
      throw apiError;
    }
  } catch (error) {
    recallLogger.error('Failed to schedule meeting bot', error);
    throw new Error(
      `Failed to schedule meeting bot: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets the status and details of a meeting bot
 */
export async function getBotStatus(botId: string): Promise<RecallBot> {
  try {
    // For development/demo - return mock bot status only if no API key
    if (!RECALL_API_CONFIG.apiKey || RECALL_API_CONFIG.apiKey === 'your-recall-ai-api-key') {
      return getMockBotStatus(botId);
    }

    const response = await recallApiRequest<RecallBotApi>(`/bot/${botId}/`);

    return {
      id: response.id,
      meetingUrl: response.meeting_url,
      status: response.status,
      botName: response.bot_name || 'Meeting Bot',
      scheduledAt: new Date(response.created_at as string | number | Date),
      startedAt: response.started_at
        ? new Date(response.started_at as string | number | Date)
        : null,
      endedAt: response.ended_at ? new Date(response.ended_at as string | number | Date) : null,
      recordingUrl: (response.recording_url as string) || null,
      transcriptUrl: (response.transcript_url as string) || null,
      config: {
        recordAudio: response.record_audio || true,
        recordVideo: response.record_video || false,
        recordScreen: response.record_screen || false,
        transcriptionEnabled: true,
        botName: response.bot_name || 'Meeting Bot',
        webhookUrl: response.webhook_url || null,
      },
      metadata: {
        meetingPlatform: detectMeetingPlatform(response.meeting_url),
        duration: response.duration || null,
        participantCount: response.participant_count || null,
        transcriptWordCount: response.transcript_word_count || null,
      },
    };
  } catch (error) {
    recallLogger.error('Failed to get bot status', error);
    throw new Error(
      `Failed to get bot status: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Cancels a scheduled meeting bot
 */
export async function cancelMeetingBot(botId: string): Promise<void> {
  try {
    // For development/demo - just log the cancellation only if no API key
    if (!RECALL_API_CONFIG.apiKey || RECALL_API_CONFIG.apiKey === 'your-recall-ai-api-key') {
      recallLogger.info(`Mock: Cancelled meeting bot ${botId}`);
      return;
    }

    await recallApiRequest(`/bot/${botId}/`, {
      method: 'DELETE',
    });
  } catch (error) {
    recallLogger.error('Failed to cancel meeting bot', error);
    throw new Error(
      `Failed to cancel meeting bot: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Lists all bots for the current user
 */
export async function listMeetingBots(
  options: {
    limit?: number;
    status?: BotStatus;
    dateFrom?: Date;
    dateTo?: Date;
  } = {}
): Promise<RecallBot[]> {
  try {
    // For development/demo - return mock bots only if no API key
    // if (!RECALL_API_CONFIG.apiKey || RECALL_API_CONFIG.apiKey === 'your-recall-ai-api-key' || RECALL_API_CONFIG.apiKey === '') {
    //   console.log('Using mock data for Recall.ai - no API key provided');
    //   return getMockBotList(options);
    // }

    // Try real API first, fall back to mock on error
    try {
      const params = new URLSearchParams();
      if (options.limit) {
        params.append('limit', options.limit.toString());
      }
      if (options.status && options.status !== null) {
        params.append('status', options.status);
      }
      if (options.dateFrom) {
        params.append('created_after', options.dateFrom.toISOString());
      }
      if (options.dateTo) {
        params.append('created_before', options.dateTo.toISOString());
      }

      const response = await recallApiRequest<{
        count: number;
        next: string | null;
        previous: string | null;
        results: RecallBotApi[];
      }>(`/bot/?${params.toString()}`);

      return response.results.map(bot => {
        // Handle meeting_url which might be a string or object
        let meetingUrl: string;
        if (typeof bot.meeting_url === 'string') {
          meetingUrl = bot.meeting_url;
        } else if (bot.meeting_url && typeof bot.meeting_url === 'object') {
          // If it's an object, try to construct URL from meeting_id and platform
          const meetingData = bot.meeting_url as any;
          if (meetingData.meeting_id && meetingData.platform) {
            if (meetingData.platform === 'google_meet') {
              meetingUrl = `https://meet.google.com/${meetingData.meeting_id}`;
            } else if (meetingData.platform === 'zoom') {
              meetingUrl = `https://zoom.us/j/${meetingData.meeting_id}`;
            } else if (meetingData.platform === 'microsoft_teams') {
              meetingUrl = `https://teams.microsoft.com/l/meetup-join/${meetingData.meeting_id}`;
            } else {
              meetingUrl = meetingData.meeting_id || 'unknown';
            }
          } else {
            meetingUrl = 'unknown';
          }
        } else {
          meetingUrl = 'unknown';
        }

        return {
          id: bot.id,
          meetingUrl,
          status: bot.status,
          botName: bot.bot_name || 'Meeting Bot',
          scheduledAt: new Date(bot.created_at),
          startedAt: bot.started_at ? new Date(bot.started_at) : null,
          endedAt: bot.ended_at ? new Date(bot.ended_at) : null,
          recordingUrl: bot.recording_url || null,
          transcriptUrl: bot.transcript_url || null,
          config: {
            recordAudio: bot.record_audio || true,
            recordVideo: bot.record_video || false,
            recordScreen: bot.record_screen || false,
            transcriptionEnabled: true,
            botName: bot.bot_name || 'Meeting Bot',
            webhookUrl: bot.webhook_url || null,
          },
          metadata: {
            meetingPlatform: detectMeetingPlatform(meetingUrl),
            duration: bot.duration || null,
            participantCount: bot.participant_count || null,
            transcriptWordCount: bot.transcript_word_count || null,
          },
        };
      });
    } catch (apiError) {
      console.log('Recall.ai API failed:', apiError);
      // TODO: Fix real API instead of falling back to mock
      throw apiError;
    }
  } catch (error) {
    recallLogger.error('Failed to list meeting bots', error);
    throw new Error(
      `Failed to list meeting bots: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ============================================================================
// TRANSCRIPT OPERATIONS
// ============================================================================

/**
 * Retrieves the transcript for a completed meeting bot
 */
export async function getMeetingTranscript(botId: string): Promise<MeetingTranscript> {
  try {
    // For development/demo - return mock transcript only if no API key
    // if (!RECALL_API_CONFIG.apiKey || RECALL_API_CONFIG.apiKey === 'your-recall-ai-api-key') {
    //   // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    //   return getMockTranscript(botId);
    // }

    // Try real API first, fall back to mock on error
    try {
      const response = await recallApiRequest<RecallTranscriptApi>(`/bot/${botId}/transcript/`);

      return {
        botId,
        meetingId: response.meeting_id,
        content: response.transcript,
        speakers: response.speakers || [],
        segments:
          response.segments?.map(segment => ({
            speaker: segment.speaker,
            text: segment.text,
            startTime: segment.start_time,
            endTime: segment.end_time,
            confidence: segment.confidence || 0.95,
          })) || [],
        summary: response.summary || null,
        keyPoints: response.key_points || [],
        actionItems: response.action_items || [],
        duration: response.duration || 0,
        wordCount: response.word_count || 0,
        language: response.language || 'en',
        createdAt: new Date(response.created_at),
      };
    } catch (apiError) {
      console.log('Recall.ai transcript API failed:', apiError);
      // TODO: Fix real API instead of falling back to mock
      throw apiError;
    }
  } catch (error) {
    recallLogger.error('Failed to get meeting transcript', error);
    throw new Error(
      `Failed to get meeting transcript: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Detects meeting platform from URL
 */
function detectMeetingPlatform(
  meetingUrl: string | null | undefined
): 'zoom' | 'google-meet' | 'microsoft-teams' | 'webex' | 'other' {
  if (!meetingUrl || typeof meetingUrl !== 'string') {
    return 'other';
  }

  const url = meetingUrl.toLowerCase();
  if (url.includes('zoom.us') || url.includes('zoom.com')) {
    return 'zoom';
  }
  if (url.includes('meet.google.com') || url.includes('google.com/meet')) {
    return 'google-meet';
  }
  if (url.includes('teams.microsoft.com') || url.includes('teams.live.com')) {
    return 'microsoft-teams';
  }
  if (url.includes('webex.com') || url.includes('cisco.com')) {
    return 'webex';
  }
  return 'other';
}

// ============================================================================
// MOCK DATA FOR DEVELOPMENT
// ============================================================================

/**
 * Creates a mock bot for development
 */
function createMockBot(meetingUrl: string, config: Partial<BotConfig>): RecallBot {
  const botId = `mock-bot-${Date.now()}`;

  return {
    id: botId,
    meetingUrl,
    status: 'scheduled' as BotStatus,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    botName: config.botName ?? 'Post-Meeting Content Bot',
    scheduledAt: new Date(),
    startedAt: null,
    endedAt: null,
    recordingUrl: null,
    transcriptUrl: null,
    config: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      recordAudio: config.recordAudio ?? true,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      recordVideo: config.recordVideo ?? false,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      recordScreen: config.recordScreen ?? false,
      transcriptionEnabled: true,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      botName: config.botName ?? 'Post-Meeting Content Bot',
      webhookUrl: RECALL_API_CONFIG.defaultConfig.webhook_url,
    },
    metadata: {
      meetingPlatform: detectMeetingPlatform(meetingUrl),
      duration: null,
      participantCount: null,
      transcriptWordCount: null,
    },
  };
}

/**
 * Gets mock bot status
 */
function getMockBotStatus(botId: string): RecallBot {
  // Simulate different statuses based on bot age
  const isOld = botId.includes('old');
  const isActive = botId.includes('active');

  let status: BotStatus = 'scheduled';
  let startedAt: Date | null = null;
  let endedAt: Date | null = null;
  let recordingUrl: string | null = null;
  let transcriptUrl: string | null = null;

  if (isActive) {
    status = 'recording';
    startedAt = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
  } else if (isOld) {
    status = 'completed';
    startedAt = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    endedAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    recordingUrl = `https://mock-recordings.recall.ai/${botId}.mp4`;
    transcriptUrl = `https://mock-transcripts.recall.ai/${botId}.json`;
  }

  return {
    id: botId,
    meetingUrl: 'https://zoom.us/j/1234567890',
    status,
    botName: 'Post-Meeting Content Bot',
    scheduledAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    startedAt,
    endedAt,
    recordingUrl,
    transcriptUrl,
    config: {
      recordAudio: true,
      recordVideo: false,
      recordScreen: false,
      transcriptionEnabled: true,
      botName: 'Post-Meeting Content Bot',
      webhookUrl: RECALL_API_CONFIG.defaultConfig.webhook_url,
    },
    metadata: {
      meetingPlatform: 'zoom',
      duration: endedAt ? 45 : null,
      participantCount: endedAt ? 3 : null,
      transcriptWordCount: endedAt ? 2500 : null,
    },
  };
}

/**
 * Gets mock bot list
 */
function getMockBotList(options: { status?: BotStatus; limit?: number }): RecallBot[] {
  const bots = [
    getMockBotStatus('mock-bot-old-1'),
    getMockBotStatus('mock-bot-active-2'),
    getMockBotStatus('mock-bot-scheduled-3'),
  ];

  if (options.status !== null) {
    return bots.filter(bot => bot.status === options.status);
  }

  return bots.slice(0, options.limit || 10);
}

/**
 * Gets mock transcript
 */
function getMockTranscript(botId: string): MeetingTranscript {
  return {
    botId,
    meetingId: `meeting-${botId}`,
    content: `Meeting: Q4 Portfolio Review with Sarah Johnson

Attendees: John Smith (Financial Advisor), Sarah Johnson (Client)

Key Discussion Points:
- Reviewed portfolio performance over the past quarter
- Discussed market volatility and its impact on long-term goals
- Explored opportunities for tax-loss harvesting
- Addressed concerns about inflation and interest rate changes
- Reviewed retirement planning timeline and adjusted contributions
- Discussed diversification strategies across asset classes

Action Items:
- Rebalance portfolio to target allocation
- Increase 401k contribution by 2%
- Schedule next review for February
- Research ESG investment options

Client expressed satisfaction with current strategy and confidence in long-term approach. Meeting concluded with clear next steps and timeline for implementation.`,
    speakers: ['John Smith', 'Sarah Johnson'],
    segments: [
      {
        speaker: 'John Smith',
        text: "Good morning Sarah, thanks for joining me today. Let's review your portfolio performance.",
        startTime: 0,
        endTime: 5,
        confidence: 0.98,
      },
      {
        speaker: 'Sarah Johnson',
        text: "Good morning John. I'm looking forward to seeing how we've done this quarter.",
        startTime: 5,
        endTime: 10,
        confidence: 0.96,
      },
    ],
    summary:
      'Quarterly portfolio review meeting discussing performance, market conditions, and strategy adjustments.',
    keyPoints: [
      'Portfolio performed well despite market volatility',
      'Opportunity for tax-loss harvesting identified',
      'Client comfortable with current investment strategy',
      'Retirement timeline on track with increased contributions',
    ],
    actionItems: [
      'Rebalance portfolio to target allocation',
      'Increase 401k contribution by 2%',
      'Schedule next review for February',
      'Research ESG investment options',
    ],
    duration: 2700, // 45 minutes
    wordCount: 2500,
    language: 'en',
    createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
  };
}
