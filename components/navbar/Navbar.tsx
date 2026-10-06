"use client";

import Link from "next/link";
import {
  Activity,
  BarChart3,
  Search,
  Swords,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
  {
    label: "Players",
    href: "/",
    icon: Users,
  },
  {
    label: "Matches",
    href: "/",
    icon: Swords,
  },
  {
    label: "Heroes",
    href: "/",
    icon: BarChart3,
  },
];

export default function Navbar() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await fetch("/api/status", {
          cache: "no-store",
        });

        if (!response.ok) {
          setApiOnline(false);
          return;
        }

        const data = await response.json();
        setApiOnline(data.online === true);
      } catch {
        setApiOnline(false);
      }
    }

    checkStatus();

    const interval = setInterval(checkStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const statusText =
    apiOnline === null
      ? "Checking"
      : apiOnline
        ? "API Online"
        : "API Offline";

  const statusColor =
    apiOnline === null
      ? "bg-yellow-500"
      : apiOnline
        ? "bg-emerald-500"
        : "bg-red-500";

  const statusTextColor =
    apiOnline === null
      ? "text-yellow-400"
      : apiOnline
        ? "text-emerald-400"
        : "text-red-400";

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#070708]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 transition-all duration-300 group-hover:border-red-500/40 group-hover:bg-red-500/15">
            <Activity
              size={19}
              className="text-red-500 transition-transform duration-300 group-hover:scale-110"
            />
          </div>

          <div className="leading-none">
            <div className="text-sm font-black tracking-[0.2em] text-white">
              DOTA
            </div>

            <div className="text-[10px] font-bold tracking-[0.35em] text-red-500">
              INSIGHT
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className="group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-all duration-200 hover:bg-white/[0.04] hover:text-white"
              >
                <Icon
                  size={16}
                  className="transition-colors group-hover:text-red-500"
                />

                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-xs font-medium text-zinc-400 transition-all hover:border-red-500/30 hover:bg-red-500/5 hover:text-white sm:flex"
          >
            <Search size={15} />
            Search
          </Link>

          {/* API Status */}
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${
              apiOnline === null
                ? "border-yellow-500/20 bg-yellow-500/5"
                : apiOnline
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-red-500/20 bg-red-500/5"
            }`}
            title="OpenDota API status"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusColor} ${
                apiOnline === null ? "animate-pulse" : ""
              }`}
            />

            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${statusTextColor}`}
            >
              {statusText}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
