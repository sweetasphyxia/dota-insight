"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Trophy,
  UserRound,
  Clock,
  Swords,
  Skull,
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

function getKdaColor(match: Match) {
  const kda =
    (match.kills + match.assists) / Math.max(match.deaths, 1);

  if (kda >= 4) return "text-emerald-400";
  if (kda >= 2) return "text-yellow-400";

  return "text-red-400";
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

  const heroMap = new Map(
    heroes.map((hero) => [hero.id, hero.localized_name]),
  );

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to search
        </Link>

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-[#0d1016] p-10 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />

            <p className="text-sm text-zinc-500">
              Loading player profile...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center">
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
            {/* PLAYER HEADER */}

            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d1016]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.07),transparent_40%)]" />

              <div className="relative flex flex-col gap-8 p-8 md:flex-row md:items-center">
                <img
                  src={player.profile.avatarfull}
                  alt={player.profile.personaname}
                  className="h-32 w-32 rounded-2xl border border-white/10 object-cover"
                />

                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h1 className="text-4xl font-bold tracking-tight">
                      {player.profile.personaname}
                    </h1>

                    <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-400">
                      #{player.profile.account_id}
                    </span>
                  </div>

                  <p className="mb-5 text-sm text-zinc-500">
                    Dota 2 Player Profile
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href={player.profile.profileurl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
                    >
                      Steam Profile
                      <ExternalLink size={14} />
                    </a>

                    <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-400">
                      <UserRound size={15} />
                      Steam ID: {player.profile.steamid}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* MAIN STATS */}

            <section className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#0d1016] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-zinc-500">
                    MMR
                  </span>

                  <Trophy
                    size={18}
                    className="text-zinc-500"
                  />
                </div>

                <p className="text-3xl font-bold">
                  {player.computed_mmr
                    ? Math.round(
                        player.computed_mmr,
                      ).toLocaleString()
                    : "—"}
                </p>

                <p className="mt-2 text-sm text-zinc-600">
                  Current estimated rating
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0d1016] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-zinc-500">
                    Rank
                  </span>

                  <Trophy
                    size={18}
                    className="text-zinc-500"
                  />
                </div>

                <p className="text-3xl font-bold">
                  {getRankName(player.rank_tier)}
                </p>

                <p className="mt-2 text-sm text-zinc-600">
                  Ranked tier
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0d1016] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-zinc-500">
                    Leaderboard
                  </span>

                  <Trophy
                    size={18}
                    className="text-zinc-500"
                  />
                </div>

                <p className="text-3xl font-bold">
                  {player.leaderboard_rank
                    ? `#${player.leaderboard_rank.toLocaleString()}`
                    : "—"}
                </p>

                <p className="mt-2 text-sm text-zinc-600">
                  Global ranking
                </p>
              </div>
            </section>

            {/* PLAYER INFORMATION */}

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[#0d1016] p-6">
                <h2 className="mb-5 text-lg font-semibold">
                  Player Information
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <span className="text-sm text-zinc-500">
                      Account ID
                    </span>

                    <span className="font-mono text-sm text-zinc-300">
                      {player.profile.account_id}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <span className="text-sm text-zinc-500">
                      Steam ID
                    </span>

                    <span className="font-mono text-sm text-zinc-300">
                      {player.profile.steamid}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <span className="text-sm text-zinc-500">
                      Country
                    </span>

                    <span className="text-sm text-zinc-300">
                      {player.profile.loccountrycode ?? "Unknown"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
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

              {/* PREVIOUS NAMES */}

              <div className="rounded-2xl border border-white/10 bg-[#0d1016] p-6">
                <h2 className="mb-5 text-lg font-semibold">
                  Previous Names
                </h2>

                {player.aliases &&
                player.aliases.length > 0 ? (
                  <div className="space-y-3">
                    {player.aliases.map(
                      (alias, index) => (
                        <div
                          key={`${alias.personaname}-${index}`}
                          className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3"
                        >
                          <span className="text-sm text-zinc-300">
                            {alias.personaname}
                          </span>

                          <span className="text-xs text-zinc-600">
                            {new Date(
                              alias.name_since,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-600">
                    No previous names found.
                  </p>
                )}
              </div>
            </section>

            {/* MATCH HISTORY */}

            <section className="mt-6 rounded-2xl border border-white/10 bg-[#0d1016]">
              <div className="flex flex-col gap-2 border-b border-white/10 p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    Recent Matches
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Latest games played by this player
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-600">
                  <Swords size={14} />
                  {matches.length} matches
                </div>
              </div>

              {matchesLoading ? (
                <div className="p-8 text-center text-sm text-zinc-600">
                  Loading matches...
                </div>
              ) : matches.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-600">
                  No recent matches found.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {matches.slice(0, 20).map((match) => {
                    const win = isWin(match);
                    const heroName =
                      heroMap.get(match.hero_id) ??
                      `Hero #${match.hero_id}`;

                    return (
                      <Link
                        key={match.match_id}
                        href={`/match/${match.match_id}`}
                        className="group block transition hover:bg-white/[0.025]"
                      >
                        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center">
                          {/* RESULT */}

                          <div className="flex w-24 shrink-0 items-center gap-3">
                            <div
                              className={`h-2.5 w-2.5 rounded-full ${
                                win
                                  ? "bg-emerald-400"
                                  : "bg-red-400"
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
                                {formatDate(
                                  match.start_time,
                                )}
                              </p>
                            </div>
                          </div>

                          {/* HERO */}

                          <div className="flex min-w-44 flex-1 items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                              <Swords
                                size={17}
                                className="text-zinc-500"
                              />
                            </div>

                            <div>
                              <p className="font-medium text-zinc-200 transition group-hover:text-white">
                                {heroName}
                              </p>

                              <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
                                <Clock size={12} />
                                {formatDuration(
                                  match.duration,
                                )}
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
                              {match.kills} /{" "}
                              {match.deaths} /{" "}
                              {match.assists}
                            </p>

                            <p className="mt-1 text-xs text-zinc-600">
                              K / D / A
                            </p>
                          </div>

                          {/* FARM */}

                          <div className="grid min-w-48 grid-cols-2 gap-x-6 gap-y-2 text-xs">
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
                                {match.hero_damage.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* ARROW */}

                          <div className="hidden text-zinc-700 transition group-hover:text-zinc-400 lg:block">
                            →
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* FOOTER INFO */}

            <div className="mt-6 flex items-center justify-between text-xs text-zinc-700">
              <span>
                Data provided by OpenDota
              </span>

              <span>
                DOTA INSIGHT
              </span>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
