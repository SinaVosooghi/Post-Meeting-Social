import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import type { Session } from 'next-auth';

// Simple in-memory storage for automation settings (persists per session, not across server restarts)
const automationSettingsStorage = new Map<
  string,
  Record<
    string,
    {
      tone: string;
      frequency: string;
      autoGenerate: boolean;
      updatedAt: Date;
    }
  >
>();

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const userAutomations = automationSettingsStorage.get(session.user.email) || {};

    return NextResponse.json({
      success: true,
      data: userAutomations,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        note: 'Using in-memory storage',
      },
    });
  } catch (error) {
    console.error('Automation settings fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch automation settings',
          code: 'AUTOMATION_SETTINGS_FETCH_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = (await request.json()) as Record<
      string,
      {
        tone: string;
        frequency: string;
        autoGenerate: boolean;
      }
    >;

    // Validate input
    for (const [platform, settings] of Object.entries(body)) {
      if (!['linkedin', 'facebook'].includes(platform)) {
        return NextResponse.json(
          { success: false, error: { message: `Invalid platform: ${platform}` } },
          { status: 400 }
        );
      }

      if (!['Professional', 'Casual', 'Educational', 'Promotional'].includes(settings.tone)) {
        return NextResponse.json(
          { success: false, error: { message: `Invalid tone: ${settings.tone}` } },
          { status: 400 }
        );
      }

      if (!['Every meeting', 'Daily', 'Weekly', 'Manual only'].includes(settings.frequency)) {
        return NextResponse.json(
          { success: false, error: { message: `Invalid frequency: ${settings.frequency}` } },
          { status: 400 }
        );
      }
    }

    // Store automation settings
    const settingsWithTimestamp = Object.fromEntries(
      Object.entries(body).map(([platform, settings]) => [
        platform,
        {
          ...settings,
          updatedAt: new Date(),
        },
      ])
    );

    automationSettingsStorage.set(session.user.email, settingsWithTimestamp);

    console.log(
      `🤖 Automation settings updated for user: ${session.user.email}`,
      settingsWithTimestamp
    );

    return NextResponse.json({
      success: true,
      data: settingsWithTimestamp,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        note: 'Using in-memory storage',
      },
    });
  } catch (error) {
    console.error('Automation settings update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to update automation settings',
          code: 'AUTOMATION_SETTINGS_UPDATE_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
