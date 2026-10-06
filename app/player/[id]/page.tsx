"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Trophy,
  UserRound,
  Clock,
  Swords,
  TrendingUp,
  Target,
  Zap,
  Skull,
  BarChart3,
  ChevronRight,
  Search,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import Navbar from "@/components/navbar/Navbar";

type Player = {
  profile?: {
    account_id: number;
    personaname: string;
    name: string | null;
    steamid: string;
    avatar: string;
    avatarmedium: string;
    avatarfull: string;
    profileurl: string;
    last_login: string | null;
    loccountrycode: string | null;
  };
  rank_tier?: number | null;
  leaderboard_rank?: number | null;
  computed_mmr?: number | null;
  computed_mmr_turbo?: number | null;
  aliases?: {
    personaname: string;
    name_since: string;
  }[];
};

type Match = {
  match_id: number;
  player_slot: number;
  radiant_win: boolean;
  hero_id: number;
  start_time: number;
  duration: number;
  game_mode: number;
  lobby_type: number;
  kills: number;
  deaths: number;
  assists: number;
  average_rank: number;
  xp_per_min: number;
  gold_per_min: number;
  hero_damage: number;
  tower_damage: number;
  hero_healing: number;
  last_hits: number;
  lane: number | null;
  lane_role: number | null;
  is_roaming: boolean | null;
  party_size: number | null;
  leaver_status: number;
  hero_variant: number;
};

type Hero = {
  id: number;
  name: string;
  localized_name: string;
};

function getRankName(rankTier?: number | null) {
  if (!rankTier) return "Unranked";

  const rank = Math.floor(rankTier / 10);
  const stars = rankTier % 10;

  const ranks: Record<number, string> = {
    1: "Herald",
    2: "Guardian",
    3: "Crusader",
    4: "Archon",
    5: "Legend",
    6: "Ancient",
    7: "Divine",
    8: "Immortal",
  };

  if (rank === 8) {
    return "Immortal";
  }

  return `${ranks[rank] ?? "Unknown"} ${stars}`;
}

