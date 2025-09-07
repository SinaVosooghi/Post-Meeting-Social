import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import { removeLinkedInToken } from '@/lib/persistent-token-store';
import type { Session } from 'next-auth';

export async function POST() {
  try {
    // Check if user is authenticated with Google
    const session = (await auth()) as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required. Please sign in with Google first.',
        },
        { status: 401 }
      );
    }

    // Remove LinkedIn token from storage
    await removeLinkedInToken(session.user.email);

    return NextResponse.json({
      success: true,
      message: 'LinkedIn account disconnected successfully!',
    });
  } catch (error) {
    console.error('LinkedIn disconnect error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to disconnect LinkedIn account',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
