/**
 * Bot Polling Service
 * Polls Recall.ai bots to check for media availability
 */

import type { RecallBot } from '../types/master-interfaces';

// Store active polling intervals
const activePolls = new Map<string, NodeJS.Timeout>();

// Bot status change callbacks
const statusCallbacks = new Map<string, (bot: any) => void>();

/**
 * Start polling a bot for status updates
 */
export function startBotPolling(
  botId: string,
  onStatusChange: (bot: any) => void,
  intervalMs: number = 30000 // Poll every 30 seconds
): void {
  // Stop existing polling for this bot
  stopBotPolling(botId);

  // Store the callback
  statusCallbacks.set(botId, onStatusChange);

  // Start polling
  const pollInterval = setInterval(() => {
    void (async () => {
      try {
        // Call the API endpoint instead of the function directly
        const response = await fetch(`/api/recall/bots/${botId}/status`);
        if (!response.ok) {
          throw new Error(`Failed to fetch bot status for ${botId}`);
        }
        
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error?.message || `API error fetching bot status for ${botId}`);
        }
        
        const botStatus = result.data;
        const callback = statusCallbacks.get(botId);
        
        if (callback) {
          callback(botStatus);
        }

        // Stop polling if bot is completed or failed
        if (botStatus.status === 'completed' || botStatus.status === 'failed') {
          stopBotPolling(botId);
        }
      } catch (error) {
        console.error(`Error polling bot ${botId}:`, error);
      }
    })();
  }, intervalMs);

  activePolls.set(botId, pollInterval);
  // Started polling bot
}

/**
 * Stop polling a specific bot
 */
export function stopBotPolling(botId: string): void {
  const pollInterval = activePolls.get(botId);
  if (pollInterval) {
    clearInterval(pollInterval);
    activePolls.delete(botId);
    statusCallbacks.delete(botId);
    // Stopped polling bot
  }
}

/**
 * Stop all active polling
 */
export function stopAllPolling(): void {
  for (const [botId, pollInterval] of activePolls.entries()) {
    clearInterval(pollInterval);
    // Stopped polling bot
  }
  activePolls.clear();
  statusCallbacks.clear();
}

/**
 * Get list of actively polled bots
 */
export function getActivePolls(): string[] {
  return Array.from(activePolls.keys());
}

/**
 * Check if a bot is being polled
 */
export function isBotBeingPolled(botId: string): boolean {
  return activePolls.has(botId);
}
