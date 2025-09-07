import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user?: {
      id?: string;
      name?: string;
      email?: string;
      image?: string;
    };
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
    providerTokens?: {
      google: {
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: number;
        connected: boolean;
      };
      linkedin: {
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: number;
        connected: boolean;
      };
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    googleAccessToken?: string;
    googleRefreshToken?: string;
    googleExpiresAt?: number;
    linkedinAccessToken?: string;
    linkedinRefreshToken?: string;
    linkedinExpiresAt?: number;
  }
}

declare module 'next-auth/react' {
  interface SignInOptions {
    callbackUrl?: string;
    redirect?: boolean;
  }
}
