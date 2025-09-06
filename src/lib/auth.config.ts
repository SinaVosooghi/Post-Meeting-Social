/**
 * NextAuth Configuration
 * Post-Meeting Social Media Content Generator
 *
 * Centralized authentication configuration for NextAuth v5 beta
 */

import GoogleProvider from 'next-auth/providers/google';
import LinkedInProvider from 'next-auth/providers/linkedin';
import type { NextAuthConfig } from 'next-auth';
import { authLogger } from './logger';

// Validate required environment variables
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const linkedinClientId = process.env.LINKEDIN_CLIENT_ID;
const linkedinClientSecret = process.env.LINKEDIN_CLIENT_SECRET;

// Only log credential warnings on the server side
if (typeof window === 'undefined') {
  if (!googleClientId || !googleClientSecret) {
    authLogger.warn('Missing Google OAuth credentials. Google sign-in will be disabled.');
  }

  if (!linkedinClientId || !linkedinClientSecret) {
    authLogger.warn('Missing LinkedIn OAuth credentials. LinkedIn sign-in will be disabled.');
  } else {
    authLogger.info('LinkedIn OAuth credentials found. Configuring LinkedIn provider.');
    if (!process.env.NEXTAUTH_URL) {
      authLogger.error('NEXTAUTH_URL is not set. This is required for OAuth callback URLs.');
    } else {
      authLogger.info(
        `LinkedIn callback URL will be: ${process.env.NEXTAUTH_URL}/api/auth/callback/linkedin`
      );
    }
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    ...(googleClientId && googleClientSecret
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            authorization: {
              params: {
                scope:
                  'openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
                access_type: 'offline',
                prompt: 'consent',
              },
            },
          }),
        ]
      : []),
    ...(linkedinClientId && linkedinClientSecret
      ? [
          LinkedInProvider({
            clientId: linkedinClientId,
            clientSecret: linkedinClientSecret,
            authorization: {
              url: 'https://www.linkedin.com/oauth/v2/authorization',
              params: {
                scope: 'openid profile email',
                response_type: 'code',
              },
            },
            token: {
              url: 'https://www.linkedin.com/oauth/v2/accessToken',
            },
            userinfo: {
              url: 'https://api.linkedin.com/v2/userinfo',
            },
            profile(profile) {
              return {
                id: profile.sub,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      if (account?.refresh_token) {
        token.refreshToken = account.refresh_token;
      }
      if (account?.expires_at) {
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      if (token.refreshToken) {
        session.refreshToken = token.refreshToken as string;
      }
      if (token.expiresAt) {
        session.expiresAt = token.expiresAt as number;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
};
