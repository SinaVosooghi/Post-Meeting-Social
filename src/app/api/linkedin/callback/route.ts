/**
 * LinkedIn OAuth Callback Handler
 * Handles OAuth callback from LinkedIn and redirects to settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { exchangeLinkedInCode, getLinkedInProfile } from '@/lib/linkedin';
import { storeSocialToken } from '@/lib/social-tokens';
import { SocialPlatform } from '@/types/master-interfaces';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('LinkedIn OAuth error:', error, errorDescription);
      
      const redirectUrl = new URL('/settings', process.env.NEXTAUTH_URL || 'http://localhost:3000');
      redirectUrl.searchParams.set('oauth_error', 'true');
      redirectUrl.searchParams.set('platform', 'linkedin');
      redirectUrl.searchParams.set('error', errorDescription || error);
      
      return NextResponse.redirect(redirectUrl.toString());
    }

    if (!code || !state) {
      const redirectUrl = new URL('/settings', process.env.NEXTAUTH_URL || 'http://localhost:3000');
      redirectUrl.searchParams.set('oauth_error', 'true');
      redirectUrl.searchParams.set('platform', 'linkedin');
      redirectUrl.searchParams.set('error', 'Missing authorization code or state');
      
      return NextResponse.redirect(redirectUrl.toString());
    }

    // For demo purposes, use mock data
    const useMockData = !process.env.LINKEDIN_CLIENT_ID || process.env.NODE_ENV === 'development';

    if (useMockData) {
      // Redirect to settings page with success status
      const redirectUrl = new URL('/settings', process.env.NEXTAUTH_URL || 'http://localhost:3000');
      redirectUrl.searchParams.set('oauth_success', 'true');
      redirectUrl.searchParams.set('platform', 'linkedin');
      
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Real OAuth flow
    const tokenData = await exchangeLinkedInCode(code, state);
    const profile = await getLinkedInProfile(tokenData.accessToken);

    // Store the token in the database
    // Note: We need the user ID, but we don't have it in the OAuth callback
    // This is a limitation of the current OAuth flow - we need to associate tokens with users
    // For now, we'll store it with a placeholder user ID
    const userId = 'oauth-callback-user'; // TODO: Get actual user ID from session or state

    await storeSocialToken(userId, SocialPlatform.LINKEDIN, {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresIn: tokenData.expiresIn,
      scope: tokenData.scope.split(' '),
      platformDetails: {
        profileId: profile.id,
        profileName: `${profile.firstName.localized.en_US} ${profile.lastName.localized.en_US}`,
        profileEmail: profile.email,
      },
    });

    // Redirect to settings page with success status
    const redirectUrl = new URL('/settings', process.env.NEXTAUTH_URL || 'http://localhost:3000');
    redirectUrl.searchParams.set('oauth_success', 'true');
    redirectUrl.searchParams.set('platform', 'linkedin');
    
    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error);

    // Redirect to settings page with error status
    const redirectUrl = new URL('/settings', process.env.NEXTAUTH_URL || 'http://localhost:3000');
    redirectUrl.searchParams.set('oauth_error', 'true');
    redirectUrl.searchParams.set('platform', 'linkedin');
    redirectUrl.searchParams.set('error', error instanceof Error ? error.message : 'OAuth callback failed');
    
    return NextResponse.redirect(redirectUrl.toString());
  }
}