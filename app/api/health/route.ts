/**
 * Health check endpoint for Cloud Run
 * Required for AI Studio "Deploy to Run" compatibility
 */
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      service: 'cashguard',
      timestamp: new Date().toISOString(),
      aiStudio: {
        integrated: true,
        prompts: 'prompts/currency-validation-prompts.md',
        documentation: 'docs/AI_STUDIO_INTEGRATION.md',
      },
      deployment: {
        platform: 'Cloud Run',
        ready: true,
      },
    },
    { status: 200 }
  )
}



