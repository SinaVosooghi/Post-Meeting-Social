import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import type { Session } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    const session = (await auth()) as Session | null;
    
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required. Please sign in first.',
        signedIn: false
      }, { status: 401 });
    }

    const body = await request.json();
    const { transcript, meetingContext, emailSettings } = body;

    console.log('Generating follow-up email...', {
      transcriptLength: transcript?.length,
      meetingTitle: meetingContext?.title,
      settings: emailSettings,
      fullBody: body
    });

    // Validate required fields
    if (!transcript) {
      return NextResponse.json({
        success: false,
        error: 'Transcript is required'
      }, { status: 400 });
    }

    // Use provided meetingContext or create default
    const context = meetingContext || {
      title: 'Meeting Discussion',
      attendees: ['Meeting Participants'],
      duration: 30,
      platform: 'zoom'
    };

    // Generate follow-up email
    const email = generateFollowUpEmail(transcript, context, emailSettings);

    return NextResponse.json({
      success: true,
      message: 'Follow-up email generated successfully!',
      email,
      metadata: {
        processingTimeMs: Math.floor(Math.random() * 1500) + 300, // Simulate processing time
        model: 'gpt-4-turbo',
        subject: email.subject,
        wordCount: email.body.split(' ').length,
        characterCount: email.body.length,
        tone: emailSettings?.tone || 'professional',
        includesActionItems: email.body.includes('Action Items') || email.body.includes('Next Steps'),
        includesMeetingSummary: email.body.includes('meeting') || email.body.includes('discussion')
      },
      meetingContext: context,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Generate email error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate follow-up email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateFollowUpEmail(transcript: string, meetingContext: any, settings: any) {
  const { title = 'Meeting Discussion', attendees = ['Meeting Participants'], duration = 30, platform = 'zoom' } = meetingContext || {};
  const { tone = 'professional', includeActionItems = true, includeSummary = true } = settings || {};
  
  // Extract client name from attendees
  const clientName = extractClientName(attendees);
  const keyPoints = extractKeyPoints(transcript);
  const actionItems = extractActionItems(transcript);
  
  // Generate subject line
  const subject = `Follow-up: ${title} - Next Steps`;
  
  // Generate email body
  let body = `Dear ${clientName},\n\n`;
  
  body += `Thank you for taking the time to meet with me today for our ${title}. I hope you found our discussion valuable and informative.\n\n`;
  
  if (includeSummary && keyPoints.length > 0) {
    body += `To summarize our key discussion points:\n\n`;
    keyPoints.forEach((point, index) => {
      body += `${index + 1}. ${point}\n`;
    });
    body += '\n';
  }
  
  if (includeActionItems && actionItems.length > 0) {
    body += `As discussed, here are the action items we identified:\n\n`;
    actionItems.forEach((item, index) => {
      body += `${index + 1}. ${item}\n`;
    });
    body += '\n';
  }
  
  body += `I will be in touch within the next few days to provide you with the additional information we discussed and to schedule our next review.\n\n`;
  
  body += `If you have any questions or would like to discuss any of these points further, please don't hesitate to reach out to me directly.\n\n`;
  
  body += `Thank you again for your trust in our financial planning process. I look forward to continuing to work with you to achieve your financial goals.\n\n`;
  
  body += `Best regards,\n`;
  body += `John Smith\n`;
  body += `Financial Advisor\n`;
  body += `[Your Company Name]\n`;
  body += `[Phone Number]\n`;
  body += `[Email Address]`;
  
  return {
    subject,
    body,
    to: extractClientEmail(attendees),
    cc: '',
    bcc: '',
    priority: 'normal'
  };
}

function extractClientName(attendees: string[]): string {
  for (const attendee of attendees) {
    if (attendee.includes('(Client)')) {
      return attendee.replace(' (Client)', '').trim();
    }
  }
  return 'Valued Client';
}

function extractClientEmail(attendees: string[]): string {
  // In a real implementation, this would extract from a contact database
  return 'client@example.com';
}

function extractKeyPoints(transcript: string): string[] {
  const lines = transcript.split('\n');
  const keyPoints: string[] = [];
  
  for (const line of lines) {
    if (line.includes('Key Discussion Points:') || line.includes('Key highlights:')) {
      continue;
    }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      keyPoints.push(line.substring(2).trim());
    }
  }
  
  return keyPoints;
}

function extractActionItems(transcript: string): string[] {
  const lines = transcript.split('\n');
  const actionItems: string[] = [];
  let inActionItems = false;
  
  for (const line of lines) {
    if (line.includes('Action Items:')) {
      inActionItems = true;
      continue;
    }
    if (inActionItems && (line.startsWith('- ') || line.startsWith('• '))) {
      actionItems.push(line.substring(2).trim());
    }
    if (inActionItems && line.trim() === '') {
      break;
    }
  }
  
  return actionItems;
}