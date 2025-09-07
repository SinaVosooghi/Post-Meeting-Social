import { NextResponse } from 'next/server';
import { validateLinkedInContent } from '@/lib/linkedin';

export async function GET() {
  const testContent = `Just wrapped up an insightful client meeting discussing:

• portfolio review
• market outlook
• investment strategy

Note: This post is for informational purposes only and does not constitute investment advice.`;

  const validation = validateLinkedInContent(testContent);
  
  return NextResponse.json({
    success: true,
    content: testContent,
    validation,
    debug: {
      hasInvestment: testContent.toLowerCase().includes('investment'),
      hasAdvice: testContent.toLowerCase().includes('advice'),
      hasRecommendation: testContent.toLowerCase().includes('recommendation'),
      hasInvestmentAdvice: testContent.toLowerCase().includes('investment') && 
        (testContent.toLowerCase().includes('advice') || testContent.toLowerCase().includes('recommendation')),
      hasNotInvestmentAdvice: testContent.toLowerCase().includes('not investment advice')
    }
  });
}
