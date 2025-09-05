/**
 * Tests for OpenAI Integration Service
 * Post-Meeting Social Media Content Generator
 */

import {
  generateMockSocialMediaPosts,
  generateMockFollowUpEmail,
  validateOpenAIConfig,
  getPostGenerationFunction,
  getEmailGenerationFunction,
} from '../openai';
import { ContentTone, ContentLength, MeetingPlatform, SocialPlatform } from '@/types';

describe('OpenAI Service', () => {
  describe('validateOpenAIConfig', () => {
    const originalEnv = process.env.OPENAI_API_KEY;

    beforeEach(() => {
      // Clear the environment variable before each test
      delete process.env.OPENAI_API_KEY;
    });

    afterEach(() => {
      // Restore original value
      if (originalEnv) {
        process.env.OPENAI_API_KEY = originalEnv;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
    });

    it('should return invalid when API key is not set', () => {
      const result = validateOpenAIConfig();
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('OPENAI_API_KEY environment variable is not set');
    });

    it('should return invalid for malformed API key', () => {
      process.env.OPENAI_API_KEY = 'invalid-key';
      const result = validateOpenAIConfig();
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid OpenAI API key format');
    });

    it('should return valid for properly formatted API key', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key-123';
      const result = validateOpenAIConfig();
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('generateMockSocialMediaPosts', () => {
    it('should generate mock social media posts', async () => {
      const request = {
        transcript: 'Test meeting transcript about financial planning',
        meetingContext: {
          title: 'Financial Planning Meeting',
          attendees: ['Advisor', 'Client'],
          duration: 30,
          platform: MeetingPlatform.ZOOM,
        },
        automationSettings: {
          maxPosts: 2,
          includeHashtags: true,
          includeEmojis: false,
          tone: ContentTone.PROFESSIONAL,
          length: ContentLength.MEDIUM,
          publishImmediately: false,
          scheduleDelay: 0,
        },
      };

      const result = await generateMockSocialMediaPosts(request);

      expect(result.posts).toHaveLength(2);
      expect(result.posts[0]).toHaveProperty('platform', SocialPlatform.LINKEDIN);
      expect(result.posts[0]).toHaveProperty('content');
      expect(result.posts[0]).toHaveProperty('hashtags');
      expect(result.posts[0]).toHaveProperty('reasoning');
      expect(result.metadata).toHaveProperty('tokensUsed');
      expect(result.metadata).toHaveProperty('processingTimeMs');
      expect(result.metadata.model).toBe('gpt-4-mock');
    });

    it('should respect maxPosts setting', async () => {
      const request = {
        transcript: 'Test transcript',
        meetingContext: {
          title: 'Test Meeting',
          attendees: ['User'],
          duration: 15,
          platform: MeetingPlatform.ZOOM,
        },
        automationSettings: {
          maxPosts: 1,
          includeHashtags: true,
          includeEmojis: false,
          tone: ContentTone.PROFESSIONAL,
          length: ContentLength.SHORT,
          publishImmediately: false,
          scheduleDelay: 0,
        },
      };

      const result = await generateMockSocialMediaPosts(request);
      expect(result.posts).toHaveLength(1);
    });
  });

  describe('generateMockFollowUpEmail', () => {
    it('should generate mock follow-up email', async () => {
      const transcript = 'Meeting transcript about investment strategy';
      const attendees = ['John Advisor', 'Jane Client'];
      const meetingTitle = 'Investment Strategy Review';

      const result = await generateMockFollowUpEmail(transcript, attendees, meetingTitle);

      expect(result).toHaveProperty('subject');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('actionItems');
      expect(result).toHaveProperty('nextSteps');
      expect(result.subject).toContain(meetingTitle);
      expect(Array.isArray(result.actionItems)).toBe(true);
      expect(result.actionItems.length).toBeGreaterThan(0);
    });
  });

  describe('getPostGenerationFunction', () => {
    const originalEnv = process.env.OPENAI_API_KEY;

    beforeEach(() => {
      delete process.env.OPENAI_API_KEY;
    });

    afterEach(() => {
      if (originalEnv) {
        process.env.OPENAI_API_KEY = originalEnv;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
    });

    it('should return mock function when API key is not configured', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const fn = getPostGenerationFunction();
      expect(fn).toBe(generateMockSocialMediaPosts);
      expect(consoleSpy).toHaveBeenCalledWith(
        'OpenAI API not configured, using mock data:',
        'OPENAI_API_KEY environment variable is not set'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getEmailGenerationFunction', () => {
    const originalEnv = process.env.OPENAI_API_KEY;

    beforeEach(() => {
      delete process.env.OPENAI_API_KEY;
    });

    afterEach(() => {
      if (originalEnv) {
        process.env.OPENAI_API_KEY = originalEnv;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
    });

    it('should return mock function when API key is not configured', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const fn = getEmailGenerationFunction();
      expect(fn).toBe(generateMockFollowUpEmail);
      expect(consoleSpy).toHaveBeenCalledWith(
        'OpenAI API not configured, using mock data:',
        'OPENAI_API_KEY environment variable is not set'
      );

      consoleSpy.mockRestore();
    });
  });
});
