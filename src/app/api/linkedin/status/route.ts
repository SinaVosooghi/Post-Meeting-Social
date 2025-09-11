import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import { getLinkedInToken, isLinkedInTokenValid } from '@/lib/persistent-token-store';
import type { Session } from 'next-auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        connected: false,
        error: 'No active session found',
      });
    }

    // Check both token store and session
    const linkedinToken = await getLinkedInToken(session.user.email);
    const sessionLinkedIn = session.providerTokens?.linkedin;

    // If we have a valid token in either location
    const hasValidToken =
      (linkedinToken && isLinkedInTokenValid(linkedinToken)) ||
      (sessionLinkedIn?.connected && sessionLinkedIn?.accessToken);

    if (!hasValidToken) {
      return NextResponse.json({
        success: true,
        connected: false,
        message: 'LinkedIn not connected or token expired',
        debug: {
          hasTokenStore: !!linkedinToken,
          hasSessionToken: !!sessionLinkedIn?.connected,
          tokenStoreValid: linkedinToken ? isLinkedInTokenValid(linkedinToken) : false,
        },
      });
    }

    // Use token store data if available, otherwise fall back to session
    const profile = linkedinToken?.profile || {
      id: 'linkedin-user',
      name: 'LinkedIn User',
      email: session.user.email,
    };

    return NextResponse.json({
      success: true,
      connected: true,
      profile,
      token: {
        expiresAt: linkedinToken?.expiresAt || Date.now() + 3600000, // 1 hour default
        isExpired: linkedinToken ? !isLinkedInTokenValid(linkedinToken) : false,
      },
      source: linkedinToken ? 'token-store' : 'session',
    });
  } catch (error) {
    console.error('LinkedIn status check error:', error);
    return NextResponse.json({
      success: false,
      connected: false,
      error: 'Failed to check LinkedIn status',
    });
  }
}
