import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import type { Session } from 'next-auth';

// Simple in-memory storage for social connections (persists per session, not across server restarts)
const socialConnectionsStorage = new Map<
  string,
  {
    platform: string;
    connected: boolean;
    username?: string;
    lastSync?: string;
    accessToken?: string;
    refreshToken?: string;
  }[]
>();

export async function GET() {
  try {
    const session = (await auth()) as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const userConnections = socialConnectionsStorage.get(session.user.email) || [
      { platform: 'linkedin', connected: false },
      { platform: 'facebook', connected: false },
    ];

    return NextResponse.json({
      success: true,
      data: userConnections,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        note: 'Using in-memory storage',
      },
    });
  } catch (error) {
    console.error('Social connections fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch social connections',
          code: 'SOCIAL_CONNECTIONS_FETCH_ERROR',
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
      platform: string;
      connected: boolean;
      username?: string;
      lastSync?: string;
      accessToken?: string;
      refreshToken?: string;
    };

    const { platform, connected, username, lastSync, accessToken, refreshToken } = body;

    // Get existing connections for this user
    const existingConnections = socialConnectionsStorage.get(session.user.email) || [
      { platform: 'linkedin', connected: false },
      { platform: 'facebook', connected: false },
    ];

    // Update the specific platform connection
    const updatedConnections = existingConnections.map(conn =>
      conn.platform === platform
        ? {
            platform,
            connected,
            username,
            lastSync,
            accessToken,
            refreshToken,
          }
        : conn
    );

    // Store updated connections
    socialConnectionsStorage.set(session.user.email, updatedConnections);

    console.log(`🔗 Social connection updated for user: ${session.user.email}`);

    return NextResponse.json({
      success: true,
      data: updatedConnections,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        note: 'Using in-memory storage',
      },
    });
  } catch (error) {
    console.error('Social connection update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to update social connection',
          code: 'SOCIAL_CONNECTION_UPDATE_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
