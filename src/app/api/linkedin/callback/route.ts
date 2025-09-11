import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import type { Session } from 'next-auth';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('LinkedIn OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/demo?linkedin_error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/demo?linkedin_error=Missing authorization code or state`
      );
    }

    // Verify user is authenticated with Google
    const session = await auth();
    if (!session || session.user?.email !== state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/demo?linkedin_error=Invalid session or state mismatch`
      );
    }

    // Exchange code for LinkedIn access token
    const linkedinClientId = process.env.LINKEDIN_CLIENT_ID;
    const linkedinClientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/linkedin/callback`;

    if (!linkedinClientId || !linkedinClientSecret) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/demo?linkedin_error=LinkedIn OAuth not configured`
      );
    }

    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: linkedinClientId,
        client_secret: linkedinClientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('LinkedIn token exchange failed:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/demo?linkedin_error=Failed to exchange code for token`
      );
    }

    const tokenData = await tokenResponse.json();

    // Get LinkedIn profile using OpenID Connect
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/demo?linkedin_error=Failed to fetch LinkedIn profile`
      );
    }

    const profile = await profileResponse.json();
    const profileName =
      profile.name ||
      `${profile.given_name || ''} ${profile.family_name || ''}`.trim() ||
      'LinkedIn User';
    const profileEmail = profile.email || profile.emailAddress;

    // Store token in persistent store
    const { storeLinkedInToken } = await import('@/lib/persistent-token-store');
    await storeLinkedInToken(session.user.email, {
      accessToken: tokenData.access_token,
      refreshToken: '', // LinkedIn doesn't provide refresh tokens
      expiresAt: Date.now() + tokenData.expires_in * 1000,
      profile: {
        id: profile.sub || profile.id,
        name: profileName,
        email: profileEmail,
      },
    });

    // Also store in session for persistence
    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/linkedin/store-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') || '',
        },
        body: JSON.stringify({
          accessToken: tokenData.access_token,
          expiresIn: tokenData.expires_in,
          profile: {
            id: profile.sub || profile.id,
            name: profileName,
            email: profileEmail,
          },
        }),
      });
    } catch (error) {
      console.error('Failed to store LinkedIn token in session:', error);
    }

    // Redirect to demo page with success message
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/demo?linkedin_success=1&profile_name=${encodeURIComponent(profileName)}`
    );
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/demo?linkedin_error=Internal server error`
    );
  }
}
