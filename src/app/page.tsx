import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from 'lucide-react'

export default function Homepage() {
  const featuredGames = [
    { 
      id: 1, 
      title: "Whack-a-me", 
      thumbnail: "/WAM-Carousel-1.jpg",
      slug: "whack-a-me" 
    },
    { 
      id: 2, 
      title: "Puzzle-a-Day", 
      thumbnail: "/placeholder.svg?height=200&width=300",
      slug: "puzzle-a-day" 
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            PL Games
          </Link>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input type="search" placeholder="Search games..." className="pl-10 pr-4 py-2" />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to PL Games!</h1>
          <p className="text-xl text-muted-foreground mb-6">Make your game and share it instantly!</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6">Games</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredGames.map((game) => (
              <Card key={game.id}>
                <CardHeader>
                  <CardTitle>{game.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <img 
                    src={game.thumbnail} 
                    alt={game.title}
                    className="w-full h-auto rounded-md"
                  />
                </CardContent>
                <CardFooter>
                  <Link href={`/games/${game.slug}`} className="w-full">
                    <Button className="w-full">Customize Now</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
          © 2024 PL Games. All rights reserved.
        </div>
      </footer>
    </div>
  )
}