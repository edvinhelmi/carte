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
    return getDailySummary(selectedDateKey, matches, teams, tournamentSessions);
  }, [selectedDateKey, matches, teams, tournamentSessions]);

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

  const handleDeleteTournamentSession = (sessionId: string) => {
    if (confirm('Vuoi davvero eliminare questo torneo dallo storico?')) {
      StorageService.deleteTournamentSession(sessionId);
      onMatchesUpdated();
    }
  };

  const hasActivity = dailySummary.totalMatches > 0 || selectedDaySessions.length > 0;

  return (
    <div className="space-y-6" data-reveal="rise">
      {/* Intestazione Sezione */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-[var(--accent)]" />
            <span>Calendario &amp; Storico Serate</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Visualizza partite, tornei e campioni giorno per giorno.
          </p>
        </div>

        {/* Tasti rapidi Oggi / Ieri */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectToday}
            className="touch-target px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[var(--surface)] hover:bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--control-border)] btn-tactile cursor-pointer"
          >
            Oggi
          </button>
          <button
            type="button"
            onClick={handleSelectYesterday}
            className="touch-target px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[var(--surface)] hover:bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--control-border)] btn-tactile cursor-pointer"
          >
            Ieri
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLONNA SINISTRA: WIDGET CALENDARIO MENSILE */}
        <div className="lg:col-span-5 bg-[var(--surface)] rounded-2xl border border-[var(--divider)] p-5 shadow-sm">
          {/* Header Mese con Frecce */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-base text-[var(--text)] capitalize">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Mese precedente"
                className="touch-target p-2 rounded-lg hover:bg-[var(--surface-raised)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Mese successivo"
                className="touch-target p-2 rounded-lg hover:bg-[var(--surface-raised)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Giorni della settimana */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[var(--text-subtle)] mb-2">
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
                  type="button"
                  onClick={() => setSelectedDateKey(dateStr)}
                  className={`h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center relative text-xs font-mono tabular-nums btn-tactile cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--accent)] text-[var(--on-accent)] font-bold shadow-md shadow-amber-500/25 z-10 ring-2 ring-amber-300/40'
                      : isToday
                      ? 'bg-[var(--surface-raised)] text-[var(--accent-text)] border border-[var(--accent-border)] hover:bg-[var(--surface-alt)]'
                      : hasItems
                      ? 'bg-[var(--surface-raised)] text-[var(--text)] hover:bg-[var(--surface-alt)] border border-[var(--divider)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text)]'
                  }`}
                >
                  <span className="font-semibold">{dayNum}</span>

                  {hasItems && (
                    <span
                      className={`text-[9px] px-1 rounded-full font-bold mt-0.5 ${
                        isSelected
                          ? 'bg-[var(--canvas)] text-[var(--accent-text)]'
                          : 'bg-[var(--accent-muted)] text-[var(--accent-text)]'
                      }`}
                    >
                      {dayTourneys.length > 0 ? '🏆' : `${dayMatches.length} part.`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legenda rapida */}
          <div className="mt-5 pt-3 border-t border-[var(--divider)] flex items-center justify-between text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
              <span>Attività registrata</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full border border-[var(--accent-border)] bg-[var(--surface-raised)]" />
              <span>Oggi</span>
            </div>
          </div>
        </div>

        {/* COLONNA DESTRA: DETTAGLIO SERATA / GIORNATA */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--divider)] p-5 sm:p-6 shadow-sm">
            {/* Header del giorno */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--divider)]">
              <div>
                <span className="text-xs font-semibold text-[var(--accent-text)] block mb-0.5">
                  Riepilogo serata
                </span>
                <h3 className="font-heading text-xl font-bold text-[var(--text)] capitalize">
                  {formattedSelectedDate}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => onOpenQuickMatchWithDate(selectedDateKey)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] hover:border-[var(--control-border-hover)] text-xs font-semibold text-[var(--text)] btn-tactile cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>+ Aggiungi Partita</span>
              </button>
            </div>

            {hasActivity ? (
              <div className="pt-5 space-y-5">
                {/* TORNEI DELLA SERATA SE PRESENTI */}
                {selectedDaySessions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[var(--accent)] flex items-center gap-1.5">
                      <Swords className="w-4 h-4" />
                      <span>Tornei della Serata</span>
                    </h4>

                    {selectedDaySessions.map((session) => {
                      const isT1Winner = session.winnerTeam === 1;
                      const isT2Winner = session.winnerTeam === 2;

                      return (
                        <div
                          key={session.id}
                          className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--control-border)] hover:border-[var(--control-border-hover)] shadow-sm space-y-2 interactive-card"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[var(--accent)]">
                              🏆 Torneo Concluso
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[var(--text-muted)] font-mono tabular-nums">
                                {session.team1Wins + session.team2Wins} partite giocate
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteTournamentSession(session.id)}
                                aria-label="Elimina torneo"
                                className="touch-target p-1 rounded-lg text-[var(--text-subtle)] hover:text-rose-400 hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 pt-1">
                            <div className="text-left min-w-0">
                              <span
                                className={`text-base font-extrabold block truncate ${
                                  isT1Winner ? 'text-[var(--accent)]' : 'text-[var(--text)]'
                                }`}
                              >
                                {session.team1Name} {isT1Winner && '🏆'}
                              </span>
                              {session.team1Players.length > 0 && (
                                <span className="text-xs text-[var(--text-muted)]">
                                  {session.team1Players.join(' & ')}
                                </span>
                              )}
                            </div>

                            {/* Punteggio finale torneo */}
                            <div className="px-3.5 py-1 rounded-xl bg-[var(--surface-alt)] border border-[var(--divider)] text-base sm:text-lg font-mono font-black text-[var(--text)] tabular-nums shrink-0">
                              {session.team1Wins} - {session.team2Wins}
                            </div>

                            <div className="text-right min-w-0">
                              <span
                                className={`text-base font-extrabold block truncate ${
                                  isT2Winner ? 'text-[var(--accent)]' : 'text-[var(--text)]'
                                }`}
                              >
                                {session.team2Name} {isT2Winner && '🏆'}
                              </span>
                              {session.team2Players.length > 0 && (
                                <span className="text-xs text-[var(--text-muted)]">
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
                  <div className="rounded-xl bg-[var(--surface-raised)] border border-[var(--accent-border)] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--accent-muted)] text-[var(--accent-text)] border border-[var(--accent-border)] flex items-center justify-center shadow-sm">
                        <Trophy className="w-5 h-5 text-[var(--accent)]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-[var(--accent)]">
                            Squadra più vincente del giorno
                          </span>
                          <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                        </div>
                        <h4 className="font-heading font-extrabold text-[var(--text)] text-base mt-0.5">
                          {dailySummary.championTeam.name}
                        </h4>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-black text-[var(--text)] font-mono tabular-nums">
                        {dailySummary.championWins}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] block font-medium">
                        {dailySummary.championWins === 1 ? 'vittoria' : 'vittorie'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Elenco cronologico singole partite */}
                {dailySummary.matches.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[var(--text-muted)]">
                      Partite Singole ({dailySummary.totalMatches})
                    </h4>

                    <div className="space-y-2">
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
                            className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--divider)] hover:border-[var(--control-border)] interactive-card"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex items-center gap-1 text-xs text-[var(--text-subtle)] font-mono tabular-nums w-12 shrink-0">
                                <Clock className="w-3 h-3" />
                                <span>{matchTime}</span>
                              </div>

                              <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                                <span
                                  className={`truncate font-semibold ${
                                    isT1Winner ? 'text-[var(--text)] font-bold' : 'text-[var(--text-muted)]'
                                  }`}
                                >
                                  {t1?.name || 'Squadra 1'}
                                  {isT1Winner && ' 🏆'}
                                </span>

                                <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface-alt)] border border-[var(--divider)] text-[var(--text-muted)] font-mono font-bold tabular-nums shrink-0">
                                  {m.scoreTeam1 !== undefined && m.scoreTeam2 !== undefined
                                    ? `${m.scoreTeam1} - ${m.scoreTeam2}`
                                    : 'vs'}
                                </span>

                                <span
                                  className={`truncate font-semibold ${
                                    isT2Winner ? 'text-[var(--text)] font-bold' : 'text-[var(--text-muted)]'
                                  }`}
                                >
                                  {t2?.name || 'Squadra 2'}
                                  {isT2Winner && ' 🏆'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              {m.notes && (
                                <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-[var(--surface-alt)] text-[var(--text-muted)] border border-[var(--divider)] max-w-[130px] truncate">
                                  {m.notes}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteMatch(m.id)}
                                aria-label="Elimina partita"
                                className="touch-target p-1.5 rounded-lg text-[var(--text-subtle)] hover:text-rose-400 hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
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
                <div className="w-12 h-12 rounded-full bg-[var(--surface-raised)] border border-[var(--control-border)] flex items-center justify-center mx-auto text-[var(--text-subtle)]">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">
                    Nessuna partita o torneo registrato per questo giorno
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Hai giocato a carte in questa data? Registra le vittorie per aggiornare lo storico.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenQuickMatchWithDate(selectedDateKey)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] text-xs font-semibold text-[var(--text)] btn-tactile cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[var(--accent)]" />
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
