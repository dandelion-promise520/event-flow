"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Calendar, LogOut } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("campus_user");
    if (stored) {
      setTimeout(() => {
        setUser(JSON.parse(stored));
      }, 0);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("campus_user");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e4e4e7] bg-[#fcfcfd]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-black">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <span>CampusEvent</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-neutral-600 hover:text-black">
            活动探索
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium text-neutral-600 hover:text-black">
                控制台 ({user.name})
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-800"
              >
                <LogOut className="h-4 w-4" />
                退出
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-black px-4 text-sm font-medium text-white transition-all hover:bg-neutral-800"
            >
              登录系统
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
