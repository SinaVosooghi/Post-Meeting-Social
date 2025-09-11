import { kv } from '@vercel/kv';

export async function GET() {
  try {
    // Test writing to KV
    await kv.set('test-key', { 
      message: 'Hello from Vercel KV!', 
      timestamp: new Date().toISOString() 
    });
    
    // Test reading from KV
    const testData = await kv.get('test-key');
    
    return Response.json({
      success: true,
      testData,
      message: 'Vercel KV is working!'
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Vercel KV test failed'
    }, { status: 500 });
  }
}
