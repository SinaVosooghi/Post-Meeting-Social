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

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      RECALL_AI_API_KEY: 'test-recall-api-key',
      RECALL_AI_BASE_URL: 'https://api.recall.ai',
    };
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
      const result = await listMeetingBots();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should return empty array when no bots exist', async () => {
      const result = await listMeetingBots();

      expect(result).toHaveLength(0);
    });
  });

  describe('getMeetingTranscript', () => {
    it('should get meeting transcript', async () => {
      const result = await getMeetingTranscript('bot-123');

      expect(result).toBeDefined();
      expect(result.botId).toBeDefined();
      expect(result.meetingId).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.speakers).toBeDefined();
      expect(result.segments).toBeDefined();
    });

    it('should handle transcript fetch for any bot ID', async () => {
      const result = await getMeetingTranscript('any-bot-id');

      expect(result).toBeDefined();
      expect(result.botId).toBeDefined();
      expect(result.content).toBeDefined();
    });
  });
});
