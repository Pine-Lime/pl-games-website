import { NextResponse } from 'next/server'
import Replicate from "replicate"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const predictionId = searchParams.get('predictionId')

  if (!predictionId) {
    return NextResponse.json({ error: 'Missing predictionId' }, { status: 400 })
  }

  try {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_KEY,
    })

    const prediction = await replicate.predictions.get(predictionId)

    if (prediction.status === 'succeeded') {
      const outputUrl = prediction.output[0]
      return NextResponse.json({ 
        status: 'complete',
        url: outputUrl
      })
    }

    return NextResponse.json({ 
      status: prediction.status 
    })
  } catch (error) {
    console.error('Error checking completion:', error)
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
  }
}
