/**
 * Main Application Page
 * Post-Meeting Social Media Content Generator
 *
 * Phase 1: Core AI functionality demo with hardcoded data
 */

'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import type { GeneratePostsRequest, GeneratePostsResponse } from '@/types';
import { ContentTone, ContentLength, MeetingPlatform } from '@/types';
import { Navigation } from '@/components/navigation';
import { logger } from '@/lib/logger';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function ensureError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

// ============================================================================
// MOCK DATA FOR DEMO
// ============================================================================

const SAMPLE_TRANSCRIPT = `Meeting: Q4 Portfolio Review with Sarah Johnson

Attendees: John Smith (Financial Advisor), Sarah Johnson (Client)

Key Discussion Points:
- Reviewed portfolio performance over the past quarter
- Discussed market volatility and its impact on long-term goals
- Explored opportunities for tax-loss harvesting
- Addressed concerns about inflation and interest rate changes
- Reviewed retirement planning timeline and adjusted contributions
- Discussed diversification strategies across asset classes

Action Items:
- Rebalance portfolio to target allocation
- Increase 401k contribution by 2%
- Schedule next review for February
- Research ESG investment options

Client expressed satisfaction with current strategy and confidence in long-term approach. Meeting concluded with clear next steps and timeline for implementation.`;

const SAMPLE_MEETING_CONTEXT = {
  title: 'Q4 Portfolio Review with Sarah Johnson',
  attendees: ['John Smith (Financial Advisor)', 'Sarah Johnson (Client)'],
  duration: 45,
  platform: MeetingPlatform.ZOOM,
};

