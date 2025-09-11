import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import { getBotStatus } from '@/lib/recall-ai';
import type { Session } from 'next-auth';

export async function GET(request: Request, { params }: { params: { botId: string } }) {
  try {
    const session = (await auth()) as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { botId } = params;

    if (!botId) {
      return NextResponse.json(
        { success: false, error: { message: 'Bot ID is required' } },
        { status: 400 }
      );
    }

    // Get bot status from Recall.ai
    const botStatus = await getBotStatus(botId);

    return NextResponse.json({
      success: true,
      data: {
        botId: botStatus.id,
        externalBotId: botStatus.externalBotId,
        status: botStatus.status,
        meetingUrl: botStatus.meetingUrl,
        scheduledAt: botStatus.scheduledAt,
        joinedAt: botStatus.joinedAt,
        startedRecordingAt: botStatus.startedRecordingAt,
        endedAt: botStatus.endedAt,
        outputs: botStatus.outputs,
        // Media availability flags
        hasRecording: !!botStatus.outputs.recordingUrl,
        hasTranscript: !!botStatus.outputs.transcriptUrl,
        hasSummary: !!botStatus.outputs.summaryUrl,
        participantCount: botStatus.outputs.participantCount,
        transcriptWordCount: botStatus.outputs.transcriptWordCount,
        // Bot configuration
        config: botStatus.config,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        polledAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Bot status fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch bot status',
          code: 'BOT_STATUS_FETCH_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
