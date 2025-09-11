import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock meeting data for testing
    const mockMeeting = {
      id: 'mock-meeting-1',
      title: 'Client Strategy Meeting',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      endTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      platform: 'zoom',
      attendees: [
        { name: 'John Smith', email: 'john@client.com' },
        { name: 'Sarah Johnson', email: 'sarah@client.com' },
        { name: 'You', email: 'lovley.messi@gmail.com' },
      ],
      transcript: `John: Good morning everyone, thanks for joining today's strategy session.

Sarah: Thanks for having us. We're excited to discuss the Q4 roadmap.

You: Absolutely, I've prepared some initial thoughts on the market analysis.

John: Perfect. Let's start with the competitive landscape. We've seen some interesting moves from our main competitors.

Sarah: Yes, they've been quite aggressive with their pricing strategy. We need to respond but maintain our premium positioning.

You: I agree. Our research shows that customers value our service quality over price. We should focus on that differentiation.

John: What about the new product launch timeline? Are we still on track for Q4?

Sarah: We're looking good for mid-November. The development team has been making great progress.

You: That's excellent. We should start the marketing campaign in early October to build anticipation.

John: Sounds like a solid plan. Let's reconvene next week to finalize the details.

Sarah: Perfect, I'll send out the calendar invite.

You: Great meeting everyone. I'll follow up with the action items by end of day.`,
      followUpEmail: `Subject: Follow-up: Client Strategy Meeting - Q4 Roadmap

Hi John and Sarah,

Thank you for the productive strategy session today. Here's a summary of our discussion and next steps:

Key Discussion Points:
• Competitive landscape analysis and pricing strategy
• Q4 product launch timeline (mid-November target)
• Marketing campaign planning for early October
• Service quality differentiation focus

Action Items:
• John: Review competitor pricing data by Friday
• Sarah: Finalize product launch timeline details
• You: Prepare marketing campaign outline by next week

Next Meeting: We'll reconvene next week to finalize the Q4 roadmap details.

Please let me know if you have any questions or need additional information.

Best regards,
Sina`,
      socialMediaPosts: [
        {
          id: 'post-1',
          platform: 'linkedin',
          content: `Just wrapped up an excellent strategy session with our key clients! 🚀

Key takeaways:
✅ Q4 product launch on track for mid-November
✅ Focusing on service quality differentiation
✅ Marketing campaign kicking off in October

Excited about the roadmap ahead! #Strategy #ClientSuccess #Q4Planning`,
          status: 'draft',
        },
        {
          id: 'post-2',
          platform: 'facebook',
          content: `Great meeting with our clients today! We're making solid progress on our Q4 initiatives and I'm excited about the direction we're heading. The team is aligned and ready to execute! 💪`,
          status: 'draft',
        },
      ],
      botId: 'bot-1757277539051-6ht8qynxj',
      recordingUrl: 'https://recall.ai/recordings/mock-recording-1',
      status: 'completed',
    };

    return NextResponse.json({
      success: true,
      data: mockMeeting,
      metadata: {
        timestamp: new Date().toISOString(),
        note: 'Mock meeting data for testing purposes',
      },
    });
  } catch (error) {
    console.error('Mock meeting error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate mock meeting',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
