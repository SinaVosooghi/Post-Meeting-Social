import { kv } from '@vercel/kv';

// Bot Settings Storage
export interface BotSettings {
  joinMinutesBefore: number;
  autoSchedule: boolean;
  maxConcurrentBots: number;
  updatedAt: string;
}

export async function getBotSettings(userEmail: string): Promise<BotSettings | null> {
  try {
    const settings = await kv.get(`bot-settings:${userEmail}`);
    return settings as BotSettings | null;
  } catch (error) {
    console.error('Error reading bot settings from KV:', error);
    return null;
  }
}

export async function saveBotSettings(userEmail: string, settings: BotSettings): Promise<void> {
  try {
    await kv.set(`bot-settings:${userEmail}`, settings);
    console.log(`Bot settings saved to KV for ${userEmail}`);
  } catch (error) {
    console.error('Error saving bot settings to KV:', error);
    throw error;
  }
}

// Bot Schedules Storage
export interface BotSchedule {
  botId: string;
  externalBotId: string;
  eventId: string;
  userId: string;
  scheduledAt: string;
  meetingUrl: string;
  joinMinutesBefore: number;
  status: string;
  recallResponse: any;
  settingsUsed: {
    joinMinutesBefore: number;
    maxConcurrentBots: number;
    autoSchedule: boolean;
  };
}

export async function getBotSchedules(): Promise<Record<string, BotSchedule>> {
  try {
    const schedules = await kv.get('bot-schedules:all');
    return (schedules as Record<string, BotSchedule>) || {};
  } catch (error) {
    console.error('Error reading bot schedules from KV:', error);
    return {};
  }
}

export async function saveBotSchedule(botId: string, schedule: BotSchedule): Promise<void> {
  try {
    // Get existing schedules
    const allSchedules = await getBotSchedules();

    // Update with new schedule
    allSchedules[botId] = schedule;

    // Save back to KV
    await kv.set('bot-schedules:all', allSchedules);
    console.log(`Bot schedule saved to KV for ${botId}`);
  } catch (error) {
    console.error('Error saving bot schedule to KV:', error);
    throw error;
  }
}

export async function getBotSchedulesForUser(userEmail: string): Promise<BotSchedule[]> {
  const allSchedules = await getBotSchedules();
  return Object.values(allSchedules).filter(schedule => schedule.userId === userEmail);
}

export async function getBotSchedulesForEvent(eventId: string): Promise<BotSchedule | null> {
  const allSchedules = await getBotSchedules();
  return Object.values(allSchedules).find(schedule => schedule.eventId === eventId) || null;
}
