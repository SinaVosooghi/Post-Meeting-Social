import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import type { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = (await auth()) as Session | null;
    
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required. Please sign in first.',
        signedIn: false
      });
    }

    console.log('Testing content generation...');

    // Mock meeting data for content generation
    const mockMeetingData = {
      title: 'Q4 Portfolio Review with Sarah Johnson',
      attendees: ['John Smith (Financial Advisor)', 'Sarah Johnson (Client)'],
      duration: 45,
      keyPoints: [
        'Portfolio performed well despite market volatility',
        'Opportunity for tax-loss harvesting identified',
        'Client comfortable with current investment strategy',
        'Retirement timeline on track with increased contributions'
      ],
      actionItems: [
        'Rebalance portfolio to target allocation',
        'Increase 401k contribution by 2%',
        'Schedule next review for February',
        'Research ESG investment options'
      ],
      platform: 'zoom'
    };

    // Generate LinkedIn post content
    const linkedinPost = generateLinkedInPost(mockMeetingData);
    
    // Generate Twitter post content
    const twitterPost = generateTwitterPost(mockMeetingData);

    return NextResponse.json({
      success: true,
      message: 'Content generation working!',
      data: {
        posts: [
          {
            platform: 'linkedin',
            content: linkedinPost.content,
            hashtags: linkedinPost.hashtags,
            wordCount: linkedinPost.content.split(' ').length
          },
          {
            platform: 'twitter',
            content: twitterPost.content,
            hashtags: twitterPost.hashtags,
            wordCount: twitterPost.content.split(' ').length
          }
        ],
        summary: {
          totalPosts: 2,
          platforms: ['linkedin', 'twitter'],
          totalWordCount: linkedinPost.content.split(' ').length + twitterPost.content.split(' ').length,
          totalHashtags: linkedinPost.hashtags.length + twitterPost.hashtags.length
        },
        meetingData: mockMeetingData
      }
    });

  } catch (error) {
    console.error('Content generation test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test content generation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateLinkedInPost(meetingData: any) {
  const { title, attendees, duration, keyPoints, actionItems } = meetingData;
  
  const content = `🎯 Just wrapped up an insightful ${duration}-minute ${title}!

Key highlights from our discussion:
• ${keyPoints[0]}
• ${keyPoints[1]}
• ${keyPoints[2]}

Next steps we're focusing on:
✅ ${actionItems[0]}
✅ ${actionItems[1]}

Grateful for the productive conversation and looking forward to implementing these strategies. The financial planning journey continues! 💼

#FinancialPlanning #WealthManagement #InvestmentStrategy #PortfolioReview #ClientSuccess #FinancialAdvisor #RetirementPlanning #TaxStrategy`;

  const hashtags = [
    '#FinancialPlanning',
    '#WealthManagement', 
    '#InvestmentStrategy',
    '#PortfolioReview',
    '#ClientSuccess',
    '#FinancialAdvisor',
    '#RetirementPlanning',
    '#TaxStrategy'
  ];

  return { content, hashtags };
}

function generateTwitterPost(meetingData: any) {
  const { title, keyPoints } = meetingData;
  
  const content = `🎯 Just finished ${title}! 

Key takeaway: ${keyPoints[0]}

Excited to implement the next steps. The financial planning journey continues! 💼

#FinancialPlanning #WealthManagement #InvestmentStrategy`;

  const hashtags = [
    '#FinancialPlanning',
    '#WealthManagement',
    '#InvestmentStrategy'
  ];

  return { content, hashtags };
}
