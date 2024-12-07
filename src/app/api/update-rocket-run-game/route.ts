import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const gameData = await request.json()
    console.log(gameData, gameData.order_id);
    
    
    const { data, error } = await supabase
      .from('GameDB')
      .update(gameData)
      .eq("order_id", gameData.order_id)
      .select()

    if (error) throw error
    console.log('data', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error updating game' }, { status: 500 })
  }
}
