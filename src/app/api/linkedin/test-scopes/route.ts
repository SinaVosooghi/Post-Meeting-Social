import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import type { Session } from 'next-auth';

export async function GET() {
  try {
    const session = (await auth()) as Session | null;
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please sign in with Google first.',
      }, { status: 401 });
    }

    const linkedinClientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/linkedin/callback`;
    
    if (!linkedinClientId) {
      return NextResponse.json({
        success: false,
        error: 'LinkedIn OAuth not configured',
      }, { status: 500 });
    }

    // Test different scope combinations
    const scopeTests = [
      { name: 'Basic Profile', scope: 'r_basicprofile' },
      { name: 'Lite Profile', scope: 'r_liteprofile' },
      { name: 'Email Address', scope: 'r_emailaddress' },
      { name: 'Member Social', scope: 'w_member_social' },
      { name: 'Basic + Email', scope: 'r_basicprofile r_emailaddress' },
      { name: 'Basic + Social', scope: 'r_basicprofile w_member_social' },
      { name: 'OpenID Connect', scope: 'openid profile email' },
    ];

    const testUrls = scopeTests.map(test => {
      const url = new URL('https://www.linkedin.com/oauth/v2/authorization');
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('client_id', linkedinClientId);
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('state', session.user?.id || 'default');
      url.searchParams.set('scope', test.scope);
      
      return {
        name: test.name,
        scope: test.scope,
        url: url.toString()
      };
    });

    return NextResponse.json({
      success: true,
      message: 'LinkedIn scope test URLs generated',
      testUrls,
      instructions: 'Test each URL to see which scopes work with your LinkedIn app'
    });
  } catch (error) {
    console.error('LinkedIn scope test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate scope test URLs',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
