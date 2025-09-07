import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET() {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Test OpenAI API with a simple completion
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Generate a professional LinkedIn post about a successful client meeting. Keep it under 200 characters and include a call-to-action.',
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const generatedContent = completion.choices[0]?.message?.content || 'No content generated';

    return NextResponse.json({
      success: true,
      message: 'OpenAI API working!',
      generatedContent,
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
      },
      model: completion.model,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('OpenAI test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test OpenAI API',
      details: error instanceof Error ? error.message : 'Unknown error',
      hasApiKey: !!process.env.OPENAI_API_KEY,
    });
  }
}