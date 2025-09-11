import { getBotSettings, saveBotSettings, getBotSchedules, saveBotSchedule } from '@/lib/file-storage';

export async function GET() {
  try {
    const testEmail = 'test@example.com';
    
    // Test bot settings
    const testSettings = {
      joinMinutesBefore: 5,
      autoSchedule: true,
      maxConcurrentBots: 3,
      updatedAt: new Date().toISOString()
    };
    
    // Save settings to KV
    await saveBotSettings(testEmail, testSettings);
    
    // Read settings from KV
    const savedSettings = await getBotSettings(testEmail);
    
    // Test bot schedules
    const testSchedule = {
      botId: 'test-bot-123',
      externalBotId: 'ext-123',
      eventId: 'event-123',
      userId: testEmail,
      scheduledAt: new Date().toISOString(),
      meetingUrl: 'https://zoom.us/j/123456789',
      joinMinutesBefore: 5,
      status: 'scheduled',
      recallResponse: { id: 'recall-123' },
      settingsUsed: {
        joinMinutesBefore: 5,
        maxConcurrentBots: 3,
        autoSchedule: true
      }
    };
    
    // Save schedule to KV
    await saveBotSchedule('test-bot-123', testSchedule);
    
    // Read schedules from KV
    const allSchedules = await getBotSchedules();
    
    return Response.json({
      success: true,
      message: 'File storage with Vercel KV is working!',
      botSettings: {
        saved: testSettings,
        retrieved: savedSettings,
        match: JSON.stringify(testSettings) === JSON.stringify(savedSettings)
      },
      botSchedules: {
        count: Object.keys(allSchedules).length,
        hasTestSchedule: 'test-bot-123' in allSchedules
      }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'File storage test failed'
    }, { status: 500 });
  }
}
