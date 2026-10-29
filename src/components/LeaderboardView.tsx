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
  const [h2hTeam1, setH2hTeam1] = useState<string>('');
  const [h2hTeam2, setH2hTeam2] = useState<string>('');

  const teamStats = useMemo(
    () => calculateTeamStats(teams, matches, players, tournamentSessions),
    [teams, matches, players, tournamentSessions]
  );
  const playerStats = useMemo(
    () => calculatePlayerStats(players, teams, matches, tournamentSessions),
    [players, teams, matches, tournamentSessions]
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
    return calculateHeadToHead(effectiveTeam1Id, effectiveTeam2Id, availableTeams, matches, tournamentSessions);
  }, [effectiveTeam1Id, effectiveTeam2Id, availableTeams, matches, tournamentSessions]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-[var(--accent)]" />
            <span>Classifiche &amp; Statistiche</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Rendimento delle squadre, vittorie dei singoli e scontri diretti al tavolo.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-xl border border-[var(--divider)] w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('teams')}
            className={`touch-target flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold btn-tactile cursor-pointer whitespace-nowrap min-h-[44px] ${
              activeTab === 'teams'
                ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Squadre</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('players')}
            className={`touch-target flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold btn-tactile cursor-pointer whitespace-nowrap min-h-[44px] ${
              activeTab === 'players'
                ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Giocatori</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('h2h')}
            className={`touch-target flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold btn-tactile cursor-pointer whitespace-nowrap min-h-[44px] ${
              activeTab === 'h2h'
                ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)]'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Testa a Testa</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CLASSIFICA SQUADRE */}
      {activeTab === 'teams' && (
        <div className="space-y-3">
          {teamStats.length === 0 ? (
            <div className="text-center py-12 bg-[var(--surface)] rounded-2xl border border-[var(--divider)] text-[var(--text-muted)] text-xs">
              Nessuna squadra registrata al momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {teamStats.map((stat, idx) => {
                const isLeader = idx === 0 && stat.wins > 0;
                return (
                  <div
                    key={stat.team?.id || `team-stat-${idx}`}
                    className={`rounded-2xl p-5 border interactive-card ${
                      isLeader
                        ? 'bg-[var(--surface)] border-[var(--accent)] shadow-md shadow-amber-500/10 ring-1 ring-[var(--accent)]/30'
                        : 'bg-[var(--surface)] border-[var(--divider)] hover:border-[var(--control-border)]'
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
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono tabular-nums">
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
                      <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-[var(--divider)]">
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
                    <div className="mt-3.5 w-full bg-[var(--surface-alt)] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[var(--accent)] h-1.5 rounded-full transition-[width] duration-500 ease-out"
                        style={{ width: `${stat.winRate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLASSIFICA GIOCATORI SINGOLI */}
      {activeTab === 'players' && (
        <div className="space-y-3">
          {playerStats.length === 0 ? (
            <div className="text-center py-12 bg-[var(--surface)] rounded-2xl border border-[var(--divider)] text-[var(--text-muted)] text-xs">
              Nessun giocatore registrato al momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {playerStats.map((pStat, idx) => {
                const isLeader = idx === 0 && pStat.wins > 0;
                return (
                  <div
                    key={pStat.player.id}
                    className={`rounded-2xl p-5 border interactive-card ${
                      isLeader
                        ? 'bg-[var(--surface)] border-[var(--accent)] shadow-md shadow-amber-500/10 ring-1 ring-[var(--accent)]/30'
                        : 'bg-[var(--surface)] border-[var(--divider)] hover:border-[var(--control-border)]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Posizione + Seme Avatar + Nome Giocatore + Nickname */}
                      <div className="flex items-center gap-3.5">
                        {getRankBadge(idx)}

                        <div className="w-10 h-10 rounded-xl bg-[var(--surface-alt)] border border-[var(--control-border)] flex items-center justify-center shrink-0 shadow-sm">
                          <SuitIcon suit={pStat.player.avatarSuit} className="w-5 h-5 text-[var(--accent)]" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-heading font-bold text-base text-[var(--text)]">
                              {pStat.player.name}
                            </h3>
                            {pStat.streak >= 2 && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono tabular-nums">
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

                      {/* Statistiche Metriche Tabulari (Coerenti con Squadre) */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-[var(--divider)]">
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
                    <div className="mt-3.5 w-full bg-[var(--surface-alt)] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[var(--accent)] h-1.5 rounded-full transition-[width] duration-500 ease-out"
                        style={{ width: `${pStat.winRate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TESTA A TESTA (H2H) */}
      {activeTab === 'h2h' && (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--divider)] p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--divider)]">
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
