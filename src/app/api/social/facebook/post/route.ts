import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import { postToFacebook, validateFacebookToken } from '@/lib/facebook';
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
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    }

    // Demo mode - simulate Facebook posting error
    return NextResponse.json(
      {
        success: false,
        error: 'Meta for Developers is not available in this location.',
        demo: true,
        message: 'This is a demo project. The posting functionality is fully implemented but requires Facebook Developer account setup in supported regions.',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Facebook posting error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to post to Facebook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

