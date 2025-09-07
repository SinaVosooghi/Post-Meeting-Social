/**
 * OpenAI Integration Service
 * Post-Meeting Social Media Content Generator
 *
 * This service handles all interactions with OpenAI's GPT-4 API for generating
 * social media posts and follow-up emails from meeting transcripts.
 */

import OpenAI from 'openai';
import type { GeneratePostsRequest, GeneratePostsResponse } from '@/types';
import { SocialPlatform, ContentTone, ContentLength } from '@/types';
import { handleError, retry, withTimeout } from '@/lib/utils';

// ============================================================================
// CONFIGURATION
// ============================================================================

const OPENAI_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  model: 'gpt-4o-mini' as const, // More available and cost-effective
} as const;

// Initialize OpenAI client dynamically
function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new OpenAI({
    apiKey,
  });
}

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

/**
 * System prompt for social media post generation
 */
const SYSTEM_PROMPT = `You are an expert social media content creator specializing in financial advisor content. Your role is to transform meeting transcripts into engaging, professional social media posts that:

1. Maintain professional credibility and compliance
2. Extract key insights and actionable takeaways
3. Use appropriate tone and length for each platform
4. Include relevant hashtags without being spammy
5. Focus on value-driven content that educates and engages

Always respond with valid JSON in the exact format requested. Never include explanations outside the JSON response.`;

/**
 * Generates platform-specific prompt for post creation
 */
function createPostPrompt(
  transcript: string,
  platform: SocialPlatform,
  tone: ContentTone,
  length: ContentLength,
  includeHashtags: boolean,
  includeEmojis: boolean
): string {
  const platformGuidelines: Record<
    SocialPlatform,
    { style: string; maxLength: number; hashtagCount: string }
  > = {
    [SocialPlatform.LINKEDIN]: {
      style: 'Professional, thought-leadership focused',
      maxLength: 3000,
      hashtagCount: '3-5 professional hashtags',
    },
    [SocialPlatform.FACEBOOK]: {
      style: 'Conversational, community-focused',
      maxLength: 500,
      hashtagCount: '2-3 relevant hashtags',
    },
    [SocialPlatform.TWITTER]: {
      style: 'Concise, engaging, thread-friendly',
      maxLength: 280,
      hashtagCount: '1-2 hashtags maximum',
    },
    [SocialPlatform.INSTAGRAM]: {
      style: 'Visual, story-driven',
      maxLength: 2200,
      hashtagCount: '5-10 relevant hashtags',
    },
  };

  const lengthGuidelines: Record<ContentLength, string> = {
    [ContentLength.SHORT]: '50-100 characters',
    [ContentLength.MEDIUM]: '100-200 characters',
    [ContentLength.LONG]: 'Up to platform maximum',
  };

  const toneGuidelines: Record<ContentTone, string> = {
    [ContentTone.PROFESSIONAL]: 'Formal, authoritative, industry-focused',
    [ContentTone.CASUAL]: 'Friendly, approachable, conversational',
    [ContentTone.ENTHUSIASTIC]: 'Energetic, motivational, inspiring',
    [ContentTone.INFORMATIVE]: 'Educational, fact-based, helpful',
  };

  return `Based on the following meeting transcript, generate 3 high-quality social media posts for ${platform}:

TRANSCRIPT:
${transcript}

REQUIREMENTS:
- Platform: ${platform}
- Style: ${platformGuidelines[platform].style}
- Tone: ${toneGuidelines[tone]}
- Length: ${lengthGuidelines[length]}
- Max Characters: ${platformGuidelines[platform].maxLength}
- Include Hashtags: ${includeHashtags ? `Yes (${platformGuidelines[platform].hashtagCount})` : 'No'}
- Include Emojis: ${includeEmojis ? 'Yes (use sparingly and professionally)' : 'No'}

FOCUS ON:
- Key insights from the meeting
- Actionable advice for financial advisors
- Industry trends or observations
- Client success stories (anonymized)
- Educational content that adds value

COMPLIANCE NOTES:
- Ensure all content is compliant with financial industry regulations
- Avoid specific investment advice
- Keep client information anonymous
- Focus on general insights and best practices

RESPONSE FORMAT (JSON only):
{
  "posts": [
    {
      "platform": "${platform}",
      "content": "The actual post content here...",
      "hashtags": ["hashtag1", "hashtag2"],
      "reasoning": "Brief explanation of why this post works for the platform and audience"
    }
  ]
}`;
}

