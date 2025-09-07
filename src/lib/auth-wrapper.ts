/**
 * Type-Safe NextAuth Wrapper
 *
 * This wrapper provides type safety for NextAuth v4 while working around
 * TypeScript module resolution issues in Yarn PnP environments.
 */

import 'server-only';
import NextAuth from 'next-auth';
import { getServerSession } from 'next-auth';
import { authLogger } from './logger';

import GoogleProvider from 'next-auth/providers/google';
import LinkedInProvider from 'next-auth/providers/linkedin';
import FacebookProvider from 'next-auth/providers/facebook';

// Only log credential warnings on the server side
if (typeof window === 'undefined') {
  // Debug logging for environment variables
  const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET;
  const linkedinClientId = process.env.LINKEDIN_CLIENT_ID || process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
  const linkedinClientSecret = process.env.LINKEDIN_CLIENT_SECRET || process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_SECRET;

  // Debug: Log the actual values (without exposing secrets)
  console.log('🔍 Environment Variables Debug:', {
    googleClientId: googleClientId ? 'SET' : 'NOT_SET',
    googleClientSecret: googleClientSecret ? 'SET' : 'NOT_SET',
    linkedinClientId: linkedinClientId ? 'SET' : 'NOT_SET',
    linkedinClientSecret: linkedinClientSecret ? 'SET' : 'NOT_SET',
    nextAuthUrl: process.env.NEXTAUTH_URL,
    nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT_SET',
  });

  authLogger.debug('Environment variables check:', {
    googleClientId: googleClientId ? 'SET' : 'NOT_SET',
    googleClientSecret: googleClientSecret ? 'SET' : 'NOT_SET',
    linkedinClientId: linkedinClientId ? 'SET' : 'NOT_SET',
    linkedinClientSecret: linkedinClientSecret ? 'SET' : 'NOT_SET',
  });

  if (!googleClientId || !googleClientSecret) {
    authLogger.warn('Missing Google OAuth credentials. Google sign-in will be disabled.');
  } else {
    authLogger.info('Google OAuth credentials found. Configuring Google provider.');
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
  
  // Redirect to home page after successful login
  if (url.startsWith('/')) {
    return `${baseUrl}${url}`;
  } else if (new URL(url).origin === baseUrl) {
    return url;
  }
  return `${baseUrl}/`;
};

// Type-safe auth configuration function
function getAuthConfig() {
  // Force load environment variables
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const linkedinClientId = process.env.LINKEDIN_CLIENT_ID;
  const linkedinClientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const facebookClientId = process.env.FACEBOOK_CLIENT_ID;
  const facebookClientSecret = process.env.FACEBOOK_CLIENT_SECRET;

  console.log('🔍 Raw Environment Variables:', {
    GOOGLE_CLIENT_ID: googleClientId || 'NOT_SET',
    GOOGLE_CLIENT_SECRET: googleClientSecret ? 'SET' : 'NOT_SET',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT_SET',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT_SET',
  });

  if (!googleClientId || !googleClientSecret) {
    console.error('❌ Missing Google OAuth credentials!');
    return {
      providers: [],
      callbacks: {},
      pages: { signIn: '/auth/signin', error: '/auth/error' },
      debug: true,
    };
  }

  const providers = [];

  console.log('🔍 Before Google Provider Check:', {
    googleClientId: googleClientId ? 'EXISTS' : 'NULL',
    googleClientSecret: googleClientSecret ? 'EXISTS' : 'NULL',
    googleClientIdLength: googleClientId?.length || 0,
    googleClientSecretLength: googleClientSecret?.length || 0,
  });

  if (googleClientId && googleClientSecret) {
    console.log('🔍 Creating Google Provider with:', {
      clientId: googleClientId.substring(0, 20) + '...',
      clientSecret: googleClientSecret.substring(0, 10) + '...',
    });
    
    const googleProvider = GoogleProvider({
      clientId: googleClientId as string,
      clientSecret: googleClientSecret as string,
      authorization: {
        params: {
          scope:
            'openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    console.log('🔍 Google Provider Created:', {
      id: googleProvider.id,
      name: googleProvider.name,
      hasClientId: !!googleProvider.clientId,
      hasClientSecret: !!googleProvider.clientSecret,
    });

    providers.push(googleProvider);
  } else {
    console.log('❌ Google Provider NOT Created - Missing credentials');
  }

  if (linkedinClientId && linkedinClientSecret) {
    providers.push(
      LinkedInProvider({
        clientId: linkedinClientId,
        clientSecret: linkedinClientSecret,
        authorization: {
          params: {
            scope: 'openid profile email w_member_social',
          },
        },
      })
    );
  }

  if (facebookClientId && facebookClientSecret) {
    providers.push(
      FacebookProvider({
        clientId: facebookClientId,
        clientSecret: facebookClientSecret,
        authorization: {
          params: {
            scope: 'public_profile email pages_manage_posts pages_read_engagement',
          },
        },
      })
    );
  }

  console.log('🔍 Providers Created:', providers.length);

  return {
    providers,
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
}

// Force fresh configuration every time (no caching)
export function getAuthConfigLazy() {
  return getAuthConfig();
}

export function getNextAuthInstance() {
  return NextAuth(getAuthConfigLazy());
}

// Export the configuration (for backward compatibility)
export const authConfig = getAuthConfig();

// Export the NextAuth instance with proper typing
const nextAuthInstance = getNextAuthInstance();
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
