import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import type { Session } from 'next-auth';
import { generateSocialMediaPosts, generateMockSocialMediaPosts } from '@/lib/openai';
import type { GeneratePostsRequest } from '@/types';

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

    console.log('Generating social media posts with OpenAI...', {
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

    // Use real OpenAI API to generate posts
    const generateRequest: GeneratePostsRequest = {
      transcript,
      meetingContext: context,
      automationSettings: automationSettings || {
        tone: 'professional',
        length: 'medium',
        includeHashtags: true,
        includeEmojis: true,
        platforms: ['linkedin', 'twitter', 'instagram']
      }
    };

    let result;
    let usingMockData = false;

    try {
      result = await generateSocialMediaPosts(generateRequest);
    } catch (error) {
      console.warn('OpenAI API failed, falling back to mock data:', error);
      
      // Check if it's a quota exceeded error
      if (error instanceof Error && error.message.includes('429')) {
        console.log('OpenAI quota exceeded, using mock data');
        result = await generateMockSocialMediaPosts(generateRequest);
        usingMockData = true;
      } else {
        throw error; // Re-throw if it's not a quota error
      }
    }

    const posts = result.posts.map(post => ({
      platform: post.platform,
      content: post.content,
      hashtags: post.hashtags,
      wordCount: post.content.split(' ').length,
      characterCount: post.content.length,
      estimatedEngagement: 'High',
      bestTimeToPost: 'Tuesday-Thursday, 8-10 AM or 1-3 PM'
    }));

    return NextResponse.json({
      success: true,
      data: {
        posts,
        metadata: {
          ...result.metadata,
          totalPosts: posts.length,
          platforms: posts.map(p => p.platform),
          totalWordCount: posts.reduce((sum, p) => sum + p.wordCount, 0),
          totalHashtags: posts.reduce((sum, p) => sum + p.hashtags.length, 0),
          averageEngagement: 'High',
          recommendedPostingTime: 'Tuesday-Thursday, 8-10 AM',
          usingMockData,
          note: usingMockData ? 'Using mock data due to OpenAI quota exceeded' : 'Generated with OpenAI API'
        },
        meetingContext: context,
        generatedAt: new Date().toISOString()
      }
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