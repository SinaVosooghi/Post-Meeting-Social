import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Simple test API called');
    return NextResponse.json({
      success: true,
      message: 'Simple test API working',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Simple test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Simple test failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

