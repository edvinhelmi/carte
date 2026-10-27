import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Trophy,
  Calendar as CalendarIcon,
  Clock,
  Trash2,
  Plus,
  Sparkles,
  Swords,
} from 'lucide-react';
import { Match, Team, TournamentSession } from '@/types/game';
import { getDailySummary } from '@/lib/stats';
import { formatDateKey, StorageService } from '@/lib/storage';

interface CalendarViewProps {
  matches: Match[];
  teams: Team[];
  tournamentSessions: TournamentSession[];
  onOpenQuickMatchWithDate: (dateKey: string) => void;
  onMatchesUpdated: () => void;
}

export function CalendarView({
  matches,
  teams,
  tournamentSessions = [],
  onOpenQuickMatchWithDate,
  onMatchesUpdated,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() => formatDateKey(new Date()));

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  // Raggruppa partite per dateKey
  const matchesByDate = useMemo(() => {
    const map: Record<string, Match[]> = {};
    for (const m of matches) {
      if (!map[m.dateKey]) {
        map[m.dateKey] = [];
      }
      map[m.dateKey].push(m);
    }
    return map;
  }, [matches]);

  // Raggruppa sessioni torneo per dateKey
  const sessionsByDate = useMemo(() => {
    const map: Record<string, TournamentSession[]> = {};
    for (const s of tournamentSessions) {
      if (!map[s.dateKey]) {
        map[s.dateKey] = [];
      }
      map[s.dateKey].push(s);
    }
    return map;
  }, [tournamentSessions]);

  // Calcolo giorni del mese corrente
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
  ];

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDay = (firstDayOfMonth.getDay() + 6) % 7;
  const totalDays = lastDayOfMonth.getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleSelectToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateKey(formatDateKey(now));
  };

  const handleSelectYesterday = () => {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    setCurrentDate(yest);
    setSelectedDateKey(formatDateKey(yest));
  };

  const dailySummary = useMemo(() => {
    return getDailySummary(selectedDateKey, matches, teams);
  }, [selectedDateKey, matches, teams]);

  const selectedDaySessions = useMemo(() => {
    return sessionsByDate[selectedDateKey] || [];
  }, [sessionsByDate, selectedDateKey]);

  const formattedSelectedDate = useMemo(() => {
    const [y, m, d] = selectedDateKey.split('-').map(Number);
    if (!y || !m || !d) return selectedDateKey;
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDateKey]);

  const handleDeleteMatch = (matchId: string) => {
    if (confirm('Vuoi davvero eliminare questa partita dallo storico?')) {
      StorageService.deleteMatch(matchId);
      onMatchesUpdated();
    }
  };

  const hasActivity = dailySummary.totalMatches > 0 || selectedDaySessions.length > 0;

  return (
    <div className="space-y-6">
      {/* Intestazione Sezione */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-amber-400" />
            <span>Calendario &amp; Storico Serate</span>
          </h1>
          <p className="text-sm text-zinc-400">
            Distingui e rivivi le partite e i tornei della serata giorno per giorno.
          </p>
        </div>

        {/* Tasti rapidi Oggi / Ieri */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectToday}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700 transition-colors cursor-pointer"
          >
            Oggi
          </button>
          <button
            onClick={handleSelectYesterday}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700 transition-colors cursor-pointer"
          >
            Ieri
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLONNA SINISTRA: WIDGET CALENDARIO MENSILE */}
        <div className="lg:col-span-5 bg-zinc-900/80 rounded-2xl border border-zinc-800 p-4 sm:p-5 shadow-xl">
          {/* Header Mese con Frecce */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base text-zinc-100 capitalize">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                aria-label="Mese precedente"
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                aria-label="Mese successivo"
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Giorni della settimana */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-zinc-500 mb-2">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mer</span>
            <span>Gio</span>
            <span>Ven</span>
            <span>Sab</span>
            <span>Dom</span>
          </div>

          {/* Griglia giorni del mese */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10 sm:h-12" />
            ))}

            {Array.from({ length: totalDays }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayMatches = matchesByDate[dateStr] || [];
              const dayTourneys = sessionsByDate[dateStr] || [];
              const hasItems = dayMatches.length > 0 || dayTourneys.length > 0;
              const isSelected = selectedDateKey === dateStr;
              const isToday = formatDateKey() === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDateKey(dateStr)}
                  className={`h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center relative text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20 scale-105 z-10'
                      : isToday
                      ? 'bg-zinc-800 text-amber-400 border border-amber-500/40 hover:bg-zinc-700'
                      : hasItems
                      ? 'bg-zinc-800/80 text-zinc-100 hover:bg-zinc-750 border border-emerald-500/30'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  }`}
                >
                  <span>{dayNum}</span>

                  {hasItems && (
                    <span
                      className={`text-[9px] px-1 rounded-full font-bold mt-0.5 ${
                        isSelected
                          ? 'bg-zinc-950 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {dayTourneys.length > 0
                        ? '🏆'
                        : `${dayMatches.length} pt`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legenda rapida */}
          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Attività registrata</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Giorno selezionato</span>
            </div>
          </div>
        </div>

        {/* COLONNA DESTRA: DETTAGLIO SERATA / GIORNATA */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-5 shadow-xl">
            {/* Header del giorno */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">
                  Riepilogo Serata
                </span>
                <h3 className="text-lg font-bold text-zinc-100 capitalize">
                  {formattedSelectedDate}
                </h3>
              </div>

              <button
                onClick={() => onOpenQuickMatchWithDate(selectedDateKey)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 text-xs font-semibold transition-all cursor-pointer shadow-sm shadow-amber-500/10"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Aggiungi singola partita</span>
              </button>
            </div>

            {hasActivity ? (
              <div className="pt-4 space-y-5">
                {/* TORNEI DELLA SERATA SE PRESENTI */}
                {selectedDaySessions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Swords className="w-4 h-4" />
                      <span>Tornei / Serie della Serata</span>
                    </h4>

                    {selectedDaySessions.map((session) => {
                      const isT1Winner = session.winnerTeam === 1;
                      const isT2Winner = session.winnerTeam === 2;

                      return (
                        <div
                          key={session.id}
                          className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-900 border border-amber-500/40 shadow-lg space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                              🏆 Torneo Concluso
                            </span>
                            <span className="text-xs text-zinc-400">
                              {session.team1Wins + session.team2Wins} partite disputate
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1">
                            <div className="text-left">
                              <span
                                className={`text-base font-black block ${
                                  isT1Winner ? 'text-emerald-400' : 'text-zinc-300'
                                }`}
                              >
                                {session.team1Name} {isT1Winner && '🏆'}
                              </span>
                              {session.team1Players.length > 0 && (
                                <span className="text-[11px] text-zinc-400">
                                  {session.team1Players.join(' & ')}
                                </span>
                              )}
                            </div>

                            {/* Punteggio finale torneo */}
                            <div className="px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-lg font-mono font-black text-amber-400">
                              {session.team1Wins} - {session.team2Wins}
                            </div>

                            <div className="text-right">
                              <span
                                className={`text-base font-black block ${
                                  isT2Winner ? 'text-amber-400' : 'text-zinc-300'
                                }`}
                              >
                                {session.team2Name} {isT2Winner && '🏆'}
                              </span>
                              {session.team2Players.length > 0 && (
                                <span className="text-[11px] text-zinc-400">
                                  {session.team2Players.join(' & ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Banner: Campione della Serata se partite singole */}
                {dailySummary.championTeam && (
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500/15 via-zinc-900 to-zinc-900 border border-emerald-500/30 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-md">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                            Squadra più vincente del giorno
                          </span>
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                        </div>
                        <h4 className="font-bold text-zinc-100 text-base">
                          {dailySummary.championTeam.name}
                        </h4>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-black text-emerald-400">
                        {dailySummary.championWins}
                      </span>
                      <span className="text-xs text-zinc-400 block font-medium">
                        {dailySummary.championWins === 1 ? 'vittoria' : 'vittorie'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Elenco cronologico singole partite */}
                {dailySummary.matches.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                      Singole Partite Disputate ({dailySummary.totalMatches})
                    </h4>

                    <div className="space-y-2.5">
                      {dailySummary.matches.map((m) => {
                        const t1 = teamMap.get(m.team1Id);
                        const t2 = teamMap.get(m.team2Id);
                        const isT1Winner = m.winnerTeamId === m.team1Id;
                        const isT2Winner = m.winnerTeamId === m.team2Id;

                        const matchTime = new Date(m.timestamp).toLocaleTimeString('it-IT', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <div
                            key={m.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex items-center gap-1 text-xs text-zinc-500 w-14 shrink-0">
                                <Clock className="w-3 h-3" />
                                <span>{matchTime}</span>
                              </div>

                              <div className="flex items-center gap-2 text-sm min-w-0">
                                <span
                                  className={`font-semibold truncate ${
                                    isT1Winner ? 'text-emerald-400' : 'text-zinc-400 font-normal'
                                  }`}
                                >
                                  {t1?.name || 'Squadra 1'}
                                  {isT1Winner && ' 🏆'}
                                </span>

                                <span className="text-xs px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono font-bold shrink-0">
                                  {m.scoreTeam1 !== undefined && m.scoreTeam2 !== undefined
                                    ? `${m.scoreTeam1} - ${m.scoreTeam2}`
                                    : 'vs'}
                                </span>

                                <span
                                  className={`font-semibold truncate ${
                                    isT2Winner ? 'text-emerald-400' : 'text-zinc-400 font-normal'
                                  }`}
                                >
                                  {t2?.name || 'Squadra 2'}
                                  {isT2Winner && ' 🏆'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              {m.notes && (
                                <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60 max-w-[130px] truncate">
                                  {m.notes}
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteMatch(m.id)}
                                aria-label="Elimina partita"
                                className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Nessuna attività */
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-500">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-300">
                    Nessuna partita o torneo registrato in questo giorno
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Hai giocato a carte in questa data? Registra subito le vittorie per aggiornare lo storico.
                  </p>
                </div>
                <button
                  onClick={() => onOpenQuickMatchWithDate(selectedDateKey)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-amber-400 font-semibold text-xs border border-amber-500/30 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registra partita per il {selectedDateKey}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
