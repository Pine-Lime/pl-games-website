import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const registrationData = await request.json()
    
    const { data, error } = await supabase
      .from('AdventOfPuzzles')
      .insert([{
        email: registrationData.email,
        phone: registrationData.phone,
      }])
      .select()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error registering for daily challenge' }, { status: 500 })
  }
}
