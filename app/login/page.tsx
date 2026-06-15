"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

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
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-neutral-900 text-center">系统登录</h2>
        <p className="mt-1.5 text-xs text-neutral-500 text-center">
          请输入您的学生账号或主办方账号
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-700">账号 (邮箱)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 px-3.5 text-sm outline-none transition-all focus:border-neutral-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700">登录密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 px-3.5 text-sm outline-none transition-all focus:border-neutral-400"
            />
          </div>

          {message && <p className="text-xs text-red-500">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex h-10 w-full items-center justify-center rounded-xl bg-black text-sm font-semibold text-white transition-all hover:bg-neutral-800 shadow-sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "立即登录"}
          </button>
        </form>

        <div className="mt-6 border-t border-neutral-100 pt-6 text-center text-xs text-neutral-400">
          测试账号：学生 student@campus.com 密码 admin123 <br />
          主办方 organizer@campus.com 密码 admin123
        </div>
      </div>
    </div>
  );
}
