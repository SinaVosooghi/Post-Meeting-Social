/**
 * Tests for Recall.ai Integration
 * Post-Meeting Social Media Content Generator
 */

import {
  scheduleMeetingBot,
  getBotStatus,
  cancelMeetingBot,
  listMeetingBots,
  getMeetingTranscript,
} from '../recall-ai';
import { BotStatus } from '@/types/master-interfaces';

// Mock external dependencies
jest.mock('@/lib/logger', () => ({
  recallLogger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Recall.ai Integration', () => {
  const originalEnv = process.env;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      RECALL_AI_API_KEY: 'test-recall-api-key',
      RECALL_AI_BASE_URL: 'https://api.recall.ai',
    };

    // Mock successful fetch responses by default
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        id: 'test-bot-123',
        status: 'scheduled',
        meeting_url: 'https://zoom.us/j/123456789',
        bot_name: 'Test Bot',
        record_audio: true,
        record_video: false,
        record_screen: false,
        transcription_enabled: true,
        real_time_transcription: false,
        webhook_url: 'https://example.com/webhook',
        join_minutes_before: 5,
      }),
    } as any);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('scheduleMeetingBot', () => {
    it('should schedule a new meeting bot', async () => {
      const result = await scheduleMeetingBot('https://zoom.us/j/123456789', {
        botName: 'Test Bot',
        recordAudio: true,
        recordVideo: false,
        recordScreen: false,
        transcriptionEnabled: true,
        realTimeTranscription: false,
        webhookUrl: 'https://example.com/webhook',
        joinMinutesBefore: 5,
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.status).toBe(BotStatus.SCHEDULED);
      expect(result.meetingUrl).toBe('https://zoom.us/j/123456789');
      expect(result.config.botName).toBe('Test Bot');
    });

    it('should handle invalid meeting URL gracefully', async () => {
      const result = await scheduleMeetingBot('invalid-url');

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.status).toBe(BotStatus.SCHEDULED);
      expect(result.meetingUrl).toBe('invalid-url');
    });
  });

  describe('getBotStatus', () => {
    it('should get bot status', async () => {
      const result = await getBotStatus('bot-123');

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.status).toBe(BotStatus.SCHEDULED);
      expect(result.meetingUrl).toBeDefined();
    });

    it('should handle bot status fetch for any bot ID', async () => {
      const result = await getBotStatus('any-bot-id');

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.status).toBeDefined();
    });
  });

  describe('cancelMeetingBot', () => {
    it('should cancel a meeting bot', async () => {
      await expect(cancelMeetingBot('bot-123')).resolves.not.toThrow();
    });

    it('should handle bot cancellation for any bot ID', async () => {
      await expect(cancelMeetingBot('any-bot-id')).resolves.not.toThrow();
    });
  });

  describe('listMeetingBots', () => {
    it('should list meeting bots', async () => {
      // Mock response for listMeetingBots
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          count: 2,
          next: null,
          previous: null,
          results: [
            {
              id: 'bot-1',
              status: 'scheduled',
              meeting_url: 'https://zoom.us/j/123456789',
            },
            {
              id: 'bot-2',
              status: 'recording',
              meeting_url: 'https://teams.microsoft.com/l/meetup-join/123',
            },
          ],
        }),
      } as any);

      const result = await listMeetingBots();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should return empty array when no bots exist', async () => {
      // Mock empty response for listMeetingBots
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          count: 0,
          next: null,
          previous: null,
          results: [],
        }),
      } as any);

      const result = await listMeetingBots();

      expect(result).toHaveLength(0);
    });
  });

  describe('getMeetingTranscript', () => {
    it('should get meeting transcript', async () => {
      // Mock response for getMeetingTranscript
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          bot_id: 'bot-123',
          meeting_id: 'meeting-456',
          transcript: 'This is a test transcript of the meeting.',
          speakers: [
            { id: 'speaker-1', name: 'John Doe' },
            { id: 'speaker-2', name: 'Jane Smith' },
          ],
          segments: [
            {
              speaker: 'speaker-1',
              text: 'Hello everyone, welcome to our meeting.',
              start_time: 0,
              end_time: 3,
            },
            {
              speaker: 'speaker-2',
              text: 'Thank you for having me.',
              start_time: 3,
              end_time: 6,
            },
          ],
        }),
      } as any);

      const result = await getMeetingTranscript('bot-123');

      expect(result).toBeDefined();
      expect(result.botId).toBeDefined();
      expect(result.meetingId).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.speakers).toBeDefined();
      expect(result.segments).toBeDefined();
    });

    it('should handle transcript fetch for any bot ID', async () => {
      // Mock response for getMeetingTranscript
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          bot_id: 'any-bot-id',
          meeting_id: 'meeting-789',
          transcript: 'This is another test transcript.',
          speakers: [{ id: 'speaker-1', name: 'Test Speaker' }],
          segments: [
            {
              speaker: 'speaker-1',
              text: 'This is a test segment.',
              start_time: 0,
              end_time: 2,
            },
          ],
        }),
      } as any);

      const result = await getMeetingTranscript('any-bot-id');

      expect(result).toBeDefined();
      expect(result.botId).toBeDefined();
      expect(result.content).toBeDefined();
    });
  });
});
