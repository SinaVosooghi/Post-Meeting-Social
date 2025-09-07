import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import { getLinkedInToken, isLinkedInTokenValid } from '@/lib/persistent-token-store';
import type { Session } from 'next-auth';

export async function GET() {
  try {
    const session = (await auth()) as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'No active session found',
      });
    }

    // Check LinkedIn token
    const linkedinToken = await getLinkedInToken(session.user.email);
    const sessionLinkedIn = session.providerTokens?.linkedin;

    return NextResponse.json({
      success: true,
      debug: {
        hasSession: !!session,
        userEmail: session.user.email,
        hasLinkedInToken: !!linkedinToken,
        hasSessionLinkedIn: !!sessionLinkedIn?.connected,
        linkedinTokenValid: linkedinToken ? isLinkedInTokenValid(linkedinToken) : false,
        linkedinToken: linkedinToken ? {
          hasAccessToken: !!linkedinToken.accessToken,
          expiresAt: linkedinToken.expiresAt,
          profile: linkedinToken.profile
        } : null,
        sessionLinkedIn: sessionLinkedIn ? {
          connected: sessionLinkedIn.connected,
          hasAccessToken: !!sessionLinkedIn.accessToken
        } : null
      }
    });
  } catch (error) {
    console.error('LinkedIn debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
