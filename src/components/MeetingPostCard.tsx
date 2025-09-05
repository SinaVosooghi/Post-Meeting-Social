/**
 * MeetingPostCard Component
 * Handles meeting selection and LinkedIn post creation
 */

import { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import {
  ClientMeeting,
  SocialMediaPost,
  SocialPlatform,
  ContentTone,
  GeneratedContent,
} from '@/types/master-interfaces';

export interface MeetingPostCardProps extends React.HTMLAttributes<HTMLDivElement> {
  key?: string;
  meeting: ClientMeeting;
  onPublish?: (post: SocialMediaPost) => Promise<void>;
}

export function MeetingPostCard({ meeting, onPublish }: MeetingPostCardProps) {
  const [content, setContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [riskScore, setRiskScore] = useState(0);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [publishError, setPublishError] = useState<string | null>(null);

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

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error.message);
      }

      const generatedContent = data.data as GeneratedContent;
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

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error.message);
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

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error.message);
      }

      // Call onPublish callback if provided
      if (onPublish) {
        await onPublish(data.data);
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
          <Badge variant={riskScore > 50 ? 'destructive' : 'default'}>
            Risk Score: {riskScore}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={generateContent} disabled={isPublishing}>
              Generate Content
            </Button>
          </div>

          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your LinkedIn post..."
            className="min-h-[200px]"
            disabled={isPublishing}
          />

          {validationIssues.length > 0 && (
            <Alert variant="warning">
              <AlertTitle>Content Issues</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {validationIssues.map((issue, index) => (
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
        <Button onClick={handlePublish} disabled={isPublishing || !content.trim()}>
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
