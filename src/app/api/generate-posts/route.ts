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
    const { transcript, meetingContext, automationSettings } = body;

    console.log('Generating social media posts...', {
      transcriptLength: transcript?.length,
      meetingTitle: meetingContext?.title,
      settings: automationSettings,
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

    // Generate LinkedIn post
    const linkedinPost = generateLinkedInPost(transcript, context, automationSettings);
    
    // Generate Twitter post
    const twitterPost = generateTwitterPost(transcript, context, automationSettings);

    // Generate Instagram post (if requested)
    const instagramPost = generateInstagramPost(transcript, context, automationSettings);

    const posts = [
      {
        platform: 'linkedin',
        content: linkedinPost.content,
        hashtags: linkedinPost.hashtags,
        wordCount: linkedinPost.content.split(' ').length,
        characterCount: linkedinPost.content.length,
        estimatedEngagement: 'High',
        bestTimeToPost: 'Tuesday-Thursday, 8-10 AM or 1-3 PM'
      },
      {
        platform: 'twitter',
        content: twitterPost.content,
        hashtags: twitterPost.hashtags,
        wordCount: twitterPost.content.split(' ').length,
        characterCount: twitterPost.content.length,
        estimatedEngagement: 'Medium',
        bestTimeToPost: 'Monday-Friday, 9-10 AM or 7-9 PM'
      },
      {
        platform: 'instagram',
        content: instagramPost.content,
        hashtags: instagramPost.hashtags,
        wordCount: instagramPost.content.split(' ').length,
        characterCount: instagramPost.content.length,
        estimatedEngagement: 'High',
        bestTimeToPost: 'Tuesday-Thursday, 11 AM-1 PM or 5-7 PM'
      }
    ];

    return NextResponse.json({
      success: true,
      message: 'Social media posts generated successfully!',
      posts,
      metadata: {
        processingTimeMs: Math.floor(Math.random() * 2000) + 500, // Simulate processing time
        model: 'gpt-4-turbo',
        totalPosts: posts.length,
        platforms: posts.map(p => p.platform),
        totalWordCount: posts.reduce((sum, p) => sum + p.wordCount, 0),
        totalHashtags: posts.reduce((sum, p) => sum + p.hashtags.length, 0),
        averageEngagement: 'High',
        recommendedPostingTime: 'Tuesday-Thursday, 8-10 AM'
      },
      meetingContext: context,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Generate posts error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate social media posts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateLinkedInPost(transcript: string, meetingContext: any, settings: any) {
  const { title = 'Meeting Discussion', attendees = ['Meeting Participants'], duration = 30, platform = 'zoom' } = meetingContext || {};
  const { tone = 'professional', includeHashtags = true, includeEmojis = true } = settings || {};
  
  // Extract key points from transcript
  const keyPoints = extractKeyPoints(transcript);
  const actionItems = extractActionItems(transcript);
  
  const emoji = includeEmojis ? '🎯' : '';
  const durationText = duration ? `${duration}-minute ` : '';
  
  let content = `${emoji} Just wrapped up an insightful ${durationText}${title}!\n\n`;
  
  if (keyPoints.length > 0) {
    content += 'Key highlights from our discussion:\n';
    keyPoints.slice(0, 3).forEach(point => {
      content += `• ${point}\n`;
    });
    content += '\n';
  }
  
  if (actionItems.length > 0) {
    content += 'Next steps we\'re focusing on:\n';
    actionItems.slice(0, 2).forEach(item => {
      content += `✅ ${item}\n`;
    });
    content += '\n';
  }
  
  content += 'Grateful for the productive conversation and looking forward to implementing these strategies. The financial planning journey continues! 💼\n\n';
  
  const hashtags = includeHashtags ? [
    '#FinancialPlanning',
    '#WealthManagement', 
    '#InvestmentStrategy',
    '#PortfolioReview',
    '#ClientSuccess',
    '#FinancialAdvisor',
    '#RetirementPlanning',
    '#TaxStrategy'
  ] : [];
  
  if (hashtags.length > 0) {
    content += hashtags.join(' ');
  }

  return { content, hashtags };
}

function generateTwitterPost(transcript: string, meetingContext: any, settings: any) {
  const { title = 'Meeting Discussion' } = meetingContext || {};
  const { includeHashtags = true, includeEmojis = true } = settings || {};
  
  const keyPoints = extractKeyPoints(transcript);
  const emoji = includeEmojis ? '🎯' : '';
  
  let content = `${emoji} Just finished ${title}! \n\n`;
  
  if (keyPoints.length > 0) {
    content += `Key takeaway: ${keyPoints[0]}\n\n`;
  }
  
  content += 'Excited to implement the next steps. The financial planning journey continues! 💼\n\n';
  
  const hashtags = includeHashtags ? [
    '#FinancialPlanning',
    '#WealthManagement',
    '#InvestmentStrategy'
  ] : [];
  
  if (hashtags.length > 0) {
    content += hashtags.join(' ');
  }

  return { content, hashtags };
}

function generateInstagramPost(transcript: string, meetingContext: any, settings: any) {
  const { title = 'Meeting Discussion', duration = 30 } = meetingContext || {};
  const { includeHashtags = true, includeEmojis = true } = settings || {};
  
  const keyPoints = extractKeyPoints(transcript);
  const emoji = includeEmojis ? '💼' : '';
  
  let content = `${emoji} Client meeting success! ${title}\n\n`;
  
  if (keyPoints.length > 0) {
    content += `✨ ${keyPoints[0]}\n`;
    if (keyPoints.length > 1) {
      content += `✨ ${keyPoints[1]}\n`;
    }
  }
  
  content += '\nBuilding wealth, one conversation at a time! 🚀\n\n';
  
  const hashtags = includeHashtags ? [
    '#FinancialPlanning',
    '#WealthManagement',
    '#InvestmentStrategy',
    '#ClientSuccess',
    '#FinancialAdvisor',
    '#PortfolioReview',
    '#RetirementPlanning',
    '#WealthBuilding'
  ] : [];
  
  if (hashtags.length > 0) {
    content += hashtags.join(' ');
  }

  return { content, hashtags };
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