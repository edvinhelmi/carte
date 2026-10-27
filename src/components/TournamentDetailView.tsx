import React, { useState, useMemo } from 'react';
import {
  Trophy,
  ArrowLeft,
  Swords,
  Trash2,
  CheckCircle2,
  Sparkles,
  Radio,
} from 'lucide-react';
import { Tournament, TournamentMatch, Team, Player, Match } from '@/types/game';
import {
  recordTournamentMatchResult,
  calculateRoundRobinStandings,
} from '@/lib/tournamentEngine';
import { StorageService, formatDateKey } from '@/lib/storage';
import { fireWinConfetti } from '@/lib/confetti';
import { SuitIcon } from './SuitIcon';

interface TournamentDetailViewProps {
  tournament: Tournament;
  teams: Team[];
  players: Player[];
  onBack: () => void;
  onTournamentUpdated: () => void;
}

export function TournamentDetailView({
  tournament,
  teams,
  players,
  onBack,
  onTournamentUpdated,
}: TournamentDetailViewProps) {
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null);
  const [score1, setScore1] = useState<string>('');
  const [score2, setScore2] = useState<string>('');
  const [recordInGlobalHistory, setRecordInGlobalHistory] = useState(true);

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const playerMap = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);

  const championTeam = tournament.winnerTeamId ? teamMap.get(tournament.winnerTeamId) : null;

  // Standings se round robin
  const roundRobinStandings = useMemo(() => {
    if (tournament.format !== 'round_robin') return [];
    return calculateRoundRobinStandings(tournament, teams);
  }, [tournament, teams]);

  // Raggruppa partite per round
  const matchesByRound = useMemo(() => {
    const rounds: Record<number, TournamentMatch[]> = {};
    for (const m of tournament.matches) {
      if (!rounds[m.roundIndex]) {
        rounds[m.roundIndex] = [];
      }
      rounds[m.roundIndex].push(m);
    }
    return rounds;
  }, [tournament.matches]);

  // Calcolo progresso partite
  const completedMatchesCount = tournament.matches.filter((m) => m.status === 'completed').length;
  const totalMatchesCount = tournament.matches.length;
  const progressPercent = Math.round((completedMatchesCount / totalMatchesCount) * 100);

  // Registrazione risultato match
  const handleSaveMatchResult = (winnerId: string) => {
    if (!selectedMatch) return;
    const team1Id = selectedMatch.team1Id;
    const team2Id = selectedMatch.team2Id;

    if (!team1Id || !team2Id) return;

    const s1 = score1 !== '' ? Number(score1) : undefined;
    const s2 = score2 !== '' ? Number(score2) : undefined;

    // Aggiorna torneo
    const updatedTournament = recordTournamentMatchResult(
      tournament,
      selectedMatch.id,
      winnerId,
      s1,
      s2
    );

    StorageService.saveTournament(updatedTournament);

    // Se richiesto, salva anche come partita globale per storico e statistiche generali
    if (recordInGlobalHistory) {
      const globalMatch: Match = {
        id: `m_tour_${Date.now()}`,
        gameType: tournament.gameType,
        timestamp: new Date().toISOString(),
        dateKey: formatDateKey(),
        team1Id,
        team2Id,
        winnerTeamId: winnerId,
        scoreTeam1: s1,
        scoreTeam2: s2,
        notes: `Torneo: ${tournament.name} (${selectedMatch.roundName})`,
      };
      StorageService.saveMatch(globalMatch);
    }

    // Coriandoli se il torneo è completato o se è una finale
    if (updatedTournament.status === 'completed' || selectedMatch.roundName.includes('Finale')) {
      fireWinConfetti();
    }

    setSelectedMatch(null);
    setScore1('');
    setScore2('');
    onTournamentUpdated();
  };

  // Eliminazione torneo
  const handleDeleteTournament = () => {
    if (confirm('Vuoi davvero eliminare questo torneo?')) {
      StorageService.deleteTournament(tournament.id);
      onBack();
      onTournamentUpdated();
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR CON TASTO INDIETRO E INFO TORNEO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Torna ai tornei"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
                {tournament.name}
              </h1>
              {/* Indicatore Live Real-time */}
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
              <span className="capitalize font-medium text-amber-400">
                {tournament.format === 'knockout' ? 'Eliminazione Diretta' : 'Girone all’Italiana'}
              </span>
              <span>•</span>
              <span>
                {completedMatchesCount} di {totalMatchesCount} partite completate ({progressPercent}%)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDeleteTournament}
            className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors cursor-pointer"
            title="Elimina Torneo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* BANNER CAMPIONE SE TORNEO CONCLUSO */}
      {tournament.status === 'completed' && championTeam && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-emerald-500/20 border-2 border-amber-500/50 p-6 sm:p-8 text-center shadow-2xl shadow-amber-500/10">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/30 text-amber-300 border border-amber-400/50 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Trophy className="w-8 h-8 stroke-[2.5]" />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-1">
            Vincitori del Torneo 🏆
          </span>

          <h2 className="text-2xl sm:text-4xl font-black text-zinc-100 tracking-tight">
            {championTeam.name}
          </h2>

          <p className="text-sm text-zinc-300 mt-2 font-medium">
            {championTeam.playerIds
              .map((id) => playerMap.get(id)?.name)
              .filter(Boolean)
              .join(' & ')}
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/80 border border-amber-500/30 text-xs font-bold text-amber-300 mt-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Trionfo confermato e salvato nell&apos;Albo d&apos;Oro!</span>
          </div>
        </div>
      )}

      {/* SE TORNEO A GIRONE (ROUND ROBIN): CLASSIFICA LIVE IN CIMA */}
      {tournament.format === 'round_robin' && (
        <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Classifica Live Girone</span>
            </h2>
            <span className="text-xs text-zinc-500">3 punti per vittoria</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-200">
              <thead>
                <tr className="border-b border-zinc-800 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Squadra</th>
                  <th className="py-2 px-3 text-center">G</th>
                  <th className="py-2 px-3 text-center">V</th>
                  <th className="py-2 px-3 text-center">S</th>
                  <th className="py-2 px-3 text-center">Punti</th>
                  <th className="py-2 px-3 text-center">Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {roundRobinStandings.map((s, idx) => (
                  <tr
                    key={s.teamId}
                    className={`hover:bg-zinc-800/40 transition-colors ${
                      idx === 0 && s.points > 0 ? 'bg-amber-500/5 font-semibold' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-xs text-zinc-400">
                      {idx === 0 ? '👑 1°' : `${idx + 1}°`}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        {s.team?.suit && (
                          <SuitIcon suit={s.team.suit} className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span className="font-bold text-zinc-100">
                          {s.team?.name || 'Squadra'}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center text-zinc-400">{s.played}</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">{s.wins}</td>
                    <td className="py-2.5 px-3 text-center text-red-400">{s.losses}</td>
                    <td className="py-2.5 px-3 text-center font-black text-amber-400 text-base">
                      {s.points}
                    </td>
                    <td className="py-2.5 px-3 text-center text-xs font-mono text-zinc-400">
                      {s.scoreDiff > 0 ? `+${s.scoreDiff}` : s.scoreDiff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABELLONE O LISTA PARTITE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Swords className="w-4 h-4 text-amber-400" />
            <span>
              {tournament.format === 'knockout'
                ? 'Tabellone Sfide a Eliminazione'
                : 'Calendario Partite del Girone'}
            </span>
          </h2>
          <span className="text-xs text-zinc-400">Tocca una partita per segnare il vincitore</span>
        </div>

        {/* BRACKET A COLONNE PER KNOCKOUT */}
        {tournament.format === 'knockout' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {Object.entries(matchesByRound).map(([roundIdx, roundMatches]) => {
              const isFinal = Number(roundIdx) === Object.keys(matchesByRound).length;
              return (
                <div key={roundIdx} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      {isFinal ? '🏆 Fase Finale' : `Turno ${roundIdx}`}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {roundMatches.map((m) => {
                      const t1 = m.team1Id ? teamMap.get(m.team1Id) : null;
                      const t2 = m.team2Id ? teamMap.get(m.team2Id) : null;
                      const canPlay = Boolean(m.team1Id && m.team2Id);

                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            if (canPlay) setSelectedMatch(m);
                          }}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                            m.status === 'completed'
                              ? 'bg-zinc-900/90 border-emerald-500/40 shadow-sm'
                              : canPlay
                              ? 'bg-zinc-900 border-zinc-700/80 hover:border-amber-400 hover:scale-[1.01]'
                              : 'bg-zinc-950/60 border-zinc-800/60 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2.5">
                            <span className="font-semibold">{m.roundName}</span>
                            {m.status === 'completed' ? (
                              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Finita</span>
                              </span>
                            ) : canPlay ? (
                              <span className="flex items-center gap-1 text-amber-400 font-semibold animate-pulse">
                                <Radio className="w-3 h-3" />
                                <span>Da giocare</span>
                              </span>
                            ) : (
                              <span className="text-zinc-500">In attesa</span>
                            )}
                          </div>

                          {/* Squadra 1 */}
                          <div
                            className={`flex items-center justify-between p-2 rounded-xl mb-1.5 ${
                              m.winnerTeamId === m.team1Id
                                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                                : 'bg-zinc-800/70 text-zinc-300'
                            }`}
                          >
                            <span className="text-sm truncate">
                              {t1 ? t1.name : 'In attesa turno precedente...'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {m.scoreTeam1 !== undefined && (
                                <span className="font-mono text-xs">{m.scoreTeam1}</span>
                              )}
                              {m.winnerTeamId === m.team1Id && <span>🏆</span>}
                            </div>
                          </div>

                          {/* Squadra 2 */}
                          <div
                            className={`flex items-center justify-between p-2 rounded-xl ${
                              m.winnerTeamId === m.team2Id
                                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                                : 'bg-zinc-800/70 text-zinc-300'
                            }`}
                          >
                            <span className="text-sm truncate">
                              {t2 ? t2.name : 'In attesa turno precedente...'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {m.scoreTeam2 !== undefined && (
                                <span className="font-mono text-xs">{m.scoreTeam2}</span>
                              )}
                              {m.winnerTeamId === m.team2Id && <span>🏆</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LISTA MATCHES PER ROUND ROBIN */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tournament.matches.map((m) => {
              const t1 = m.team1Id ? teamMap.get(m.team1Id) : null;
              const t2 = m.team2Id ? teamMap.get(m.team2Id) : null;

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMatch(m)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    m.status === 'completed'
                      ? 'bg-zinc-900/90 border-emerald-500/40'
                      : 'bg-zinc-900 border-zinc-700/80 hover:border-amber-400 hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                    <span className="font-semibold">{m.roundName}</span>
                    {m.status === 'completed' ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completata</span>
                      </span>
                    ) : (
                      <span className="text-amber-400 font-medium">Tocca per registrare</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`flex-1 p-2 rounded-xl text-center text-sm truncate ${
                        m.winnerTeamId === m.team1Id
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                          : 'bg-zinc-800/80 text-zinc-200'
                      }`}
                    >
                      {t1?.name} {m.winnerTeamId === m.team1Id && '🏆'}
                      {m.scoreTeam1 !== undefined && (
                        <span className="block text-xs font-mono text-zinc-400">
                          {m.scoreTeam1} pt
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-bold text-zinc-500">VS</span>

                    <div
                      className={`flex-1 p-2 rounded-xl text-center text-sm truncate ${
                        m.winnerTeamId === m.team2Id
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                          : 'bg-zinc-800/80 text-zinc-200'
                      }`}
                    >
                      {t2?.name} {m.winnerTeamId === m.team2Id && '🏆'}
                      {m.scoreTeam2 !== undefined && (
                        <span className="block text-xs font-mono text-zinc-400">
                          {m.scoreTeam2} pt
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL ASSEGNAZIONE VITTORIA DELLA PARTITA DEL TORNEO */}
      {selectedMatch && selectedMatch.team1Id && selectedMatch.team2Id && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-3xl border border-zinc-700 p-5 sm:p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="font-bold text-base text-zinc-100">
                  {selectedMatch.roundName}
                </h3>
                <p className="text-xs text-zinc-400">
                  Tocca la squadra vincitrice per aggiornare il tabellone in tempo reale
                </p>
              </div>
              <button
                onClick={() => setSelectedMatch(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* BOTTONI TOUCH ASSEGNAZIONE VITTORIA */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Tasto Squadra 1 */}
              <button
                type="button"
                onClick={() => handleSaveMatchResult(selectedMatch.team1Id!)}
                className="p-4 rounded-2xl border-2 border-emerald-500/40 bg-zinc-950/80 hover:border-emerald-400 hover:bg-emerald-950/20 active:scale-95 transition-all text-center cursor-pointer flex flex-col items-center justify-center"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                  <Trophy className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider mb-0.5">
                  Vince
                </span>
                <span className="text-sm font-bold text-zinc-100 line-clamp-2">
                  {teamMap.get(selectedMatch.team1Id!)?.name}
                </span>
              </button>

              {/* Tasto Squadra 2 */}
              <button
                type="button"
                onClick={() => handleSaveMatchResult(selectedMatch.team2Id!)}
                className="p-4 rounded-2xl border-2 border-amber-500/40 bg-zinc-950/80 hover:border-amber-400 hover:bg-amber-950/20 active:scale-95 transition-all text-center cursor-pointer flex flex-col items-center justify-center"
              >
                <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
                  <Trophy className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider mb-0.5">
                  Vince
                </span>
                <span className="text-sm font-bold text-zinc-100 line-clamp-2">
                  {teamMap.get(selectedMatch.team2Id!)?.name}
                </span>
              </button>
            </div>

            {/* Punteggio facoltativo */}
            <div className="bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Punteggio Manches/Punti (Opzionale):
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder={`Punti ${teamMap.get(selectedMatch.team1Id!)?.name}`}
                  value={score1}
                  onChange={(e) => setScore1(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-xs rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <input
                  type="number"
                  placeholder={`Punti ${teamMap.get(selectedMatch.team2Id!)?.name}`}
                  value={score2}
                  onChange={(e) => setScore2(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-xs rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 text-xs text-zinc-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={recordInGlobalHistory}
                  onChange={(e) => setRecordInGlobalHistory(e.target.checked)}
                  className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500 bg-zinc-900 cursor-pointer"
                />
                <span>Conta anche per la classifica generale e calendario</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
