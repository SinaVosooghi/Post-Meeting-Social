import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import type { Session } from 'next-auth';

export async function GET() {
  try {
    const session = (await auth()) as Session | null;
    
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'No session found'
      });
    }

    return NextResponse.json({
      success: true,
      session: {
        user: {
          email: session.user?.email,
          name: session.user?.name,
          image: session.user?.image
        },
        providerTokens: session.providerTokens,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt,
        // Check if tokens are strings or objects
        googleTokenType: typeof session.providerTokens?.google?.accessToken,
        googleTokenLength: session.providerTokens?.google?.accessToken?.length,
        googleTokenPreview: session.providerTokens?.google?.accessToken?.substring(0, 20) + '...',
        linkedinTokenType: typeof session.providerTokens?.linkedin?.accessToken,
        linkedinTokenLength: session.providerTokens?.linkedin?.accessToken?.length,
        linkedinTokenPreview: session.providerTokens?.linkedin?.accessToken?.substring(0, 20) + '...'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}