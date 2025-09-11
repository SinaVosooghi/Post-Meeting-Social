/**
 * Recall.ai Integration Library
 *
 * Handles meeting bot scheduling, transcript retrieval, and recording management
 * for the Post-Meeting Social Media Content Generator
 */

import type { RecallBot, BotConfiguration } from '../types';
import type { BotStatus } from '../types/master-interfaces';
import { MeetingPlatformType } from '../types/master-interfaces';
import { createBotID, createMeetingID } from '../types/master-interfaces';
import type { RecallBotApi, RecallTranscriptApi } from '../types/master-interfaces';
import { recallLogger } from './logger';

// ============================================================================
// CONFIGURATION
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
    // webhook_url: process.env.NEXTAUTH_URL + '/api/webhooks/recall', // Disabled - localhost URLs blocked by Recall.ai WAF
  },
};

// ============================================================================
// API CLIENT
// ============================================================================

/**
 * Makes authenticated request to Recall.ai API
 */
async function recallApiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${RECALL_API_CONFIG.baseUrl}${endpoint}`;

  console.log(`[Recall.ai] Making request to: ${url}`);
  console.log(`[Recall.ai] API Key present: ${!!RECALL_API_CONFIG.apiKey}`);
  console.log(`[Recall.ai] Request options:`, options);

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Token ${RECALL_API_CONFIG.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  console.log(`[Recall.ai] Response status: ${response.status}`);

  if (!response.ok) {
    const error = await response.text();
    console.log(`[Recall.ai] Error response:`, error);
    throw new Error(`Recall.ai API error (${response.status}): ${error}`);
  }

  const jsonResponse = (await response.json()) as T;
  console.log(`[Recall.ai] Success response:`, jsonResponse);
  return jsonResponse;
}

// Helper function to convert Date to ISODate
const toISODate = (date: Date): string => (date ? date.toISOString() : new Date().toISOString());

// ============================================================================
// BOT MANAGEMENT
// ============================================================================

/**
 * Creates and schedules a meeting bot for a specific meeting
 */
export async function scheduleMeetingBot(
  meetingUrl: string,
  config: Partial<BotConfiguration> = {}
): Promise<RecallBot> {
  try {
    // 1. Prepare bot configuration
    const botConfig = {
      ...RECALL_API_CONFIG.defaultConfig,
      meeting_url: meetingUrl,
      bot_name: config.botName ?? 'Post-Meeting Content Bot',
      recording_config: {
        transcription: true,
      },
      ...config,
    };

    // 2. Call Recall.ai API to create bot
    const response = await recallApiRequest<RecallBotApi>('/bot/', {
      method: 'POST',
      body: JSON.stringify(botConfig),
    });

    // 3. Transform response to our internal format
    return {
      id: createBotID(response.id),
      externalBotId: response.id,
      meetingId: createMeetingID(meetingUrl),
      meetingUrl,
      status: response.status as BotStatus,
      scheduledAt: toISODate(new Date()),
      joinedAt: response.started_at
        ? toISODate(new Date(response.started_at as string | number | Date))
        : null,
      startedRecordingAt: response.started_at
        ? toISODate(new Date(response.started_at as string | number | Date))
        : null,
      endedAt: null, // Will be set when bot ends
      outputs: {
        recordingUrl: null, // Will be available after recording
        transcriptUrl: null, // Will be available after transcription
        summaryUrl: null,
        participantCount: null,
        recordingSize: null,
        transcriptWordCount: null,
      },
      meetingPlatform: detectMeetingPlatform(meetingUrl),
      errors: [],
      createdAt: toISODate(new Date()),
      updatedAt: toISODate(new Date()),
      config: {
        recordAudio: botConfig.record_audio,
        recordVideo: botConfig.record_video,
        recordScreen: botConfig.record_screen,
        transcriptionEnabled: true,
        realTimeTranscription: false,
        joinMinutesBefore: 5,
        botName: botConfig.bot_name,
        webhookUrl: botConfig.webhookUrl || null,
      },
      transcriptURL: null, // Will be available after transcription
    };
  } catch (error) {
    recallLogger.error('Failed to schedule meeting bot', error as Error | undefined);
    throw new Error(
      `Failed to schedule meeting bot: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * High-level function to schedule a bot with user settings and validation
 */
