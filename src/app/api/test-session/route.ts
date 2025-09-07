import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import type { Session } from 'next-auth';

export async function GET() {
  try {
    const session = (await auth()) as Session | null;
    
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'No session found. Please sign in first.',
        signedIn: false
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Session found!',
      signedIn: true,
      user: {
        id: session.user?.id,
        name: session.user?.name,
        email: session.user?.email,
        image: session.user?.image
      },
      hasGoogleToken: !!session.accessToken,
      hasLinkedInToken: !!session.providerTokens?.linkedin?.accessToken,
      providerTokens: session.providerTokens
    });
  } catch (error) {
    console.error('Session test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
