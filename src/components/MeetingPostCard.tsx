'use client';

/**
 * MeetingPostCard Component
 * Handles meeting selection and LinkedIn post creation
 */

import * as React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import type { ClientMeeting, SocialMediaPost, GeneratedContent } from '@/types/master-interfaces';
import { SocialPlatform, ContentTone } from '@/types/master-interfaces';

export interface MeetingPostCardProps extends React.HTMLAttributes<HTMLDivElement> {
  key?: string;
  meeting: ClientMeeting;
}

export function MeetingPostCard({ meeting }: MeetingPostCardProps) {
  const [content, setContent] = React.useState('');
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [riskScore, setRiskScore] = React.useState(0);
  const [validationIssues, setValidationIssues] = React.useState<string[]>([]);
  const [publishError, setPublishError] = React.useState<string | null>(null);

  // Generate initial content from meeting
  const generateContent = async () => {
    try {
      const response = await fetch('/api/generate-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: meeting.id,
          platform: SocialPlatform.LINKEDIN,
          tone: ContentTone.PROFESSIONAL,
          includeHashtags: true,
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        data?: GeneratedContent;
        error?: { message: string };
      };
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed to generate content');
      }

      const generatedContent = data.data;
      setContent(generatedContent.content.finalContent);
      setRiskScore(generatedContent.riskScore);
      setValidationIssues(generatedContent.complianceFlags);
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'Content generation failed');
    }
  };

  // Validate content before publishing
  const validateContent = async () => {
    try {
      const response = await fetch('/api/social/linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate',
          content,
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        data?: {
          riskScore: number;
          issues: string[];
          isValid: boolean;
        };
        error?: { message: string };
      };
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed to validate content');
      }

      setRiskScore(data.data.riskScore);
      setValidationIssues(data.data.issues);
      return data.data.isValid;
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'Validation failed');
      return false;
    }
  };

  // Handle post publishing
  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      setPublishError(null);

      // Validate content first
      const isValid = await validateContent();
      if (!isValid) {
        setPublishError('Content validation failed. Please review the issues.');
        return;
      }

      // Publish to LinkedIn
      const response = await fetch('/api/social/linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish',
          content,
          meetingId: meeting.id,
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        data?: SocialMediaPost;
        error?: { message: string };
      };
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed to publish content');
      }

      // Clear form
      setContent('');
      setRiskScore(0);
      setValidationIssues([]);
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'Publishing failed');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{meeting.title}</h3>
            <p className="text-sm text-gray-500">{new Date(meeting.startTime).toLocaleString()}</p>
          </div>
          <div
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${riskScore > 50 ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'}`}
          >
            Risk Score: {riskScore}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                void generateContent();
              }}
              disabled={isPublishing}
            >
              Generate Content
            </Button>
          </div>

          <Textarea
            value={content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
            placeholder="Write your LinkedIn post..."
            className="min-h-[200px]"
            disabled={isPublishing}
          />

          {validationIssues.length > 0 && (
            <Alert variant="warning">
              <AlertTitle>Content Issues</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {validationIssues.map((issue: string, index: number) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {publishError && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{publishError}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="text-sm text-gray-500">{content.length} characters</div>
        <Button
          onClick={() => {
            void handlePublish();
          }}
          disabled={isPublishing || !content.trim()}
        >
          {isPublishing ? (
            <>
              <Spinner className="mr-2" />
              Publishing...
            </>
          ) : (
            'Publish to LinkedIn'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
