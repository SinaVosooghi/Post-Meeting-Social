import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';

export async function GET() {
  try {
    console.log('Testing auth function...');
    const session = await auth();
    console.log('Auth result:', session);
    
    return NextResponse.json({
      success: true,
      data: {
        hasSession: !!session,
        session: session,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Auth test failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

