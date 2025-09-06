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
    error?: string;
  }
}

declare module 'next-auth/react' {
  interface SignInOptions {
    callbackUrl?: string;
    redirect?: boolean;
  }
}
