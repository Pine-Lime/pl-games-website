'use client'

import { useState } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Camera, Upload } from 'lucide-react'
import { use } from 'react'

// This would typically come from a database or API
const games = [
  { 
    id: 1, 
    title: "Whack-a-me", 
    image: "/placeholder.svg?height=200&width=300", 
    slug: "whack-a-me",
    description: "Customize your Whack-a-me game with personalized messages and images!",
  },
  { 
    id: 2, 
    title: "Puzzle-a-Day", 
    image: "/placeholder.svg?height=200&width=300", 
    slug: "puzzle-a-day",
    description: "Create your daily puzzle challenge with custom clues and images!",
  },
]

export default function GamePage({ params }: { params: { slug: string } }) {
  const resolvedParams = use(params)
  const game = games.find(g => g.slug === resolvedParams.slug)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  if (!game) {
    notFound()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0])
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Here you would typically send the form data to your backend
    console.log('Form submitted')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-primary">
            PL Games
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">{game.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <img src={game.image} alt={game.title} className="w-full h-64 object-cover rounded-md mb-4" />
            <p className="text-lg text-muted-foreground mb-4">
              {game.description}
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {game.slug === 'whack-a-me' && (
                <>
                  <div>
                    <Label htmlFor="input1">First Message</Label>
                    <Input id="input1" required />
                  </div>
                  <div>
                    <Label htmlFor="multiline">Apology Message</Label>
                    <Textarea id="multiline" rows={4} required />
                  </div>
                  <div>
                    <Label htmlFor="input2">Final Message</Label>
                    <Input id="input2" required />
                  </div>
                </>
              )}
              {game.slug === 'puzzle-a-day' && (
                <>
                  <div>
                    <Label htmlFor="input1">Puzzle Clue</Label>
                    <Input id="input1" required />
                  </div>
                  <div>
                    <Label htmlFor="input2">Puzzle Answer</Label>
                    <Input id="input2" required />
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="image">Upload Image</Label>
                <div className="mt-1 flex items-center space-x-4">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                  <Label
                    htmlFor="image"
                    className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                  >
                    <Camera className="mr-2" size={18} />
                    Take Photo
                  </Label>
                  <Label
                    htmlFor="image"
                    className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                  >
                    <Upload className="mr-2" size={18} />
                    Upload Image
                  </Label>
                  {selectedFile && (
                    <span className="text-sm text-muted-foreground">
                      {selectedFile.name}
                    </span>
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full">
                Create Custom Game
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
          © 2024 PL Games. All rights reserved.
        </div>
      </footer>
    </div>
  )
}