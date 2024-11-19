import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { apologyReason } = await request.json()

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that writes short, four-line apology poems."
        },
        {
          role: "user",
          content: `Write a short, four-line poem apologizing for: ${apologyReason}`
        }
      ],
    })

    const poem = completion.choices[0]?.message?.content || 'Failed to generate poem'

    return NextResponse.json({ poem })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate poem' },
      { status: 500 }
    )
  }
}