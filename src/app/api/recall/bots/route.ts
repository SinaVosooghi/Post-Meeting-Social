import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import { scheduleBotWithUserSettings, getUserBotSchedules } from '@/lib/recall-ai';
import type { Session } from 'next-auth';

/**
 * Recall.ai Bot Management API Controller
 * Thin controller layer that delegates to business logic in lib/recall-ai.ts
 */

/**
 * POST /api/recall/bots
 * Schedule a new meeting bot for recording
 */
export async function POST(request: Request) {
  try {
    // 1. Authentication check
    const session = (await auth()) as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = (await request.json()) as {
      eventId: string;
      joinMinutesBefore?: number;
      meetingUrl?: string;
      eventTime?: string | null;
    };
    const { eventId, meetingUrl, eventTime } = body;

    if (!meetingUrl) {
      return NextResponse.json(
        { success: false, error: { message: 'Meeting URL is required' } },
        { status: 400 }
      );
    }

    // 3. Delegate to business logic
    const result = await scheduleBotWithUserSettings(
      session.user.email,
      eventId,
      meetingUrl,
      body.joinMinutesBefore,
      eventTime
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: result.error } },
        { status: 400 }
      );
    }

    // 4. Return success response
    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    console.error('Bot scheduling error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to schedule bot',
          code: 'BOT_SCHEDULING_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recall/bots
 * Retrieve all bot schedules for the authenticated user
 */
export async function GET() {
  try {
    // 1. Authentication check
    const session = (await auth()) as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Delegate to business logic
    const result = await getUserBotSchedules(session.user.email);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: result.error } },
        { status: 500 }
      );
    }

    // 3. Return formatted response
    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        totalMeetings: Object.keys(result.data).length,
      },
    });
  } catch (error) {
    console.error('Bot status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch bot status',
          code: 'BOT_STATUS_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
