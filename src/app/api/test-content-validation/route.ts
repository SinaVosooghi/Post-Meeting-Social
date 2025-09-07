import { NextResponse } from 'next/server';
import { validateLinkedInContent } from '@/lib/linkedin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content } = body;
    
    if (!content) {
      return NextResponse.json({
        success: false,
        error: 'No content provided'
      });
    }
    
    const validation = validateLinkedInContent(content);
    
    return NextResponse.json({
      success: true,
      content,
      validation,
      debug: {
        hasInvestment: content.toLowerCase().includes('investment'),
        hasAdvice: content.toLowerCase().includes('advice'),
        hasRecommendation: content.toLowerCase().includes('recommendation'),
        hasInvestmentAdvice: content.toLowerCase().includes('investment') && 
          (content.toLowerCase().includes('advice') || content.toLowerCase().includes('recommendation'))
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}