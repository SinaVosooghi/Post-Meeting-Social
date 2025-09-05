/**
 * Authentication Utilities
 * Post-Meeting Social Media Content Generator
 *
 * Utilities for handling authentication, sessions, and OAuth tokens
 */

import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

/**
 * Gets the current session on the server side
 * @returns Current session or null if not authenticated
 */
export async function getCurrentSession(): Promise<Session | null> {
  const session = await auth();
  return session;
}

/**
 * Requires authentication - redirects to signin if not authenticated
 * @returns Current session (guaranteed to exist)
 */
export async function requireAuth(): Promise<Session> {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/auth/signin');
  }

  return session;
}

/**
 * Checks if the current user has a valid Google access token
 * @param session - Current session
 * @returns True if Google access token is available and valid
 */
export function hasValidGoogleToken(session: Session): boolean {
  if (!session.accessToken) {
    return false;
  }

  // Check if token is expired
  if (session.expiresAt && Date.now() >= session.expiresAt * 1000) {
    return false;
  }

  return true;
}

/**
 * Gets the Google access token from the session
 * @param session - Current session
 * @returns Google access token or null if not available
 */
export function getGoogleAccessToken(session: Session): string | null {
  if (!hasValidGoogleToken(session)) {
    return null;
  }

  return session.accessToken || null;
}

/**
 * Type guard to check if session has required Google permissions
 * @param session - Current session
 * @returns True if session has Google Calendar permissions
 */
export function hasGoogleCalendarAccess(session: Session): boolean {
  // In a real implementation, you'd check the token scopes
  // For now, we'll assume if they have a Google token, they have calendar access
  return hasValidGoogleToken(session);
}

/**
 * Refreshes an expired Google access token using the refresh token
 * @param refreshToken - Google refresh token
 * @returns New access token data
 */
export async function refreshGoogleToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Google access token');
  }

  const tokens = await response.json();
  return tokens;
}
