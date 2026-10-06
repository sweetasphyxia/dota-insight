"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Clock3,
  ExternalLink,
  Flame,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import Navbar from "@/components/navbar/Navbar";

type Hero = {
  id: number;
  name: string;
  localized_name: string;
};

type MatchPlayer = {
  account_id?: number | null;
  player_slot: number;
  personaname?: string | null;
  name?: string | null;
  hero_id: number;
  kills: number;
  deaths: number;
  assists: number;
  gold_per_min: number;
  xp_per_min: number;
  last_hits: number;
  denies?: number;
  hero_damage: number;
  tower_damage: number;
  hero_healing?: number;
  level: number;
  net_worth: number;
  item_0?: number;
  item_1?: number;
  item_2?: number;
  item_3?: number;
  item_4?: number;
  item_5?: number;
  computed_mmr?: number | null;
};

type MatchData = {
  match_id: number;
  radiant_win: boolean;
  duration: number;
  start_time: number;
  game_mode: number;
  lobby_type: number;
  radiant_score: number;
  dire_score: number;
  first_blood_time?: number | null;
  patch?: number | null;
  region?: number | null;
  replay_url?: string | null;
  players: MatchPlayer[];
};

const HERO_CDN =
  "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/";

function heroImage(hero?: Hero) {
  if (!hero) return null;
  return `${HERO_CDN}${hero.name.replace("npc_dota_hero_", "")}.png`;
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getKda(player: MatchPlayer) {
  return (player.kills + player.assists) / Math.max(player.deaths, 1);
}

function getKdaColor(player: MatchPlayer) {
  const kda = getKda(player);
  if (kda >= 4) return "text-emerald-400";
  if (kda >= 2) return "text-yellow-400";
  return "text-red-400";
}

function getGameMode(mode?: number) {
  const modes: Record<number, string> = {
    1: "All Pick",
    2: "Captains Mode",
    3: "Random Draft",
    4: "Single Draft",
    5: "All Random",
    22: "Ranked All Pick",
    23: "Turbo",
  };

  return modes[mode ?? -1] ?? `Mode ${mode ?? "—"}`;
}

function getLobbyType(lobby?: number) {
  const lobbies: Record<number, string> = {
    0: "Normal",
    1: "Practice",
    2: "Tournament",
    4: "Ranked",
    7: "Ranked",
  };

  return lobbies[lobby ?? -1] ?? "Unknown lobby";
}

function getPlayerName(player: MatchPlayer) {
  return player.personaname || player.name || `Player ${player.account_id ?? ""}`;
}

function PlayerRow({
  player,
  hero,
  won,
}: {
  player: MatchPlayer;
  hero?: Hero;
  won: boolean;
}) {
  const image = heroImage(hero);

  return (
    <Link
      href={player.account_id ? `/player/${player.account_id}` : "#"}
      className="group grid grid-cols-[minmax(180px,1.5fr)_repeat(4,minmax(70px,0.5fr))] items-center gap-3 border-b border-white/5 px-4 py-3 transition hover:bg-white/[0.025] sm:px-5"
    >
      <div className="flex min-w-0 items-center gap-3">
        {image ? (
          <img
            src={image}
            alt={hero?.localized_name ?? "Hero"}
            className="h-10 w-16 shrink-0 rounded-lg border border-white/10 object-cover object-left"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="h-10 w-16 shrink-0 rounded-lg border border-white/10 bg-white/5" />
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-200 group-hover:text-white">
            {getPlayerName(player)}
          </p>
          <p className="mt-1 truncate text-xs text-zinc-600">
            {hero?.localized_name ?? `Hero #${player.hero_id}`}
          </p>
        </div>
      </div>

      <div className={`text-center font-mono text-sm font-semibold ${won ? "text-emerald-300" : "text-zinc-300"}`}>
        {player.kills}/{player.deaths}/{player.assists}
      </div>

      <div className={`text-center font-mono text-sm font-semibold ${getKdaColor(player)}`}>
        {getKda(player).toFixed(2)}
      </div>

      <div className="text-center text-sm text-zinc-300">
        {player.gold_per_min}
      </div>

      <div className="text-center text-sm text-zinc-300">
        {player.net_worth.toLocaleString()}
      </div>
    </Link>
  );
}

export default function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [match, setMatch] = useState<MatchData | null>(null);
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { id } = await params;

        const [matchResponse, heroesResponse] = await Promise.all([
          fetch(`/api/matches/${id}`, { cache: "no-store" }),
          fetch("/api/heroes", { cache: "no-store" }),
        ]);

        if (!matchResponse.ok) {
          throw new Error("Match not found");
        }

        const matchData = await matchResponse.json();
        const heroesData = heroesResponse.ok ? await heroesResponse.json() : [];

        setMatch(matchData);
        setHeroes(Array.isArray(heroesData) ? heroesData : []);
      } catch {
        setError("Не удалось загрузить матч");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params]);

  const heroMap = useMemo(
    () => new Map(heroes.map((hero) => [hero.id, hero])),
    [heroes],
  );

  const radiantPlayers = useMemo(
    () => match?.players.filter((player) => player.player_slot < 128) ?? [],
    [match],
  );

  const direPlayers = useMemo(
    () => match?.players.filter((player) => player.player_slot >= 128) ?? [],
    [match],
  );

  const teamStats = useMemo(() => {
    const radiantGold = radiantPlayers.reduce(
      (sum, player) => sum + player.net_worth,
      0,
    );
    const direGold = direPlayers.reduce(
      (sum, player) => sum + player.net_worth,
      0,
    );
    const radiantDamage = radiantPlayers.reduce(
      (sum, player) => sum + player.hero_damage,
      0,
    );
    const direDamage = direPlayers.reduce(
      (sum, player) => sum + player.hero_damage,
      0,
    );
    const radiantXpm = radiantPlayers.reduce(
      (sum, player) => sum + player.xp_per_min,
      0,
    );
    const direXpm = direPlayers.reduce(
      (sum, player) => sum + player.xp_per_min,
      0,
    );

    return {
      radiantGold,
      direGold,
      radiantDamage,
      direDamage,
      radiantXpm,
      direXpm,
    };
  }, [radiantPlayers, direPlayers]);

  const topPlayer = useMemo(() => {
    if (!match?.players.length) return null;

    return [...match.players].sort(
      (a, b) => getKda(b) - getKda(a),
    )[0];
  }, [match]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07090d] text-white">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
          <p className="mt-4 text-sm text-zinc-500">Loading match...</p>
        </div>
      </main>
    );
  }

  if (error || !match) {
    return (
      <main className="min-h-screen bg-[#07090d] text-white">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <p className="text-red-400">{error || "Match not found"}</p>
          <Link
            href="/"
            className="mt-5 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
          >
            Back to search
          </Link>
        </div>
      </main>
    );
  }

  const winnerName = match.radiant_win ? "Radiant Victory" : "Dire Victory";
  const winnerClass = match.radiant_win
    ? "text-emerald-400"
    : "text-red-400";

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

        {/* MATCH HERO */}
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d1016]">
          <div className="relative px-6 py-8 sm:px-8 sm:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.07),transparent_45%)]" />

            <div className="relative text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-600">
                Match #{match.match_id}
              </p>

              <h1 className={`mt-3 text-2xl font-black sm:text-4xl ${winnerClass}`}>
                {winnerName}
              </h1>

              <div className="mt-4 flex items-center justify-center gap-5">
                <span className="text-4xl font-black sm:text-6xl">
                  {match.radiant_score}
                </span>
                <span className="text-xl text-zinc-700">—</span>
                <span className="text-4xl font-black sm:text-6xl">
                  {match.dire_score}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-2">
                  <Clock3 size={14} />
                  {formatDuration(match.duration)}
                </span>
                <span>{formatDate(match.start_time)}</span>
                <span>{getGameMode(match.game_mode)}</span>
                <span>{getLobbyType(match.lobby_type)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-white/10 sm:grid-cols-4">
            <div className="border-r border-white/10 p-5 text-center">
              <p className="text-xs uppercase tracking-widest text-zinc-600">
                First Blood
              </p>
              <p className="mt-2 font-semibold">
                {match.first_blood_time != null
                  ? formatDuration(match.first_blood_time)
                  : "—"}
              </p>
            </div>

            <div className="border-r border-white/10 p-5 text-center">
              <p className="text-xs uppercase tracking-widest text-zinc-600">
                Patch
              </p>
              <p className="mt-2 font-semibold">{match.patch ?? "—"}</p>
            </div>

            <div className="border-r border-white/10 p-5 text-center">
              <p className="text-xs uppercase tracking-widest text-zinc-600">
                Region
              </p>
              <p className="mt-2 font-semibold">{match.region ?? "—"}</p>
            </div>

            <div className="p-5 text-center">
              <p className="text-xs uppercase tracking-widest text-zinc-600">
                Players
              </p>
              <p className="mt-2 font-semibold">{match.players.length}/10</p>
            </div>
          </div>
        </section>

        {/* TOP PERFORMANCE */}
        {topPlayer && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-[#0d1016] p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-amber-400/10 p-3">
                  <Trophy size={21} className="text-amber-400" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-zinc-600">
                    Top Performance
                  </p>
                  <Link
                    href={
                      topPlayer.account_id
                        ? `/player/${topPlayer.account_id}`
                        : "#"
                    }
                    className="mt-1 block text-lg font-bold transition hover:text-zinc-300"
                  >
                    {getPlayerName(topPlayer)}
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 text-center sm:text-right">
                <div>
                  <p className="text-xs text-zinc-600">KDA</p>
                  <p className={`mt-1 font-mono font-bold ${getKdaColor(topPlayer)}`}>
                    {getKda(topPlayer).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600">GPM</p>
                  <p className="mt-1 font-mono font-bold">{topPlayer.gold_per_min}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600">Damage</p>
                  <p className="mt-1 font-mono font-bold">
                    {topPlayer.hero_damage.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TEAM COMPARISON */}
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 size={17} className="text-zinc-500" />
            <h2 className="font-semibold">Team Comparison</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {[
              {
                label: "Net Worth",
                left: teamStats.radiantGold,
                right: teamStats.direGold,
              },
              {
                label: "Hero Damage",
                left: teamStats.radiantDamage,
                right: teamStats.direDamage,
              },
              {
                label: "Total XPM",
                left: teamStats.radiantXpm,
                right: teamStats.direXpm,
              },
            ].map((stat) => {
              const total = stat.left + stat.right || 1;
              const leftPercent = (stat.left / total) * 100;

              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-[#0d1016] p-5"
                >
                  <p className="text-center text-xs uppercase tracking-widest text-zinc-600">
                    {stat.label}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-emerald-400">
                      {stat.left.toLocaleString()}
                    </span>
                    <span className="text-red-400">
                      {stat.right.toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-red-500/30">
                    <div
                      className="bg-emerald-400 transition-all"
                      style={{ width: `${leftPercent}%` }}
                    />
                  </div>

                  <div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-zinc-700">
                    <span>Radiant</span>
                    <span>Dire</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* PLAYER TABLES */}
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Users size={17} className="text-zinc-500" />
            <h2 className="font-semibold">Player Performance</h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1016]">
            <div className="grid grid-cols-[minmax(180px,1.5fr)_repeat(4,minmax(70px,0.5fr))] gap-3 border-b border-white/10 px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-600 sm:px-5">
              <span>Player</span>
              <span className="text-center">K/D/A</span>
              <span className="text-center">KDA</span>
              <span className="text-center">GPM</span>
              <span className="text-center">Net Worth</span>
            </div>

            <div className="border-b border-white/10">
              <div className="flex items-center gap-2 px-5 py-4">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Radiant
                </span>
                {match.radiant_win && (
                  <span className="text-xs text-zinc-600">Victory</span>
                )}
              </div>

              {radiantPlayers.map((player) => (
                <PlayerRow
                  key={`${player.account_id ?? "unknown"}-${player.hero_id}`}
                  player={player}
                  hero={heroMap.get(player.hero_id)}
                  won={match.radiant_win}
                />
              ))}
            </div>

            <div>
              <div className="flex items-center gap-2 px-5 py-4">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-red-400">
                  Dire
                </span>
                {!match.radiant_win && (
                  <span className="text-xs text-zinc-600">Victory</span>
                )}
              </div>

              {direPlayers.map((player) => (
                <PlayerRow
                  key={`${player.account_id ?? "unknown"}-${player.hero_id}`}
                  player={player}
                  hero={heroMap.get(player.hero_id)}
                  won={!match.radiant_win}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ACTIONS */}
        <section className="mt-6 flex flex-wrap gap-3">
          {match.replay_url && (
            <a
              href={match.replay_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              Open Replay
              <ExternalLink size={14} />
            </a>
          )}

          <a
            href={`https://www.opendota.com/matches/${match.match_id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            OpenDota
            <ExternalLink size={14} />
          </a>
        </section>

        <div className="mt-8 flex items-center justify-between text-xs text-zinc-700">
          <span className="inline-flex items-center gap-2">
            <Flame size={13} />
            DOTA INSIGHT Match Analyzer
          </span>
          <span>Data provided by OpenDota</span>
        </div>
      </div>
    </main>
  );
}
