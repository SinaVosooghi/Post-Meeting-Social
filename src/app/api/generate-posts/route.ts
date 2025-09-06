/**
 * Content Generation API Route
 * Transforms meeting content into social media posts
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generatePost } from '@/lib/content-generator';
import type { ApiResponse, GeneratedContent, ClientMeeting } from '@/types/master-interfaces';
import {
  SocialPlatform,
  ContentTone,
  MeetingPlatform,
  RecordingStatus,
  TranscriptStatus,
  RiskLevel,
  RiskTolerance,
  FirmType,
  ComplianceFramework,
  RelationshipType,
  RiskProfile,
  InvestmentExperience,
} from '@/types/master-interfaces';
import { z } from 'zod';

// Request validation schema
const generatePostSchema = z.object({
  meetingId: z.string(),
  platform: z.nativeEnum(SocialPlatform),
  tone: z.nativeEnum(ContentTone).optional(),
  includeHashtags: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            message: 'Authentication required',
            code: 'UNAUTHORIZED',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
            processingTimeMs: 0,
            version: '1.0.0',
            complianceChecked: false,
          },
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = (await request.json()) as z.infer<typeof generatePostSchema>;
    const validationResult = generatePostSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            message: 'Invalid request parameters',
            code: 'VALIDATION_ERROR',
            details: validationResult.error.flatten(),
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
            processingTimeMs: 0,
            version: '1.0.0',
            complianceChecked: false,
          },
        },
        { status: 400 }
      );
    }

    const { meetingId, platform, tone } = validationResult.data;

    // For demo, use mock meeting data that matches our interface
    const mockMeeting: ClientMeeting = {
      id: meetingId,
      advisorId: session.user.id,
      calendarEventId: `cal-${meetingId}`,
      title: 'Investment Strategy Review',
      description: 'Quarterly portfolio review and investment strategy discussion',
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000),
      meetingUrl: 'https://meet.google.com/mock',
      platform: MeetingPlatform.GOOGLE_MEET,

      // Client relationship context
      clientRelationship: {
        clientId: 'client-123',
        relationshipType: RelationshipType.CLIENT,
        riskProfile: RiskProfile.MODERATE,
        investmentExperience: InvestmentExperience.INTERMEDIATE,
        regulatoryStatus: 'retail',
        communicationPreferences: {
          allowSocialMedia: true,
          privacyLevel: 'public',
          consentToRecord: true,
          dataRetentionConsent: true,
          preferredContactMethod: 'email',
        },
      },

      // Compliance flags
      complianceFlags: {
        containsSensitiveData: false,
        requiresLegalReview: false,
        hasInvestmentAdvice: true,
        needsDisclaimer: true,
        riskLevel: RiskLevel.MEDIUM,
        topicsDiscussed: ['portfolio review', 'market outlook', 'investment strategy'],
      },

      // Recording details
      recordingDetails: {
        botId: 'bot-123',
        recordingStatus: RecordingStatus.COMPLETED,
        transcriptStatus: TranscriptStatus.COMPLETED,
        transcript: 'Mock transcript content...',
        recordingUrl: 'https://storage.example.com/recording.mp4',
        transcriptUrl: 'https://storage.example.com/transcript.txt',
        duration: 3600,
        participantCount: 2,
      },

      createdAt: new Date(),
      updatedAt: new Date(),

      // Include required advisor relationship
      advisor: {
        id: 'advisor-123',
        userId: session.user.id,
        firmName: 'Example Wealth Management',
        licenseNumbers: {
          series7: '1234567',
          series66: '7654321',
          stateRegistrations: ['NY', 'CA'],
          crd: '123456',
        },
        complianceSettings: {
          riskToleranceThreshold: RiskTolerance.MEDIUM,
          requiredDisclosures: ['investment disclaimer'],
          approvedHashtags: ['WealthManagement', 'FinancialPlanning'],
          restrictedTopics: ['specific stocks', 'guarantees'],
          autoApprovalThreshold: 80,
          contentReviewRequired: true,
          supervisorApprovalRequired: false,
        },
        regulatoryRequirements: {
          finraRegistered: true,
          secRegistered: true,
          stateRequirements: ['NY fiduciary', 'CA fiduciary'],
          recordKeepingPeriod: 7,
          complianceOfficer: 'Jane Smith',
          lastComplianceReview: new Date(),
        },
        firmSettings: {
          firmType: FirmType.RIA,
          aum: 500000000,
          clientCount: 200,
          complianceFramework: ComplianceFramework.MULTIPLE,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    const startTime = Date.now();

    // Generate post content
    const post = await generatePost({
      meeting: mockMeeting,
      platform,
      tone: tone !== null ? tone : 'professional',
      includeHashtags: true,
    });

    const processingTime = Date.now() - startTime;

    // Return standardized API response
    return NextResponse.json<ApiResponse<GeneratedContent>>({
      success: true,
      data: {
        id: crypto.randomUUID(),
        requestId: crypto.randomUUID(),
        advisorId: session.user.id,
        meetingId,
        platform,
        content: {
          originalContent: post.content,
          finalContent: post.content,
          hashtags: post.hashtags,
          mentions: [],
          callToAction: 'Contact us to learn more about our investment strategies.',
          mediaRecommendations: [],
        },
        aiMetadata: {
          model: 'gpt-4',
          promptVersion: '1.0.0',
          tokensUsed: 500, // Mock value
          processingTimeMs: processingTime,
          confidence: 0.95,
          reasoning: 'Generated based on meeting transcript and compliance requirements',
          alternatives: [],
        },
        complianceStatus: post.issues.length > 0 ? 'requires_modification' : 'approved',
        riskScore: post.riskScore,
        complianceFlags: post.issues,
        publishingStatus: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        processingTimeMs: processingTime,
        version: '1.0.0',
        complianceChecked: true,
      },
    });
  } catch (error) {
    console.error('Content generation error:', error);

    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to generate content',
          code: 'GENERATION_ERROR',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          stack:
            process.env.NODE_ENV === 'development'
              ? error instanceof Error
                ? error.stack
                : undefined
              : undefined,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          processingTimeMs: 0,
          version: '1.0.0',
          complianceChecked: false,
        },
      },
      { status: 500 }
    );
  }
}
