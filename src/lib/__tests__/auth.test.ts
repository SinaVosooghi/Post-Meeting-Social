/**
 * Authentication Utilities Tests
 * Post-Meeting Social Media Content Generator
 *
 * Comprehensive tests for authentication functions and utilities
 */

// Mock NextAuth to avoid ES module issues
jest.mock('next-auth', () => ({
  auth: jest.fn(),
}));

import {
  hasValidGoogleToken,
  getGoogleAccessToken,
  hasGoogleCalendarAccess,
  refreshGoogleToken,
} from '../auth';
import type { Session } from 'next-auth';

// Mock fetch for token refresh tests
global.fetch = jest.fn();

describe('Authentication Utilities', () => {
  describe('hasValidGoogleToken', () => {
    it('should return true for valid token without expiration', () => {
      const session: Session = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        accessToken: 'valid-token',
        expiresAt: undefined,
      };

      expect(hasValidGoogleToken(session)).toBe(true);
    });

    it('should return true for valid token with future expiration', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const session: Session = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        accessToken: 'valid-token',
        expiresAt: futureTime,
      };

      expect(hasValidGoogleToken(session)).toBe(true);
    });

    it('should return false for session without access token', () => {
      const session: Session = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        accessToken: undefined,
        expiresAt: undefined,
      };

      expect(hasValidGoogleToken(session)).toBe(false);
    });

    it('should return false for expired token', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const session: Session = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        accessToken: 'expired-token',
        expiresAt: pastTime,
      };

      expect(hasValidGoogleToken(session)).toBe(false);
    });
  });

  describe('getGoogleAccessToken', () => {
    it('should return access token for valid session', () => {
      const session: Session = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        accessToken: 'valid-token',
        expiresAt: undefined,
      };

      expect(getGoogleAccessToken(session)).toBe('valid-token');
    });

    it('should return null for invalid session', () => {
      const session: Session = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        accessToken: undefined,
        expiresAt: undefined,
      };

      expect(getGoogleAccessToken(session)).toBe(null);
    });

    it('should return null for expired session', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      const session: Session = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        accessToken: 'expired-token',
        expiresAt: pastTime,
      };

      expect(getGoogleAccessToken(session)).toBe(null);
    });
  });

  describe('hasGoogleCalendarAccess', () => {
    it('should return true for valid Google token', () => {
      const session: Session = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        accessToken: 'valid-token',
        expiresAt: undefined,
      };

      expect(hasGoogleCalendarAccess(session)).toBe(true);
    });

    it('should return false for invalid session', () => {
      const session: Session = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        accessToken: undefined,
        expiresAt: undefined,
      };

      expect(hasGoogleCalendarAccess(session)).toBe(false);
    });
  });

  describe('refreshGoogleToken', () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockClear();
    });

    it('should refresh token successfully', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        expires_in: 3600,
        refresh_token: 'new-refresh-token',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await refreshGoogleToken('old-refresh-token');

      expect(fetch).toHaveBeenCalledWith('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: expect.any(URLSearchParams),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw error when refresh fails', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      await expect(refreshGoogleToken('invalid-refresh-token')).rejects.toThrow(
        'Failed to refresh Google access token'
      );
    });

    it('should include correct parameters in request', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        expires_in: 3600,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await refreshGoogleToken('test-refresh-token');

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = call[1].body as URLSearchParams;

      expect(body.get('client_id')).toBe(process.env.GOOGLE_CLIENT_ID);
      expect(body.get('client_secret')).toBe(process.env.GOOGLE_CLIENT_SECRET);
      expect(body.get('refresh_token')).toBe('test-refresh-token');
      expect(body.get('grant_type')).toBe('refresh_token');
    });
  });
});
