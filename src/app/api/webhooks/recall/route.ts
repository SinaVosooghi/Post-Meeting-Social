/**
 * Recall.ai Webhook Handler
 * POST /api/webhooks/recall - Handle Recall.ai webhook events
 *
 * Handles real-time updates from Recall.ai about bot status, recordings, and transcripts
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { recallLogger } from '@/lib/logger';
import type { RecallWebhookEvent } from '@/types/master-interfaces';

// ============================================================================
// WEBHOOK HANDLERS
// ============================================================================

/**
 * Handle bot status updates
 */
async function handleBotStatusUpdate(event: RecallWebhookEvent): Promise<void> {
  const { bot_id, data } = event;

  recallLogger.info(`Bot ${bot_id} status updated to: ${data.status}`);

  // Update bot status in database
  // This would typically update the database with the new status
  // For now, we'll just log the update

  if (data.status === 'recording') {
    recallLogger.info(`Bot ${bot_id} started recording at ${data.started_at}`);
  } else if (data.status === 'done') {
    recallLogger.info(`Bot ${bot_id} completed recording at ${data.ended_at}`);
    if (data.recording_url) {
      recallLogger.info(`Recording available at: ${data.recording_url}`);
    }
    if (data.transcript_url) {
      recallLogger.info(`Transcript available at: ${data.transcript_url}`);
    }
  } else if (data.status === 'error') {
    recallLogger.error(`Bot ${bot_id} encountered error: ${data.error}`);
  }
}

/**
 * Handle transcript ready events
 */
async function handleTranscriptReady(event: RecallWebhookEvent): Promise<void> {
  const { bot_id, data } = event;

  recallLogger.info(`Transcript ready for bot ${bot_id}`);

  // Process transcript and generate social media content
  // This would typically trigger the content generation pipeline
  if (data.transcript_url) {
    recallLogger.info(`Processing transcript from: ${data.transcript_url}`);

    // TODO: Trigger content generation pipeline
    // 1. Fetch transcript from URL
    // 2. Generate social media content
    // 3. Store generated content
    // 4. Notify user (optional)
  }
}

/**
 * Handle recording ready events
 */
async function handleRecordingReady(event: RecallWebhookEvent): Promise<void> {
  const { bot_id, data } = event;

  recallLogger.info(`Recording ready for bot ${bot_id}`);

  if (data.recording_url) {
    recallLogger.info(`Recording available at: ${data.recording_url}`);

    // TODO: Process recording if needed
    // This could include:
    // 1. Download and store recording
    // 2. Extract audio for transcription
    // 3. Generate video thumbnails
  }
}

// ============================================================================
// MAIN WEBHOOK HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RecallWebhookEvent;

    recallLogger.info(`Received Recall.ai webhook: ${body.event} for bot ${body.bot_id}`);

    // Verify webhook signature (in production)
    // const signature = request.headers.get('x-recall-signature');
    // if (!verifyWebhookSignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    // Handle different event types
    switch (body.event) {
      case 'bot.status_changed':
        await handleBotStatusUpdate(body);
        break;

      case 'bot.transcript_ready':
        await handleTranscriptReady(body);
        break;

      case 'bot.recording_ready':
        await handleRecordingReady(body);
        break;

      case 'bot.error':
        await handleBotStatusUpdate(body);
        break;

      default:
        recallLogger.warn(`Unknown webhook event: ${body.event}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    recallLogger.error('Webhook processing error:', error as Error);

    return NextResponse.json(
      {
        success: false,
        error: 'Webhook processing failed',
      },
      { status: 500 }
    );
  }
}

/**
 * Verify webhook signature (for production use)
 */
function _verifyWebhookSignature(_payload: unknown, _signature: string | null): boolean {
  // TODO: Implement webhook signature verification
  // This would use the webhook secret to verify the request is from Recall.ai
  return true; // For now, always return true
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'recall-webhook-handler',
    timestamp: new Date().toISOString(),
  });
}
