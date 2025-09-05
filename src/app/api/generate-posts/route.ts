/**
 * API Route: Generate Social Media Posts
 * POST /api/generate-posts
 * 
 * Generates social media posts from meeting transcripts using OpenAI GPT-4
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  getPostGenerationFunction,
  validateOpenAIConfig 
} from '@/lib/openai';
import { 
  GeneratePostsRequest,
  SocialPlatform,
  ContentTone,
  ContentLength,
  MeetingPlatform 
} from '@/types';
import { handleError } from '@/lib/utils';

// ============================================================================
// REQUEST VALIDATION SCHEMA
// ============================================================================

const GeneratePostsRequestSchema = z.object({
  transcript: z.string().min(10, 'Transcript must be at least 10 characters'),
  meetingContext: z.object({
    title: z.string().min(1, 'Meeting title is required'),
    attendees: z.array(z.string()).min(1, 'At least one attendee is required'),
    duration: z.number().positive('Duration must be positive'),
    platform: z.nativeEnum(MeetingPlatform)
  }),
  automationSettings: z.object({
    maxPosts: z.number().min(1).max(10).default(3),
    includeHashtags: z.boolean().default(true),
    includeEmojis: z.boolean().default(false),
    tone: z.nativeEnum(ContentTone).default(ContentTone.PROFESSIONAL),
    length: z.nativeEnum(ContentLength).default(ContentLength.MEDIUM),
    publishImmediately: z.boolean().default(false),
    scheduleDelay: z.number().min(0).default(0)
  })
});

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = GeneratePostsRequestSchema.parse(body);

    // Check OpenAI configuration
    const configCheck = validateOpenAIConfig();
    if (!configCheck.isValid) {
      console.warn('OpenAI not configured, using mock data:', configCheck.error);
    }

    // Get the appropriate generation function (real or mock)
    const generatePosts = getPostGenerationFunction();

    // Generate posts
    const result = await generatePosts(validatedData);

    // Return successful response
    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        usingMockData: !configCheck.isValid
      }
    });

  } catch (error) {
    console.error('Generate posts API error:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: error.errors,
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }

    // Handle other errors
    const errorDetails = handleError(error);
    return NextResponse.json({
      success: false,
      error: {
        message: errorDetails.message,
        code: errorDetails.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
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
