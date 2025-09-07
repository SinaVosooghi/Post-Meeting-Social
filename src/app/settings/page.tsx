'use client';

import { useState, useEffect } from 'react';
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
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [botSettings, setBotSettings] = useState<BotSettings>({
    joinMinutesBefore: 5,
    autoSchedule: false,
    maxConcurrentBots: 3,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetch('/api/settings/social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          connected: true,
          username: `${platform}_user_${Date.now()}`,
          lastSync: new Date().toISOString(),
          accessToken: `mock_${platform}_token_${Date.now()}`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSocialConnections(result.data);
        setSuccess(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully!`);
        showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully!`, 'success');
      } else {
        setError(result.error?.message || `Failed to connect ${platform}`);
        showToast(result.error?.message || `Failed to connect ${platform}`, 'error');
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
        setSuccess(
          `${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected successfully!`
        );
        showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected successfully!`, 'success');
      } else {
        setError(result.error?.message || `Failed to disconnect ${platform}`);
        showToast(result.error?.message || `Failed to disconnect ${platform}`, 'error');
      }
    } catch (err) {
      setError(`Failed to disconnect ${platform}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBotSettings = async () => {
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
        setSuccess('Bot settings updated successfully!');
        showToast('Bot settings updated successfully!', 'success');
        // Update local state with the saved settings
        setBotSettings(result.data);
      } else {
        const errorMessage = result.error?.message || 'Failed to update bot settings';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }
    } catch (err) {
      const errorMessage = 'Failed to update bot settings';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateAutomation = (platform: string, field: string, value: string | boolean) => {
    setAutomations(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value,
      },
    }));
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
        setSuccess('Automation settings updated successfully!');
        showToast('Automation settings updated successfully!', 'success');
        // Update local state with the saved settings
        setAutomations(result.data);
      } else {
        const errorMessage = result.error?.message || 'Failed to update automation settings';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }
    } catch (err) {
      const errorMessage = 'Failed to update automation settings';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return '💼';
      case 'facebook':
        return '📘';
      default:
        return '🔗';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return 'bg-blue-100 text-blue-800';
      case 'facebook':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load bot settings
        const botResponse = await fetch('/api/settings/bot');
        const botResult = await botResponse.json();
        
        if (botResult.success) {
          setBotSettings(botResult.data);
        } else {
          // Fallback to default settings if API fails
          console.warn('Failed to load bot settings, using defaults:', botResult.error);
        }

        // Load social connections
        const socialResponse = await fetch('/api/settings/social');
        const socialResult = await socialResponse.json();
        
        if (socialResult.success) {
          // If no data from API, use default connections
          const connections = socialResult.data.length > 0 
            ? socialResult.data 
            : [
                { platform: 'linkedin', connected: false },
                { platform: 'facebook', connected: false },
              ];
          setSocialConnections(connections);
        } else {
          // Fallback to default connections if API fails
          setSocialConnections([
            { platform: 'linkedin', connected: false },
            { platform: 'facebook', connected: false },
          ]);
        }

        // Load automation settings
        const automationResponse = await fetch('/api/settings/automations');
        const automationResult = await automationResponse.json();
        
        if (automationResult.success) {
          setAutomations(automationResult.data);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };

    void loadSettings();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">⚙️ Settings</h1>
            <p className="text-lg text-gray-600">
              Configure your social media connections and bot settings
            </p>
          </div>

          {error && (
            <Card className="p-6 border-red-200 bg-red-50 mb-6">
              <h3 className="font-semibold text-red-800 mb-2">Error</h3>
              <p className="text-red-700">{error}</p>
            </Card>
          )}

          {success && (
            <Card className="p-6 border-green-200 bg-green-50 mb-6">
              <h3 className="font-semibold text-green-800 mb-2">Success</h3>
              <p className="text-green-700">{success}</p>
            </Card>
          )}

          <Tabs defaultValue="social" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="social">Social Media</TabsTrigger>
              <TabsTrigger value="bots">Bot Settings</TabsTrigger>
              <TabsTrigger value="automations">Automations</TabsTrigger>
            </TabsList>

            <TabsContent value="social" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Social Media Connections</h2>
                <p className="text-gray-600 mb-6">
                  Connect your social media accounts to enable automatic posting
                </p>

                <div className="space-y-4">
                  {socialConnections.map(connection => (
                    <div
                      key={connection.platform}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getPlatformIcon(connection.platform)}</span>
                        <div>
                          <h3 className="font-semibold capitalize">{connection.platform}</h3>
                          {connection.connected ? (
                            <div className="flex items-center gap-2">
                              <Badge className={getPlatformColor(connection.platform)}>
                                Connected
                              </Badge>
                              <span className="text-sm text-gray-600">@{connection.username}</span>
                              {connection.lastSync && (
                                <span className="text-xs text-gray-500">
                                  Last sync: {new Date(connection.lastSync).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600">Not connected</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {connection.connected ? (
                          <Button
                            onClick={() => void disconnectSocial(connection.platform)}
                            variant="outline"
                            disabled={isLoading}
                          >
                            Disconnect
                          </Button>
                        ) : (
                          <Button
                            onClick={() => void connectSocial(connection.platform)}
                            disabled={isLoading}
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="bots" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Bot Settings</h2>
                <p className="text-gray-600 mb-6">Configure how your AI notetaker bots behave</p>

                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="joinMinutesBefore" className="text-sm font-medium">
                        Join Meeting (minutes before)
                      </Label>
                      <Input
                        id="joinMinutesBefore"
                        type="number"
                        min="1"
                        max="30"
                        value={botSettings.joinMinutesBefore}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setBotSettings(prev => ({
                            ...prev,
                            joinMinutesBefore: parseInt(e.target.value) || 5,
                          }))
                        }
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        How many minutes before the meeting should the bot join?
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="maxConcurrentBots" className="text-sm font-medium">
                        Max Concurrent Bots
                      </Label>
                      <Input
                        id="maxConcurrentBots"
                        type="number"
                        min="1"
                        max="10"
                        value={botSettings.maxConcurrentBots}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setBotSettings(prev => ({
                            ...prev,
                            maxConcurrentBots: parseInt(e.target.value) || 3,
                          }))
                        }
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum number of bots that can run simultaneously
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoSchedule"
                      checked={botSettings.autoSchedule}
                      onCheckedChange={(checked: boolean) =>
                        setBotSettings(prev => ({
                          ...prev,
                          autoSchedule: checked,
                        }))
                      }
                    />
                    <Label htmlFor="autoSchedule" className="text-sm font-medium">
                      Auto-schedule bots for new meetings
                    </Label>
                  </div>

                  <Button
                    onClick={() => void updateBotSettings()}
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? 'Updating...' : 'Update Bot Settings'}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="automations" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Content Automations</h2>
                <p className="text-gray-600 mb-6">
                  Configure how AI generates content for different platforms
                </p>

                <div className="space-y-4">
                  {socialConnections.map(connection => (
                    <div key={connection.platform} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getPlatformIcon(connection.platform)}</span>
                          <div>
                            <h3 className="font-semibold capitalize">{connection.platform}</h3>
                            <p className="text-sm text-gray-600">
                              {connection.connected ? 'Connected' : 'Not connected'}
                            </p>
                          </div>
                        </div>

                        <Badge variant={connection.connected ? 'default' : 'outline'}>
                          {connection.connected ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      {connection.connected && (
                        <div className="space-y-3">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium">Content Tone</Label>
                              <select 
                                className="w-full mt-1 p-2 border rounded-md"
                                value={automations[connection.platform]?.tone || 'Professional'}
                                onChange={(e) => updateAutomation(connection.platform, 'tone', e.target.value)}
                              >
                                <option value="Professional">Professional</option>
                                <option value="Casual">Casual</option>
                                <option value="Educational">Educational</option>
                                <option value="Promotional">Promotional</option>
                              </select>
                            </div>

                            <div>
                              <Label className="text-sm font-medium">Post Frequency</Label>
                              <select 
                                className="w-full mt-1 p-2 border rounded-md"
                                value={automations[connection.platform]?.frequency || 'Every meeting'}
                                onChange={(e) => updateAutomation(connection.platform, 'frequency', e.target.value)}
                              >
                                <option value="Every meeting">Every meeting</option>
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Manual only">Manual only</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch 
                              id={`auto-${connection.platform}`}
                              checked={automations[connection.platform]?.autoGenerate || false}
                              onCheckedChange={(checked) => updateAutomation(connection.platform, 'autoGenerate', checked)}
                            />
                            <Label
                              htmlFor={`auto-${connection.platform}`}
                              className="text-sm font-medium"
                            >
                              Auto-generate content after meetings
                            </Label>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <Button
                    onClick={() => void saveAutomations()}
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? 'Saving...' : 'Save Automation Settings'}
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
              toast.type === 'success' 
                ? 'bg-green-500' 
                : 'bg-red-500'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
