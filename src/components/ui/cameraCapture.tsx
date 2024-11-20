'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Camera, Repeat2 } from 'lucide-react'
import { uploadToS3 } from '@/lib/upload'

interface CameraCaptureProps {
  onPhotoCapture: (happyPhoto: string, sadPhoto: string, happyFaceAnalysis: any, sadFaceAnalysis: any) => void
  onError?: () => void
}

export function CameraCapture({ onPhotoCapture, onError }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [happyFacePhoto, setHappyFacePhoto] = useState<string | null>(null)
  const [sadFacePhoto, setSadFacePhoto] = useState<string | null>(null)
  const [currentMode, setCurrentMode] = useState<'happy' | 'sad' | null>(null)
  const [processedHappyPhotoUrl, setProcessedHappyPhotoUrl] = useState<string | null>(null)
  const [processedSadPhotoUrl, setProcessedSadPhotoUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [happyFaceAnalysis, setHappyFaceAnalysis] = useState<any>(null)
  const [sadFaceAnalysis, setSadFaceAnalysis] = useState<any>(null)

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      })
      setStream(mediaStream)
      
      while (!videoRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      videoRef.current.srcObject = mediaStream
      
      await new Promise((resolve) => {
        videoRef.current!.onloadedmetadata = resolve
      })
      await videoRef.current.play()
    } catch (error) {
      console.error('Camera access error:', error)
      onError?.()
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const context = canvas.getContext('2d')
      context?.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const photoData = canvas.toDataURL('image/jpeg')
      
      const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')

      const dateNow = Date.now()
      
      try {
        setIsUploading(true)
        if (currentMode === 'happy') {
          const result = await uploadToS3(buffer, 'image/jpeg', `happy-${dateNow}.jpg`, 'whack-a-me/raw-photos')
          if ('cloudFront' in result) {
            setHappyFacePhoto(result.cloudFront || result.objectURL)
          } else {
            console.error('Error uploading to S3:', result)
            onError?.()
          }
          
          if (!sadFacePhoto) {
            setCurrentMode('sad')
          } else {
            setCurrentMode(null)
            stopCamera()
          }
        } else if (currentMode === 'sad') {
          const result = await uploadToS3(buffer, 'image/jpeg', `sad-${dateNow}.jpg`, 'whack-a-me/raw-photos')
          if ('cloudFront' in result) {
            setSadFacePhoto(result.cloudFront || result.objectURL)
            setCurrentMode(null)
            stopCamera()
          } else {
            console.error('Error uploading to S3:', result)
            onError?.()
          }
        }
      } catch (error) {
        console.error('Error uploading photo:', error)
        onError?.()
      } finally {
        setIsUploading(false)
      }
    }
  }

  useEffect(() => {
    const processPhotos = async () => {
      if (happyFacePhoto && sadFacePhoto) {
        try {
          const [happyResponse, sadResponse] = await Promise.all([
            fetch('/api/face-cutout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageUrl: happyFacePhoto })
            }),
            fetch('/api/face-cutout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageUrl: sadFacePhoto })
            })
          ])

          const [happyResult, sadResult] = await Promise.all([
            happyResponse.json(),
            sadResponse.json()
          ])

          if (happyResult.success && sadResult.success) {
            const dateNow = Date.now()
            
            setHappyFaceAnalysis(happyResult.faceAnalysis)
            setSadFaceAnalysis(sadResult.faceAnalysis)
            
            const [happyS3Result, sadS3Result] = await Promise.all([
              uploadToS3(
                Buffer.from(happyResult.imageData, 'base64'),
                'image/png',
                `happy-processed-${dateNow}.png`,
                'whack-a-me/processed-photos'
              ),
              uploadToS3(
                Buffer.from(sadResult.imageData, 'base64'),
                'image/png',
                `sad-processed-${dateNow}.png`,
                'whack-a-me/processed-photos'
              )
            ])

            if ('cloudFront' in happyS3Result && 'cloudFront' in sadS3Result) {
              setProcessedHappyPhotoUrl(happyS3Result.cloudFront)
              setProcessedSadPhotoUrl(sadS3Result.cloudFront)
            }
          }
        } catch (error) {
          console.error('Error processing photos:', error)
        }
      }
    }

    processPhotos()
  }, [happyFacePhoto, sadFacePhoto])

  const handleConfirm = () => {
    if (processedHappyPhotoUrl && processedSadPhotoUrl) {
      Promise.all([
        fetch(processedHappyPhotoUrl),
        fetch(processedSadPhotoUrl)
      ]).then(() => {
        setHappyFacePhoto(null)
        setSadFacePhoto(null)
        onPhotoCapture(
          processedHappyPhotoUrl, 
          processedSadPhotoUrl, 
          happyFaceAnalysis, 
          sadFaceAnalysis
        )
      })
    }
  }

  const handleRetake = (type: 'happy' | 'sad') => {
    if (type === 'happy') {
      setHappyFacePhoto(null)
      setProcessedHappyPhotoUrl(null)
    } else {
      setSadFacePhoto(null)
      setProcessedSadPhotoUrl(null)
    }
    setCurrentMode(type)
    openCamera()
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <>
      <div className="flex gap-2">
        {!stream && !happyFacePhoto && !sadFacePhoto && (
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1"
            onClick={() => {
              setCurrentMode('happy')
              openCamera()
            }}
          >
            <Camera className="mr-2 h-4 w-4" />
            Create avatar
          </Button>
        )}
      </div>

      {stream && (
        <div className="relative mt-4">
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/20 text-white px-4 py-2 rounded">
            {currentMode === 'happy' ? 'Happy Face 😄' : 'Sad Face 😔'}
          </div>
          <video
            ref={videoRef}
            playsInline
            className="w-full rounded-lg"
            style={{ maxHeight: '400px' }}
          />
          <Button 
            type="button"
            onClick={capturePhoto}
            disabled={isUploading}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 hover:bg-red-600"
          >
            <Camera className="h-4 w-4" />
          </Button>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {!stream && (happyFacePhoto || sadFacePhoto) && (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              {processedHappyPhotoUrl ? (
                <img 
                  src={processedHappyPhotoUrl} 
                  alt="Processed happy face" 
                  className="w-full rounded-lg"
                  style={{ maxHeight: '200px', objectFit: 'contain' }}
                />
              ) : happyFacePhoto && (
                <div className="w-full aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                  Processing...
                </div>
              )}
              {happyFacePhoto && (
                <Button 
                  type="button"
                  variant="secondary"
                  className="absolute bottom-1 right-1"
                  onClick={() => handleRetake('happy')}
                >
                  <Repeat2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="relative">
              {processedSadPhotoUrl ? (
                <img 
                  src={processedSadPhotoUrl} 
                  alt="Processed sad face" 
                  className="w-full rounded-lg"
                  style={{ maxHeight: '200px', objectFit: 'contain' }}
                />
              ) : sadFacePhoto && (
                <div className="w-full aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                  Processing...
                </div>
              )}
              {sadFacePhoto && (
                <Button 
                  type="button"
                  variant="secondary"
                  className="absolute bottom-1 right-1"
                  onClick={() => handleRetake('sad')}
                >
                  <Repeat2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {processedHappyPhotoUrl && processedSadPhotoUrl && (
            <Button 
              type="button"
              className="mt-4 w-full"
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          )}
        </div>
      )}
    </>
  )
}