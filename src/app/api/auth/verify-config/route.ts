import { NextResponse } from 'next/server';
import { authLogger } from '@/lib/logger';

export async function GET() {
  const linkedinClientId = process.env.LINKEDIN_CLIENT_ID;
  const linkedinClientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const nextAuthUrl = process.env.NEXTAUTH_URL;

  const config = {
    linkedinConfigured: Boolean(linkedinClientId && linkedinClientSecret),
    callbackUrl: nextAuthUrl ? `${nextAuthUrl}/api/auth/callback/linkedin` : null,
    error: null as string | null,
  };

  try {
    if (!linkedinClientId || !linkedinClientSecret) {
      throw new Error('LinkedIn OAuth credentials are missing');
    }
    if (!nextAuthUrl) {
      throw new Error('NEXTAUTH_URL is not configured');
    }

    authLogger.info('LinkedIn OAuth configuration verified successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    authLogger.error('LinkedIn OAuth configuration error:', error);
    config.error = message;
  }

  return NextResponse.json(config);
}
