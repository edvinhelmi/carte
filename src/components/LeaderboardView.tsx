import React, { useState, useMemo } from 'react';
import { Trophy, Flame, Users, User, Swords, ChevronDown } from 'lucide-react';
import { Team, Player, Match, TournamentSession } from '@/types/game';
import { calculateTeamStats, calculatePlayerStats, calculateHeadToHead } from '@/lib/stats';
import { SuitIcon } from './SuitIcon';

interface LeaderboardViewProps {
  teams: Team[];
  players: Player[];
  matches: Match[];
  tournamentSessions?: TournamentSession[];
}

export function LeaderboardView({
  teams,
  players,
  matches,
  tournamentSessions = [],
}: LeaderboardViewProps) {
  const [activeTab, setActiveTab] = useState<'teams' | 'players' | 'h2h'>('teams');
  const [gameFilter, setGameFilter] = useState<import('@/types/game').GameType | 'all'>('all');
  const [h2hTeam1, setH2hTeam1] = useState<string>('');
  const [h2hTeam2, setH2hTeam2] = useState<string>('');

  const teamStats = useMemo(
    () => calculateTeamStats(teams, matches, players, tournamentSessions, gameFilter),
    [teams, matches, players, tournamentSessions, gameFilter]
  );
  const playerStats = useMemo(
    () => calculatePlayerStats(players, teams, matches, tournamentSessions, gameFilter),
    [players, teams, matches, tournamentSessions, gameFilter]
  );

  // Includi tutti i team (sia preset che generati da tornei 1v1 o 1vs1vs1) per H2H
  const availableTeams = useMemo(() => {
    return teamStats.map((s) => s.team);
  }, [teamStats]);

  const effectiveTeam1Id = h2hTeam1 || availableTeams[0]?.id || '';
  const effectiveTeam2Id =
    h2hTeam2 && h2hTeam2 !== effectiveTeam1Id
      ? h2hTeam2
      : availableTeams.find((t) => t.id !== effectiveTeam1Id)?.id || '';

  const h2hStats = useMemo(() => {
    if (!effectiveTeam1Id || !effectiveTeam2Id || effectiveTeam1Id === effectiveTeam2Id) return null;
    return calculateHeadToHead(effectiveTeam1Id, effectiveTeam2Id, availableTeams, matches, tournamentSessions, gameFilter);
  }, [effectiveTeam1Id, effectiveTeam2Id, availableTeams, matches, tournamentSessions, gameFilter]);

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="w-7 h-7 rounded-xl bg-[var(--accent)] text-[var(--on-accent)] font-mono font-black text-xs flex items-center justify-center shadow-md shadow-amber-500/25 ring-1 ring-amber-300/60 scale-105">
            1°
          </div>
        );
      case 1:
        return (
          <div className="w-7 h-7 rounded-xl bg-[var(--surface-alt)] text-slate-100 border border-slate-400/30 font-mono font-bold text-xs flex items-center justify-center shadow-sm">
            2°
          </div>
        );
      case 2:
        return (
          <div className="w-7 h-7 rounded-xl bg-[var(--surface-raised)] text-amber-500 border border-amber-700/30 font-mono font-bold text-xs flex items-center justify-center">
            3°
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-xl bg-[var(--surface-raised)] text-[var(--text-subtle)] font-mono text-xs flex items-center justify-center">
            {index + 1}°
          </div>
        );
    }
  };

  return (
    <div className="space-y-6" data-reveal="rise">
      {/* Intestazione */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-[var(--accent)]" />
            <span>Classifiche &amp; Statistiche</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Rendimento delle squadre, vittorie dei singoli e scontri diretti al tavolo.
          </p>
        </div>

        {/* Filtro Gioco & Tab switch */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Selettore Categoria Gioco */}
          <div className="inline-flex p-1 rounded-full bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={() => setGameFilter('all')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-full text-xs font-semibold btn-ios-tactile active:scale-96 cursor-pointer min-h-[40px] sm:min-h-0 ${
                gameFilter === 'all'
                  ? 'bg-white/15 text-[var(--text)] font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Tutti
            </button>
            <button
              type="button"
              onClick={() => setGameFilter('briscola')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-full text-xs font-semibold btn-ios-tactile active:scale-96 cursor-pointer min-h-[40px] sm:min-h-0 ${
                gameFilter === 'briscola'
                  ? 'bg-[var(--accent)] text-[var(--on-accent)] font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              🃏 Briscola
            </button>
            <button
              type="button"
              onClick={() => setGameFilter('scopa')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-full text-xs font-semibold btn-ios-tactile active:scale-96 cursor-pointer min-h-[40px] sm:min-h-0 ${
                gameFilter === 'scopa'
                  ? 'bg-[var(--accent)] text-[var(--on-accent)] font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              🎴 Scopa
            </button>
          </div>

          {/* Tab switch */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('teams')}
              className={`touch-target flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold btn-ios-tactile active:scale-96 cursor-pointer whitespace-nowrap min-h-[40px] ${
                activeTab === 'teams'
                  ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Squadre</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('players')}
              className={`touch-target flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold btn-ios-tactile active:scale-96 cursor-pointer whitespace-nowrap min-h-[40px] ${
                activeTab === 'players'
                  ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Giocatori</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('h2h')}
              className={`touch-target flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold btn-ios-tactile active:scale-96 cursor-pointer whitespace-nowrap min-h-[40px] ${
                activeTab === 'h2h'
                  ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Testa a Testa</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: CLASSIFICA SQUADRE */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          {teamStats.length === 0 ? (
            <div className="text-center py-12 glass-ios rounded-[26px] border border-white/10 text-[var(--text-muted)] text-xs">
              Nessuna squadra registrata al momento.
            </div>
          ) : (
            <>
              {/* PODIO 3D STYLE APPLE SPORTS / FITNESS */}
              {teamStats.length >= 2 && (
                <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-4 pb-2 max-w-2xl mx-auto animate-fade-in">
                  {/* 2° Posto - Argento */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-800/80 border border-slate-400/40 flex items-center justify-center mb-2 shadow-lg">
                      <span className="text-xl sm:text-2xl font-black font-mono text-slate-200">2</span>
                    </div>
                    <div className="w-full glass-ios rounded-t-[22px] border-t border-x border-slate-400/30 p-3 sm:p-4 text-center h-32 sm:h-36 flex flex-col justify-between">
                      <div className="truncate">
                        <p className="font-heading font-extrabold text-xs sm:text-sm text-[var(--text)] truncate">{teamStats[1]?.team?.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono">{teamStats[1]?.winRate}% WR</p>
                      </div>
                      <div className="text-xs font-mono font-bold text-slate-300">
                        {teamStats[1]?.wins} V
                      </div>
                    </div>
                  </div>

                  {/* 1° Posto - Oro */}
                  <div className="flex flex-col items-center -mt-4">
                    <div className="relative mb-2">
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <Trophy className="w-5 h-5 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                      </div>
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 border border-amber-300/80 flex items-center justify-center shadow-xl shadow-amber-500/25 ring-2 ring-amber-400/50">
                        <span className="text-2xl sm:text-3xl font-black font-mono text-slate-950">1</span>
                      </div>
                    </div>
                    <div className="w-full glass-ios-raised rounded-t-[26px] border-t border-x border-amber-400/50 p-3 sm:p-4 text-center h-40 sm:h-44 flex flex-col justify-between shadow-2xl shadow-amber-500/10">
                      <div className="truncate">
                        <p className="font-heading font-black text-sm sm:text-base text-amber-300 truncate">{teamStats[0]?.team?.name}</p>
                        <p className="text-[11px] text-amber-200/80 font-mono font-bold">{teamStats[0]?.winRate}% WR</p>
                      </div>
                      <div className="text-xs font-mono font-extrabold text-amber-300">
                        {teamStats[0]?.wins} Vittorie
                      </div>
                    </div>
                  </div>

                  {/* 3° Posto - Bronzo (se presente) */}
                  {teamStats.length >= 3 ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-950/70 border border-amber-700/40 flex items-center justify-center mb-2 shadow-lg">
                        <span className="text-xl sm:text-2xl font-black font-mono text-amber-500">3</span>
                      </div>
                      <div className="w-full glass-ios rounded-t-[22px] border-t border-x border-amber-700/30 p-3 sm:p-4 text-center h-28 sm:h-32 flex flex-col justify-between">
                        <div className="truncate">
                          <p className="font-heading font-extrabold text-xs sm:text-sm text-[var(--text)] truncate">{teamStats[2]?.team?.name}</p>
                          <p className="text-[10px] text-[var(--text-muted)] font-mono">{teamStats[2]?.winRate}% WR</p>
                        </div>
                        <div className="text-xs font-mono font-bold text-amber-600">
                          {teamStats[2]?.wins} V
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 sm:h-32" />
                  )}
                </div>
              )}

              {/* LISTA INSET GROUPED */}
              <div className="glass-ios-raised rounded-[28px] border border-white/10 overflow-hidden divide-y divide-white/5">
                {teamStats.map((stat, idx) => {
                  const isLeader = idx === 0 && stat.wins > 0;
                  return (
                    <div
                      key={stat.team?.id || `team-stat-${idx}`}
                      className={`p-5 sm:p-6 transition-colors hover:bg-white/[0.03] ${
                        isLeader ? 'bg-amber-500/[0.04]' : ''
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Posizione + Nome Squadra + Giocatori */}
                        <div className="flex items-center gap-3.5">
                          {getRankBadge(idx)}

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-heading font-bold text-base text-[var(--text)]">
                                {stat.team?.name || 'Squadra'}
                              </h3>
                              {stat.streak >= 2 && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono tabular-nums">
                                  <Flame className="w-3 h-3 fill-rose-400" />
                                  <span>{stat.streak} di fila</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
                              {stat.players.length === 1 &&
                              stat.players[0]?.name &&
                              stat.team?.name &&
                              stat.team.name.toLowerCase() === stat.players[0].name.toLowerCase()
                                ? stat.players[0].nickname
                                  ? `"${stat.players[0].nickname}"`
                                  : 'Giocatore singolo'
                                : stat.players.length > 0
                                ? stat.players.map((p) => p?.name || 'Giocatore').join(' & ')
                                : 'Partecipante torneo'}
                            </p>
                          </div>
                        </div>

                        {/* Statistiche Metriche Tabulari */}
                        <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                          {/* Win Rate */}
                          <div className="text-center sm:text-right">
                            <span className="text-[11px] text-[var(--text-subtle)] font-medium block">
                              Win Rate
                            </span>
                            <span className="text-base font-extrabold text-[var(--accent-text)] font-mono tabular-nums">
                              {stat.winRate}%
                            </span>
                          </div>

                          {/* Vittorie / Sconfitte */}
                          <div className="text-center sm:text-right">
                            <span className="text-[11px] text-[var(--text-subtle)] font-medium block">
                              V / S
                            </span>
                            <span className="text-sm font-bold font-mono tabular-nums">
                              <span className="text-emerald-400">{stat.wins}</span>
                              <span className="text-[var(--text-subtle)] mx-1">/</span>
                              <span className="text-rose-400">{stat.losses}</span>
                            </span>
                          </div>

                          {/* Partite Totali */}
                          <div className="text-center sm:text-right min-w-[60px]">
                            <span className="text-[11px] text-[var(--text-subtle)] font-medium block">
                              Totali
                            </span>
                            <span className="text-sm font-bold text-[var(--text)] font-mono tabular-nums">
                              {stat.matchesPlayed}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Barra grafica di Win Rate */}
                      <div className="mt-3.5 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[var(--accent)] h-1.5 rounded-full transition-[width] duration-500 ease-out"
                          style={{ width: `${stat.winRate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: CLASSIFICA GIOCATORI SINGOLI */}
      {activeTab === 'players' && (
        <div className="space-y-6">
          {playerStats.length === 0 ? (
            <div className="text-center py-12 glass-ios rounded-[26px] border border-white/10 text-[var(--text-muted)] text-xs">
              Nessun giocatore registrato al momento.
            </div>
          ) : (
            <>
              {/* PODIO 3D GIOCATORI */}
              {playerStats.length >= 2 && (
                <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-4 pb-2 max-w-2xl mx-auto animate-fade-in">
                  {/* 2° Posto - Argento */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-800/80 border border-slate-400/40 flex items-center justify-center mb-2 shadow-lg">
                      <span className="text-xl sm:text-2xl font-black font-mono text-slate-200">2</span>
                    </div>
                    <div className="w-full glass-ios rounded-t-[22px] border-t border-x border-slate-400/30 p-3 sm:p-4 text-center h-32 sm:h-36 flex flex-col justify-between">
                      <div className="truncate">
                        <p className="font-heading font-extrabold text-xs sm:text-sm text-[var(--text)] truncate">{playerStats[1]?.player?.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono">{playerStats[1]?.winRate}% WR</p>
                      </div>
                      <div className="text-xs font-mono font-bold text-slate-300">
                        {playerStats[1]?.wins} V
                      </div>
                    </div>
                  </div>

                  {/* 1° Posto - Oro */}
                  <div className="flex flex-col items-center -mt-4">
                    <div className="relative mb-2">
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <Trophy className="w-5 h-5 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                      </div>
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 border border-amber-300/80 flex items-center justify-center shadow-xl shadow-amber-500/25 ring-2 ring-amber-400/50">
                        <span className="text-2xl sm:text-3xl font-black font-mono text-slate-950">1</span>
                      </div>
                    </div>
                    <div className="w-full glass-ios-raised rounded-t-[26px] border-t border-x border-amber-400/50 p-3 sm:p-4 text-center h-40 sm:h-44 flex flex-col justify-between shadow-2xl shadow-amber-500/10">
                      <div className="truncate">
                        <p className="font-heading font-black text-sm sm:text-base text-amber-300 truncate">{playerStats[0]?.player?.name}</p>
                        <p className="text-[11px] text-amber-200/80 font-mono font-bold">{playerStats[0]?.winRate}% WR</p>
                      </div>
                      <div className="text-xs font-mono font-extrabold text-amber-300">
                        {playerStats[0]?.wins} Vittorie
                      </div>
                    </div>
                  </div>

                  {/* 3° Posto - Bronzo (se presente) */}
                  {playerStats.length >= 3 ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-950/70 border border-amber-700/40 flex items-center justify-center mb-2 shadow-lg">
                        <span className="text-xl sm:text-2xl font-black font-mono text-amber-500">3</span>
                      </div>
                      <div className="w-full glass-ios rounded-t-[22px] border-t border-x border-amber-700/30 p-3 sm:p-4 text-center h-28 sm:h-32 flex flex-col justify-between">
                        <div className="truncate">
                          <p className="font-heading font-extrabold text-xs sm:text-sm text-[var(--text)] truncate">{playerStats[2]?.player?.name}</p>
                          <p className="text-[10px] text-[var(--text-muted)] font-mono">{playerStats[2]?.winRate}% WR</p>
                        </div>
                        <div className="text-xs font-mono font-bold text-amber-600">
                          {playerStats[2]?.wins} V
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 sm:h-32" />
                  )}
                </div>
              )}

              {/* LISTA INSET GROUPED */}
              <div className="glass-ios-raised rounded-[28px] border border-white/10 overflow-hidden divide-y divide-white/5">
                {playerStats.map((pStat, idx) => {
                  const isLeader = idx === 0 && pStat.wins > 0;
                  return (
                    <div
                      key={pStat.player.id}
                      className={`p-5 sm:p-6 transition-colors hover:bg-white/[0.03] ${
                        isLeader ? 'bg-amber-500/[0.04]' : ''
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Posizione + Seme Avatar + Nome Giocatore + Nickname */}
                        <div className="flex items-center gap-3.5">
                          {getRankBadge(idx)}

                          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-sm">
                            <SuitIcon suit={pStat.player.avatarSuit} className="w-5 h-5 text-[var(--accent)]" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-heading font-bold text-base text-[var(--text)]">
                                {pStat.player.name}
                              </h3>
                              {pStat.streak >= 2 && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono tabular-nums">
                                  <Flame className="w-3 h-3 fill-rose-400" />
                                  <span>{pStat.streak} di fila</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
                              {pStat.player.nickname ? `"${pStat.player.nickname}"` : 'Giocatore di casa'}
                            </p>
                          </div>
                        </div>

                        {/* Statistiche Metriche Tabulari */}
                        <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                          {/* Win Rate */}
                          <div className="text-center sm:text-right">
                            <span className="text-[11px] text-[var(--text-subtle)] font-medium block">
                              Win Rate
                            </span>
                            <span className="text-base font-extrabold text-[var(--accent-text)] font-mono tabular-nums">
                              {pStat.winRate}%
                            </span>
                          </div>

                          {/* Vittorie / Sconfitte */}
                          <div className="text-center sm:text-right">
                            <span className="text-[11px] text-[var(--text-subtle)] font-medium block">
                              V / S
                            </span>
                            <span className="text-sm font-bold font-mono tabular-nums">
                              <span className="text-emerald-400">{pStat.wins}</span>
                              <span className="text-[var(--text-subtle)] mx-1">/</span>
                              <span className="text-rose-400">{pStat.losses}</span>
                            </span>
                          </div>

                          {/* Partite Totali */}
                          <div className="text-center sm:text-right min-w-[60px]">
                            <span className="text-[11px] text-[var(--text-subtle)] font-medium block">
                              Totali
                            </span>
                            <span className="text-sm font-bold text-[var(--text)] font-mono tabular-nums">
                              {pStat.matchesPlayed}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Barra grafica di Win Rate */}
                      <div className="mt-3.5 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[var(--accent)] h-1.5 rounded-full transition-[width] duration-500 ease-out"
                          style={{ width: `${pStat.winRate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: TESTA A TESTA (H2H) */}
      {activeTab === 'h2h' && (
        <div className="glass-ios-raised rounded-[28px] border border-white/10 p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div>
              <h2 className="font-heading font-bold text-base text-[var(--text)] flex items-center gap-2">
                <Swords className="w-4 h-4 text-[var(--accent)]" />
                <span>Confronto Diretto Storico</span>
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Seleziona due formazioni per vedere il bilancio delle partite e dei tornei.
              </p>
            </div>

            {/* Selettori dei 2 team */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={effectiveTeam1Id}
                  onChange={(e) => setH2hTeam1(e.target.value)}
                  className="appearance-none bg-[var(--surface-raised)] border border-[var(--control-border)] text-xs rounded-xl pl-3 pr-7 py-2 text-[var(--text)] focus:outline-none cursor-pointer"
                >
                  {availableTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 shrink-0" />
              </div>

              <span className="text-xs font-bold text-[var(--accent)]">VS</span>

              <div className="relative">
                <select
                  value={effectiveTeam2Id}
                  onChange={(e) => setH2hTeam2(e.target.value)}
                  className="appearance-none bg-[var(--surface-raised)] border border-[var(--control-border)] text-xs rounded-xl pl-3 pr-7 py-2 text-[var(--text)] focus:outline-none cursor-pointer"
                >
                  {availableTeams.map((t) => (
                    <option key={t.id} value={t.id} disabled={t.id === effectiveTeam1Id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 shrink-0" />
              </div>
            </div>
          </div>

          {h2hStats ? (
            <div className="space-y-6">
              {/* Tabellone punteggio H2H */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center text-center bg-[var(--surface-raised)] p-5 rounded-xl border border-[var(--control-border)]">
                <div>
                  <h3 className="font-heading font-bold text-base text-[var(--text)]">{h2hStats.team1.name}</h3>
                  <div className="text-4xl font-black text-[var(--text)] font-mono tabular-nums mt-1">
                    {h2hStats.team1Wins}
                  </div>
                  <span className="text-xs text-[var(--text-muted)] font-medium">vittorie</span>
                </div>

                <div className="text-xs text-[var(--text-muted)] font-medium">
                  <span className="font-mono tabular-nums">Totale: {h2hStats.totalMatches} partite</span>
                  <div className="w-full bg-[var(--surface-alt)] h-2 rounded-full mt-2 overflow-hidden flex">
                    <div
                      className="bg-[var(--accent)] h-full transition-[width] duration-300 ease-out"
                      style={{
                        width: `${
                          h2hStats.totalMatches > 0
                            ? (h2hStats.team1Wins / h2hStats.totalMatches) * 100
                            : 0
                        }%`,
                      }}
                    />
                    <div
                      className="bg-sky-400 h-full transition-[width] duration-300 ease-out"
                      style={{
                        width: `${
                          h2hStats.totalMatches > 0
                            ? (h2hStats.team2Wins / h2hStats.totalMatches) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-heading font-bold text-base text-[var(--text)]">{h2hStats.team2.name}</h3>
                  <div className="text-4xl font-black text-sky-400 font-mono tabular-nums mt-1">
                    {h2hStats.team2Wins}
                  </div>
                  <span className="text-xs text-[var(--text-muted)] font-medium">vittorie</span>
                </div>
              </div>

              {/* Ultime sfide dirette */}
              {h2hStats.lastMatches.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-muted)] mb-3">
                    Ultime Sfide Dirette ({h2hStats.lastMatches.length})
                  </h4>
                  <div className="space-y-2">
                    {h2hStats.lastMatches.map((m) => {
                      const winner = m.winnerTeamId === h2hStats.team1.id ? h2hStats.team1 : h2hStats.team2;
                      const winnerName = winner?.name || 'Vincitore';
                      return (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--divider)] text-xs"
                        >
                          <span className="text-[var(--text-subtle)] font-mono tabular-nums">{m.dateKey}</span>
                          <span className="font-medium text-[var(--text)]">
                            Vincitore:{' '}
                            <span className="text-[var(--accent-text)] font-bold">{winnerName}</span>
                          </span>
                          {m.scoreTeam1 !== undefined && m.scoreTeam2 !== undefined && (
                            <span className="font-mono tabular-nums text-[var(--text-muted)]">
                              {m.scoreTeam1} - {m.scoreTeam2}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--text-muted)] text-xs">
              Seleziona due squadre distinte per visualizzare lo storico dello scontro diretto.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
