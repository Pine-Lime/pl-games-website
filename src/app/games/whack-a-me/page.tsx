'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CameraCapture } from '@/components/ui/cameraCapture'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

interface FaceAnalysis {
  face_num: number;
  faces: number[][];
  point: [number, number][][];
}

export default function WhackAMePage() {
  const [happyPhotoUrl, setHappyPhotoUrl] = useState<string | null>(null)
  const [sadPhotoUrl, setSadPhotoUrl] = useState<string | null>(null)
  const [happyFaceAnalysis, setHappyFaceAnalysis] = useState<FaceAnalysis | null>(null)
  const [sadFaceAnalysis, setSadFaceAnalysis] = useState<FaceAnalysis | null>(null)
  const [apologyReason, setApologyReason] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [orderId, setOrderId] = useState<string>('')
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [gameOrderId, setGameOrderId] = useState<string | null>(null)

  useEffect(() => {
    setUserId(crypto.randomUUID())
    setOrderId(crypto.randomUUID())
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    
    // Get form data
    const formData = new FormData(event.currentTarget)
    const name = formData.get('input1') as string
    const recipientName = formData.get('recipientName') as string
    const endText = formData.get('endText') as string

    // Create structured game data
    const gameTextObj = {
      introText: apologyReason,
      endText: endText,
      usedText: null // Add if you need to track used text
    }

    const userNamesObj = {
      sender: name,
      receiver: recipientName
    }

    const gameData = {
      order_id: orderId,
      user_id: userId,
      faceCutout: {
        happy: happyPhotoUrl || "",
        frown: sadPhotoUrl || "",
        facepoints: {
          happy: happyFaceAnalysis?.faces || [],
          frown: sadFaceAnalysis?.faces || []
        }
      },
      userNames: {
        sender: userNamesObj.sender || "",
        receiver: userNamesObj.receiver || ""
      },
      gameText: {
        introText: gameTextObj.introText || "",
        endText: gameTextObj.endText || ""
      },
      tempateId: "",
      assets: {
        startBackground: "https://pinelime-orders.s3.amazonaws.com/personalised-games/backgrounds/start_background_new.png",
        gameBackground: "https://pinelime-orders.s3.amazonaws.com/personalised-games/backgrounds/game_background_college.png",
        finishBackground: "https://pinelime-orders.s3.amazonaws.com/personalised-games/backgrounds/finish_background_new.png",
        whackItem: "https://pinelime-orders.s3.amazonaws.com/personalised-games/hammer/slipper.png"
      },
      senderPhone: "",
      status: "PREVIEW",
      gameURL: "",
      gameType: "Whack-a-me"
    }

    try {
      const response = await fetch('/api/create-whack-a-me-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData),
      })

      if (!response.ok) throw new Error('Failed to create game')
      
      const result = await response.json()
      setGameOrderId(result.order_id)
      setIsSuccessDialogOpen(true)
    } catch (error) {
      console.error('Error creating game:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generatePoem = async () => {
    try {
      const response = await fetch('/api/generate-poem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apologyReason }),
      })

      if (!response.ok) throw new Error('Failed to generate poem')
      const data = await response.json()
      setApologyReason(data.poem)
    } catch (error) {
      console.error('Error generating poem:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <Link 
          href="/"
          className="inline-flex items-center mb-6 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Link>

        <Card className="max-w-2xl mx-auto">
          <CardContent>
            <Image 
              src="/WAM-Hero.webp"
              alt="Whack-a-me main preview" 
              width={800}
              height={320}
              className="w-full h-auto object-cover rounded-lg mt-6"
            />

            <Carousel className="mt-6">
              <CarouselContent>
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <CarouselItem key={num} className="basis-1/3">
                    <Image
                      src={`/WAM-Carousel-${num}.jpg`}
                      alt={`Whack-a-me preview ${num}`}
                      width={300}
                      height={200}
                      className="w-[100px] h-[200px] object-cover rounded-lg"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground text-center">
              Customize your game
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Your Photo</Label>
                <CameraCapture 
                  onPhotoCapture={(happyFile, sadFile, happyFaceAnalysis, sadFaceAnalysis) => {
                    console.log('happyFile', happyFile)
                    console.log('sadFile', sadFile)
                    setHappyPhotoUrl(happyFile)
                    setSadPhotoUrl(sadFile)
                    console.log('happyFaceAnalysis', happyFaceAnalysis)
                    console.log('sadFaceAnalysis', sadFaceAnalysis)
                    setHappyFaceAnalysis(happyFaceAnalysis as FaceAnalysis)
                    setSadFaceAnalysis(sadFaceAnalysis as FaceAnalysis)
                  }}
                  onError={() => console.error('Camera access error')}
                />
              </div>

              <div>
                <Label htmlFor="input1">Your name (This will be in the title of the game)</Label>
                <Input id="input1" name="input1" placeholder="Bae" required />
              </div>

              <div>
                <Label htmlFor="recipientName">Recipient name</Label>
                <Input id="recipientName" name="recipientName" placeholder="Pookie" required />
              </div>

              <div>
                <Label htmlFor="apologyReason">Reason for apology</Label>
                <Textarea 
                  id="apologyReason"
                  placeholder="I forgot their birthday"
                  value={apologyReason}
                  onChange={(e) => setApologyReason(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-foreground pr-2 text-sm">We&apos;ll try and help make this better</p>
                <Button 
                  type="button" 
                  onClick={generatePoem}
                  disabled={!apologyReason}
                >
                  Generate Poem
                </Button>
              </div>

              <div>
                <Label htmlFor="endText">End Text</Label>
                <Input 
                  id="endText" 
                  name="endText"
                  placeholder="I'll be better!"
                  required 
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create!"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Game Created Successfully! 🎉</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Your game has been created successfully.</p>
            <Button
              asChild
              className="mt-2 w-full"
              variant="outline"
            >
              <Link href={`https://games.pinenli.me/?order_id=${gameOrderId}`}>
                Try Now
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}