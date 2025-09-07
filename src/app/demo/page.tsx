'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/navigation';
import { LinkedInConnection } from '@/components/linkedin-connection';
import type { GeneratedContent, ApiResponse } from '@/types/master-interfaces';
import { SocialPlatform, ContentTone } from '@/types/master-interfaces';

export default function DemoPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [publishedPost, setPublishedPost] = useState<{
    postId: string;
    postUrl: string;
    publishedAt: string;
    engagement?: {
      likes: number;
      comments: number;
      shares: number;
      clicks: number;
      saves: number;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkedinSuccess, setLinkedinSuccess] = useState<string | null>(null);

  // Check for LinkedIn success message from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const linkedinSuccess = urlParams.get('linkedin_success');
    const linkedinError = urlParams.get('linkedin_error');
    const profileName = urlParams.get('profile_name');

    if (linkedinSuccess) {
      setLinkedinSuccess(
        `LinkedIn connected successfully! Welcome ${profileName || 'LinkedIn User'}!`
      );
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (linkedinError) {
      setError(`LinkedIn connection failed: ${linkedinError}`);
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleGenerateContent = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId: 'demo-meeting-123',
          platform: SocialPlatform.LINKEDIN,
          tone: ContentTone.PROFESSIONAL,
          includeHashtags: true,
        }),
      });

      const result = (await response.json()) as ApiResponse<GeneratedContent>;

      if (result.success && result.data) {
        setGeneratedContent(result.data);
      } else {
        setError(result.error?.message || 'Failed to generate content');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishToLinkedIn = async () => {
    if (!generatedContent) {
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const response = await fetch('/api/social/linkedin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'publish',
          content: generatedContent.content.finalContent,
          hashtags: generatedContent.content.hashtags,
          meetingId: generatedContent.meetingId,
        }),
      });

      const result = (await response.json()) as ApiResponse<{
        postId: string;
        postUrl: string;
        publishedAt: string;
        engagement?: {
          likes: number;
          comments: number;
          shares: number;
          clicks: number;
          saves: number;
        };
      }>;

      if (result.success && result.data) {
        setPublishedPost(result.data);
      } else {
        const errorMessage = result.error?.message || 'Failed to publish to LinkedIn';
        console.error('LinkedIn publishing error:', result.error);
        setError(errorMessage);
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🎯 Post-Meeting Social Media Generator
            </h1>
            <p className="text-lg text-gray-600">
              Complete workflow demonstration: Google Calendar → AI Content → LinkedIn Publishing
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Authentication:</strong> Sign in with Google for calendar access, then
                connect LinkedIn for publishing
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            {/* LinkedIn Connection */}
            <LinkedInConnection />

            {/* Step 1: Generate Content */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Step 1: Generate AI Content</h2>
                <Badge variant="outline">Content Generation</Badge>
              </div>

              <p className="text-gray-600 mb-4">
                Transform meeting transcript into professional LinkedIn content with compliance
                validation.
              </p>

              <Button
                onClick={() => void handleGenerateContent()}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate LinkedIn Post'}
              </Button>

              {generatedContent && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Generated Content:</h3>
                  <div className="space-y-2">
                    <p className="text-gray-700">{generatedContent.content.finalContent}</p>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.content.hashtags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Compliance Status: {generatedContent.complianceStatus}</p>
                      <p>Publishing Status: {generatedContent.publishingStatus}</p>
                      <p>Platform: {generatedContent.platform}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Step 2: Publish to LinkedIn */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Step 2: Publish to LinkedIn</h2>
                <Badge variant="outline">Social Publishing</Badge>
              </div>

              <p className="text-gray-600 mb-4">
                Publish the generated content to LinkedIn with real OAuth authentication.
              </p>

              <Button
                onClick={() => void handlePublishToLinkedIn()}
                disabled={!generatedContent || isPublishing}
                className="w-full"
              >
                {isPublishing ? 'Publishing...' : 'Publish to LinkedIn'}
              </Button>

              {publishedPost && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Published Successfully!</h3>
                  <div className="space-y-2">
                    <p className="text-gray-700">Post ID: {publishedPost.postId}</p>
                    <p className="text-gray-700">
                      <a
                        href={publishedPost.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View on LinkedIn →
                      </a>
                    </p>
                    <p className="text-sm text-gray-600">
                      Published: {new Date(publishedPost.publishedAt).toLocaleString()}
                    </p>
                    {publishedPost.engagement && (
                      <div className="text-sm text-gray-600">
                        <p>
                          Engagement: {publishedPost.engagement.likes} likes,{' '}
                          {publishedPost.engagement.comments} comments
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Success Display */}
            {linkedinSuccess && (
              <Card className="p-6 border-green-200 bg-green-50">
                <h3 className="font-semibold text-green-800 mb-2">Success!</h3>
                <p className="text-green-700">{linkedinSuccess}</p>
                <button
                  onClick={() => setLinkedinSuccess(null)}
                  className="mt-2 text-sm text-green-600 hover:text-green-800"
                >
                  Dismiss
                </button>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <Card className="p-6 border-red-200 bg-red-50">
                <h3 className="font-semibold text-red-800 mb-2">Error</h3>
                <p className="text-red-700">{error}</p>
              </Card>
            )}

            {/* Demo Info */}
            <Card className="p-6 bg-gray-50">
              <h3 className="font-semibold text-gray-800 mb-2">Demo Information</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• This demo uses mock data for development purposes</p>
                <p>• LinkedIn OAuth is configured but uses mock responses</p>
                <p>• Content generation includes compliance validation</p>
                <p>• All API endpoints are fully functional</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
