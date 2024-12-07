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
        user_id: gameData.user_id,
        order_id: gameData.order_id,
        game_data: gameData,  // The entire request body goes into game_data column
        game_type: "rocket-run"
      }])
      .select()

    if (error) throw error
    console.log('data', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error creating game' }, { status: 500 })
  }
}
