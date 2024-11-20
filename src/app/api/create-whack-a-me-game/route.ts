import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const gameData = await request.json()
    
    const { data, error } = await supabase
      .from('GameDB')
      .insert([{
        user_id: gameData.userId,
        order_id: gameData.orderId,
        game_data: gameData  // The entire request body goes into game_data column
      }])
      .select()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error creating game' }, { status: 500 })
  }
}
