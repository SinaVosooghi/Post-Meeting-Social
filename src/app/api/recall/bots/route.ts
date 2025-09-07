import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import type { Session } from 'next-auth';

// Simple in-memory storage for bot schedules
const botSchedules = new Map<string, { botId: string; eventId: string; scheduledAt: Date; userId: string }>();

export async function POST(request: Request) {
  try {
    const session = (await auth()) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { eventId: string; joinMinutesBefore?: number };
    const { eventId, joinMinutesBefore = 5 } = body;

    // Generate bot ID
    const botId = `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Store bot schedule in memory
    const scheduleKey = `${session.user.email}-${eventId}`;
    botSchedules.set(scheduleKey, {
      botId,
      eventId,
      scheduledAt: new Date(),
      userId: session.user.email,
    });

    console.log(`🤖 Bot scheduled: ${botId} for event: ${eventId}`);

    return NextResponse.json({
      success: true,
      data: {
        botId,
        eventId,
        status: 'scheduled',
        joinMinutesBefore,
        scheduledAt: new Date().toISOString(),
        message: 'Bot successfully scheduled for meeting',
      },
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

export async function GET() {
  try {
    const session = (await auth()) as Session | null;
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get bot schedules for this user
    const userSchedules: Record<string, { botScheduled: boolean; botId: string | null; scheduledAt: Date }> = {};
    
    for (const [key, schedule] of botSchedules.entries()) {
      if (schedule.userId === session.user.email) {
        userSchedules[schedule.eventId] = {
          botScheduled: true,
          botId: schedule.botId,
          scheduledAt: schedule.scheduledAt,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: userSchedules,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        totalMeetings: Object.keys(userSchedules).length,
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