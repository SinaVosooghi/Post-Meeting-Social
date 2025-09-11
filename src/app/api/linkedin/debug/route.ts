import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const linkedinClientId = process.env.LINKEDIN_CLIENT_ID;
    const linkedinClientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/linkedin/callback`;

    return NextResponse.json({
      success: true,
      debug: {
        clientId: linkedinClientId ? 'Set' : 'Missing',
        clientSecret: linkedinClientSecret ? 'Set' : 'Missing',
        redirectUri,
        nexAuthUrl: process.env.NEXTAUTH_URL,
        availableScopes: [
          'r_liteprofile',
          'r_emailaddress',
          'w_member_social',
          'openid',
          'profile',
          'email',
        ],
        recommendedScopes: [
          'r_liteprofile', // Basic profile - should work
          'w_member_social', // Posting - might need approval
        ],
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
