'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Camera, Repeat2 } from 'lucide-react'
import { uploadToS3 } from '@/lib/upload'

// Define interfaces for face analysis
interface FaceAnalysis {
  // Add specific properties based on what your API returns
  // This is an example - adjust according to your actual data structure
  faceId?: string;
  confidence?: number;
  // ... other properties
}

interface CameraCaptureProps {
  onPhotoCapture: (
    happyPhoto: string, 
    sadPhoto: string, 
    happyFaceAnalysis: FaceAnalysis | null, 
    sadFaceAnalysis: FaceAnalysis | null
  ) => void;
  onError?: () => void;
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
            
            // Store face analysis in local variables first
            const happyAnalysis = happyResult.faceAnalysis
            const sadAnalysis = sadResult.faceAnalysis

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
              onPhotoCapture(
                happyS3Result.cloudFront,
                sadS3Result.cloudFront,
                happyAnalysis, // Use local variables instead of state
                sadAnalysis
              )
            }
          }
        } catch (error) {
          console.error('Error processing photos:', error)
        }
      }
    }

    processPhotos();
  }, [happyFacePhoto, sadFacePhoto])

//   const handleConfirm = () => {
//     if (processedHappyPhotoUrl && processedSadPhotoUrl) {
//       Promise.all([
//         fetch(processedHappyPhotoUrl),
//         fetch(processedSadPhotoUrl)
//       ]).then(() => {
//         setHappyFacePhoto(null)
//         setSadFacePhoto(null)
//         onPhotoCapture(
//           processedHappyPhotoUrl, 
//           processedSadPhotoUrl, 
//           happyFaceAnalysis, 
//           sadFaceAnalysis
//         )
//       })
//     }
//   }
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
            <div className="relative w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              {processedHappyPhotoUrl ? (
                <img 
                  src={processedHappyPhotoUrl} 
                  alt="Processed happy face" 
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : happyFacePhoto && (
                <div className="relative w-full h-full">
                  <img
                    src={happyFacePhoto}
                    alt="Happy face being processed"
                    className="w-full h-full object-contain rounded-lg opacity-50"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
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
            <div className="relative w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              {processedSadPhotoUrl ? (
                <img 
                  src={processedSadPhotoUrl} 
                  alt="Processed sad face" 
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : sadFacePhoto && (
                <div className="relative w-full h-full">
                  <img
                    src={sadFacePhoto}
                    alt="Sad face being processed"
                    className="w-full h-full object-contain rounded-lg opacity-50"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
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
        </div>
      )}
    </>
  )
}