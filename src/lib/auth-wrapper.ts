/**
 * Type-Safe NextAuth Wrapper
 *
 * This wrapper provides type safety for NextAuth v4 while working around
 * TypeScript module resolution issues in Yarn PnP environments.
 */

import NextAuth from 'next-auth';
import { getServerSession } from 'next-auth';
import { authLogger } from './logger';

// Runtime imports with type assertions
// eslint-disable-next-line @typescript-eslint/no-var-requires
const GoogleProvider = require('next-auth/providers/google').default;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const LinkedInProvider = require('next-auth/providers/linkedin').default;

// Environment variables with proper typing
const googleClientId = process.env.GOOGLE_CLIENT_ID as string;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET as string;
const linkedinClientId = process.env.LINKEDIN_CLIENT_ID as string;
const linkedinClientSecret = process.env.LINKEDIN_CLIENT_SECRET as string;

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

// Type-safe callback functions
const jwtCallback = async ({
  token,
  account,
  _profile,
}: {
  token: any;
  account: any;
  _profile: any;
}) => {
  // Store tokens by provider to support multiple OAuth sessions
  if (account?.provider && account?.access_token) {
    token[`${account.provider}AccessToken`] = account.access_token;
    token[`${account.provider}RefreshToken`] = account.refresh_token;
    token[`${account.provider}ExpiresAt`] = account.expires_at;
    token[`${account.provider}Provider`] = account.provider;
  }

  // Keep backward compatibility
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
};

const sessionCallback = async ({ session, token }: { session: any; token: any }) => {
  // Make all provider tokens available in session
  session.providerTokens = {
    google: {
      accessToken: token.googleAccessToken as string,
      refreshToken: token.googleRefreshToken as string,
      expiresAt: token.googleExpiresAt as number,
      connected: !!token.googleAccessToken,
    },
    linkedin: {
      accessToken: token.linkedinAccessToken as string,
      refreshToken: token.linkedinRefreshToken as string,
      expiresAt: token.linkedinExpiresAt as number,
      connected: !!token.linkedinAccessToken,
    },
  };

  // Keep backward compatibility
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
};

const redirectCallback = async ({ url, baseUrl }: { url: string; baseUrl: string }) => {
  // Handle dashboard redirects by redirecting to demo
  if (url.includes('/dashboard')) {
    return `${baseUrl}/demo`;
  }
  
  // Redirect to demo page after successful login
  if (url.startsWith('/')) {
    return `${baseUrl}${url}`;
  } else if (new URL(url).origin === baseUrl) {
    return url;
  }
  return `${baseUrl}/demo`;
};

// Type-safe auth configuration
export const authConfig = {
  providers: [
    // Only Google for primary authentication
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
    // LinkedIn will be handled separately as a "Connect Account" feature
  ],
  callbacks: {
    jwt: jwtCallback,
    session: sessionCallback,
    redirect: redirectCallback,
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code: any, metadata: any) {
      authLogger.error(`NextAuth error: ${code}`, metadata);
    },
    warn(code: any) {
      authLogger.warn(`NextAuth warning: ${code}`);
    },
    debug(code: any, metadata: any) {
      authLogger.debug(`NextAuth debug: ${code}`, metadata);
    },
  },
};

// Export the NextAuth instance with proper typing
const nextAuthInstance = NextAuth(authConfig);
export default nextAuthInstance;

// Export individual functions for easier importing
export const handlers = nextAuthInstance.handlers;
export const signIn = nextAuthInstance.signIn;
export const signOut = nextAuthInstance.signOut;

// For NextAuth v4, we need to use getServerSession
export async function auth() {
  try {
    const session = await getServerSession(authConfig);
    return session;
  } catch (error) {
    authLogger.error('Error getting server session:', error);
    return null;
  }
}

// Also export getServerSession for direct use
export { getServerSession };
