"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Calendar, LogOut, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

import NotificationCenter from "./notification-center"

import { useTheme } from "next-themes"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function ModeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon">
            <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">主题切换</span>
          </Button>
        }
      ></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          亮色
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          暗色
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          跟随系统
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function Navbar() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem("campus_user")
    if (stored) {
      setTimeout(() => {
        setUser(JSON.parse(stored))
      }, 0)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("campus_user")
    setUser(null)
    window.location.href = "/"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-foreground"
        >
          <Calendar className="h-5 w-5 text-brand" />
          <span>EventFlow</span>
        </Link>
        <nav className="flex items-center gap-6">
          <ModeToggle />
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            活动探索
          </Link>
          {user ? (
            <>
              <NotificationCenter />
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                控制台 ({user.name})
              </Link>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut data-icon="inline-start" />
                退出
              </Button>
            </>
          ) : (
            <Button render={<Link href="/login" />} nativeButton={false}>
              登录系统
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
