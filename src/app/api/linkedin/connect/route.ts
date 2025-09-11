import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import type { Session } from 'next-auth';

export async function GET(request: Request) {
  try {
    // Check if user is authenticated with Google
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required. Please sign in with Google first.',
        },
        { status: 401 }
      );
    }

    // Generate LinkedIn OAuth URL
    const linkedinClientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/linkedin/callback`;

    if (!linkedinClientId) {
      return NextResponse.json(
        {
          success: false,
          error: 'LinkedIn OAuth not configured',
        },
        { status: 500 }
      );
    }

    const linkedinAuthUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    linkedinAuthUrl.searchParams.set('response_type', 'code');
    linkedinAuthUrl.searchParams.set('client_id', linkedinClientId);
    linkedinAuthUrl.searchParams.set('redirect_uri', redirectUri);
    linkedinAuthUrl.searchParams.set('state', session.user?.email || 'default');
    linkedinAuthUrl.searchParams.set('scope', 'openid profile email');

    return NextResponse.json({
      success: true,
      authUrl: linkedinAuthUrl.toString(),
      message: 'LinkedIn OAuth URL generated',
    });
  } catch (error) {
    console.error('LinkedIn connect error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate LinkedIn OAuth URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
