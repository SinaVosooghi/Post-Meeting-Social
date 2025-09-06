/**
 * Content Generator Service
 * Transforms meeting content into social media posts
 */

import type { ClientMeeting, GeneratePostOptions, GeneratedPostUtility } from '@/types';
import { SocialPlatform } from '@/types';
import { validateLinkedInContent, optimizeContentForLinkedIn } from '@/lib/linkedin';

/**
 * Generates social media post from meeting content
 */
export async function generatePost(options: GeneratePostOptions): Promise<GeneratedPostUtility> {
  const { meeting, platform, tone = 'professional', includeHashtags = true } = options;

  // Extract key points from meeting
  const keyPoints = extractKeyPoints(meeting);

  // Generate initial content
  const content = await generateInitialContent(keyPoints, tone);

  // Generate relevant hashtags
  const hashtags = includeHashtags ? generateHashtags(keyPoints) : [];

  // Validate and optimize for platform
  if (platform === SocialPlatform.LINKEDIN) {
    // Validate content
    const validation = validateLinkedInContent(content);

    // Optimize content
    const optimized = optimizeContentForLinkedIn({
      text: content,
      hashtags,
      platform: 'linkedin',
    });

    return {
      content: optimized.optimizedText,
      hashtags: optimized.hashtags,
      riskScore: validation.riskScore,
      issues: validation.issues,
    };
  }

  // Default return for other platforms
  return {
    content,
    hashtags,
    riskScore: 0,
    issues: [],
  };
}

/**
 * Extracts key points from meeting
 */
function extractKeyPoints(meeting: ClientMeeting): string[] {
  // For demo, use meeting topics from compliance flags
  return meeting.complianceFlags.topicsDiscussed;
}

/**
 * Generates initial content from key points
 */
async function generateInitialContent(keyPoints: string[], tone: string): Promise<string> {
  // For demo, generate mock content
  // In production, this would use OpenAI API
  const intro =
    tone === 'professional'
      ? 'Just wrapped up an insightful client meeting discussing:'
      : 'Great discussion with a client about:';

  const points = keyPoints.map(point => `• ${point}`).join('\n');

  const disclaimer =
    '\n\nNote: This post is for informational purposes only and does not constitute investment advice.';

  return `${intro}\n\n${points}${disclaimer}`;
}

/**
 * Generates relevant hashtags
 */
function generateHashtags(keyPoints: string[]): string[] {
  // Convert key points to hashtags
  const baseHashtags = ['FinancialPlanning', 'WealthManagement', 'FinancialAdvisor'];

  // Add hashtags from key points
  const topicHashtags = keyPoints.map(point =>
    point
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
  );

  return [...new Set([...baseHashtags, ...topicHashtags])];
}
