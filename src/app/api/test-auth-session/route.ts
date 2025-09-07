import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth-wrapper';
import type { Session } from 'next-auth';

export async function GET() {
  try {
    console.log('=== AUTH SESSION DEBUG START ===');
    
    // Test both auth() and getServerSession
    const authResult = await auth();
    console.log('Auth result:', authResult);
    
    // Test getServerSession directly
    const sessionResult = await getServerSession(authConfig);
    console.log('Session result:', sessionResult);
    
    console.log('=== AUTH SESSION DEBUG END ===');
    
    return NextResponse.json({
      success: true,
      debug: {
        authResult: authResult ? {
          user: authResult.user,
          expires: authResult.expires
        } : null,
        sessionResult: sessionResult ? {
          user: sessionResult.user,
          expires: sessionResult.expires
        } : null,
        authHasUser: !!authResult?.user,
        sessionHasUser: !!sessionResult?.user,
        authUserId: authResult?.user?.id,
        sessionUserId: sessionResult?.user?.id,
        authUserEmail: authResult?.user?.email,
        sessionUserEmail: sessionResult?.user?.email,
      }
    });
  } catch (error) {
    console.error('Auth session debug error:', error);
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
