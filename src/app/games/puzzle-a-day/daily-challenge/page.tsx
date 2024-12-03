'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function DailyChallengePage() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (!email && !phone) return // Ensure at least one field is filled
    
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/register-for-daily-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone }),
      })

      if (!response.ok) throw new Error('Failed to register')
      setIsSuccessDialogOpen(true) // Show success dialog
    } catch (error) {
      console.error('Error registering:', error)
      // Handle error (could add an error message state here)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="puzzle-page dark min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12">
        <Link 
          href="/games/puzzle-a-day"
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
                alt="Daily Challenge Preview" 
                width={800}
                height={320}
                className="w-full h-full object-cover"
              />
              <div className="relative w-full h-full">
                <div className="w-full h-full bg-gradient-to-t from-black/50 to-transparent" />
                <div className="relative -mt-16 px-4 pb-4">
                  <h1 className="text-3xl font-bold text-primary-foreground">
                    Daily Challenge
                  </h1>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-lg">Email Address</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary"
                  placeholder="your@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-lg">Phone Number</Label>
                <Input 
                  id="phone" 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-secondary"
                  placeholder="+1 (555) 555-5555"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-lg py-6 button-effect"
                disabled={isSubmitting || (!email && !phone)}
              >
                {isSubmitting ? 'Registering...' : 'Register'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registration Successful! 🎉</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>You have successfully registered for the daily challenge.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              We'll send you notifications when new challenges are available.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}