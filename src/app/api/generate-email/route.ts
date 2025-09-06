/**
 * API Route: Generate Follow-up Email
 * POST /api/generate-email
 *
 * Generates follow-up emails from meeting transcripts using OpenAI GPT-4
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getEmailGenerationFunction, validateOpenAIConfig } from '@/lib/openai';
import { handleError } from '@/lib/utils';

// ============================================================================
// REQUEST VALIDATION SCHEMA
// ============================================================================

const GenerateEmailRequestSchema = z.object({
  transcript: z.string().min(10, 'Transcript must be at least 10 characters'),
  attendees: z.array(z.string()).min(1, 'At least one attendee is required'),
  meetingTitle: z.string().min(1, 'Meeting title is required'),
});

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = (await request.json()) as z.infer<typeof GenerateEmailRequestSchema>;
    const { transcript, attendees, meetingTitle } = GenerateEmailRequestSchema.parse(body);

    // Check OpenAI configuration
    const configCheck = validateOpenAIConfig();
    if (!configCheck.isValid) {
      console.warn('OpenAI not configured, using mock data:', configCheck.error);
    }

    // Get the appropriate generation function (real or mock)
    const generateEmail = getEmailGenerationFunction();

    // Generate email
    const result = await generateEmail(transcript, attendees, meetingTitle);

    // Return successful response
    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        usingMockData: !configCheck.isValid,
      },
    });
  } catch (error) {
    console.error('Generate email API error:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid request data',
            code: 'VALIDATION_ERROR',
            details: error.issues,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Handle other errors
    const errorDetails = handleError(error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: errorDetails.message,
          code: errorDetails.code || 'INTERNAL_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// OPTIONS HANDLER FOR CORS
// ============================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
