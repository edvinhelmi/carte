import React, { useMemo } from 'react';
import { Trophy, Flame, Sparkles, Calendar, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { Match, Team, Player } from '@/types/game';
import { calculateTeamStats, getDailySummary } from '@/lib/stats';
import { formatDateKey, StorageService } from '@/lib/storage';
import { SuitIcon } from './SuitIcon';
import { TabType } from './Header';

interface MatchesHomeViewProps {
  matches: Match[];
  teams: Team[];
  players: Player[];
  onOpenQuickMatch: () => void;
  setActiveTab: (tab: TabType) => void;
  onMatchesUpdated: () => void;
}

export function MatchesHomeView({
  matches,
  teams,
  players,
  onOpenQuickMatch,
  setActiveTab,
  onMatchesUpdated,
}: MatchesHomeViewProps) {
  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const teamStats = useMemo(() => calculateTeamStats(teams, matches, players), [teams, matches, players]);

  const todayKey = formatDateKey();
  const todaySummary = useMemo(() => getDailySummary(todayKey, matches, teams), [todayKey, matches, teams]);

  const leaderTeamStat = teamStats[0];

  // Trova la striscia vincente più alta al momento
  const highestStreakStat = useMemo(() => {
    return [...teamStats].sort((a, b) => b.streak - a.streak)[0];
  }, [teamStats]);

  const handleDeleteMatch = (matchId: string) => {
    if (confirm('Vuoi rimuovere questa partita dallo storico?')) {
      StorageService.deleteMatch(matchId);
      onMatchesUpdated();
    }
  };

  return (
    <div className="space-y-6">
      {/* BANNER PRINCIPALE: TAVOLO DA GIOCO RAPIDO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/30 border border-zinc-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Briscola Club • Segnapunti per Casa</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight leading-tight">
            Tieni il conto delle vittorie, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200">
              senza perdere il ritmo del gioco.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 mt-2.5 max-w-xl leading-relaxed">
            Un tocco per segnare chi ha vinto la mano, resoconti divisi per serata sul calendario e statistiche testa a testa sempre aggiornate.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={onOpenQuickMatch}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-95 text-zinc-950 font-bold text-sm shadow-xl shadow-amber-500/25 transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Registra Nuova Vittoria</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 font-semibold text-sm border border-zinc-700 transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Vedi Calendario</span>
            </button>
          </div>
        </div>

        {/* Decorazione di sfondo con semi delle carte */}
        <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none select-none hidden sm:block">
          <div className="flex gap-4">
            <SuitIcon suit="coppe" className="w-44 h-44 text-amber-400" />
            <SuitIcon suit="denari" className="w-44 h-44 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* 4 STAT CARDS IN EVIDENZA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Partite Totali */}
        <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-4 sm:p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Partite Totali</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-zinc-100">{matches.length}</div>
          <span className="text-[11px] text-zinc-400 mt-1 block">Registrate finora</span>
        </div>

        {/* Card 2: Squadra in Testa */}
        <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-4 sm:p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">In Testa</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base sm:text-lg font-bold text-zinc-100 truncate">
            {leaderTeamStat ? leaderTeamStat.team.name : 'Nessuna'}
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">
            {leaderTeamStat ? `${leaderTeamStat.wins} vittorie (${leaderTeamStat.winRate}%)` : '-'}
          </span>
        </div>

        {/* Card 3: Partite Oggi */}
        <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-4 sm:p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Oggi</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-zinc-100">
            {todaySummary.totalMatches}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block truncate">
            {todaySummary.championTeam
              ? `👑 ${todaySummary.championTeam.name}`
              : 'Nessuna ancora oggi'}
          </span>
        </div>

        {/* Card 4: Striscia Vincente Attiva */}
        <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-4 sm:p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Miglior Streak</span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-zinc-100">
            {highestStreakStat && highestStreakStat.streak > 0
              ? `${highestStreakStat.streak} 🔥`
              : '0'}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block truncate">
            {highestStreakStat && highestStreakStat.streak > 0
              ? highestStreakStat.team.name
              : 'Nessuna striscia'}
          </span>
        </div>
      </div>

      {/* SEZIONE: ULTIME PARTITE REGISTRATE */}
      <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-100">Ultime Partite Giocate</h2>
            <p className="text-xs text-zinc-400">Le sfide più recenti disputate al tavolo da gioco</p>
          </div>

          <button
            onClick={() => setActiveTab('calendar')}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
          >
            <span>Tutte sul Calendario</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <p className="text-sm text-zinc-400">Nessuna partita registrata finora.</p>
            <button
              onClick={onOpenQuickMatch}
              className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs cursor-pointer"
            >
              Registra la prima partita!
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {matches.slice(0, 8).map((m) => {
              const t1 = teamMap.get(m.team1Id);
              const t2 = teamMap.get(m.team2Id);
              const isT1Winner = m.winnerTeamId === m.team1Id;
              const isT2Winner = m.winnerTeamId === m.team2Id;

              const dateFormatted = new Date(m.timestamp).toLocaleDateString('it-IT', {
                day: 'numeric',
                month: 'short',
              });

              const timeFormatted = new Date(m.timestamp).toLocaleTimeString('it-IT', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={m.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-zinc-800/30 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-[11px] text-zinc-500 w-16 shrink-0 leading-tight">
                      <span className="block font-medium text-zinc-400">{dateFormatted}</span>
                      <span>{timeFormatted}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <span
                        className={`truncate ${
                          isT1Winner ? 'font-bold text-emerald-400' : 'text-zinc-400'
                        }`}
                      >
                        {t1?.name || 'Squadra 1'}
                        {isT1Winner && ' 🏆'}
                      </span>

                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 font-mono font-bold shrink-0">
                        {m.scoreTeam1 !== undefined && m.scoreTeam2 !== undefined
                          ? `${m.scoreTeam1} - ${m.scoreTeam2}`
                          : 'vs'}
                      </span>

                      <span
                        className={`truncate ${
                          isT2Winner ? 'font-bold text-emerald-400' : 'text-zinc-400'
                        }`}
                      >
                        {t2?.name || 'Squadra 2'}
                        {isT2Winner && ' 🏆'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {m.notes && (
                      <span className="hidden md:inline-block text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60 max-w-[140px] truncate">
                        {m.notes}
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteMatch(m.id)}
                      aria-label="Elimina partita"
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
