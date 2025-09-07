import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import { getLinkedInToken } from '@/lib/persistent-token-store';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'No session found'
      }, { status: 401 });
    }

    // Check LinkedIn token
    const linkedInToken = await getLinkedInToken(session.user.email);
    if (!linkedInToken) {
      return NextResponse.json({
        success: false,
        error: 'No LinkedIn token found. Please connect LinkedIn first.'
      }, { status: 400 });
    }

    console.log('Testing LinkedIn permissions...');

    // Test different API endpoints to see what permissions we have
    const tests = [];

    // Test 1: Basic profile access
    try {
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${linkedInToken.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      tests.push({
        endpoint: 'userinfo',
        status: profileResponse.status,
        success: profileResponse.ok,
        message: profileResponse.ok ? 'Profile access works' : `Profile access failed: ${profileResponse.status}`
      });
    } catch (error) {
      tests.push({
        endpoint: 'userinfo',
        status: 'error',
        success: false,
        message: `Profile access error: ${error}`
      });
    }

    // Test 2: UGC Posts access (without creating)
    try {
      const ugcResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${linkedInToken.accessToken}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': '202312',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });
      tests.push({
        endpoint: 'ugcPosts (GET)',
        status: ugcResponse.status,
        success: ugcResponse.ok,
        message: ugcResponse.ok ? 'UGC Posts read access works' : `UGC Posts read failed: ${ugcResponse.status}`
      });
    } catch (error) {
      tests.push({
        endpoint: 'ugcPosts (GET)',
        status: 'error',
        success: false,
        message: `UGC Posts read error: ${error}`
      });
    }

    // Test 3: Check token scopes
    try {
      const tokenInfoResponse = await fetch('https://api.linkedin.com/v2/me', {
        headers: {
          Authorization: `Bearer ${linkedInToken.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      let tokenInfo = null;
      if (tokenInfoResponse.ok) {
        tokenInfo = await tokenInfoResponse.json();
      }
      
      tests.push({
        endpoint: 'me',
        status: tokenInfoResponse.status,
        success: tokenInfoResponse.ok,
        message: tokenInfoResponse.ok ? 'Token info access works' : `Token info failed: ${tokenInfoResponse.status}`,
        data: tokenInfo
      });
    } catch (error) {
      tests.push({
        endpoint: 'me',
        status: 'error',
        success: false,
        message: `Token info error: ${error}`
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        linkedInToken: {
          hasAccessToken: !!linkedInToken.accessToken,
          expiresAt: linkedInToken.expiresAt,
          isExpired: Date.now() > linkedInToken.expiresAt,
          profile: linkedInToken.profile
        },
        tests,
        recommendations: [
          'If ugcPosts access fails, the LinkedIn app needs w_member_social permission',
          'Go to LinkedIn Developer Console and add the permission',
          'Re-authorize the app after adding permissions'
        ]
      }
    });

  } catch (error) {
    console.error('Test LinkedIn permissions error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
