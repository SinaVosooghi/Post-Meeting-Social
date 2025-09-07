import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.RECALL_AI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'No Recall.ai API key found'
      });
    }

    const response = await fetch('https://us-east-1.recall.ai/api/v1/bot/?limit=10', {
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `API call failed: ${response.status} ${response.statusText}`,
        response: await response.text()
      });
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Recall.ai API response structure',
      data: {
        type: typeof data,
        isArray: Array.isArray(data),
        keys: data ? Object.keys(data) : 'no keys',
        firstItem: data && Array.isArray(data) ? data[0] : data,
        fullResponse: data
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
