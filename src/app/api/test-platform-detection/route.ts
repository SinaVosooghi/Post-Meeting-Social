import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'No session found'
      }, { status: 401 });
    }

    console.log('Testing platform detection...');

    // Test URLs for different platforms
    const testUrls = [
      'https://zoom.us/j/123456789',
      'https://teams.microsoft.com/l/meetup-join/123456789',
      'https://meet.google.com/abc-defg-hij',
      'https://webex.com/meet/123456789',
      'https://us02web.zoom.us/j/123456789?pwd=abc123',
      'https://teams.live.com/meet/123456789',
      'https://meet.google.com/abc-defg-hij?authuser=0',
      'https://invalid-platform.com/meeting/123',
    ];

    // Platform detection function
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

    // Test each URL
    const results = testUrls.map(url => ({
      url,
      platform: detectMeetingPlatform(url),
      isValid: detectMeetingPlatform(url) !== 'other'
    }));

    const platformCounts = results.reduce((acc, result) => {
      acc[result.platform] = (acc[result.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        results,
        platformCounts,
        summary: {
          totalUrls: testUrls.length,
          validPlatforms: results.filter(r => r.isValid).length,
          invalidPlatforms: results.filter(r => !r.isValid).length,
          supportedPlatforms: ['zoom', 'google-meet', 'microsoft-teams', 'webex']
        },
        tests: [
          {
            name: 'Platform Detection',
            success: true,
            detectedPlatforms: Object.keys(platformCounts)
          },
          {
            name: 'URL Validation',
            success: results.filter(r => r.isValid).length > 0,
            validCount: results.filter(r => r.isValid).length
          }
        ]
      }
    });

  } catch (error) {
    console.error('Test platform detection error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
