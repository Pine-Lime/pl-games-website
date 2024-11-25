import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from 'next/image'

export default function Homepage() {
  const featuredGames = [
    { 
      id: 1, 
      title: "Whack-a-me", 
      thumbnail: "/WAM-Thumbnail.png",
      slug: "whack-a-me" 
    },
    { 
      id: 2, 
      title: "Puzzle-a-Day", 
      thumbnail: "/PAD-Thumbnail.png",
      slug: "puzzle-a-day" 
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/30 via-background to-secondary/30">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            PL Games
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="mb-12 text-center relative">
          <Image 
            src="/hero-image.jpg"
            alt="PL Games Hero"
            width={1920}
            height={400}
            className="w-full h-[400px] object-cover rounded-lg mb-8"
          />
          <h1 className="text-4xl font-bold mb-4">Welcome to PL Games!</h1>
          <p className="text-xl text-muted-foreground mb-6">Make your game and share it instantly!</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6 text-center">Games</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-[1200px] mx-auto">
            {featuredGames.map((game) => (
              <Link href={`/games/${game.slug}`} key={game.id} className="block">
                <Card className="w-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-2xl text-center">{game.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Image 
                      src={game.thumbnail} 
                      alt={game.title}
                      width={1000}
                      height={500}
                      className="w-[1000px] h-[500px] rounded-md object-cover"
                    />
                  </CardContent>
                </Card>
              </Link>
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