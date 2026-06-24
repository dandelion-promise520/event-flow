"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardSidebar from "@/components/dashboard-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem("campus_user")
    if (!stored) {
      router.push("/login")
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] bg-background">
        {/* Sidebar skeleton */}
        <div className="hidden md:flex w-[--sidebar-width] shrink-0 flex-col border-r border-border bg-card/50 p-4 gap-4">
          <div className="h-8 w-3/4 rounded-lg bg-muted animate-pulse" />
          <div className="flex flex-col gap-2 mt-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-9 rounded-lg bg-muted animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
            ))}
          </div>
        </div>
        {/* Main content skeleton */}
        <div className="flex-1 p-4 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-7 w-32 rounded-lg bg-muted animate-pulse" />
              <div className="h-4 w-48 rounded-lg bg-muted animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-56 rounded-xl bg-muted animate-pulse" />
            <div className="h-56 rounded-xl bg-muted animate-pulse" />
          </div>
          <div className="h-64 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <SidebarProvider className="min-h-[calc(100dvh-4rem)] bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
