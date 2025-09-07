import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import { getLinkedInToken } from '@/lib/persistent-token-store';
import { validateLinkedInContent } from '@/lib/linkedin';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'No session found'
      }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    console.log('Testing LinkedIn publish with content:', content);

    // Test content validation
    const validation = validateLinkedInContent(content);
    console.log('Validation result:', validation);

    // Check LinkedIn token
    const linkedInToken = await getLinkedInToken(session.user.email);
    console.log('LinkedIn token exists:', !!linkedInToken);

    return NextResponse.json({
      success: true,
      debug: {
        content,
        validation,
        hasLinkedInToken: !!linkedInToken,
        linkedInToken: linkedInToken ? {
          hasAccessToken: !!linkedInToken.accessToken,
          expiresAt: linkedInToken.expiresAt,
          isExpired: Date.now() > linkedInToken.expiresAt
        } : null
      }
    });

  } catch (error) {
    console.error('Test LinkedIn publish error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}