function getRankColor(rankTier?: number | null) {
  if (!rankTier) return "text-zinc-400";

  const rank = Math.floor(rankTier / 10);

  if (rank >= 8) return "text-red-400";
  if (rank >= 7) return "text-amber-400";
  if (rank >= 6) return "text-cyan-400";
  if (rank >= 5) return "text-purple-400";
  if (rank >= 4) return "text-blue-400";
  if (rank >= 3) return "text-emerald-400";

  return "text-zinc-300";
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isWin(match: Match) {
  const radiant = match.player_slot < 128;

  return radiant === match.radiant_win;
}

function getKda(match: Match) {
  return (match.kills + match.assists) / Math.max(match.deaths, 1);
}

function getKdaColor(match: Match) {
  const kda = getKda(match);

  if (kda >= 4) return "text-emerald-400";
  if (kda >= 2) return "text-yellow-400";

  return "text-red-400";
}

function getHeroImage(hero?: Hero) {
  if (!hero?.name) return null;

  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${hero.name.replace(
    "npc_dota_hero_",
    "",
  )}.png`;
}

function getWinRate(matches: Match[]) {
  if (!matches.length) return 0;

  const wins = matches.filter(isWin).length;

  return Math.round((wins / matches.length) * 100);
}

function average(
  matches: Match[],
  selector: (match: Match) => number,
) {
  if (!matches.length) return 0;

  return Math.round(
    matches.reduce((sum, match) => sum + selector(match), 0) /
      matches.length,
  );
}

export default function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [heroes, setHeroes] = useState<Hero[]>([]);

  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const { id } = await params;

        const [playerResponse, matchesResponse, heroesResponse] =
          await Promise.all([
            fetch(`/api/players/${id}`, {
              cache: "no-store",
            }),
            fetch(`/api/players/${id}/matches`, {
              cache: "no-store",
            }),
            fetch("/api/heroes", {
              cache: "no-store",
            }),
          ]);

        if (!playerResponse.ok) {
          throw new Error("Player not found");
        }

        const playerData = await playerResponse.json();
        setPlayer(playerData);

        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          setMatches(matchesData.matches ?? []);
        }

        if (heroesResponse.ok) {
          const heroesData = await heroesResponse.json();
          setHeroes(heroesData);
        }
      } catch {
        setError("Не удалось загрузить профиль игрока");
      } finally {
        setLoading(false);
        setMatchesLoading(false);
      }
    }

    loadData();
  }, [params]);

  const heroMap = useMemo(
    () => new Map(heroes.map((hero) => [hero.id, hero])),
    [heroes],
  );

  const recentMatches = matches.slice(0, 20);

  const [resultFilter, setResultFilter] = useState<"all" | "wins" | "losses">("all");
  const [heroFilter, setHeroFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [matchSearch, setMatchSearch] = useState("");

  const filteredMatches = useMemo(() => {
    const query = matchSearch.trim().toLowerCase();

    return [...recentMatches]
      .filter((match) => {
        if (resultFilter === "wins" && !isWin(match)) return false;
        if (resultFilter === "losses" && isWin(match)) return false;
        if (heroFilter !== "all" && String(match.hero_id) !== heroFilter) return false;

        if (query) {
          const hero = heroMap.get(match.hero_id);
          const heroName = hero?.localized_name?.toLowerCase() ?? "";
          const matchId = String(match.match_id);
          if (!heroName.includes(query) && !matchId.includes(query)) return false;
        }

        return true;
      })
      .sort((a, b) =>
        sortOrder === "newest"
          ? b.start_time - a.start_time
          : a.start_time - b.start_time,
      );
  }, [recentMatches, resultFilter, heroFilter, sortOrder, matchSearch, heroMap]);

  const stats = useMemo(() => {
    const wins = recentMatches.filter(isWin).length;
    const losses = recentMatches.length - wins;

    const avgKda = average(recentMatches, getKda);
    const avgGpm = average(recentMatches, (match) => match.gold_per_min);
    const avgXpm = average(recentMatches, (match) => match.xp_per_min);
    const avgLastHits = average(
      recentMatches,
      (match) => match.last_hits,
    );
    const avgDamage = average(
      recentMatches,
      (match) => match.hero_damage,
    );

    return {
      wins,
      losses,
      winRate: getWinRate(recentMatches),
      avgKda,
      avgGpm,
      avgXpm,
      avgLastHits,
      avgDamage,
    };
  }, [recentMatches]);

  const trendMatches = useMemo(
    () => [...recentMatches].reverse(),
    [recentMatches],
  );

  const maxKda = useMemo(
    () => Math.max(1, ...trendMatches.map(getKda)),
    [trendMatches],
  );

  const maxGpm = useMemo(
    () => Math.max(1, ...trendMatches.map((match) => match.gold_per_min)),
    [trendMatches],
  );

  const maxXpm = useMemo(
    () => Math.max(1, ...trendMatches.map((match) => match.xp_per_min)),
    [trendMatches],
  );

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to search
        </Link>

        {loading && (
          <div className="rounded-3xl border border-white/10 bg-[#0d1016] p-12 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />

            <p className="text-sm text-zinc-500">
              Loading player profile...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-10 text-center">
            <p className="text-red-400">{error}</p>

            <Link
              href="/"
              className="mt-5 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              Search another player
            </Link>
          </div>
        )}

        {!loading && !error && player?.profile && (
          <>
            {/* PROFILE HERO */}

            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d1016]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.08),transparent_35%)]" />

              <div className="relative p-6 sm:p-8">
                <div className="flex flex-col gap-7 md:flex-row md:items-center">
                  <img
                    src={player.profile.avatarfull}
                    alt={player.profile.personaname}
                    className="h-28 w-28 rounded-2xl border border-white/10 object-cover shadow-2xl sm:h-32 sm:w-32"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="truncate text-3xl font-bold tracking-tight sm:text-4xl">
                        {player.profile.personaname}
                      </h1>

                      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs text-zinc-500">
                        #{player.profile.account_id}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span
                        className={`text-sm font-semibold ${getRankColor(
                          player.rank_tier,
                        )}`}
                      >
                        {getRankName(player.rank_tier)}
                      </span>

                      <span className="text-sm text-zinc-600">
                        •
                      </span>

                      <span className="text-sm text-zinc-500">
                        Dota 2 Player
                      </span>

                      {player.profile.loccountrycode && (
                        <>
                          <span className="text-sm text-zinc-600">
                            •
                          </span>

                          <span className="text-sm text-zinc-500">
                            {player.profile.loccountrycode}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <a
                        href={player.profile.profileurl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
                      >
                        Steam Profile
                        <ExternalLink size={14} />
                      </a>

                      <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-500">
                        <UserRound size={14} />
                        {player.profile.steamid}
                      </div>
                    </div>
                  </div>

                  <div className="min-w-[150px] rounded-2xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-widest text-zinc-600">
                      Estimated MMR
                    </p>

                    <p className="mt-2 text-3xl font-bold">
                      {player.computed_mmr
                        ? Math.round(
                            player.computed_mmr,
                          ).toLocaleString()
                        : "—"}
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      OpenDota estimate
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* PERFORMANCE OVERVIEW */}

            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-[#0d1016] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-zinc-600">
                    Win Rate
                  </span>

                  <TrendingUp
                    size={17}
                    className="text-emerald-400"
                  />
                </div>

                <div className="mt-3 flex items-end gap-3">
                  <p className="text-3xl font-bold">
                    {stats.winRate}%
                  </p>

                  <p className="mb-1 text-xs text-zinc-600">
                    {stats.wins}W / {stats.losses}L
                  </p>
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all"
                    style={{
                      width: `${stats.winRate}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0d1016] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-zinc-600">
                    Avg KDA
                  </span>

                  <Target
                    size={17}
                    className="text-yellow-400"
                  />
                </div>

                <p className="mt-3 text-3xl font-bold">
                  {stats.avgKda.toFixed(2)}
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  Last {recentMatches.length} matches
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0d1016] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-zinc-600">
                    Avg GPM
                  </span>

                  <Zap
                    size={17}
                    className="text-amber-400"
                  />
                </div>

                <p className="mt-3 text-3xl font-bold">
                  {stats.avgGpm}
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  Gold per minute
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0d1016] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-zinc-600">
                    Avg XPM
                  </span>

                  <BarChart3
                    size={17}
                    className="text-cyan-400"
                  />
                </div>

                <p className="mt-3 text-3xl font-bold">
                  {stats.avgXpm}
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  XP per minute
                </p>
              </div>
            </section>

            {/* QUICK ANALYTICS */}

            <section className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#0d1016] p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-white/5 p-2">
                    <Swords size={17} className="text-zinc-400" />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Combat
                    </h2>

                    <p className="text-xs text-zinc-600">
                      Average per match
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-zinc-600">
                      Damage
                    </p>

                    <p className="mt-1 text-xl font-semibold">
                      {stats.avgDamage.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-600">
                      KDA
                    </p>

                    <p className="mt-1 text-xl font-semibold">
                      {stats.avgKda.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0d1016] p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-white/5 p-2">
                    <BarChart3 size={17} className="text-zinc-400" />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Farming
                    </h2>

                    <p className="text-xs text-zinc-600">
                      Average per match
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-zinc-600">
                      Last Hits
                    </p>

                    <p className="mt-1 text-xl font-semibold">
                      {stats.avgLastHits}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-600">
                      GPM
                    </p>

                    <p className="mt-1 text-xl font-semibold">
                      {stats.avgGpm}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0d1016] p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-white/5 p-2">
                    <Trophy size={17} className="text-zinc-400" />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Rank
                    </h2>

                    <p className="text-xs text-zinc-600">
                      Current competitive status
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <p
                      className={`text-xl font-bold ${getRankColor(
                        player.rank_tier,
                      )}`}
                    >
                      {getRankName(player.rank_tier)}
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      Tier {player.rank_tier ?? "—"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-zinc-600">
                      Leaderboard
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {player.leaderboard_rank
                        ? `#${player.leaderboard_rank.toLocaleString()}`
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* PERFORMANCE TRENDS */}

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[#0d1016] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">Performance Trend</h2>
                    <p className="mt-1 text-xs text-zinc-600">
                      KDA across recent matches
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-zinc-600">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Win
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      Loss
                    </span>
                  </div>
                </div>

                <div className="mt-7 flex h-44 items-end gap-1.5 border-b border-white/5">
                  {trendMatches.map((match) => {
                    const kda = getKda(match);
                    const height = Math.max(
                      8,
                      Math.min(100, (kda / maxKda) * 100),
                    );
                    const win = isWin(match);

                    return (
                      <Link
                        key={match.match_id}
                        href={`/match/${match.match_id}`}
                        title={`${match.kills}/${match.deaths}/${match.assists} • KDA ${kda.toFixed(2)}`}
                        className="group relative flex h-full flex-1 items-end"
                      >
                        <div
                          className={`w-full min-w-[3px] rounded-t-sm transition-all group-hover:opacity-100 ${
                            win
                              ? "bg-emerald-400/60 group-hover:bg-emerald-400"
                              : "bg-red-400/50 group-hover:bg-red-400"
                          }`}
                          style={{ height: `${height}%` }}
                        />
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-700">
                  <span>Older</span>
                  <span>Latest</span>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                  <span className="text-xs text-zinc-500">Peak KDA</span>
                  <span className="font-mono text-sm font-semibold text-zinc-200">
                    {maxKda.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0d1016] p-6">
                <div>
                  <h2 className="font-semibold">Economy Trend</h2>
                  <p className="mt-1 text-xs text-zinc-600">
                    GPM and XPM across recent matches
                  </p>
                </div>

                <div className="mt-7 flex h-44 items-end gap-1.5 border-b border-white/5">
                  {trendMatches.map((match) => {
                    const gpmHeight = Math.max(
                      8,
                      Math.min(100, (match.gold_per_min / maxGpm) * 100),
                    );
                    const xpmHeight = Math.max(
                      8,
                      Math.min(100, (match.xp_per_min / maxXpm) * 100),
                    );

                    return (
                      <Link
                        key={match.match_id}
                        href={`/match/${match.match_id}`}
                        title={`GPM ${match.gold_per_min} • XPM ${match.xp_per_min}`}
                        className="group flex h-full flex-1 items-end gap-px"
                      >
                        <div
                          className="w-1/2 rounded-t-sm bg-amber-400/45 transition-all group-hover:bg-amber-400"
                          style={{ height: `${gpmHeight}%` }}
                        />
                        <div
                          className="w-1/2 rounded-t-sm bg-cyan-400/45 transition-all group-hover:bg-cyan-400"
                          style={{ height: `${xpmHeight}%` }}
                        />
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-700">
                  <span>Older</span>
                  <span>Latest</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                      Peak GPM
                    </p>
                    <p className="mt-1 font-mono text-sm font-semibold text-amber-300">
                      {maxGpm}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                      Peak XPM
                    </p>
                    <p className="mt-1 font-mono text-sm font-semibold text-cyan-300">
                      {maxXpm}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* MATCH HISTORY */}

            <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1016]">
              <div className="border-b border-white/10 p-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Recent Matches</h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      Latest games played by this player
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-600">
                    <Swords size={14} />
                    {filteredMatches.length} of {recentMatches.length} matches
                  </div>
                </div>

                {!matchesLoading && recentMatches.length > 0 && (
                  <div className="mt-5 flex flex-col gap-3 xl:flex-row">
                    <div className="relative min-w-0 flex-1">
                      <Search
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
                      />
                      <input
                        value={matchSearch}
                        onChange={(event) => setMatchSearch(event.target.value)}
                        placeholder="Search hero or match ID..."
                        className="h-10 w-full rounded-lg border border-white/10 bg-black/20 pl-9 pr-3 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:border-white/20 focus:bg-white/[0.03]"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div className="flex rounded-lg border border-white/10 bg-black/20 p-1">
                        {([
                          ["all", "All"],
                          ["wins", "Wins"],
                          ["losses", "Losses"],
                        ] as const).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setResultFilter(value)}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                              resultFilter === value
                                ? "bg-white text-black"
                                : "text-zinc-500 hover:text-white"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      <label className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3">
                        <Filter size={14} className="text-zinc-600" />
                        <select
                          value={heroFilter}
                          onChange={(event) => setHeroFilter(event.target.value)}
                          className="bg-transparent text-xs text-zinc-400 outline-none"
                        >
                          <option value="all" className="bg-[#0d1016]">
                            All heroes
                          </option>
                          {heroes
                            .filter((hero) =>
                              recentMatches.some(
                                (match) => match.hero_id === hero.id,
                              ),
                            )
                            .sort((a, b) =>
                              a.localized_name.localeCompare(b.localized_name),
                            )
                            .map((hero) => (
                              <option
                                key={hero.id}
                                value={hero.id}
                                className="bg-[#0d1016]"
                              >
                                {hero.localized_name}
                              </option>
                            ))}
                        </select>
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          setSortOrder((current) =>
                            current === "newest" ? "oldest" : "newest",
                          )
                        }
                        className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 text-xs text-zinc-500 transition hover:border-white/20 hover:text-white"
                      >
                        <ArrowUpDown size={14} />
                        {sortOrder === "newest" ? "Newest" : "Oldest"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {matchesLoading ? (
                <div className="p-10 text-center text-sm text-zinc-600">
                  Loading matches...
                </div>
              ) : recentMatches.length === 0 ? (
                <div className="p-10 text-center text-sm text-zinc-600">
                  No recent matches found.
                </div>
              ) : filteredMatches.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-sm text-zinc-500">No matches found.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setResultFilter("all");
                      setHeroFilter("all");
                      setSortOrder("newest");
                      setMatchSearch("");
                    }}
                    className="mt-3 text-xs text-zinc-400 underline underline-offset-4 transition hover:text-white"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredMatches.map((match) => {
                    const win = isWin(match);
                    const hero = heroMap.get(match.hero_id);
                    const heroImage = getHeroImage(hero);

                    return (
                      <Link
                        key={match.match_id}
                        href={`/match/${match.match_id}`}
                        className="group block transition hover:bg-white/[0.025]"
                      >
                        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
                          {/* RESULT */}

                          <div className="flex w-28 shrink-0 items-center gap-3">
                            <div
                              className={`h-2.5 w-2.5 rounded-full ${
                                win
                                  ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.45)]"
                                  : "bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.35)]"
                              }`}
                            />

                            <div>
                              <p
                                className={`text-sm font-semibold ${
                                  win
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                }`}
                              >
                                {win ? "Victory" : "Defeat"}
                              </p>

                              <p className="text-xs text-zinc-600">
                                {formatDate(match.start_time)}
                              </p>
                            </div>
                          </div>

                          {/* HERO */}

                          <div className="flex min-w-52 flex-1 items-center gap-3">
                            {heroImage ? (
                              <img
                                src={heroImage}
                                alt={hero?.localized_name ?? "Hero"}
                                className="h-12 w-20 rounded-lg border border-white/10 object-cover object-left"
                                onError={(event) => {
                                  event.currentTarget.style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <div className="flex h-12 w-20 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                                <Swords
                                  size={17}
                                  className="text-zinc-600"
                                />
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="truncate font-medium text-zinc-200 transition group-hover:text-white">
                                {hero?.localized_name ??
                                  `Hero #${match.hero_id}`}
                              </p>

                              <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
                                <Clock size={12} />
                                {formatDuration(match.duration)}
                              </div>
                            </div>
                          </div>

                          {/* KDA */}

                          <div className="min-w-32">
                            <p
                              className={`font-mono text-base font-semibold ${getKdaColor(
                                match,
                              )}`}
                            >
                              {match.kills} / {match.deaths} /{" "}
                              {match.assists}
                            </p>

                            <p className="mt-1 text-xs text-zinc-600">
                              K / D / A
                            </p>
                          </div>

                          {/* STATS */}

                          <div className="grid min-w-64 grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                            <div>
                              <span className="text-zinc-600">
                                GPM
                              </span>

                              <span className="ml-2 text-zinc-300">
                                {match.gold_per_min}
                              </span>
                            </div>

                            <div>
                              <span className="text-zinc-600">
                                XPM
                              </span>

                              <span className="ml-2 text-zinc-300">
                                {match.xp_per_min}
                              </span>
                            </div>

                            <div>
                              <span className="text-zinc-600">
                                LH
                              </span>

                              <span className="ml-2 text-zinc-300">
                                {match.last_hits}
                              </span>
                            </div>

                            <div>
                              <span className="text-zinc-600">
                                DMG
                              </span>

                              <span className="ml-2 text-zinc-300">
                                {Math.round(
                                  match.hero_damage,
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* MATCH */}

                          <div className="flex items-center justify-between gap-3 lg:w-28 lg:justify-end">
                            <span className="font-mono text-xs text-zinc-700 group-hover:text-zinc-500">
                              #{match.match_id}
                            </span>

                            <ChevronRight
                              size={17}
                              className="text-zinc-700 transition group-hover:translate-x-0.5 group-hover:text-zinc-400"
                            />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* PLAYER INFORMATION */}

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[#0d1016] p-6">
                <h2 className="mb-5 text-lg font-semibold">
                  Player Information
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-5 border-b border-white/5 pb-4">
                    <span className="text-sm text-zinc-500">
                      Account ID
                    </span>

                    <span className="font-mono text-sm text-zinc-300">
                      {player.profile.account_id}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-5 border-b border-white/5 pb-4">
                    <span className="text-sm text-zinc-500">
                      Steam ID
                    </span>

                    <span className="truncate font-mono text-sm text-zinc-300">
                      {player.profile.steamid}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-5 border-b border-white/5 pb-4">
                    <span className="text-sm text-zinc-500">
                      Country
                    </span>

                    <span className="text-sm text-zinc-300">
                      {player.profile.loccountrycode ?? "Unknown"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-5">
                    <span className="text-sm text-zinc-500">
                      Last Login
                    </span>

                    <span className="text-sm text-zinc-300">
                      {player.profile.last_login
                        ? new Date(
                            player.profile.last_login,
                          ).toLocaleDateString()
                        : "Unknown"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0d1016] p-6">
                <h2 className="mb-5 text-lg font-semibold">
                  Previous Names
                </h2>

                {player.aliases &&
                player.aliases.length > 0 ? (
                  <div className="space-y-3">
                    {player.aliases.map((alias, index) => (
                      <div
                        key={`${alias.personaname}-${index}`}
                        className="flex items-center justify-between gap-4 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3"
                      >
                        <span className="truncate text-sm text-zinc-300">
                          {alias.personaname}
                        </span>

                        <span className="shrink-0 text-xs text-zinc-600">
                          {new Date(
                            alias.name_since,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-600">
                    No previous names found.
                  </p>
                )}
              </div>
            </section>

            {/* FOOTER */}

            <div className="mt-6 flex items-center justify-between text-xs text-zinc-700">
              <span>Data provided by OpenDota</span>

              <span>DOTA INSIGHT</span>
            </div>
          </>
        )}
      </div>
    </main>
  );
}