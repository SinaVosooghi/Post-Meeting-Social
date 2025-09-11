/**
 * NextAuth Testing Helper for Playwright
 *
 * Provides utilities to mock NextAuth sessions in Playwright tests
 */

import type { Page } from '@playwright/test';

export interface MockUser {
  name: string;
  email: string;
  image?: string;
}

export interface MockSession {
  user: MockUser;
  expires: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  providerTokens?: {
    google?: {
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
      connected: boolean;
    };
    linkedin?: {
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
      connected: boolean;
    };
  };
}

/**
 * Mocks a NextAuth session in the browser
 */
export async function mockNextAuthSession(page: Page, session: MockSession) {
  await page.addInitScript(sessionData => {
    // Mock the session in localStorage (NextAuth v4 uses this)
    window.localStorage.setItem('nextauth.session', JSON.stringify(sessionData));

    // Also mock the session in sessionStorage as fallback
    window.sessionStorage.setItem('nextauth.session', JSON.stringify(sessionData));

    // Mock the useSession hook to return our session
    (window as any).__NEXT_AUTH_SESSION__ = sessionData;
  }, session);
}

/**
 * Creates a mock Google user session
 */
export function createMockGoogleSession(user: MockUser): MockSession {
  return {
    user,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    accessToken: 'mock-google-access-token',
    refreshToken: 'mock-google-refresh-token',
    expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    providerTokens: {
      google: {
        accessToken: 'mock-google-access-token',
        refreshToken: 'mock-google-refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        connected: true,
      },
    },
  };
}

/**
 * Creates a mock LinkedIn user session
 */
export function createMockLinkedInSession(user: MockUser): MockSession {
  return {
    user,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    accessToken: 'mock-linkedin-access-token',
    refreshToken: 'mock-linkedin-refresh-token',
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    providerTokens: {
      linkedin: {
        accessToken: 'mock-linkedin-access-token',
        refreshToken: 'mock-linkedin-refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        connected: true,
      },
    },
  };
}

/**
 * Creates a mock user with both Google and LinkedIn connected
 */
export function createMockFullSession(user: MockUser): MockSession {
  return {
    user,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    accessToken: 'mock-google-access-token',
    refreshToken: 'mock-google-refresh-token',
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    providerTokens: {
      google: {
        accessToken: 'mock-google-access-token',
        refreshToken: 'mock-google-refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        connected: true,
      },
      linkedin: {
        accessToken: 'mock-linkedin-access-token',
        refreshToken: 'mock-linkedin-refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        connected: true,
      },
    },
  };
}

/**
 * Clears the mocked session
 */
export async function clearMockSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.removeItem('nextauth.session');
    window.sessionStorage.removeItem('nextauth.session');
    delete (window as any).__NEXT_AUTH_SESSION__;
  });
}
