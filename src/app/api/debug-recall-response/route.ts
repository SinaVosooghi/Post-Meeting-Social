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

    // Test the actual API response
    const response = await fetch('https://us-east-1.recall.ai/api/v1/bot/', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = responseText;
    }

    return NextResponse.json({
      success: true,
      data: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        responseType: typeof responseData,
        responseData: responseData,
        isArray: Array.isArray(responseData),
        hasResults: responseData?.results ? 'yes' : 'no',
        hasData: responseData?.data ? 'yes' : 'no',
        keys: responseData && typeof responseData === 'object' ? Object.keys(responseData) : 'not an object'
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
