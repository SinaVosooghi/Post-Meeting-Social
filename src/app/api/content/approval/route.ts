/**
 * Content Approval API Endpoint
 * POST /api/content/approval - Handle content approval workflow
 *
 * Handles pre-publish content review and approval for social media posts
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import type { Session } from 'next-auth';
import { socialLogger } from '@/lib/logger';
import type { ContentApprovalRequest, ContentApprovalResponse } from '@/types/master-interfaces';

// ============================================================================
// MOCK CONTENT STORAGE
// ============================================================================

// In production, this would be stored in a database
const mockContentStorage = new Map<
  string,
  {
    id: string;
    content: string;
    platform: string;
    status: 'pending_approval' | 'approved' | 'rejected' | 'pending_changes';
    createdAt: string;
    approvedAt?: string;
    approvedBy?: string;
    changes?: string;
    reason?: string;
  }
>();

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const session = (await auth()) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json<ContentApprovalResponse>(
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

    const body = (await request.json()) as ContentApprovalRequest;
    const { action, contentId, changes, reason } = body;

    switch (action) {
      case 'approve': {
        if (!contentId) {
          return NextResponse.json<ContentApprovalResponse>(
            {
              success: false,
              error: {
                message: 'Content ID is required for approval',
                code: 'MISSING_CONTENT_ID',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          );
        }

        const content = mockContentStorage.get(contentId);
        if (!content) {
          return NextResponse.json<ContentApprovalResponse>(
            {
              success: false,
              error: {
                message: 'Content not found',
                code: 'CONTENT_NOT_FOUND',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 404 }
          );
        }

        // Update content status
        content.status = 'approved';
        content.approvedAt = new Date().toISOString();
        content.approvedBy = session.user.id;
        mockContentStorage.set(contentId, content);

        socialLogger.info(`Content ${contentId} approved by user ${session.user.id}`);

        return NextResponse.json<ContentApprovalResponse>({
          success: true,
          data: {
            contentId,
            status: 'approved',
            approvedAt: content.approvedAt,
            approvedBy: content.approvedBy,
          },
        });
      }

      case 'reject': {
        if (!contentId) {
          return NextResponse.json<ContentApprovalResponse>(
            {
              success: false,
              error: {
                message: 'Content ID is required for rejection',
                code: 'MISSING_CONTENT_ID',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          );
        }

        const content = mockContentStorage.get(contentId);
        if (!content) {
          return NextResponse.json<ContentApprovalResponse>(
            {
              success: false,
              error: {
                message: 'Content not found',
                code: 'CONTENT_NOT_FOUND',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 404 }
          );
        }

        // Update content status
        content.status = 'rejected';
        content.reason = reason;
        mockContentStorage.set(contentId, content);

        socialLogger.info(`Content ${contentId} rejected by user ${session.user.id}: ${reason}`);

        return NextResponse.json<ContentApprovalResponse>({
          success: true,
          data: {
            contentId,
            status: 'rejected',
            reason: content.reason,
          },
        });
      }

      case 'request_changes': {
        if (!contentId || !changes) {
          return NextResponse.json<ContentApprovalResponse>(
            {
              success: false,
              error: {
                message: 'Content ID and changes are required',
                code: 'MISSING_REQUIRED_FIELDS',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          );
        }

        const content = mockContentStorage.get(contentId);
        if (!content) {
          return NextResponse.json<ContentApprovalResponse>(
            {
              success: false,
              error: {
                message: 'Content not found',
                code: 'CONTENT_NOT_FOUND',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 404 }
          );
        }

        // Update content status
        content.status = 'pending_changes';
        content.changes = changes;
        content.reason = reason;
        mockContentStorage.set(contentId, content);

        socialLogger.info(`Content ${contentId} marked for changes by user ${session.user.id}`);

        return NextResponse.json<ContentApprovalResponse>({
          success: true,
          data: {
            contentId,
            status: 'pending_changes',
            changes: content.changes,
            reason: content.reason,
          },
        });
      }

      case 'get_pending': {
        // Get all pending content for approval
        const pendingContent = Array.from(mockContentStorage.values())
          .filter(content => content.status === 'pending_approval')
          .map(content => ({
            id: content.id,
            content: content.content,
            platform: content.platform,
            status: content.status,
            createdAt: content.createdAt,
          }));

        return NextResponse.json({
          success: true,
          data: {
            pendingContent,
            count: pendingContent.length,
          },
        });
      }

      default:
        return NextResponse.json<ContentApprovalResponse>(
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
    socialLogger.error('Content approval error:', error as Error);

    return NextResponse.json<ContentApprovalResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Content approval error',
          code: 'CONTENT_APPROVAL_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET PENDING CONTENT
// ============================================================================

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const session = (await auth()) as Session | null;
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

    // Get all pending content for approval
    const pendingContent = Array.from(mockContentStorage.values())
      .filter(content => content.status === 'pending_approval')
      .map(content => ({
        id: content.id,
        content: content.content,
        platform: content.platform,
        status: content.status,
        createdAt: content.createdAt,
      }));

    return NextResponse.json({
      success: true,
      data: {
        pendingContent,
        count: pendingContent.length,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    socialLogger.error('Get pending content error:', error as Error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Get pending content error',
          code: 'GET_PENDING_CONTENT_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Add content for approval (called by content generation pipeline)
 */
export function addContentForApproval(contentId: string, content: string, platform: string): void {
  mockContentStorage.set(contentId, {
    id: contentId,
    content,
    platform,
    status: 'pending_approval',
    createdAt: new Date().toISOString(),
  });

  socialLogger.info(`Content ${contentId} added for approval`);
}

/**
 * Get content by ID
 */
export function getContentById(contentId: string) {
  return mockContentStorage.get(contentId);
}
