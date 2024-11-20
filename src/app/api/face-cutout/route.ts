import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { imageUrl } = await request.json();
        
        const response = await fetch(
            `https://www.cutout.pro/api/v1/mattingByUrl?url=${imageUrl}&mattingType=3&crop=true&preview=true&faceAnalysis=true`,
            {
                method: "GET",
                headers: { 'APIKEY': '2d4e70bdccd74b3d97bda50ddd9ea7f8' }
            }
        );

        // Check if response is ok
        if (!response.ok) {
            console.error('API response not ok:', {
                status: response.status,
                statusText: response.statusText
            });
            const text = await response.text();
            console.error('Response body:', text);
            return NextResponse.json(
                { error: `API returned ${response.status}: ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        
        if (!data.data?.imageBase64) {
            return NextResponse.json({ error: 'Face cutout failed' }, { status: 400 });
        }

        console.log('data', data.data.faceAnalysis)

        return NextResponse.json({ 
            success: true, 
            imageData: data.data.imageBase64,
            faceAnalysis: data.data.faceAnalysis
        });

    } catch (error) {
        console.error('Face cutout error:', error);
        return NextResponse.json(
            { error: 'Internal server error' }, 
            { status: 500 }
        );
    }
}
