"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";

export default function Login() {
  const [email, setEmail] = useState<string>("student@campus.com");
  const [password, setPassword] = useState<string>("admin123");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("campus_user", JSON.stringify(data.user));
        window.location.href = "/dashboard";
      } else {
        setMessage(data.message || "登录失败");
      }
    } catch {
      setMessage("接口异常，登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h2 className="text-xl font-bold text-foreground text-center">系统登录</h2>
        <p className="mt-1.5 text-xs text-muted-foreground text-center">
          请输入您的学生账号或主办方账号
        </p>

        <form onSubmit={handleLogin} className="mt-8">
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

            {message && <p className="text-xs text-red-500">{message}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 font-semibold"
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
          主办方 organizer@campus.com 密码 admin123
        </div>
      </div>
    </div>
  );
}
