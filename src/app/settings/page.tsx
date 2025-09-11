'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/navigation';
import type { SocialConnection, BotSettings } from '@/types/master-interfaces';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [botSettings, setBotSettings] = useState<BotSettings>({
    joinMinutesBefore: 5,
    autoSchedule: false,
    maxConcurrentBots: 3,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

  const [automations, setAutomations] = useState<Record<string, {
    tone: string;
    frequency: string;
    autoGenerate: boolean;
  }>>({});

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const connectSocial = async (platform: 'linkedin' | 'facebook') => {
    setIsLoading(true);
    setError(null);

    try {
      if (platform === 'linkedin') {
        // Use real LinkedIn OAuth flow
        const response = await fetch('/api/social/linkedin?action=auth');
        const result = await response.json();
        
        if (result.success && result.data.authUrl) {
          // Redirect to LinkedIn OAuth
          window.location.href = result.data.authUrl;
          return;
        } else {
          throw new Error(result.error?.message || 'Failed to initiate LinkedIn OAuth');
        }
      } else if (platform === 'facebook') {
        // Use real Facebook OAuth flow
        const response = await fetch('/api/social/facebook?action=auth');
        const result = await response.json();
        
        if (result.success && result.data.authUrl) {
          // Redirect to Facebook OAuth
          window.location.href = result.data.authUrl;
          return;
        } else {
          throw new Error(result.error?.message || 'Failed to initiate Facebook OAuth');
        }
      }
    } catch (err) {
      setError(`Failed to connect ${platform}`);
      showToast(`Failed to connect ${platform}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectSocial = async (platform: 'linkedin' | 'facebook') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/settings/social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          connected: false,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSocialConnections(result.data);
        setSuccess(`${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected successfully!`);
        showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected successfully!`, 'success');
      } else {
        setError(result.error?.message || `Failed to disconnect ${platform}`);
        showToast(result.error?.message || `Failed to disconnect ${platform}`, 'error');
      }
    } catch (err) {
      setError(`Failed to disconnect ${platform}`);
      showToast(`Failed to disconnect ${platform}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSocialConnections = async () => {
    try {
      const response = await fetch('/api/settings/social');
      const result = await response.json();

      if (result.success) {
        setSocialConnections(result.data);
      } else {
        setError(result.error?.message || 'Failed to load social connections');
        showToast(result.error?.message || 'Failed to load social connections', 'error');
      }
    } catch (err) {
      setError('Failed to load social connections');
      showToast('Failed to load social connections', 'error');
    }
  };

  const loadBotSettings = async () => {
    try {
      const response = await fetch('/api/settings/bot');
      const result = await response.json();

      if (result.success) {
        setBotSettings(result.data);
      } else {
        setError(result.error?.message || 'Failed to load bot settings');
        showToast(result.error?.message || 'Failed to load bot settings', 'error');
      }
    } catch (err) {
      setError('Failed to load bot settings');
      showToast('Failed to load bot settings', 'error');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const saveBotSettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/settings/bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(botSettings),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Bot settings saved successfully!');
        showToast('Bot settings saved successfully!', 'success');
        console.log('Bot settings saved:', result.data);
      } else {
        setError(result.error?.message || 'Failed to save bot settings');
        showToast(result.error?.message || 'Failed to save bot settings', 'error');
      }
    } catch (err) {
      setError('Failed to save bot settings');
      showToast('Failed to save bot settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAutomations = async () => {
    try {
      const response = await fetch('/api/settings/automations');
      const result = await response.json();

      if (result.success) {
        setAutomations(result.data);
      } else {
        setError(result.error?.message || 'Failed to load automations');
        showToast(result.error?.message || 'Failed to load automations', 'error');
      }
    } catch (err) {
      setError('Failed to load automations');
      showToast('Failed to load automations', 'error');
    }
  };

  const saveAutomations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/settings/automations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(automations),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Automations saved successfully!');
        showToast('Automations saved successfully!', 'success');
        setSocialConnections(result.data);
      } else {
        setError(result.error?.message || 'Failed to save automations');
        showToast(result.error?.message || 'Failed to save automations', 'error');
      }
    } catch (err) {
      setError('Failed to save automations');
      showToast('Failed to save automations', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Check for OAuth callback success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess = urlParams.get('oauth_success');
    const platform = urlParams.get('platform');
    
    if (oauthSuccess === 'true' && platform) {
      showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully!`, 'success');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Reload connections
      loadSocialConnections();
    }
  }, []);

  useEffect(() => {
    loadSocialConnections();
    loadBotSettings();
    loadAutomations();
  }, []);

  const getConnectionStatus = (platform: string) => {
    const connection = socialConnections.find(conn => conn.platform === platform);
    return connection?.connected || false;
  };

  const getConnectionInfo = (platform: string) => {
    const connection = socialConnections.find(conn => conn.platform === platform);
    return connection;
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Settings</h1>
            <p className="text-xl text-gray-600">Configure your social media connections and bot settings</p>
          </div>

          <Tabs defaultValue="social" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="social">Social Media</TabsTrigger>
              <TabsTrigger value="bot">Bot Settings</TabsTrigger>
              <TabsTrigger value="automations">Automations</TabsTrigger>
            </TabsList>

            <TabsContent value="social" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Social Media Connections</h2>
                <div className="space-y-6">
                  {/* LinkedIn Connection */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xl">💼</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">LinkedIn</h3>
                        <p className="text-sm text-gray-500">
                          {getConnectionStatus('linkedin') 
                            ? `Connected as ${getConnectionInfo('linkedin')?.username || 'User'}`
                            : 'Connect your LinkedIn account to post content'
                          }
                        </p>
                        {getConnectionStatus('linkedin') && getConnectionInfo('linkedin')?.lastSync && (
                          <p className="text-xs text-gray-400">
                            Last synced: {new Date(getConnectionInfo('linkedin')?.lastSync || '').toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getConnectionStatus('linkedin') ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                          Not Connected
                        </Badge>
                      )}
                      {getConnectionStatus('linkedin') ? (
                        <Button
                          onClick={() => disconnectSocial('linkedin')}
                          disabled={isLoading}
                          variant="outline"
                          size="sm"
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          onClick={() => connectSocial('linkedin')}
                          disabled={isLoading}
                          size="sm"
                        >
                          Connect LinkedIn
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Facebook Connection */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xl">📘</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Facebook</h3>
                        <p className="text-sm text-gray-500">
                          {getConnectionStatus('facebook') 
                            ? `Connected as ${getConnectionInfo('facebook')?.username || 'User'}`
                            : 'Connect your Facebook account to post content'
                          }
                        </p>
                        {getConnectionStatus('facebook') && getConnectionInfo('facebook')?.lastSync && (
                          <p className="text-xs text-gray-400">
                            Last synced: {new Date(getConnectionInfo('facebook')?.lastSync || '').toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getConnectionStatus('facebook') ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                          Not Connected
                        </Badge>
                      )}
                      {getConnectionStatus('facebook') ? (
                        <Button
                          onClick={() => disconnectSocial('facebook')}
                          disabled={isLoading}
                          variant="outline"
                          size="sm"
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          onClick={() => connectSocial('facebook')}
                          disabled={isLoading}
                          size="sm"
                        >
                          Connect Facebook
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="bot" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Bot Settings</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="joinMinutesBefore">Join Minutes Before Meeting</Label>
                      <Input
                        id="joinMinutesBefore"
                        type="number"
                        min="1"
                        max="30"
                        value={botSettings.joinMinutesBefore}
                        onChange={(e) => setBotSettings(prev => ({ ...prev, joinMinutesBefore: parseInt(e.target.value) || 5 }))}
                      />
                      <p className="text-sm text-gray-500">How many minutes before the meeting should the bot join?</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxConcurrentBots">Max Concurrent Bots</Label>
                      <Input
                        id="maxConcurrentBots"
                        type="number"
                        min="1"
                        max="10"
                        value={botSettings.maxConcurrentBots}
                        onChange={(e) => setBotSettings(prev => ({ ...prev, maxConcurrentBots: parseInt(e.target.value) || 3 }))}
                      />
                      <p className="text-sm text-gray-500">Maximum number of bots that can run simultaneously</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoSchedule"
                      checked={botSettings.autoSchedule}
                      onCheckedChange={(checked) => setBotSettings(prev => ({ ...prev, autoSchedule: checked }))}
                    />
                    <Label htmlFor="autoSchedule">Auto-schedule bots for new meetings</Label>
                  </div>

                  <Button onClick={saveBotSettings} disabled={isLoading} className="w-full">
                    {isLoading ? 'Saving...' : 'Save Bot Settings'}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="automations" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Content Automations</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">LinkedIn</h3>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="linkedin-tone">Content Tone</Label>
                          <select
                            id="linkedin-tone"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={automations.linkedin?.tone || 'professional'}
                            onChange={(e) => setAutomations(prev => ({
                              ...prev,
                              linkedin: { ...prev.linkedin, tone: e.target.value, frequency: prev.linkedin?.frequency || 'immediate', autoGenerate: prev.linkedin?.autoGenerate || false }
                            }))}
                          >
                            <option value="professional">Professional</option>
                            <option value="casual">Casual</option>
                            <option value="friendly">Friendly</option>
                            <option value="authoritative">Authoritative</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="linkedin-frequency">Posting Frequency</Label>
                          <select
                            id="linkedin-frequency"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={automations.linkedin?.frequency || 'immediate'}
                            onChange={(e) => setAutomations(prev => ({
                              ...prev,
                              linkedin: { ...prev.linkedin, tone: prev.linkedin?.tone || 'professional', frequency: e.target.value, autoGenerate: prev.linkedin?.autoGenerate || false }
                            }))}
                          >
                            <option value="immediate">Immediate</option>
                            <option value="delayed">Delayed (5 min)</option>
                            <option value="scheduled">Scheduled</option>
                          </select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="linkedin-auto"
                            checked={automations.linkedin?.autoGenerate || false}
                            onCheckedChange={(checked) => setAutomations(prev => ({
                              ...prev,
                              linkedin: { ...prev.linkedin, tone: prev.linkedin?.tone || 'professional', frequency: prev.linkedin?.frequency || 'immediate', autoGenerate: checked }
                            }))}
                          />
                          <Label htmlFor="linkedin-auto">Auto-generate content</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Facebook</h3>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="facebook-tone">Content Tone</Label>
                          <select
                            id="facebook-tone"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={automations.facebook?.tone || 'casual'}
                            onChange={(e) => setAutomations(prev => ({
                              ...prev,
                              facebook: { ...prev.facebook, tone: e.target.value, frequency: prev.facebook?.frequency || 'immediate', autoGenerate: prev.facebook?.autoGenerate || false }
                            }))}
                          >
                            <option value="casual">Casual</option>
                            <option value="friendly">Friendly</option>
                            <option value="professional">Professional</option>
                            <option value="engaging">Engaging</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="facebook-frequency">Posting Frequency</Label>
                          <select
                            id="facebook-frequency"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={automations.facebook?.frequency || 'immediate'}
                            onChange={(e) => setAutomations(prev => ({
                              ...prev,
                              facebook: { ...prev.facebook, tone: prev.facebook?.tone || 'casual', frequency: e.target.value, autoGenerate: prev.facebook?.autoGenerate || false }
                            }))}
                          >
                            <option value="immediate">Immediate</option>
                            <option value="delayed">Delayed (5 min)</option>
                            <option value="scheduled">Scheduled</option>
                          </select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="facebook-auto"
                            checked={automations.facebook?.autoGenerate || false}
                            onCheckedChange={(checked) => setAutomations(prev => ({
                              ...prev,
                              facebook: { ...prev.facebook, tone: prev.facebook?.tone || 'casual', frequency: prev.facebook?.frequency || 'immediate', autoGenerate: checked }
                            }))}
                          />
                          <Label htmlFor="facebook-auto">Auto-generate content</Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button onClick={saveAutomations} disabled={isLoading} className="w-full">
                    {isLoading ? 'Saving...' : 'Save Automation Settings'}
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Toast Notification */}
          {toast && (
            <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
              toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}>
              {toast.message}
            </div>
          )}
        </div>
      </div>
    </>
  );
}