"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState<string>("student@campus.com")
  const [password, setPassword] = useState<string>("admin123")
  const [loading, setLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<string>("")
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true)

  useEffect(() => {
    const stored = localStorage.getItem("campus_user")
    if (stored) {
      router.replace("/dashboard")
    } else {
      setTimeout(() => {
        setCheckingAuth(false)
      }, 0)
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (data.success) {
        localStorage.setItem("campus_user", JSON.stringify(data.user))
        window.location.href = "/dashboard"
      } else {
        setMessage(data.message || "登录失败")
      }
    } catch {
      setMessage("接口异常，登录失败")
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold">
            系统登录
          </CardTitle>
          <CardDescription className="text-center text-xs">
            请输入您的学生账号或主办方账号
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <FieldGroup>
              <Field>
                <FieldLabel>账号 (邮箱)</FieldLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background"
                />
              </Field>

              <Field>
                <FieldLabel>登录密码</FieldLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background"
                />
              </Field>

              {message && <p className="text-xs text-destructive">{message}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="h-10 w-full font-semibold"
              >
                {loading ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : null}
                {loading ? "正在登录..." : "立即登录"}
              </Button>
            </FieldGroup>
          </form>

          <div className="mt-6 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground/80">
            测试账号：学生 student@campus.com 密码 admin123 <br />
            主办方 organizer@campus.com 密码 admin123 <br />
            超级管理员 admin@campus.com 密码 admin123
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
