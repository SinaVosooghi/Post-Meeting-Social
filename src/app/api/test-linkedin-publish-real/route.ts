import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-wrapper';
import { getLinkedInToken } from '@/lib/persistent-token-store';
import { postToLinkedIn, validateLinkedInContent, optimizeContentForLinkedIn } from '@/lib/linkedin';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'No session found'
      }, { status: 401 });
    }

    // Use hardcoded test content for GET request
    const content = "Just wrapped up an insightful client meeting discussing:\n\n• portfolio review\n• market outlook\n• investment strategy\n\nNote: This post is for informational purposes only and does not constitute investment advice.";
    const hashtags = ["FinancialPlanning", "WealthManagement", "FinancialAdvisor"];

    console.log('Testing real LinkedIn publish with content:', content);

    // Check LinkedIn token
    const linkedInToken = await getLinkedInToken(session.user.email);
    if (!linkedInToken) {
      return NextResponse.json({
        success: false,
        error: 'No LinkedIn token found. Please connect LinkedIn first.'
      }, { status: 400 });
    }

    // Test content validation
    const validation = validateLinkedInContent(content);
    console.log('Validation result:', validation);

    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: `Content validation failed: ${validation.issues.join(', ')}`,
        validation
      }, { status: 400 });
    }

    // Test content optimization
    const optimized = optimizeContentForLinkedIn({
      text: content,
      hashtags,
      platform: 'linkedin'
    });
    console.log('Optimization result:', optimized);

    // Test real LinkedIn posting
    console.log('Attempting real LinkedIn post...');
    const postResult = await postToLinkedIn(linkedInToken.accessToken, {
      text: optimized.optimizedText,
      hashtags: optimized.hashtags,
    });

    console.log('LinkedIn post result:', postResult);

    return NextResponse.json({
      success: true,
      data: {
        postId: postResult.postId,
        postUrl: postResult.postUrl,
        publishedAt: postResult.publishedAt,
        validation,
        optimization: optimized
      }
    });

  } catch (error) {
    console.error('Test LinkedIn publish error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
