import type React from "react"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { UserNav } from "@/components/dashboard/user-nav"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { Music } from "lucide-react"
import Link from "next/link"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="flex h-16 items-center justify-between p-8">
          <div className="flex items-center gap-2 md:hidden">
            <MobileNav />
            <Music className="h-6 w-6 text-primary" />
            <span className="font-bold">SonataAI</span>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Link href={"/dashboard"} className="flex items-center gap-2">
              <Music className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">SonataAI</span>
            </Link>
          </div>
          <UserNav />
        </div>
      </header>
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="fixed top-16 z-30 -ml-2 hidden h-[calc(100vh-4rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
          <DashboardNav />
        </aside>
        <main className="flex w-full flex-col overflow-hidden py-6">{children}</main>
      </div>
    </div>
  )
}
