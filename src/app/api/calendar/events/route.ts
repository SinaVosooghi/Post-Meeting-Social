import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import type { Session } from 'next-auth';
import { getUpcomingEvents } from '@/lib/google-calendar';
import { getBotSchedulesForEvent } from '@/lib/file-storage';
import { BotStatus, type CalendarEvent } from '@/types/master-interfaces';
import { getBotStatus } from '@/lib/recall-ai';

export async function GET() {
  try {
    const session = (await auth()) as Session | null;
    if (!session) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user has Google access token
    if (!session.accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Google Calendar not connected. Please sign in with Google.' },
        },
        { status: 401 }
      );
    }

    // Fetch real Google Calendar events (past and future)
    console.log('Fetching real Google Calendar events...');
    const events = await getUpcomingEvents(session.accessToken, {
      maxResults: 20,
      timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
    });
    // Enhance each event with bot data
    const eventsWithBotData = await Promise.all(
      events.map(async event => {
        const botData = await getBotSchedulesForEvent(event.id);
        let botTstaus = null;
        if (botData?.botId) {
          botTstaus = await getBotStatus(botData?.botId);
        }
        return {
          ...event,
          botData: botData
            ? {
                botId: botData.botId,
                externalBotId: botData.externalBotId,
                status: botData.status,
                scheduledAt: botData.scheduledAt,
                joinMinutesBefore: botData.joinMinutesBefore,
                settingsUsed: botData.settingsUsed,
                recallResponse: botData.recallResponse,
                BotStatus: botTstaus,
                transcript: botTstaus?.transcriptURL,
              }
            : null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: eventsWithBotData,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        totalEvents: eventsWithBotData.length,
        eventsWithBots: eventsWithBotData.filter(e => e.botData).length,
      },
    });
  } catch (error) {
    console.error('Calendar events error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch calendar events',
          code: 'CALENDAR_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
