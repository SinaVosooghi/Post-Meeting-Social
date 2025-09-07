import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import { 
  scheduleMeetingBot, 
  listMeetingBots, 
  getMeetingTranscript, 
  getBotStatus,
  cancelMeetingBot 
} from '@/lib/recall-ai';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'No session found'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('test') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');
    const botId = searchParams.get('botId');

    console.log(`Testing Recall.ai integration - Test: ${testType}`);

    const results: any = {
      timestamp: new Date().toISOString(),
      user: session.user.email,
      testType,
      tests: []
    };

    // Test 1: Environment Check
    if (testType === 'all' || testType === 'env') {
      try {
        const apiKey = process.env.RECALL_AI_API_KEY;
        results.env = {
          hasApiKey: !!apiKey,
          apiKeyLength: apiKey?.length || 0,
          apiKeyPrefix: apiKey?.substring(0, 8) + '...' || 'none'
        };
        results.tests.push({
          name: 'Environment Check',
          success: !!apiKey,
          details: results.env
        });
      } catch (error) {
        results.tests.push({
          name: 'Environment Check',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Test 2: List Existing Bots
    if (testType === 'all' || testType === 'list') {
      try {
        console.log('Testing listMeetingBots...');
        const bots = await listMeetingBots({ limit });
        results.existingBots = {
          count: bots.length,
          bots: bots.map(bot => ({
            id: bot.id,
            name: bot.botName,
            status: bot.status,
            platform: bot.metadata.meetingPlatform,
            scheduledAt: bot.scheduledAt,
            startedAt: bot.startedAt,
            endedAt: bot.endedAt,
            hasRecording: !!bot.recordingUrl,
            hasTranscript: !!bot.transcriptUrl
          }))
        };
        results.tests.push({
          name: 'List Meeting Bots',
          success: true,
          count: bots.length
        });
      } catch (error) {
        results.tests.push({
          name: 'List Meeting Bots',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Test 3: Get Bot Status (if botId provided)
    if (botId && (testType === 'all' || testType === 'status')) {
      try {
        console.log(`Testing getBotStatus for bot: ${botId}`);
        const botStatus = await getBotStatus(botId);
        results.botStatus = {
          id: botStatus.id,
          name: botStatus.botName,
          status: botStatus.status,
          platform: botStatus.metadata.meetingPlatform,
          scheduledAt: botStatus.scheduledAt,
          startedAt: botStatus.startedAt,
          endedAt: botStatus.endedAt,
          hasRecording: !!botStatus.recordingUrl,
          hasTranscript: !!botStatus.transcriptUrl,
          config: botStatus.config
        };
        results.tests.push({
          name: 'Get Bot Status',
          success: true,
          botId: botId
        });
      } catch (error) {
        results.tests.push({
          name: 'Get Bot Status',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Test 4: Get Transcript (if botId provided)
    if (botId && (testType === 'all' || testType === 'transcript')) {
      try {
        console.log(`Testing getMeetingTranscript for bot: ${botId}`);
        const transcript = await getMeetingTranscript(botId);
        results.transcript = {
          botId: transcript.botId,
          meetingId: transcript.meetingId,
          content: transcript.content?.substring(0, 500) + (transcript.content && transcript.content.length > 500 ? '...' : ''),
          speakers: transcript.speakers,
          segments: transcript.segments?.length || 0,
          summary: transcript.summary,
          keyPoints: transcript.keyPoints,
          actionItems: transcript.actionItems,
          duration: transcript.duration,
          wordCount: transcript.wordCount,
          language: transcript.language,
          createdAt: transcript.createdAt
        };
        results.tests.push({
          name: 'Get Meeting Transcript',
          success: true,
          hasContent: !!transcript.content,
          wordCount: transcript.wordCount
        });
      } catch (error) {
        results.tests.push({
          name: 'Get Meeting Transcript',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Test 5: Schedule New Bot
    if (testType === 'all' || testType === 'schedule') {
      try {
        console.log('Testing scheduleMeetingBot...');
        const testUrls = [
          'https://zoom.us/j/123456789',
          'https://meet.google.com/abc-defg-hij',
          'https://teams.microsoft.com/l/meetup-join/123456789'
        ];
        
        const newBots = [];
        for (const url of testUrls) {
          try {
            const newBot = await scheduleMeetingBot(url, {
              botName: `Test Bot - ${new Date().toISOString()}`,
              recordAudio: true,
              recordVideo: false,
            });
            newBots.push({
              id: newBot.id,
              url: url,
              platform: newBot.metadata.meetingPlatform,
              status: newBot.status
            });
          } catch (error) {
            console.log(`Failed to schedule bot for ${url}:`, error);
          }
        }
        
        results.newBots = newBots;
        results.tests.push({
          name: 'Schedule New Bots',
          success: newBots.length > 0,
          scheduled: newBots.length,
          total: testUrls.length
        });
      } catch (error) {
        results.tests.push({
          name: 'Schedule New Bots',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Test 6: Platform Detection
    if (testType === 'all' || testType === 'platform') {
      try {
        const testUrls = [
          'https://zoom.us/j/123456789',
          'https://teams.microsoft.com/l/meetup-join/123456789',
          'https://meet.google.com/abc-defg-hij',
          'https://webex.com/meet/123456789',
          'https://invalid-url.com/meeting'
        ];

        function detectMeetingPlatform(meetingUrl: string): 'zoom' | 'google-meet' | 'microsoft-teams' | 'webex' | 'other' {
          const url = meetingUrl.toLowerCase();
          
          if (url.includes('zoom.us') || url.includes('zoom.com')) {
            return 'zoom';
          } else if (url.includes('teams.microsoft.com') || url.includes('teams.live.com')) {
            return 'microsoft-teams';
          } else if (url.includes('meet.google.com') || url.includes('google.com/meet')) {
            return 'google-meet';
          } else if (url.includes('webex.com') || url.includes('cisco.com')) {
            return 'webex';
          } else {
            return 'other';
          }
        }

        const platformResults = testUrls.map(url => ({
          url,
          platform: detectMeetingPlatform(url),
          isValid: detectMeetingPlatform(url) !== 'other'
        }));

        results.platformDetection = {
          results: platformResults,
          summary: {
            totalUrls: testUrls.length,
            validPlatforms: platformResults.filter(r => r.isValid).length,
            invalidPlatforms: platformResults.filter(r => !r.isValid).length,
            supportedPlatforms: ['zoom', 'google-meet', 'microsoft-teams', 'webex']
          }
        };
        results.tests.push({
          name: 'Platform Detection',
          success: true,
          detectedPlatforms: [...new Set(platformResults.map(r => r.platform))]
        });
      } catch (error) {
        results.tests.push({
          name: 'Platform Detection',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Test 7: API Health Check
    if (testType === 'all' || testType === 'health') {
      try {
        const apiKey = process.env.RECALL_AI_API_KEY;
        if (apiKey) {
          const response = await fetch('https://us-east-1.recall.ai/api/v1/bot/', {
            headers: {
              'Authorization': `Token ${apiKey}`,
              'Content-Type': 'application/json',
            },
          });

          results.apiHealth = {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText
          };
          results.tests.push({
            name: 'API Health Check',
            success: response.ok,
            status: response.status
          });
        } else {
          results.tests.push({
            name: 'API Health Check',
            success: false,
            error: 'No API key available'
          });
        }
      } catch (error) {
        results.tests.push({
          name: 'API Health Check',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Summary
    results.summary = {
      totalTests: results.tests.length,
      passedTests: results.tests.filter(t => t.success).length,
      failedTests: results.tests.filter(t => !t.success).length,
      successRate: `${Math.round((results.tests.filter(t => t.success).length / results.tests.length) * 100)}%`
    };

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Comprehensive Recall.ai test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
