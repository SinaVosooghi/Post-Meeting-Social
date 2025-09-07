import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { eventId: string; joinMinutesBefore?: number };
    const { eventId, joinMinutesBefore = 5 } = body;

    // For demo purposes, simulate bot scheduling
    const botId = `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // For demo purposes, return mock bot statuses
    const mockBots = [
      {
        botId: 'bot-123456789',
        eventId: 'event-1',
        status: 'completed',
        meetingUrl: 'https://zoom.us/j/123456789',
        recordingUrl: 'https://storage.example.com/recording-123.mp4',
        transcriptUrl: 'https://storage.example.com/transcript-123.txt',
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        endedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        duration: 3600, // 1 hour in seconds
        participantCount: 2,
      },
      {
        botId: 'bot-987654321',
        eventId: 'event-2',
        status: 'recording',
        meetingUrl: 'https://teams.microsoft.com/l/meetup-join/123456789',
        startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        participantCount: 2,
      },
    ];

    return NextResponse.json({
      success: true,
      data: mockBots,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        totalBots: mockBots.length,
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
