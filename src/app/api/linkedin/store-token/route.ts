import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import type { Session } from 'next-auth';

export async function POST(request: Request) {
  try {
    const session = (await auth()) as Session | null;
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please sign in with Google first.',
      }, { status: 401 });
    }

    const { accessToken, expiresIn, profile } = await request.json();

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Access token is required',
      }, { status: 400 });
    }

    // TODO: Store LinkedIn token in database
    // For now, we'll store it in the session by updating the providerTokens
    // This is a temporary solution - in production, store in database
    
    // Update session with LinkedIn token
    if (!session.providerTokens) {
      session.providerTokens = {
        google: {
          accessToken: session.accessToken || '',
          refreshToken: session.refreshToken || '',
          expiresAt: session.expiresAt || 0,
          connected: !!session.accessToken,
        },
        linkedin: {
          accessToken: '',
          refreshToken: '',
          expiresAt: 0,
          connected: false,
        },
      };
    }

    session.providerTokens.linkedin = {
      accessToken,
      refreshToken: '', // LinkedIn doesn't provide refresh token in this flow
      expiresAt: Date.now() + (expiresIn * 1000),
      connected: true,
    };

    return NextResponse.json({
      success: true,
      message: 'LinkedIn token stored successfully',
      profile,
    });
  } catch (error) {
    console.error('LinkedIn token storage error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to store LinkedIn token',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
