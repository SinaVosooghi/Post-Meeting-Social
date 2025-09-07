import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import type { Session } from 'next-auth';
import { getUpcomingEvents } from '@/lib/google-calendar';
import { scheduleMeetingBot, listMeetingBots } from '@/lib/recall-ai';

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

    console.log('Testing complete end-to-end workflow...');

    const workflowResults: any = {
      timestamp: new Date().toISOString(),
      user: session.user?.email,
      steps: []
    };

    // Step 1: Fetch Calendar Events
    try {
      console.log('Step 1: Fetching calendar events...');
      const googleToken = session.providerTokens?.google?.accessToken;
      
      if (!googleToken) {
        throw new Error('Google Calendar not connected');
      }

      const events = await getUpcomingEvents(googleToken, {
        maxResults: 5,
        timeMin: new Date(),
        refreshToken: session.providerTokens?.google?.refreshToken,
        expiresAt: session.providerTokens?.google?.expiresAt,
      });

      workflowResults.calendarEvents = {
        count: events.length,
        events: events.map(event => ({
          id: event.id,
          title: event.title,
          startTime: event.startTime,
          location: event.location,
          meetingUrl: event.meetingUrl,
          attendeesCount: event.attendees.length
        }))
      };

      workflowResults.steps.push({
        step: 1,
        name: 'Fetch Calendar Events',
        success: true,
        count: events.length
      });
    } catch (error) {
      workflowResults.steps.push({
        step: 1,
        name: 'Fetch Calendar Events',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Step 2: Schedule Recall.ai Bots
    try {
      console.log('Step 2: Scheduling Recall.ai bots...');
      const testUrls = [
        'https://zoom.us/j/123456789',
        'https://meet.google.com/abc-defg-hij'
      ];
      
      const scheduledBots = [];
      for (const url of testUrls) {
        try {
          const bot = await scheduleMeetingBot(url, {
            botName: `E2E Test Bot - ${new Date().toISOString()}`,
            recordAudio: true,
            recordVideo: false,
          });
          scheduledBots.push({
            id: bot.id,
            url: url,
            platform: bot.metadata.meetingPlatform,
            status: bot.status
          });
        } catch (error) {
          console.log(`Failed to schedule bot for ${url}:`, error);
        }
      }

      workflowResults.scheduledBots = {
        count: scheduledBots.length,
        bots: scheduledBots
      };

      workflowResults.steps.push({
        step: 2,
        name: 'Schedule Recall.ai Bots',
        success: scheduledBots.length > 0,
        count: scheduledBots.length
      });
    } catch (error) {
      workflowResults.steps.push({
        step: 2,
        name: 'Schedule Recall.ai Bots',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Step 3: Generate Content
    try {
      console.log('Step 3: Generating social media content...');
      
      const mockMeetingData = {
        title: 'E2E Test Meeting - Portfolio Review',
        attendees: ['John Smith (Financial Advisor)', 'Sarah Johnson (Client)'],
        duration: 45,
        keyPoints: [
          'Portfolio performed well despite market volatility',
          'Opportunity for tax-loss harvesting identified',
          'Client comfortable with current investment strategy'
        ],
        actionItems: [
          'Rebalance portfolio to target allocation',
          'Increase 401k contribution by 2%'
        ]
      };

      const linkedinPost = generateLinkedInPost(mockMeetingData);
      const twitterPost = generateTwitterPost(mockMeetingData);

      workflowResults.generatedContent = {
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
        totalPosts: 2,
        totalWordCount: linkedinPost.content.split(' ').length + twitterPost.content.split(' ').length
      };

      workflowResults.steps.push({
        step: 3,
        name: 'Generate Content',
        success: true,
        postsGenerated: 2
      });
    } catch (error) {
      workflowResults.steps.push({
        step: 3,
        name: 'Generate Content',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Step 4: Publish to LinkedIn
    try {
      console.log('Step 4: Publishing to LinkedIn...');
      
      // Mock LinkedIn publishing (in real implementation, this would use LinkedIn API)
      const mockPublishedPost = {
        platform: 'linkedin',
        postId: `e2e-test-${Date.now()}`,
        content: 'E2E Test: Just wrapped up an insightful client meeting...',
        publishedAt: new Date().toISOString(),
        url: `https://linkedin.com/feed/update/e2e-test-${Date.now()}`
      };

      workflowResults.publishedPosts = {
        count: 1,
        posts: [mockPublishedPost]
      };

      workflowResults.steps.push({
        step: 4,
        name: 'Publish to LinkedIn',
        success: true,
        postsPublished: 1
      });
    } catch (error) {
      workflowResults.steps.push({
        step: 4,
        name: 'Publish to LinkedIn',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Step 5: Get Recall.ai Bot Status
    try {
      console.log('Step 5: Checking Recall.ai bot status...');
      
      const bots = await listMeetingBots({ limit: 5 });
      
      workflowResults.botStatus = {
        totalBots: bots.length,
        recentBots: bots.slice(0, 3).map(bot => ({
          id: bot.id,
          name: bot.botName,
          status: bot.status,
          platform: bot.metadata.meetingPlatform
        }))
      };

      workflowResults.steps.push({
        step: 5,
        name: 'Check Bot Status',
        success: true,
        botsFound: bots.length
      });
    } catch (error) {
      workflowResults.steps.push({
        step: 5,
        name: 'Check Bot Status',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Calculate overall success
    const successfulSteps = workflowResults.steps.filter(step => step.success).length;
    const totalSteps = workflowResults.steps.length;
    const successRate = Math.round((successfulSteps / totalSteps) * 100);

    workflowResults.summary = {
      totalSteps,
      successfulSteps,
      failedSteps: totalSteps - successfulSteps,
      successRate: `${successRate}%`,
      workflowComplete: successRate >= 80
    };

    return NextResponse.json({
      success: true,
      message: 'Complete end-to-end workflow test completed!',
      data: workflowResults
    });

  } catch (error) {
    console.error('Complete workflow test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test complete workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateLinkedInPost(meetingData: any) {
  const { title, duration, keyPoints, actionItems } = meetingData;
  
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
