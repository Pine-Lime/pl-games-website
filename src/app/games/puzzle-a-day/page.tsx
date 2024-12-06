'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from 'next/image'
import Cropper from 'react-easy-crop'
import { Camera, Upload, ZoomIn, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import './styles.css'
import { uploadToS3 } from '@/lib/upload'

// Define an interface for the crop area
interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export default function PuzzleADayPage() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [orderId, setOrderId] = useState<string>('')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)
  const [croppedImage, setCroppedImage] = useState<string | null>(null)
  const [isCropConfirmed, setIsCropConfirmed] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  const [stylizedImageUrl, setStylizedImageUrl] = useState<string | null>(null)

  useEffect(() => {
    setUserId(crypto.randomUUID())
    setOrderId(crypto.randomUUID())
  }, [])

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new window.Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (error: Event) => reject(error))
      image.src = url
    })

  const getCroppedImg = async (imageSrc: string, pixelCrop: CropArea) => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return null

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )

    return new Promise<string>((resolve) => {
      canvas.toBlob(blob => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        resolve(url)
      }, 'image/jpeg')
    })
  }

  const onCropComplete = async (croppedArea: CropArea, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const handleConfirmCrop = async () => {
    if (selectedFile && croppedAreaPixels) {
      const croppedImage = await getCroppedImg(selectedFile, croppedAreaPixels)
      if (croppedImage) {
        setCroppedImage(croppedImage)
        setIsCropConfirmed(true)
        setIsProcessing(true)

        try {
          // Upload original image to S3
          const response = await fetch(croppedImage)
          const blob = await response.blob()
          const buffer = Buffer.from(await blob.arrayBuffer())

          const uploadResult = await uploadToS3(
            buffer,
            'image/png',
            'original.png',
            `puzzle-a-day/${orderId}`
          )

          if (uploadResult instanceof Error) throw uploadResult
          setOriginalImageUrl(uploadResult.objectURL)

          // Start the stylization process
          const stylizeResponse = await fetch('/api/stylize-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: uploadResult.cloudFront
            })
          })

          if (!stylizeResponse.ok) throw new Error('Failed to start stylization')
          
          const { predictionId, status } = await stylizeResponse.json()
          
          // Poll for completion
          while (status !== 'complete') {
            await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second between checks
            
            const checkResponse = await fetch(`/api/check-completion?predictionId=${predictionId}`)
            if (!checkResponse.ok) throw new Error('Failed to check status')
            
            const result = await checkResponse.json()
            if (result.status === 'complete') {
              // Upload the stylized image to S3
              const stylizedResponse = await fetch(result.url)
              const stylizedBlob = await stylizedResponse.blob()
              const stylizedBuffer = Buffer.from(await stylizedBlob.arrayBuffer())

              const stylizedUploadResult = await uploadToS3(
                stylizedBuffer,
                'image/webp',
                'stylized.webp',
                `puzzle-a-day/${orderId}`
              )

              if (stylizedUploadResult instanceof Error) throw stylizedUploadResult
              setStylizedImageUrl(stylizedUploadResult.objectURL)
              setCroppedImage(stylizedUploadResult.objectURL)
              break
            }
          }
        } catch (error) {
          console.error('Error processing image:', error)
        } finally {
          setIsProcessing(false)
        }
      }
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]
      setSelectedFile(URL.createObjectURL(file))
      setIsCropConfirmed(false)
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setSelectedFile(URL.createObjectURL(file))
      setIsCropConfirmed(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    
    const gameData = {
      assets: {
        original: originalImageUrl || "",
        filtered: stylizedImageUrl || "",
      },
      userNames: {
        sender: formData.get('name') as string,
        recipient: "",
      },
      gameText: {
        endText: formData.get('endText') as string
      },
      order_id: orderId,
      user_id: userId,
      status: "PREVIEW", 
      gameURL: "",
      gameType: "Puzzle-a-Day"
    }

    try {
      const response = await fetch('/api/create-puzzle-a-day-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData),
      })

      if (!response.ok) throw new Error('Failed to create game')
    } catch (error) {
      console.error('Error creating game:', error)
    }
  }

  return (
    <div className="puzzle-page dark min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12">
        <Link 
          href="/"
          className="inline-flex items-center mb-6 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Link>

        <Card className="max-w-2xl mx-auto shadow-xl card-hover">
          <CardContent className="p-8">
            <div className="relative h-60 sm:h-80 mb-8 rounded-lg overflow-hidden">
              <Image 
                src="/PAD-Hero.webp"
                alt="Puzzle-a-Day main preview" 
                width={800}
                height={320}
                className="w-full h-full object-cover"
              />
              <div className="relative w-full h-full">
                <div className="w-full h-full bg-gradient-to-t from-black/50 to-transparent" />
                <div className="relative -mt-16 px-4 pb-4">
                  <h1 className="text-3xl font-bold text-primary-foreground">
                    Create Your Puzzle
                  </h1>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-lg">Your Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  required 
                  className="bg-secondary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endText" className="text-lg font-medium">End Text</Label>
                <Input 
                  id="endText" 
                  name="endText" 
                  required 
                  className="bg-secondary"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-medium">Upload Image</Label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors upload-zone
                    ${isDragging ? 'border-primary bg-primary/10 dragging' : 'border-muted'}
                    ${selectedFile ? 'border-none p-0' : ''}`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  {!selectedFile ? (
                    <div className="space-y-4">
                      <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Drag and drop your image here, or
                        </p>
                        <label className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors">
                          <Upload className="w-4 h-4 mr-2" />
                          Choose File
                          <Input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-[400px] rounded-lg overflow-hidden">
                      <Cropper
                        image={selectedFile}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        classes={{
                          containerClassName: "rounded-lg",
                          mediaClassName: "rounded-lg"
                        }}
                      />
                      <div className="absolute bottom-4 left-4 right-4 bg-secondary/90 p-4 rounded-lg backdrop-blur-sm">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <div className="flex items-center gap-4 w-full">
                            <ZoomIn className="w-5 h-5 text-muted-foreground" />
                            <input
                              type="range"
                              value={zoom}
                              min={1}
                              max={3}
                              step={0.01}
                              aria-label="Zoom"
                              onChange={(e) => setZoom(Number(e.target.value))}
                              className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                          <Button 
                            type="button" 
                            onClick={handleConfirmCrop}
                            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                          >
                            Crop
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {isCropConfirmed && croppedImage && (
                  <div className="mt-6 p-4 bg-secondary/20 rounded-lg">
                    <p className="text-sm font-medium text-primary mb-3">Preview</p>
                    <div className="relative w-40 h-40 mx-auto rounded-lg overflow-hidden">
                      <Image 
                        src={croppedImage} 
                        alt="Cropped preview" 
                        fill
                        className={`object-cover ${isProcessing ? 'opacity-50' : ''}`}
                      />
                      {isProcessing && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-lg py-6 button-effect"
              >
                Create!
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}