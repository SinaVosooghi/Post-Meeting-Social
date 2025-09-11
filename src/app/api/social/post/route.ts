import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import { postToLinkedIn, validateLinkedInToken } from '@/lib/linkedin';
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

    const { platform, content, hashtags, linkUrl, imageUrl } = await request.json();

    if (!platform || !content) {
      return NextResponse.json(
        { success: false, error: 'Platform and content are required' },
        { status: 400 }
      );
    }

    // Demo mode - simulate API responses instead of real posting
    if (platform === 'linkedin') {
      return NextResponse.json(
        {
          success: false,
          error: 'LinkedIn Business Account required for publishing.',
          demo: true,
          message: 'This is a demo project. The posting functionality is fully implemented but requires LinkedIn Business Account for content publishing.',
        },
        { status: 400 }
      );
    } else if (platform === 'facebook') {
      return NextResponse.json(
        {
          success: false,
          error: 'Meta for Developers is not available in this location.',
          demo: true,
          message: 'This is a demo project. The posting functionality is fully implemented but requires Facebook Developer account setup in supported regions.',
        },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported platform. Supported platforms: linkedin, facebook' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Social media posting error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to post to social media',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