/**
 * Generates prompt for follow-up email creation
 */
function createEmailPrompt(transcript: string, attendees: string[], meetingTitle: string): string {
  return `Based on the following meeting transcript, generate a professional follow-up email:

MEETING: ${meetingTitle}
ATTENDEES: ${attendees.join(', ')}

TRANSCRIPT:
${transcript}

Generate a follow-up email that:
1. Summarizes key discussion points
2. Outlines agreed-upon action items
3. Includes next steps and timelines
4. Maintains a professional, helpful tone
5. Is concise but comprehensive

RESPONSE FORMAT (JSON only):
{
  "email": {
    "subject": "Follow-up: [Meeting Title]",
    "content": "Email body content here...",
    "actionItems": ["Action item 1", "Action item 2"],
    "nextSteps": "Summary of next steps"
  }
}`;
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Generates social media posts from meeting transcript
 */
export async function generateSocialMediaPosts(
  request: GeneratePostsRequest
): Promise<GeneratePostsResponse> {
  try {
    if (!OPENAI_CONFIG.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const startTime = Date.now();

    // Generate posts for each platform in the automation settings
    const allPosts: GeneratePostsResponse['posts'] = [];

    // For demo purposes, we'll generate for LinkedIn (most common for financial advisors)
    const platforms = [SocialPlatform.LINKEDIN];

    for (const platform of platforms) {
      const prompt = createPostPrompt(
        request.transcript,
        platform,
        request.automationSettings.tone as ContentTone,
        request.automationSettings.length as ContentLength,
        request.automationSettings.includeHashtags as boolean,
        request.automationSettings.includeEmojis as boolean
      );

      const response = await withTimeout(
        retry(async () => {
          const openai = getOpenAIClient();
          if (!openai) {
            throw new Error('OpenAI client not initialized');
          }
          const completion = await openai.chat.completions.create({
            model: OPENAI_CONFIG.model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 1000,
            response_format: { type: 'json_object' },
          });

          const content = completion.choices[0]?.message?.content;
          if (!content) {
            throw new Error('No content received from OpenAI');
          }

          return {
            content,
            usage: completion.usage,
          };
        }, OPENAI_CONFIG.maxRetries),
        OPENAI_CONFIG.timeout,
        'OpenAI request timed out'
      );

      // Parse the JSON response
      const parsedResponse = JSON.parse(response.content) as {
        posts: Array<{
          platform: SocialPlatform;
          content: string;
          hashtags: string[];
          reasoning: string;
        }>;
      };

      if (!parsedResponse.posts || !Array.isArray(parsedResponse.posts)) {
        throw new Error('Invalid response format from OpenAI');
      }

      allPosts.push(...parsedResponse.posts);
    }

    const processingTime = Date.now() - startTime;

    return {
      posts: allPosts,
      metadata: {
        tokensUsed: 0, // Will be calculated from actual usage
        processingTimeMs: processingTime,
        model: OPENAI_CONFIG.model,
      },
    };
  } catch (error) {
    const errorDetails = handleError(error);
    throw new Error(`Failed to generate social media posts: ${errorDetails.message}`);
  }
}

/**
 * Generates a follow-up email from meeting transcript
 */
export async function generateFollowUpEmail(
  transcript: string,
  attendees: string[],
  meetingTitle: string
): Promise<{
  subject: string;
  content: string;
  actionItems: string[];
  nextSteps: string;
}> {
  try {
    if (!OPENAI_CONFIG.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const prompt = createEmailPrompt(transcript, attendees, meetingTitle);

    const response = await withTimeout(
      retry(async () => {
        const openai = getOpenAIClient();
        if (!openai) {
          throw new Error('OpenAI client not initialized');
        }
        const completion = await openai.chat.completions.create({
          model: OPENAI_CONFIG.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 800,
          response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No content received from OpenAI');
        }

        return content;
      }, OPENAI_CONFIG.maxRetries),
      OPENAI_CONFIG.timeout,
      'OpenAI email generation timed out'
    );

    const parsedResponse = JSON.parse(response) as {
      email: {
        subject: string;
        content: string;
        actionItems: string[];
        nextSteps: string;
      };
    };

    if (!parsedResponse.email) {
      throw new Error('Invalid email response format from OpenAI');
    }

    return parsedResponse.email;
  } catch (error) {
    const errorDetails = handleError(error);
    throw new Error(`Failed to generate follow-up email: ${errorDetails.message}`);
  }
}

// ============================================================================
// MOCK DATA FOR DEVELOPMENT
// ============================================================================

/**
 * Mock function for development when OpenAI API key is not available
 */
export async function generateMockSocialMediaPosts(
  request: GeneratePostsRequest
): Promise<GeneratePostsResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const mockPosts = [
    {
      platform: SocialPlatform.LINKEDIN,
      content:
        "Just wrapped up an insightful client meeting discussing portfolio diversification strategies. Key takeaway: The importance of balancing growth potential with risk management in today's market. Remember, successful investing isn't about timing the market—it's about time in the market. 📈",
      hashtags: ['#FinancialPlanning', '#InvestmentStrategy', '#WealthManagement'],
      reasoning:
        "This post focuses on educational content while highlighting expertise in portfolio management, perfect for LinkedIn's professional audience.",
    },
    {
      platform: SocialPlatform.LINKEDIN,
      content:
        "Today's client conversation reinforced why regular portfolio reviews are crucial. Markets evolve, life changes, and so should your investment strategy. A well-timed adjustment can make all the difference in achieving your financial goals. What questions should you be asking your advisor? 🤔",
      hashtags: ['#FinancialAdvisor', '#PortfolioReview', '#ClientSuccess'],
      reasoning:
        'Engages the audience with a question while demonstrating the value of ongoing financial advice and relationship management.',
    },
    {
      platform: SocialPlatform.LINKEDIN,
      content:
        "Grateful for another productive meeting with a long-term client. Watching their financial confidence grow over the years never gets old. It's not just about the numbers—it's about peace of mind and achieving life goals. This is why I love what I do. 💼✨",
      hashtags: ['#ClientRelationships', '#FinancialConfidence', '#PurposeDriven'],
      reasoning:
        'Personal and emotional appeal that showcases the human side of financial advising while maintaining professionalism.',
    },
  ];

  return {
    posts: mockPosts.slice(0, (request.automationSettings.maxPosts as number) ?? 3),
    metadata: {
      tokensUsed: 450,
      processingTimeMs: 1500,
      model: 'gpt-4-mock',
    },
  };
}

/**
 * Mock function for email generation during development
 */
export async function generateMockFollowUpEmail(
  _transcript: string,
  attendees: string[],
  meetingTitle: string
): Promise<{
  subject: string;
  content: string;
  actionItems: string[];
  nextSteps: string;
}> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1200));

  return {
    subject: `Follow-up: ${meetingTitle}`,
    content: `Dear ${attendees.join(', ')},

Thank you for taking the time to meet with me today. I wanted to follow up on our discussion and provide a summary of the key points we covered.

During our meeting, we discussed your current financial situation and explored several strategies to help you achieve your long-term goals. I was particularly impressed by your thoughtful questions about portfolio diversification and risk management.

Based on our conversation, I believe we've identified some excellent opportunities to optimize your investment strategy while maintaining an appropriate risk profile for your situation.

I look forward to continuing our partnership and helping you build the financial future you envision.

Best regards,
Your Financial Advisor`,
    actionItems: [
      'Review updated portfolio allocation proposal',
      'Schedule quarterly review meeting',
      'Provide additional documentation for account setup',
      'Research tax-advantaged investment options',
    ],
    nextSteps:
      "I'll prepare the detailed portfolio recommendations we discussed and send them to you by Friday. We can schedule a follow-up call next week to review everything in detail.",
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validates OpenAI API configuration
 */
export function validateOpenAIConfig(): { isValid: boolean; error?: string } {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      isValid: false,
      error: 'OPENAI_API_KEY environment variable is not set',
    };
  }

  if (!apiKey.startsWith('sk-')) {
    return {
      isValid: false,
      error: 'Invalid OpenAI API key format',
    };
  }

  return { isValid: true };
}

/**
 * Gets appropriate generation function based on environment
 */
export function getPostGenerationFunction() {
  const config = validateOpenAIConfig();

  if (config.isValid) {
    return generateSocialMediaPosts;
  } else {
    console.warn('OpenAI API not configured, using mock data:', config.error);
    return generateMockSocialMediaPosts;
  }
}

/**
 * Gets appropriate email generation function based on environment
 */
export function getEmailGenerationFunction() {
  const config = validateOpenAIConfig();

  if (config.isValid) {
    return generateFollowUpEmail;
  } else {
    console.warn('OpenAI API not configured, using mock data:', config.error);
    return generateMockFollowUpEmail;
  }
}
