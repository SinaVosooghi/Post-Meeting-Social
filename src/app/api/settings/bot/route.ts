import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import { getBotSettings, saveBotSettings, type BotSettings } from '@/lib/file-storage';
import type { Session } from 'next-auth';

export async function GET() {
  try {
    const session = (await auth()) as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const userSettings = (await getBotSettings(session.user.email)) || {
      joinMinutesBefore: 5,
      autoSchedule: false,
      maxConcurrentBots: 3,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: userSettings,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        note: 'Using file-based storage',
      },
    });
  } catch (error) {
    console.error('Bot settings fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch bot settings',
          code: 'BOT_SETTINGS_FETCH_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = (await auth()) as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      joinMinutesBefore: number;
      autoSchedule: boolean;
      maxConcurrentBots: number;
    };

    const { joinMinutesBefore, autoSchedule, maxConcurrentBots } = body;

    // Validate input
    if (joinMinutesBefore < 1 || joinMinutesBefore > 30) {
      return NextResponse.json(
        { success: false, error: { message: 'Join minutes must be between 1 and 30' } },
        { status: 400 }
      );
    }

    if (maxConcurrentBots < 1 || maxConcurrentBots > 10) {
      return NextResponse.json(
        { success: false, error: { message: 'Max concurrent bots must be between 1 and 10' } },
        { status: 400 }
      );
    }

    // Store bot settings
    const settings: BotSettings = {
      joinMinutesBefore,
      autoSchedule,
      maxConcurrentBots,
      updatedAt: new Date().toISOString(),
    };

    await saveBotSettings(session.user.email, settings);

    console.log(`🤖 Bot settings updated for user: ${session.user.email}`);

    return NextResponse.json({
      success: true,
      data: settings,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        note: 'Using file-based storage',
      },
    });
  } catch (error) {
    console.error('Bot settings update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to update bot settings',
          code: 'BOT_SETTINGS_UPDATE_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
