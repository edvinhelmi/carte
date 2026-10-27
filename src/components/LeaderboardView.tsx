import React, { useState, useMemo } from 'react';
import { Trophy, Flame, Users, User, Swords } from 'lucide-react';
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

  // H2H state
  const [h2hTeam1, setH2hTeam1] = useState<string>(teams[0]?.id || '');
  const [h2hTeam2, setH2hTeam2] = useState<string>(teams[1]?.id || '');

  const teamStats = useMemo(
    () => calculateTeamStats(teams, matches, players, tournamentSessions),
    [teams, matches, players, tournamentSessions]
  );
  const playerStats = useMemo(
    () => calculatePlayerStats(players, teams, matches, tournamentSessions),
    [players, teams, matches, tournamentSessions]
  );

  const h2hStats = useMemo(() => {
    if (!h2hTeam1 || !h2hTeam2 || h2hTeam1 === h2hTeam2) return null;
    return calculateHeadToHead(h2hTeam1, h2hTeam2, teams, matches, tournamentSessions);
  }, [h2hTeam1, h2hTeam2, teams, matches, tournamentSessions]);

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 text-zinc-950 font-black text-xs flex items-center justify-center shadow-md shadow-yellow-500/20">
            1°
          </div>
        );
      case 1:
        return (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-300 to-slate-400 text-zinc-950 font-black text-xs flex items-center justify-center shadow-md shadow-zinc-400/20">
            2°
          </div>
        );
      case 2:
        return (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 text-amber-200 font-black text-xs flex items-center justify-center shadow-md shadow-amber-800/20">
            3°
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 font-bold text-xs flex items-center justify-center">
            {index + 1}°
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Intestazione */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>Classifiche &amp; Statistiche</span>
          </h1>
          <p className="text-sm text-zinc-400">
            Monitora chi domina il tavolo da gioco, le percentuali di vittoria e le sfide dirette.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'teams'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Squadre</span>
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'players'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Giocatori</span>
          </button>
          <button
            onClick={() => setActiveTab('h2h')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'h2h'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Testa a Testa</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CLASSIFICA SQUADRE */}
      {activeTab === 'teams' && (
        <div className="space-y-4">
          {teamStats.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/60 rounded-2xl border border-zinc-800 text-zinc-400">
              Nessuna squadra trovata.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {teamStats.map((stat, idx) => {
                const isLeader = idx === 0 && stat.wins > 0;
                return (
                  <div
                    key={stat.team.id}
                    className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all ${
                      isLeader
                        ? 'bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Posizione + Nome Squadra + Giocatori */}
                      <div className="flex items-center gap-3.5">
                        {getRankBadge(idx)}

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-zinc-100">{stat.team.name}</h3>
                            {stat.streak >= 2 && (
                              <span className="flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                                <Flame className="w-3 h-3 fill-red-400" />
                                {stat.streak} in fila
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {stat.players.map((p) => p.name).join(' & ') || 'Nessun giocatore assegnato'}
                          </p>
                        </div>
                      </div>

                      {/* Statistiche Metriche */}
                      <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-800/80">
                        {/* Win Rate */}
                        <div className="text-center sm:text-right">
                          <span className="text-xs text-zinc-400 uppercase tracking-wider block">
                            Win Rate
                          </span>
                          <span className="text-lg font-black text-amber-400">
                            {stat.winRate}%
                          </span>
                        </div>

                        {/* Vittorie / Sconfitte */}
                        <div className="text-center sm:text-right">
                          <span className="text-xs text-zinc-400 uppercase tracking-wider block">
                            V / S
                          </span>
                          <span className="text-base font-bold text-zinc-200">
                            <span className="text-emerald-400">{stat.wins}</span>
                            <span className="text-zinc-600 mx-1">/</span>
                            <span className="text-red-400">{stat.losses}</span>
                          </span>
                        </div>

                        {/* Partite Totali */}
                        <div className="text-center sm:text-right min-w-[70px]">
                          <span className="text-xs text-zinc-400 uppercase tracking-wider block">
                            Totali
                          </span>
                          <span className="text-base font-bold text-zinc-300">
                            {stat.matchesPlayed}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Barra grafica di Win Rate */}
                    <div className="mt-3.5 w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-emerald-400 h-1.5 rounded-full transition-all duration-500"
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {playerStats.map((pStat, idx) => (
              <div
                key={pStat.player.id}
                className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-4 hover:border-zinc-700 transition-colors relative"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getRankBadge(idx)}
                    <SuitIcon suit={pStat.player.avatarSuit} className="w-4 h-4 text-amber-400" />
                  </div>
                  {pStat.streak >= 2 && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                      <Flame className="w-2.5 h-2.5 fill-red-400" />
                      {pStat.streak}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base text-zinc-100">{pStat.player.name}</h3>
                {pStat.player.nickname && (
                  <p className="text-xs text-zinc-400 italic mb-3">&quot;{pStat.player.nickname}&quot;</p>
                )}

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80 text-center">
                  <div>
                    <span className="text-[10px] uppercase text-zinc-500 block">Vittorie</span>
                    <span className="text-sm font-bold text-emerald-400">{pStat.wins}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-zinc-500 block">Sconfitte</span>
                    <span className="text-sm font-bold text-red-400">{pStat.losses}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-zinc-500 block">Win Rate</span>
                    <span className="text-sm font-bold text-amber-400">{pStat.winRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TESTA A TESTA (H2H) */}
      {activeTab === 'h2h' && (
        <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Swords className="w-5 h-5 text-amber-400" />
                <span>Confronto Diretto tra Squadre</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Seleziona due formazioni per vedere chi è storicamente in vantaggio.
              </p>
            </div>

            {/* Selettori dei 2 team */}
            <div className="flex items-center gap-2">
              <select
                value={h2hTeam1}
                onChange={(e) => setH2hTeam1(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-xs rounded-xl px-3 py-2 text-zinc-200 focus:outline-none"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <span className="text-xs font-bold text-amber-400">VS</span>
              <select
                value={h2hTeam2}
                onChange={(e) => setH2hTeam2(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-xs rounded-xl px-3 py-2 text-zinc-200 focus:outline-none"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id} disabled={t.id === h2hTeam1}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {h2hStats ? (
            <div className="space-y-6">
              {/* Tabellone punteggio H2H */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center text-center bg-zinc-950/60 p-5 rounded-2xl border border-zinc-800/80">
                <div>
                  <h3 className="font-bold text-lg text-zinc-100">{h2hStats.team1.name}</h3>
                  <div className="text-4xl font-black text-amber-400 mt-1">
                    {h2hStats.team1Wins}
                  </div>
                  <span className="text-xs text-zinc-400">vittorie dirette</span>
                </div>

                <div className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
                  <span>Totale: {h2hStats.totalMatches} sfide</span>
                  <div className="w-full bg-zinc-800 h-2 rounded-full mt-2 overflow-hidden flex">
                    <div
                      className="bg-amber-400 h-full"
                      style={{
                        width: `${
                          h2hStats.totalMatches > 0
                            ? (h2hStats.team1Wins / h2hStats.totalMatches) * 100
                            : 50
                        }%`,
                      }}
                    />
                    <div
                      className="bg-emerald-400 h-full"
                      style={{
                        width: `${
                          h2hStats.totalMatches > 0
                            ? (h2hStats.team2Wins / h2hStats.totalMatches) * 100
                            : 50
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-zinc-100">{h2hStats.team2.name}</h3>
                  <div className="text-4xl font-black text-emerald-400 mt-1">
                    {h2hStats.team2Wins}
                  </div>
                  <span className="text-xs text-zinc-400">vittorie dirette</span>
                </div>
              </div>

              {/* Ultime sfide dirette */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                  Ultime Sfide Dirette ({h2hStats.lastMatches.length})
                </h4>
                <div className="space-y-2">
                  {h2hStats.lastMatches.map((m) => {
                    const winner = m.winnerTeamId === h2hStats.team1.id ? h2hStats.team1 : h2hStats.team2;
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 border border-zinc-800 text-xs"
                      >
                        <span className="text-zinc-500">{m.dateKey}</span>
                        <span className="font-semibold text-zinc-200">
                          Vincitore:{' '}
                          <span className="text-amber-400 font-bold">{winner.name}</span>
                        </span>
                        {m.scoreTeam1 !== undefined && m.scoreTeam2 !== undefined && (
                          <span className="font-mono text-zinc-400">
                            {m.scoreTeam1} - {m.scoreTeam2}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-400 text-sm">
              Seleziona due squadre distinte per visualizzare lo scontro diretto.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
