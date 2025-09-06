/**
 * Recall.ai Meeting Bots API Endpoint
 * /api/recall/bots - Manage meeting bots
 *
 * Handles bot scheduling, status checking, and transcript retrieval
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  scheduleMeetingBot,
  getBotStatus,
  cancelMeetingBot,
  listMeetingBots,
  getMeetingTranscript,
} from '@/lib/recall-ai';
import type { BotConfig, BotStatus } from '@/types';

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Authentication required',
            code: 'UNAUTHORIZED',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const botId = searchParams.get('botId');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as BotStatus | null;

    // Get specific bot status
    if (botId && !action) {
      const bot = await getBotStatus(botId);

      return NextResponse.json({
        success: true,
        data: bot,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      });
    }

    // Get bot transcript
    if (botId && action === 'transcript') {
      const transcript = await getMeetingTranscript(botId);

      return NextResponse.json({
        success: true,
        data: transcript,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      });
    }

    // List all bots
    const bots = await listMeetingBots({
      limit,
      ...(status !== null && { status }),
    });

    return NextResponse.json({
      success: true,
      data: {
        bots,
        totalCount: bots.length,
        filters: {
          limit,
          status,
        },
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        usingMockData: process.env.NODE_ENV === 'development' || !process.env.RECALL_AI_API_KEY,
      },
    });
  } catch (error) {
    console.error('Recall bots API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch bots',
          code: 'BOT_FETCH_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Authentication required',
            code: 'UNAUTHORIZED',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      action: 'schedule' | 'cancel' | 'status' | 'transcript';
      meetingUrl?: string;
      botId?: string;
      config?: BotConfig;
    };
    const { action, ...params } = body;

    switch (action) {
      case 'schedule': {
        // Schedule a new meeting bot
        const { meetingUrl, config } = params;

        if (!meetingUrl) {
          return NextResponse.json(
            {
              success: false,
              error: {
                message: 'Meeting URL is required',
                code: 'MISSING_MEETING_URL',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          );
        }

        const botConfig: Partial<BotConfig> = {
          botName: config?.botName || 'Post-Meeting Content Bot',
          recordAudio: config?.recordAudio ?? true,
          recordVideo: config?.recordVideo ?? false,
          recordScreen: config?.recordScreen ?? false,
          transcriptionEnabled: config?.transcriptionEnabled ?? true,
          webhookUrl: config?.webhookUrl || null,
        };

        const scheduledBot = await scheduleMeetingBot(meetingUrl, botConfig);

        return NextResponse.json({
          success: true,
          data: scheduledBot,
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
            action: 'schedule',
          },
        });
      }

      case 'cancel': {
        // Cancel an existing bot
        const { botId } = params;

        if (!botId) {
          return NextResponse.json(
            {
              success: false,
              error: {
                message: 'Bot ID is required',
                code: 'MISSING_BOT_ID',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          );
        }

        await cancelMeetingBot(botId);

        return NextResponse.json({
          success: true,
          data: {
            botId,
            cancelled: true,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
            action: 'cancel',
          },
        });
      }

      case 'status': {
        // Get bot status
        const { botId: statusBotId } = params;

        if (!statusBotId) {
          return NextResponse.json(
            {
              success: false,
              error: {
                message: 'Bot ID is required',
                code: 'MISSING_BOT_ID',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          );
        }

        const botStatus = await getBotStatus(statusBotId);

        return NextResponse.json({
          success: true,
          data: botStatus,
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
            action: 'status',
          },
        });
      }

      case 'transcript': {
        // Get meeting transcript
        const { botId: transcriptBotId } = params;

        if (!transcriptBotId) {
          return NextResponse.json(
            {
              success: false,
              error: {
                message: 'Bot ID is required',
                code: 'MISSING_BOT_ID',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          );
        }

        const transcript = await getMeetingTranscript(transcriptBotId);

        return NextResponse.json({
          success: true,
          data: transcript,
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
            action: 'transcript',
          },
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              message: `Unknown action: ${action}`,
              code: 'INVALID_ACTION',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Recall bots API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to process bot request',
          code: 'BOT_API_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Authentication required',
            code: 'UNAUTHORIZED',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const botId = searchParams.get('botId');

    if (!botId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Bot ID is required',
            code: 'MISSING_BOT_ID',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    await cancelMeetingBot(botId);

    return NextResponse.json({
      success: true,
      data: {
        botId,
        cancelled: true,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    console.error('Recall bots API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to cancel bot',
          code: 'BOT_CANCEL_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
