import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import type { Session } from 'next-auth';

// Simple in-memory storage for bot schedules
const botSchedules = new Map<
  string,
  { botId: string; eventId: string; scheduledAt: Date; userId: string }
>();

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get bot schedules for this user
    const userSchedules: Record<
      string,
      { botScheduled: boolean; botId: string | null; scheduledAt: Date }
    > = {};

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