export async function scheduleBotWithUserSettings(
  userId: string,
  eventId: string,
  meetingUrl: string,
  joinMinutesBefore?: number
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    // Import here to avoid circular dependencies
    const { getBotSettings, saveBotSchedule, getBotSchedulesForUser } = await import(
      './file-storage'
    );

    // 1. Get user settings with defaults
    const userSettings = (await getBotSettings(userId)) || {
      joinMinutesBefore: 5,
      autoSchedule: false,
      maxConcurrentBots: 3,
      updatedAt: new Date().toISOString(),
    };

    const finalJoinMinutesBefore = joinMinutesBefore || userSettings.joinMinutesBefore;

    // 2. Check concurrent bot limit
    const userBotSchedules = await getBotSchedulesForUser(userId);
    if (userBotSchedules.length >= userSettings.maxConcurrentBots) {
      return {
        success: false,
        error: `Maximum concurrent bots limit reached (${userSettings.maxConcurrentBots}). Please wait for some bots to complete.`,
      };
    }

    // 3. Schedule bot with Recall.ai
    console.log(`🤖 Creating bot for user: ${userId}`);
    const recallBot = await scheduleMeetingBot(meetingUrl, {
      joinMinutesBefore: finalJoinMinutesBefore,
      botName: 'Post-Meeting Content Bot',
    });

    // 4. Store bot schedule locally
    const botSchedule = {
      botId: recallBot.id,
      externalBotId: recallBot.externalBotId,
      eventId,
      userId,
      scheduledAt: recallBot.scheduledAt,
      meetingUrl: recallBot.meetingUrl,
      joinMinutesBefore: finalJoinMinutesBefore,
      status: recallBot.status,
      recallResponse: {
        id: recallBot.externalBotId,
        status: recallBot.status,
        meeting_url: recallBot.meetingUrl,
        created_at: recallBot.scheduledAt,
      },
      settingsUsed: {
        joinMinutesBefore: finalJoinMinutesBefore,
        maxConcurrentBots: userSettings.maxConcurrentBots,
        autoSchedule: userSettings.autoSchedule,
      },
    };

    await saveBotSchedule(recallBot.id, botSchedule);
    console.log(`🤖 Bot scheduled: ${recallBot.id} for event: ${eventId}`);

    // 5. Return success response
    return {
      success: true,
      data: {
        botId: recallBot.id,
        externalBotId: recallBot.externalBotId,
        eventId,
        status: recallBot.status,
        joinMinutesBefore: finalJoinMinutesBefore,
        scheduledAt: recallBot.scheduledAt,
        meetingUrl: recallBot.meetingUrl,
        settingsUsed: {
          joinMinutesBefore: finalJoinMinutesBefore,
          maxConcurrentBots: userSettings.maxConcurrentBots,
          autoSchedule: userSettings.autoSchedule,
        },
        recallResponse: {
          id: recallBot.externalBotId,
          status: recallBot.status,
          meeting_url: recallBot.meetingUrl,
          created_at: recallBot.scheduledAt,
        },
        message: 'Bot successfully scheduled for meeting',
      },
    };
  } catch (error) {
    console.error('Bot scheduling error:', error);
    return {
      success: false,
      error: `Failed to schedule bot: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * High-level function to get all bot schedules for a user
 */
export async function getUserBotSchedules(userId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    // Import here to avoid circular dependencies
    const { getBotSchedulesForUser } = await import('./file-storage');

    // Get user's bot schedules
    const userBotSchedules = await getBotSchedulesForUser(userId);

    // Format response data
    const userSchedules: Record<
      string,
      { botScheduled: boolean; botId: string | null; scheduledAt: string; botData?: any }
    > = {};

    for (const schedule of userBotSchedules) {
      userSchedules[schedule.eventId] = {
        botScheduled: true,
        botId: schedule.botId,
        scheduledAt: schedule.scheduledAt,
        botData: schedule,
      };
    }

    return {
      success: true,
      data: userSchedules,
    };
  } catch (error) {
    console.error('Bot status error:', error);
    return {
      success: false,
      error: `Failed to fetch bot status: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Gets the status and details of a meeting bot
 */
export async function getBotStatus(botId: string): Promise<RecallBot> {
  try {
    // 1. Fetch bot status from Recall.ai
    const response = await recallApiRequest<RecallBotApi>(`/bot/${botId}/`);

    // 2. Extract transcript URL if available
    const transcriptURL =
      (response.recordings as any)?.[0]?.media_shortcuts?.transcript?.data?.download_url ?? null;

    // 3. Fetch and process transcript text
    let transcriptText = null;
    if (transcriptURL) {
      try {
        const transcriptResponse = await fetch(transcriptURL);
        const transcriptData = await transcriptResponse.json();

        transcriptText = (transcriptData as any)
          .flatMap((item: any) => (item.words as any).map((w: any) => w.text))
          .join(' ');
      } catch (error) {
        console.warn('Failed to fetch transcript:', error);
        transcriptText = null;
      }
    }

    // 4. Handle meeting_url (can be string or object)
    let meetingUrl: string;
    if (typeof response.meeting_url === 'string') {
      meetingUrl = response.meeting_url;
    } else if (response.meeting_url && typeof response.meeting_url === 'object') {
      const meetingData = response.meeting_url as any;
      if ((meetingData as any).meeting_id && (meetingData as any).platform) {
        meetingUrl = `https://zoom.us/j/${(meetingData as any).meeting_id}`;
      } else {
        meetingUrl = 'unknown';
      }
    } else {
      meetingUrl = 'unknown';
    }

    // 5. Transform to internal format
    return {
      id: createBotID(response.id || 'unknown'),
      externalBotId: response.id || 'unknown',
      meetingId: createMeetingID(meetingUrl || 'unknown'),
      meetingUrl: meetingUrl || 'unknown',
      status: response.status as BotStatus,
      scheduledAt: toISODate(new Date(response.created_at || Date.now())),
      joinedAt: response.started_at ? toISODate(new Date(response.started_at)) : null,
      startedRecordingAt: response.started_at ? toISODate(new Date(response.started_at)) : null,
      endedAt: response.ended_at ? toISODate(new Date(response.ended_at)) : null,
      outputs: {
        recordingUrl: response.recording_url || null,
        transcriptUrl: response.transcript_url || null,
        summaryUrl: null,
        participantCount: response.participant_count || null,
        recordingSize: null,
        transcriptWordCount: response.transcript_word_count || null,
      },
      meetingPlatform: detectMeetingPlatform(meetingUrl),
      errors: [],
      createdAt: toISODate(new Date(Date.now())),
      updatedAt: toISODate(new Date(Date.now())),
      config: {
        recordAudio: response.record_audio || true,
        recordVideo: response.record_video || false,
        recordScreen: response.record_screen || false,
        transcriptionEnabled: true,
        realTimeTranscription: false,
        joinMinutesBefore: 5,
        botName: response.bot_name || 'Meeting Bot',
        webhookUrl: response.webhook_url || null,
      },
      transcriptURL: transcriptText,
    };
  } catch (error) {
    recallLogger.error('Failed to get bot status', error as Error | undefined);
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
    await recallApiRequest(`/bot/${botId}/`, {
      method: 'DELETE',
    });
  } catch (error) {
    recallLogger.error('Failed to cancel meeting bot', error as Error | undefined);
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
        if ((meetingData as any).meeting_id && (meetingData as any).platform) {
          if ((meetingData as any).platform === 'google_meet') {
            meetingUrl = `https://meet.google.com/${(meetingData as any).meeting_id}`;
          } else if ((meetingData as any).platform === 'zoom') {
            meetingUrl = `https://zoom.us/j/${(meetingData as any).meeting_id}`;
          } else if ((meetingData as any).platform === 'microsoft_teams') {
            meetingUrl = `https://teams.microsoft.com/l/meetup-join/${(meetingData as any).meeting_id}`;
          } else {
            meetingUrl = (meetingData as any).meeting_id || 'unknown';
          }
        } else {
          meetingUrl = 'unknown';
        }
      } else {
        meetingUrl = 'unknown';
      }

      return {
        id: createBotID(bot.id),
        externalBotId: bot.id,
        meetingId: createMeetingID(meetingUrl),
        meetingUrl,
        status: bot.status as BotStatus,
        scheduledAt: toISODate(new Date(bot.created_at)),
        joinedAt: bot.started_at ? toISODate(new Date(bot.started_at)) : null,
        startedRecordingAt: bot.started_at ? toISODate(new Date(bot.started_at)) : null,
        endedAt: bot.ended_at ? toISODate(new Date(bot.ended_at)) : null,
        outputs: {
          recordingUrl: bot.recording_url || null,
          transcriptUrl: bot.transcript_url || null,
          summaryUrl: null,
          participantCount: bot.participant_count || null,
          recordingSize: null,
          transcriptWordCount: bot.transcript_word_count || null,
        },
        meetingPlatform: detectMeetingPlatform(meetingUrl),
        errors: [],
        createdAt: toISODate(new Date()),
        updatedAt: toISODate(new Date()),
        config: {
          recordAudio: bot.record_audio || true,
          recordVideo: bot.record_video || false,
          recordScreen: bot.record_screen || false,
          transcriptionEnabled: true,
          realTimeTranscription: false,
          joinMinutesBefore: 5,
          botName: bot.bot_name || 'Meeting Bot',
          webhookUrl: bot.webhook_url || null,
        },
        transcriptURL: bot.recordings?.media_shortcuts?.transcript?.data?.download_url || null,
      };
    });
  } catch (error) {
    recallLogger.error('Failed to list meeting bots', error as Error | undefined);
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
export async function getMeetingTranscript(botId: string): Promise<any> {
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
  } catch (error) {
    recallLogger.error('Failed to get meeting transcript', error as Error | undefined);
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
function detectMeetingPlatform(meetingUrl: string | null | undefined): MeetingPlatformType {
  if (!meetingUrl || typeof meetingUrl !== 'string') {
    return MeetingPlatformType.OTHER;
  }

  const url = meetingUrl.toLowerCase();

  if (url.includes('zoom.us') || url.includes('zoom.com')) {
    return MeetingPlatformType.ZOOM;
  }
  if (url.includes('meet.google.com') || url.includes('google.com/meet')) {
    return MeetingPlatformType.GOOGLE_MEET;
  }
  if (url.includes('teams.microsoft.com') || url.includes('teams.live.com')) {
    return MeetingPlatformType.MICROSOFT_TEAMS;
  }
  if (url.includes('webex.com') || url.includes('cisco.com')) {
    return MeetingPlatformType.WEBEX;
  }

  return MeetingPlatformType.OTHER;
}