const DEFAULT_AUTOMATION_SETTINGS = {
  autoPublish: false,
  requireApproval: true,
  notifyOnGeneration: false,
  scheduleDelay: 0,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function HomePage() {
  const { data: session, status } = useSession();
  const [transcript, setTranscript] = useState(SAMPLE_TRANSCRIPT);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratePostsResponse | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState<{
    subject: string;
    content: string;
    actionItems: string[];
    nextSteps: string;
  } | null>(null);
  const [emailKey, setEmailKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'posts' | 'email'>('posts');
  const [error, setError] = useState<string | null>(null);

  // Show loading state while session is being determined
  if (status === 'loading') {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">Loading...</h2>
              <p className="text-gray-500">Please wait while we verify your authentication</p>
            </div>
          </div>
        </div>
      </>
    );
  }


  // Handle post generation
  const handleGeneratePosts = async () => {
    // Check if user is authenticated
    if (!session?.user) {
      setError('Please sign in to generate posts');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setActiveTab('posts'); // Switch to posts tab

    try {
      const request: GeneratePostsRequest = {
        transcript,
        meetingContext: SAMPLE_MEETING_CONTEXT,
        automationSettings: DEFAULT_AUTOMATION_SETTINGS,
      };

      const response = await fetch('/api/generate-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = (await response.json()) as {
        success: boolean;
        data?: GeneratePostsResponse;
        error?: { message: string };
      };

      if (result.success && result.data) {
        setGeneratedPosts(result.data);
      } else {
        throw new Error(result.error?.message || 'Failed to generate posts');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('Failed to generate posts', ensureError(err));
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle email generation
  const handleGenerateEmail = async () => {
    // Check if user is authenticated
    if (!session?.user) {
      setError('Please sign in to generate email');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setActiveTab('email'); // Switch to email tab

    try {
      const response = await fetch('/api/generate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          attendees: SAMPLE_MEETING_CONTEXT.attendees,
          meetingTitle: SAMPLE_MEETING_CONTEXT.title,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = (await response.json()) as {
        success: boolean;
        data?: {
          subject: string;
          content: string;
          actionItems: string[];
          nextSteps: string;
        };
        error?: { message: string };
      };

      if (result.success && result.data) {
        setGeneratedEmail(result.data);
        setEmailKey(prev => prev + 1);
      } else {
        throw new Error(result.error?.message || 'Failed to generate email');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('Failed to generate email', ensureError(err));
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle copy to clipboard
  const handleCopyToClipboard = async (
    text: string,
    event?: React.MouseEvent<HTMLButtonElement>
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show brief success feedback
      const button = event?.currentTarget as HTMLButtonElement;
      const originalText = button?.textContent;
      if (button) {
        button.textContent = '✅ Copied!';
        button.style.color = '#10b981';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.color = '';
        }, 2000);
      }
      logger.info('Content copied to clipboard', { success: true });
    } catch (err) {
      logger.error('Failed to copy to clipboard', ensureError(err));
      // Show error feedback
      const button = event?.currentTarget as HTMLButtonElement;
      const originalText = button?.textContent;
      if (button) {
        button.textContent = '❌ Failed';
        button.style.color = '#ef4444';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.color = '';
        }, 2000);
      }
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              🎯 Post-Meeting Social Content Generator
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              Transform your meeting transcripts into engaging social media posts and professional
              follow-up emails using AI. Perfect for financial advisors, consultants, and professionals.
            </p>
            
            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                🤖 AI-Powered Content Generation
              </div>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                📱 Social Media Ready
              </div>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                📧 Professional Follow-ups
              </div>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                🔗 Google Calendar Integration
              </div>
            </div>

            {session && (
              <div className="mt-4 text-sm text-gray-600">
                Welcome back, <strong>{session.user?.name}</strong>! Ready to generate some content?
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">📝 Meeting Transcript</h2>

              <div className="mb-4">
                <label
                  htmlFor="transcript"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Paste your meeting transcript below:
                </label>
                <textarea
                  id="transcript"
                  value={transcript}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setTranscript(e.target.value)
                  }
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Paste your meeting transcript here..."
                />
              </div>

              {/* Meeting Context */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Meeting Context:</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    <strong>Title:</strong> {SAMPLE_MEETING_CONTEXT.title}
                  </div>
                  <div>
                    <strong>Duration:</strong> {SAMPLE_MEETING_CONTEXT.duration} minutes
                  </div>
                  <div>
                    <strong>Platform:</strong> {SAMPLE_MEETING_CONTEXT.platform}
                  </div>
                  <div>
                    <strong>Attendees:</strong> {SAMPLE_MEETING_CONTEXT.attendees.join(', ')}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    if (!session?.user) {
                      // Redirect to sign in
                      window.location.href = '/api/auth/signin';
                      return;
                    }
                    void handleGeneratePosts();
                  }}
                  disabled={isGenerating || !transcript.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  {isGenerating && activeTab === 'posts' ? (
                    <>
                      <span className="inline-block animate-spin mr-3">⏳</span>
                      Generating Posts...
                    </>
                  ) : !session?.user ? (
                    <>
                      <span className="mr-2">🚀</span>
                      Sign In to Generate Posts
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🚀</span>
                      Generate Social Posts
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    if (!session?.user) {
                      // Redirect to sign in
                      window.location.href = '/api/auth/signin';
                      return;
                    }
                    void handleGenerateEmail();
                  }}
                  disabled={isGenerating || !transcript.trim()}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  {isGenerating && activeTab === 'email' ? (
                    <>
                      <span className="inline-block animate-spin mr-3">⏳</span>
                      Generating Email...
                    </>
                  ) : !session?.user ? (
                    <>
                      <span className="mr-2">📧</span>
                      Sign In to Generate Email
                    </>
                  ) : (
                    <>
                      <span className="mr-2">📧</span>
                      Generate Follow-up Email
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Output Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">🎨 Generated Content</h2>

                {/* Tab Buttons */}
                <div className="flex rounded-xl bg-gray-100 p-1 shadow-inner">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      activeTab === 'posts'
                        ? 'bg-white text-blue-600 shadow-md transform scale-105'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-2">📱</span>
                    Social Posts
                  </button>
                  <button
                    onClick={() => setActiveTab('email')}
                    className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      activeTab === 'email'
                        ? 'bg-white text-green-600 shadow-md transform scale-105'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-2">📧</span>
                    Follow-up Email
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-red-600 mr-2">❌</span>
                    <span className="text-red-700 font-medium">Error:</span>
                  </div>
                  <p className="text-red-600 mt-1">{error}</p>
                </div>
              )}

              {/* Social Posts Tab */}
              {activeTab === 'posts' && (
                <div className="space-y-4">
                  {generatedPosts ? (
                    <>
                      <div className="text-sm text-gray-500 mb-4">
                        Generated {generatedPosts.posts.length} posts in{' '}
                        {generatedPosts.metadata.processingTime}ms
                        {generatedPosts.metadata.model.includes('mock') && (
                          <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded tex</div>t-xs">
                            Using Mock Data
                          </span>
                        )}
                      </div>

                      {generatedPosts.posts.map(
                        (post: GeneratePostsResponse['posts'][number], index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-700">
                                  {post.platform}
                                </span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  Post {index + 1}
                                </span>
                              </div>
                              <button
                                onClick={e => {
                                  void handleCopyToClipboard(post.content, e);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                📋 Copy
                              </button>
                            </div>

                            <p className="text-gray-800 mb-3 leading-relaxed">{post.content}</p>

                            {post.hashtags && post.hashtags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {post.hashtags.map((hashtag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                                  >
                                    #{hashtag.replace('#', '')}
                                  </span>
                                ))}
                              </div>
                            )}

                            {post.reasoning && (
                              <div className="text-xs text-gray-500 italic border-t pt-2 mt-2">
                                <strong>AI Reasoning:</strong> {post.reasoning}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-6">📱</div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Ready to Generate Social Posts?</h3>
                      <p className="text-gray-500 mb-4">Click the "Generate Social Posts" button to see AI-generated content for LinkedIn, Facebook, and more!</p>
                      <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">
                        💡 Tip: The AI will create platform-specific content with hashtags and engagement optimization
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Email Tab */}
              {activeTab === 'email' && (
                <div key={emailKey}>
                  {generatedEmail && generatedEmail.subject ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Generated follow-up email</span>
                        <button
                          onClick={() => {
                            void handleCopyToClipboard(
                              `Subject: ${generatedEmail.subject}\n\n${generatedEmail.content}`
                            );
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          📋 Copy Email
                        </button>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="mb-4">
                          <label className="text-sm font-medium text-gray-700">Subject:</label>
                          <p className="text-gray-800 font-medium">{generatedEmail.subject}</p>
                        </div>

                        <div className="mb-4">
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Content:
                          </label>
                          <div className="bg-gray-50 rounded p-3 text-gray-800 whitespace-pre-wrap">
                            {generatedEmail.content}
                          </div>
                        </div>

                        {generatedEmail.actionItems && generatedEmail.actionItems.length > 0 && (
                          <div className="mb-4">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Action Items:
                            </label>
                            <ul className="list-disc list-inside space-y-1">
                              {generatedEmail.actionItems.map((item: string, index: number) => (
                                <li key={index} className="text-gray-700 text-sm">
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {generatedEmail.nextSteps && (
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Next Steps:
                            </label>
                            <p className="text-gray-700 text-sm">{generatedEmail.nextSteps}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-6">📧</div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Ready to Generate Follow-up Email?</h3>
                      <p className="text-gray-500 mb-4">Click the "Generate Follow-up Email" button to see AI-generated professional follow-up content!</p>
                      <div className="inline-flex items-center px-4 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium">
                        💡 Tip: The AI will create personalized emails with action items and next steps
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 text-gray-500">
            <p className="text-sm">
              Built with ❤️ for Jump.ai Challenge • Complete Post-Meeting Social Media Content Generator
            </p>
            <p className="text-xs mt-1">
              ✅ Google Calendar Integration • ✅ Recall.ai Bot Management • ✅ Social Media Publishing • ✅ AI Content Generation
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
