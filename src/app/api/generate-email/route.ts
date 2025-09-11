import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import type { Session } from 'next-auth';
import { generateFollowUpEmail, generateMockFollowUpEmail } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required. Please sign in first.',
          signedIn: false,
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { transcript, meetingContext, emailSettings } = body;

    console.log('Generating follow-up email...', {
      transcriptLength: transcript?.length,
      meetingTitle: meetingContext?.title,
      settings: emailSettings,
      fullBody: body,
    });

    // Validate required fields
    if (!transcript) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transcript is required',
        },
        { status: 400 }
      );
    }

    // Use provided meetingContext or create default
    const context = meetingContext || {
      title: 'Meeting Discussion',
      attendees: ['Meeting Participants'],
      duration: 30,
      platform: 'zoom',
    };

    // Generate follow-up email using OpenAI with fallback
    let email;
    let usingMockData = false;
    let processingTimeMs = 0;
    const startTime = Date.now();

    try {
      email = await generateFollowUpEmail(
        transcript,
        context.attendees || ['Meeting Participants'],
        context.title || 'Meeting Discussion'
      );
      processingTimeMs = Date.now() - startTime;
    } catch (error) {
      console.warn('OpenAI email generation failed, using mock data:', error);

      if (error instanceof Error && error.message.includes('429')) {
        console.log('OpenAI quota exceeded, using mock email data');
        email = await generateMockFollowUpEmail(
          transcript,
          context.attendees || ['Meeting Participants'],
          context.title || 'Meeting Discussion'
        );
        usingMockData = true;
        processingTimeMs = Date.now() - startTime;
      } else {
        throw error;
      }
    }

    // Format email response to match expected structure
    const emailResponse = {
      subject: email.subject,
      body: email.content,
      to: 'client@example.com',
      cc: '',
      bcc: '',
      priority: 'normal',
    };

    return NextResponse.json({
      success: true,
      message: 'Follow-up email generated successfully!',
      data: {
        subject: email.subject,
        content: email.content,
        actionItems: email.actionItems || [],
        nextSteps: email.nextSteps || '',
      },
      metadata: {
        processingTimeMs,
        model: usingMockData ? 'gpt-4o-mini-mock' : 'gpt-4o-mini',
        subject: email.subject,
        wordCount: email.content.split(' ').length,
        characterCount: email.content.length,
        tone: emailSettings?.tone || 'professional',
        includesActionItems: email.actionItems && email.actionItems.length > 0,
        includesMeetingSummary:
          email.content.includes('meeting') || email.content.includes('discussion'),
        usingMockData,
        note: usingMockData ? 'Using mock data due to OpenAI quota exceeded' : undefined,
      },
      meetingContext: context,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Generate email error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate follow-up email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
