"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  Search,
  Swords,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/navbar/Navbar";

type PlayerSearchResult = {
  account_id: number;
  avatarfull?: string;
  personaname: string;
  last_match_time?: string;
  sml?: number;
};

const recentPlayers = [
  {
    name: "Yatoro",
    team: "Team Spirit",
    rank: "Immortal",
    rating: "8.7",
    winrate: "58.4%",
    color: "from-red-500/20",
  },
  {
    name: "Arteezy",
    team: "Free Agent",
    rank: "Immortal",
    rating: "8.3",
    winrate: "55.1%",
    color: "from-orange-500/20",
  },
  {
    name: "Collapse",
    team: "Team Spirit",
    rank: "Immortal",
    rating: "8.9",
    winrate: "61.2%",
    color: "from-purple-500/20",
  },
];

const stats = [
  {
    value: "1.2M+",
    label: "Players tracked",
    icon: Users,
  },
  {
    value: "8.4M+",
    label: "Matches analyzed",
    icon: Swords,
  },
  {
    value: "126",
    label: "Heroes tracked",
    icon: Trophy,
  },
];

function formatLastMatch(date?: string) {
  if (!date) return "No recent match";

  const matchDate = new Date(date);

  if (Number.isNaN(matchDate.getTime())) {
    return "Unknown";
  }

  return `Last match ${matchDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
}

function extractAccountId(value: string) {
  const trimmed = value.trim();

  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(/profiles\/(\d+)/);

  if (match) {
    return match[1];
  }

  return null;
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setResults([]);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  async function handleSearch() {
    const value = search.trim();

    if (!value || loading) return;

    setError("");
    setSearched(false);

    const accountId = extractAccountId(value);

    if (accountId) {
      window.location.href = `/player/${accountId}`;
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/players/search?q=${encodeURIComponent(value)}`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setResults(data.players || []);
      setSearched(true);
    } catch {
      setResults([]);
      setError("Unable to search players. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      handleSearch();
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#070708] text-white">
      <Navbar />

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-0">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="absolute left-1/2 top-[-300px] h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-red-600/[0.07] blur-[140px]" />

        <div className="absolute bottom-[-300px] left-[-200px] h-[500px] w-[500px] rounded-full bg-red-900/[0.05] blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-6 pb-24 pt-24 md:pt-32">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/[0.06] px-4 py-2">
              <Zap size={14} className="text-red-500" />

              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
                Dota 2 Analytics Platform
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.04em] sm:text-6xl md:text-8xl">
              UNDERSTAND
              <br />
              <span className="text-red-500">YOUR GAME.</span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-zinc-400 md:text-lg">
              Analyze players, matches and performance. Discover what makes
              you win — and what is holding you back.
            </p>

            {/* Search */}
            <div
              ref={searchRef}
              className="relative mx-auto mt-10 max-w-2xl"
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search
                    size={19}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600"
                  />

                  <input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setError("");
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Steam ID, player name or profile URL..."
                    className="h-14 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] pl-13 pr-5 text-sm text-white outline-none transition-all placeholder:text-zinc-600 focus:border-red-500/40 focus:bg-white/[0.05] focus:ring-4 focus:ring-red-500/[0.06]"
                  />
                </div>

                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="flex h-14 items-center justify-center gap-2 rounded-xl bg-red-600 px-7 text-sm font-bold transition-all duration-200 hover:bg-red-500 hover:shadow-[0_0_30px_rgba(220,38,38,0.25)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Searching
                    </>
                  ) : (
                    <>
                      Analyze
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </div>

              {/* Search results */}
              {(results.length > 0 || searched || error) && (
                <div className="absolute left-0 right-0 top-[68px] z-50 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0d10] text-left shadow-2xl shadow-black/50">
                  {results.length > 0 ? (
                    <div className="max-h-[420px] overflow-y-auto p-2">
                      <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                        {results.length} players found
                      </div>

                      {results.map((player) => (
                        <Link
                          key={player.account_id}
                          href={`/player/${player.account_id}`}
                          onClick={() => setResults([])}
                          className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-white/[0.05]"
                        >
                          {player.avatarfull ? (
                            <img
                              src={player.avatarfull}
                              alt=""
                              className="h-11 w-11 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-bold text-zinc-500">
                              {player.personaname.slice(0, 2).toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold text-white">
                              {player.personaname}
                            </div>

                            <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-600">
                              <span>ID {player.account_id}</span>

                              <span className="h-1 w-1 rounded-full bg-zinc-700" />

                              <span>
                                {formatLastMatch(player.last_match_time)}
                              </span>
                            </div>
                          </div>

                          <ChevronRight
                            size={16}
                            className="text-zinc-700 transition-all group-hover:translate-x-0.5 group-hover:text-red-500"
                          />
                        </Link>
                      ))}
                    </div>
                  ) : searched ? (
                    <div className="p-6 text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04]">
                        <Search size={17} className="text-zinc-600" />
                      </div>

                      <p className="mt-3 text-sm font-semibold text-zinc-400">
                        No players found
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        Try another player name or Steam ID.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-red-400">{error}</div>
                  )}
                </div>
              )}
            </div>

            <p className="mt-4 text-xs text-zinc-600">
              Enter a Steam ID, player name or Steam profile URL
            </p>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-20 grid max-w-4xl grid-cols-1 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.06] bg-white/[0.015] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="flex items-center justify-center gap-4 px-6 py-6"
                >
                  <Icon size={19} className="text-red-500/70" />

                  <div>
                    <div className="text-xl font-black tracking-tight">
                      {stat.value}
                    </div>

                    <div className="mt-0.5 text-[11px] uppercase tracking-wider text-zinc-600">
                      {stat.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Players */}
        <section className="border-t border-white/[0.05]">
          <div className="mx-auto max-w-7xl px-6 py-20">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-red-500">
                  Explore
                </p>

                <h2 className="text-2xl font-black tracking-tight md:text-3xl">
                  Recently analyzed
                </h2>
              </div>

              <Link
                href="/"
                className="group hidden items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-white sm:flex"
              >
                View all
                <ChevronRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {recentPlayers.map((player) => (
                <Link
                  href="/"
                  key={player.name}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.12] hover:bg-white/[0.035]"
                >
                  <div
                    className={`absolute right-0 top-0 h-32 w-32 rounded-full bg-gradient-to-br ${player.color} to-transparent blur-2xl`}
                  />

                  <div className="relative">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-sm font-black text-zinc-400">
                          {player.name.slice(0, 2).toUpperCase()}
                        </div>

                        <div>
                          <h3 className="font-bold">{player.name}</h3>
                          <p className="mt-0.5 text-xs text-zinc-600">
                            {player.team}
                          </p>
                        </div>
                      </div>

                      <ChevronRight
                        size={17}
                        className="text-zinc-700 transition-all group-hover:translate-x-1 group-hover:text-zinc-400"
                      />
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-3">
                      <div>
                        <div className="text-sm font-bold">
                          {player.rating}
                        </div>
                        <div className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">
                          Rating
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-bold text-emerald-400">
                          {player.winrate}
                        </div>
                        <div className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">
                          Winrate
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-bold">{player.rank}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">
                          Rank
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Match Analyzer */}
        <section className="border-t border-white/[0.05]">
          <div className="mx-auto max-w-7xl px-6 py-20">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-red-500">
                  Match Analyzer
                </p>

                <h2 className="max-w-xl text-3xl font-black leading-tight tracking-tight md:text-5xl">
                  More than stats.
                  <br />
                  <span className="text-zinc-500">Actual insight.</span>
                </h2>

                <p className="mt-6 max-w-lg text-sm leading-7 text-zinc-500">
                  We turn raw match data into information you can actually
                  use. Find your strengths, weaknesses and the moments that
                  changed the game.
                </p>

                <button
                  onClick={() =>
                    document
                      .querySelector("input")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="mt-8 flex items-center gap-2 text-sm font-bold text-white transition-colors hover:text-red-400"
                >
                  Analyze a match
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Analysis card */}
              <div className="relative">
                <div className="absolute -inset-6 rounded-[2rem] bg-red-600/[0.04] blur-3xl" />

                <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0b0d] p-6 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                        Performance
                      </p>

                      <div className="mt-1 flex items-end gap-2">
                        <span className="text-4xl font-black">87</span>
                        <span className="mb-1 text-sm font-bold text-emerald-400">
                          / 100
                        </span>
                      </div>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                      <span className="text-sm font-black text-emerald-400">
                        A
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-5">
                    <AnalysisBar
                      label="Laning phase"
                      value="92"
                      width="92%"
                    />

                    <AnalysisBar
                      label="Teamfights"
                      value="84"
                      width="84%"
                    />

                    <AnalysisBar
                      label="Farming"
                      value="79"
                      width="79%"
                    />

                    <AnalysisBar
                      label="Map impact"
                      value="88"
                      width="88%"
                    />
                  </div>

                  <div className="mt-6 rounded-xl border border-red-500/10 bg-red-500/[0.04] p-4">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-red-500" />

                      <span className="text-xs font-bold text-red-400">
                        Key insight
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      Strong early game. Your biggest improvement area is
                      converting map advantage into objectives.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/[0.05]">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 DOTA INSIGHT</span>

            <span>
              Built for players who want to understand the game.
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}

function AnalysisBar({
  label,
  value,
  width,
}: {
  label: string;
  value: string;
  width: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-zinc-500">{label}</span>
        <span className="font-bold text-zinc-300">{value}</span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-red-500"
          style={{ width }}
        />
      </div>
    </div>
  );
}
