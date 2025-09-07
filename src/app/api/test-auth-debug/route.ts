import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import type { Session } from 'next-auth';

export async function GET() {
  try {
    console.log('=== AUTH DEBUG START ===');
    
    const session = await auth();
    console.log('Raw session:', session);
    console.log('Session type:', typeof session);
    console.log('Session user:', session?.user);
    console.log('Session user ID:', session?.user?.id);
    console.log('Session user email:', session?.user?.email);
    
    const hasSession = !!session;
    const hasUser = !!session?.user;
    const hasUserId = !!session?.user?.id;
    const hasUserEmail = !!session?.user?.email;
    
    console.log('=== AUTH DEBUG END ===');
    
    return NextResponse.json({
      success: true,
      debug: {
        hasSession,
        hasUser,
        hasUserId,
        hasUserEmail,
        session: session ? {
          user: session.user,
          expires: session.expires
        } : null,
        rawSession: session
      }
    });
  } catch (error) {
    console.error('Auth debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    });
  }
}
