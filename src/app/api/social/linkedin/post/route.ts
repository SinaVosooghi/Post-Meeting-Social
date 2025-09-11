import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import { postToLinkedIn, validateLinkedInToken } from '@/lib/linkedin';
import type { Session } from 'next-auth';

export async function POST(request: Request) {
  try {
    const session = (await auth()) as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { content, hashtags, linkUrl, imageUrl } = await request.json();

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    // Demo mode - simulate LinkedIn posting error
    return NextResponse.json(
      {
        success: false,
        error: 'LinkedIn Business Account required for publishing.',
        demo: true,
        message: 'This is a demo project. The posting functionality is fully implemented but requires LinkedIn Business Account for content publishing.',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('LinkedIn posting error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to post to LinkedIn',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
