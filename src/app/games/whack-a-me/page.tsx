'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Camera, Upload } from 'lucide-react'

export default function WhackAMePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [poem, setPoem] = useState<string>('')
  const [apologyReason, setApologyReason] = useState<string>('')

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0])
    }
  }

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      // If we successfully got camera access, close it and open the camera input
      stream.getTracks().forEach(track => track.stop())
      document.getElementById('camera-upload')?.click()
    } catch (error) {
      // If camera access fails, fall back to gallery upload
      document.getElementById('gallery-upload')?.click()
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    console.log('Form submitted')
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
      setPoem(data.poem)
    } catch (error) {
      console.error('Error generating poem:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent>
            <img 
              src="/WAM-Hero.webp"
              alt="Whack-a-me main preview" 
              className="w-full h-80 object-contain rounded-md mb-4"
            />

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-primary text-center">
              Customize your Whack-a-me game
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Your Photo</Label>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={openCamera}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Take Photo
                  </Button>
                </div>
                <input
                  id="camera-upload"
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <input
                  id="gallery-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="input1">Your name (This will be in the title of the game)</Label>
                <Input id="input1" placeholder="Bae" required />
              </div>

              <div>
                <Label htmlFor="recipientName">Recipient name</Label>
                <Input id="recipientName" placeholder="Pookie" required />
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

              <Button 
                type="button" 
                onClick={generatePoem}
                className="w-1/3 mx-auto"
                disabled={!apologyReason}
              >
                Generate Poem
              </Button>

              <div>
                <Label htmlFor="poem">Apology Poem</Label>
                <Textarea 
                  id="poem"
                  value={poem}
                  onChange={(e) => setPoem(e.target.value)}
                  className="min-h-[150px]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="endText">End Text</Label>
                <Input 
                  id="endText" 
                  placeholder="I'll be better!"
                  required 
                />
              </div>

              <Button type="submit" className="w-full">
                Create Game
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}