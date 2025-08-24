import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Music, Sparkles } from "lucide-react"
import { PianoKeyAnimation } from "@/components/piano/piano-key-animation"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href={"/"} className="flex items-center gap-2">
            <Music className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SonataAI</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Login
            </Link>
            <Button asChild size="sm">
              <Link href="/auth/signup">Sign Up</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-background"></div>
          <div className="container relative z-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm">
              <Sparkles className="mr-1 h-3.5 w-3.5 text-primary" />
              <span>AI-powered piano learning</span>
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Learn Piano with Your <span className="text-primary">AI Tutor</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Master piano at your own pace with personalized AI feedback, interactive lessons, and real-time guidance.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/auth/signup">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/demo">Try Demo</Link>
              </Button>
            </div>
          </div>
        </section>

        <PianoKeyAnimation />

        <section className="py-20">
          <div className="container">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Music className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Personalized Learning</h3>
                <p className="text-muted-foreground">
                  Our AI adapts to your skill level and learning style, providing customized lessons and feedback.
                </p>
              </div>
              <div className="rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-bold">Real-time Feedback</h3>
                <p className="text-muted-foreground">
                  Get instant feedback on your playing with visual cues and helpful suggestions to improve.
                </p>
              </div>
              <div className="rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="M18 6H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h13l4-3.5L18 6Z" />
                    <path d="M12 13v8" />
                    <path d="M5 13v6a2 2 0 0 0 2 2h8" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-bold">Track Progress</h3>
                <p className="text-muted-foreground">
                  Monitor your improvement over time with detailed analytics and progress tracking.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-muted py-20">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to start your piano journey?</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Join thousands of students who are learning piano with AI assistance.
              </p>
              <Button size="lg" className="mt-8" asChild>
                <Link href="/auth/signup">Sign Up Now</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold">SonataAI</span>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} SonataAI. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
