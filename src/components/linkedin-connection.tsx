'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LinkedInStatus {
  connected: boolean;
  profile?: {
    id: string;
    name: string;
    email: string;
  };
}

export function LinkedInConnection() {
  const [linkedinStatus, setLinkedinStatus] = useState<LinkedInStatus>({ connected: false });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check LinkedIn connection status
  const checkLinkedInStatus = async () => {
    try {
      const response = await fetch('/api/linkedin/status');
      const data = await response.json();

      if (data.success && data.connected) {
        setLinkedinStatus({
          connected: true,
          profile: data.profile,
        });
      } else {
        setLinkedinStatus({ connected: false });
      }
    } catch (error) {
      console.error('Error checking LinkedIn status:', error);
      setLinkedinStatus({ connected: false });
    }
  };

  // Connect to LinkedIn
  const connectLinkedIn = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch('/api/linkedin/connect');
      const data = await response.json();

      if (data.success) {
        // Redirect to LinkedIn OAuth (server-side redirect)
        window.location.href = data.authUrl;
      } else {
        setError(data.error || 'Failed to connect to LinkedIn');
      }
    } catch (error) {
      setError('Failed to connect to LinkedIn');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect from LinkedIn
  const disconnectLinkedIn = async () => {
    setIsDisconnecting(true);
    setError(null);

    try {
      const response = await fetch('/api/linkedin/disconnect', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setLinkedinStatus({ connected: false });
      } else {
        setError(data.error || 'Failed to disconnect from LinkedIn');
      }
    } catch (error) {
      setError('Failed to disconnect from LinkedIn');
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Check status on component mount and when URL changes
  useEffect(() => {
    checkLinkedInStatus();

    // Also check when the page becomes visible (in case of redirect back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkLinkedInStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">LinkedIn Connection</h3>
        <Badge variant={linkedinStatus.connected ? 'default' : 'secondary'}>
          {linkedinStatus.connected ? 'Connected' : 'Not Connected'}
        </Badge>
      </div>

      {linkedinStatus.connected ? (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>✅ LinkedIn account connected successfully!</p>
            {linkedinStatus.profile && <p>Profile: {linkedinStatus.profile.name}</p>}
          </div>
          <Button
            onClick={disconnectLinkedIn}
            disabled={isDisconnecting}
            variant="outline"
            className="w-full"
          >
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect LinkedIn'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>Connect your LinkedIn account to enable social media publishing.</p>
          </div>
          <Button onClick={connectLinkedIn} disabled={isConnecting} className="w-full">
            {isConnecting ? 'Connecting...' : 'Connect LinkedIn'}
          </Button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </Card>
  );
}
