import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const orderId = request.nextUrl.searchParams.get('order_id')
    
    
    const { data, error } = await supabase
      .from('GameDB')
      .select()
      .eq("order_id", orderId)

    if (error) throw error
    console.log('data', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error creating game' }, { status: 500 })
  }
}
