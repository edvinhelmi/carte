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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClone, faBroom, faTrophy } from '@fortawesome/free-solid-svg-icons';

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
  const [gameFilter, setGameFilter] = useState<import('@/types/game').GameType | 'all'>('all');

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  // Raggruppa partite per dateKey filtrate
  const matchesByDate = useMemo(() => {
    const map: Record<string, Match[]> = {};
    for (const m of matches) {
      if (gameFilter !== 'all' && (m.gameType || 'briscola') !== gameFilter) continue;
      if (!map[m.dateKey]) {
        map[m.dateKey] = [];
      }
      map[m.dateKey].push(m);
    }
    return map;
  }, [matches, gameFilter]);

  // Raggruppa sessioni torneo per dateKey filtrate
  const sessionsByDate = useMemo(() => {
    const map: Record<string, TournamentSession[]> = {};
    for (const s of tournamentSessions) {
      if (gameFilter !== 'all' && (s.gameType || 'briscola') !== gameFilter) continue;
      if (!map[s.dateKey]) {
        map[s.dateKey] = [];
      }
      map[s.dateKey].push(s);
    }
    return map;
  }, [tournamentSessions, gameFilter]);

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
    return getDailySummary(selectedDateKey, matches, teams, tournamentSessions, gameFilter);
  }, [selectedDateKey, matches, teams, tournamentSessions, gameFilter]);

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

        {/* Filtro Gioco & Tasti rapidi Oggi / Ieri */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex p-1 rounded-full bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={() => setGameFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold btn-ios-tactile active:scale-96 cursor-pointer min-h-[40px] sm:min-h-0 ${
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold btn-ios-tactile active:scale-96 cursor-pointer min-h-[40px] sm:min-h-0 inline-flex items-center gap-1.5 ${
                gameFilter === 'briscola'
                  ? 'bg-[var(--accent)] text-[var(--on-accent)] font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <FontAwesomeIcon icon={faClone} className="text-[11px]" />
              <span>Briscola</span>
            </button>
            <button
              type="button"
              onClick={() => setGameFilter('scopa')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold btn-ios-tactile active:scale-96 cursor-pointer min-h-[40px] sm:min-h-0 inline-flex items-center gap-1.5 ${
                gameFilter === 'scopa'
                  ? 'bg-[var(--accent)] text-[var(--on-accent)] font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <FontAwesomeIcon icon={faBroom} className="text-[11px]" />
              <span>Scopa</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSelectToday}
              className="touch-target px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 text-[var(--text)] border border-white/10 btn-ios-tactile active:scale-96 cursor-pointer min-h-[40px]"
            >
              Oggi
            </button>
            <button
              type="button"
              onClick={handleSelectYesterday}
              className="touch-target px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 text-[var(--text)] border border-white/10 btn-ios-tactile active:scale-96 cursor-pointer min-h-[40px]"
            >
              Ieri
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLONNA SINISTRA: WIDGET CALENDARIO MENSILE */}
        <div className="lg:col-span-5 glass-ios-raised rounded-[28px] border border-white/10 p-5 sm:p-6 shadow-xl">
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
                className="touch-target p-2 rounded-xl hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Mese successivo"
                className="touch-target p-2 rounded-xl hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
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
                  className={`min-h-[44px] h-11 sm:h-12 rounded-2xl flex flex-col items-center justify-center relative text-xs font-mono tabular-nums btn-ios-tactile active:scale-96 cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--accent)] text-[var(--on-accent)] font-bold shadow-md shadow-amber-500/25 z-10 ring-2 ring-amber-300/40'
                      : isToday
                      ? 'bg-white/10 text-amber-300 border border-amber-500/30 hover:bg-white/15'
                      : hasItems
                      ? 'bg-white/5 text-[var(--text)] hover:bg-white/10 border border-white/10'
                      : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text)]'
                  }`}
                >
                  <span className="font-semibold">{dayNum}</span>

                  {hasItems && (
                    <span
                      className={`text-[9px] px-1.5 rounded-full font-bold mt-0.5 ${
                        isSelected
                          ? 'bg-[var(--canvas)] text-[var(--accent-text)]'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {dayTourneys.length > 0 ? (
                        <FontAwesomeIcon icon={faTrophy} className="text-[10px] text-amber-400" />
                      ) : (
                        <>
                          <span className="hidden sm:inline">{dayMatches.length} part.</span>
                          <span className="sm:hidden">{dayMatches.length}p</span>
                        </>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legenda rapida */}
          <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
              <span>Attività registrata</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full border border-amber-500/40 bg-amber-500/20" />
              <span>Oggi</span>
            </div>
          </div>
        </div>

        {/* COLONNA DESTRA: DETTAGLIO SERATA / GIORNATA */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-ios-raised rounded-[28px] border border-white/10 p-6 sm:p-7 shadow-xl">
            {/* Header del giorno */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
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
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[var(--text)] btn-ios-tactile active:scale-96 cursor-pointer"
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
                      const isA5 = session.mode === 'a5';
                      const isThree = !isA5 && (session.mode === '1vs1vs1' || !!session.team3Name);
                      const isT1Winner =
                        Number(session.winnerTeam) === 1 ||
                        session.winnerTeam === '1' ||
                        (!session.winnerTeam && session.team1Wins > session.team2Wins && (!isThree || session.team1Wins > (session.team3Wins || 0)));
                      const isT2Winner =
                        Number(session.winnerTeam) === 2 ||
                        session.winnerTeam === '2' ||
                        (!session.winnerTeam && session.team2Wins > session.team1Wins && (!isThree || session.team2Wins > (session.team3Wins || 0)));
                      const isT3Winner =
                        Number(session.winnerTeam) === 3 ||
                        session.winnerTeam === '3' ||
                        (!session.winnerTeam && isThree && (session.team3Wins || 0) > session.team1Wins && (session.team3Wins || 0) > session.team2Wins);

                      let winnerLabel = '';
                      if (
                        session.winnerPlayerName &&
                        session.winnerPlayerName !== 'Pareggio' &&
                        session.winnerPlayerName !== 'Nessuno (0 vittorie)'
                      ) {
                        winnerLabel = session.winnerPlayerName;
                      } else if (isA5 && session.players5 && session.players5.length > 0) {
                        const maxWins = Math.max(...session.players5.map((p) => p.wins || 0));
                        if (maxWins > 0) {
                          const winners = session.players5.filter((p) => (p.wins || 0) === maxWins);
                          winnerLabel = winners.map((p) => p.name).join(' & ');
                        }
                      } else if (isThree) {
                        if (isT1Winner) winnerLabel = session.team1Name;
                        else if (isT2Winner) winnerLabel = session.team2Name;
                        else if (isT3Winner) winnerLabel = session.team3Name || 'Giocatore 3';
                      } else {
                        if (isT1Winner) winnerLabel = session.team1Name;
                        else if (isT2Winner) winnerLabel = session.team2Name;
                      }

                      const totalGames = isA5 && session.players5
                        ? session.players5.reduce((sum, p) => sum + (p.wins || 0), 0)
                        : session.team1Wins + session.team2Wins + (session.team3Wins || 0);

                      return (
                        <div
                          key={session.id}
                          className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--control-border)] hover:border-[var(--control-border-hover)] shadow-sm space-y-3 interactive-card"
                        >
                          <div className="flex items-center justify-between text-xs text-[var(--text-subtle)] font-medium gap-2">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[var(--surface-alt)] text-[var(--text-muted)] border border-[var(--control-border)] font-bold inline-flex items-center gap-1.5">
                                <FontAwesomeIcon
                                  icon={session.gameType === 'scopa' ? faBroom : faClone}
                                  className="text-[10px] text-[var(--accent)]"
                                />
                                <span>
                                  {session.gameType === 'scopa'
                                    ? session.scopaVariant === 'scopone_scientifico'
                                      ? 'Scopone'
                                      : 'Scopa'
                                    : session.mode === 'a5'
                                    ? 'Briscola A 5'
                                    : session.mode === '1vs1vs1'
                                    ? 'Briscola a 3'
                                    : session.mode === '1vs1'
                                    ? 'Briscola 1v1'
                                    : 'Briscola 2v2'}
                                  {session.targetPoints ? ` (${session.targetPoints} pt)` : ''}
                                </span>
                              </span>
                              <span className="font-mono tabular-nums text-xs">
                                {isA5
                                  ? `${totalGames} ${totalGames === 1 ? 'vittoria' : 'vittorie'}`
                                  : `${totalGames} ${totalGames === 1 ? 'partita' : 'partite'}`}
                              </span>
                              {winnerLabel && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--accent-text)] bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full shadow-sm">
                                  <Trophy className="w-3 h-3 text-[var(--accent)] fill-[var(--accent)] shrink-0" />
                                  <span className="truncate max-w-[130px] sm:max-w-[180px]">Vinto da {winnerLabel}</span>
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteTournamentSession(session.id)}
                              aria-label="Elimina torneo"
                              className="touch-target p-1 rounded-lg text-[var(--text-subtle)] hover:text-rose-400 hover:bg-[var(--surface-alt)] transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {isA5 && session.players5 && session.players5.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-0.5">
                              {session.players5.map((p, pIdx) => {
                                const maxWins = Math.max(...session.players5!.map((x) => x.wins || 0));
                                const isWinner = session.winnerPlayerName
                                  ? session.winnerPlayerName.split(' & ').includes(p.name)
                                  : (Number(session.winnerTeam) === pIdx + 1 || (maxWins > 0 && p.wins === maxWins));
                                return (
                                  <div
                                    key={p.name + pIdx}
                                    className={`p-2.5 rounded-xl border flex flex-col justify-between text-center transition-all ${
                                      pIdx === 4 ? 'col-span-2 sm:col-span-1' : ''
                                    } ${
                                      isWinner
                                        ? 'bg-[var(--accent-muted)]/20 border-[var(--accent)] ring-1 ring-[var(--accent)]/40 shadow-sm'
                                        : 'bg-[var(--surface-alt)] border-[var(--divider)]'
                                    }`}
                                  >
                                    <div className="flex items-center justify-center gap-1 min-w-0">
                                      {isWinner && (
                                        <Trophy className="w-3.5 h-3.5 text-[var(--accent)] fill-[var(--accent)] shrink-0" />
                                      )}
                                      <span
                                        className={`text-xs sm:text-sm font-bold truncate ${
                                          isWinner ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                                        }`}
                                      >
                                        {p.name}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-lg sm:text-xl font-mono font-black tabular-nums mt-1 block ${
                                        isWinner ? 'text-[var(--accent-text)]' : 'text-[var(--text)]'
                                      }`}
                                    >
                                      {p.wins}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : isThree ? (
                            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-0.5">
                              <div
                                className={`p-3 rounded-xl border flex flex-col justify-between text-center transition-all ${
                                  isT1Winner
                                    ? 'bg-[var(--accent-muted)]/20 border-[var(--accent)] ring-1 ring-[var(--accent)]/40 shadow-sm'
                                    : 'bg-[var(--surface-alt)] border-[var(--divider)]'
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1 min-w-0">
                                  {isT1Winner && (
                                    <Trophy className="w-3.5 h-3.5 text-[var(--accent)] fill-[var(--accent)] shrink-0" />
                                  )}
                                  <span
                                    className={`text-xs sm:text-sm font-bold truncate ${
                                      isT1Winner ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                                    }`}
                                  >
                                    {session.team1Name}
                                  </span>
                                </div>
                                <span
                                  className={`text-xl sm:text-2xl font-mono font-black tabular-nums mt-1 block ${
                                    isT1Winner ? 'text-[var(--accent-text)]' : 'text-[var(--text)]'
                                  }`}
                                >
                                  {session.team1Wins}
                                </span>
                              </div>

                              <div
                                className={`p-3 rounded-xl border flex flex-col justify-between text-center transition-all ${
                                  isT2Winner
                                    ? 'bg-[var(--accent-muted)]/20 border-[var(--accent)] ring-1 ring-[var(--accent)]/40 shadow-sm'
                                    : 'bg-[var(--surface-alt)] border-[var(--divider)]'
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1 min-w-0">
                                  {isT2Winner && (
                                    <Trophy className="w-3.5 h-3.5 text-[var(--accent)] fill-[var(--accent)] shrink-0" />
                                  )}
                                  <span
                                    className={`text-xs sm:text-sm font-bold truncate ${
                                      isT2Winner ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                                    }`}
                                  >
                                    {session.team2Name}
                                  </span>
                                </div>
                                <span
                                  className={`text-xl sm:text-2xl font-mono font-black tabular-nums mt-1 block ${
                                    isT2Winner ? 'text-[var(--accent-text)]' : 'text-[var(--text)]'
                                  }`}
                                >
                                  {session.team2Wins}
                                </span>
                              </div>

                              <div
                                className={`p-3 rounded-xl border flex flex-col justify-between text-center transition-all ${
                                  isT3Winner
                                    ? 'bg-[var(--accent-muted)]/20 border-[var(--accent)] ring-1 ring-[var(--accent)]/40 shadow-sm'
                                    : 'bg-[var(--surface-alt)] border-[var(--divider)]'
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1 min-w-0">
                                  {isT3Winner && (
                                    <Trophy className="w-3.5 h-3.5 text-[var(--accent)] fill-[var(--accent)] shrink-0" />
                                  )}
                                  <span
                                    className={`text-xs sm:text-sm font-bold truncate ${
                                      isT3Winner ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                                    }`}
                                  >
                                    {session.team3Name || 'Giocatore 3'}
                                  </span>
                                </div>
                                <span
                                  className={`text-xl sm:text-2xl font-mono font-black tabular-nums mt-1 block ${
                                    isT3Winner ? 'text-[var(--accent-text)]' : 'text-[var(--text)]'
                                  }`}
                                >
                                  {session.team3Wins || 0}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3 pt-1">
                              {/* Team 1 (Left Box) */}
                              <div
                                className={`p-3 rounded-xl border flex items-center justify-between gap-2 min-w-0 transition-all ${
                                  isT1Winner
                                    ? 'bg-[var(--accent-muted)]/20 border-[var(--accent)] ring-1 ring-[var(--accent)]/40 shadow-sm'
                                    : 'bg-[var(--surface-alt)] border-[var(--divider)]'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {isT1Winner && (
                                      <Trophy className="w-3.5 h-3.5 text-[var(--accent)] fill-[var(--accent)] shrink-0" />
                                    )}
                                    <span
                                      className={`text-xs sm:text-sm font-bold truncate ${
                                        isT1Winner ? 'text-[var(--accent)]' : 'text-[var(--text)]'
                                      }`}
                                    >
                                      {session.team1Name}
                                    </span>
                                  </div>
                                  {session.team1Players && session.team1Players.length > 0 && (session.mode ?? '2vs2') === '2vs2' && (
                                    <span className="text-[11px] text-[var(--text-muted)] truncate block mt-0.5">
                                      {session.team1Players.join(' & ')}
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={`text-lg sm:text-xl font-mono font-black tabular-nums shrink-0 ${
                                    isT1Winner ? 'text-[var(--accent-text)]' : 'text-[var(--text-muted)]'
                                  }`}
                                >
                                  {session.team1Wins}
                                </span>
                              </div>

                              {/* VS Divider */}
                              <span className="text-xs font-mono font-bold text-[var(--text-subtle)] px-1 shrink-0">VS</span>

                              {/* Team 2 (Right Box) */}
                              <div
                                className={`p-3 rounded-xl border flex items-center justify-between gap-2 min-w-0 transition-all ${
                                  isT2Winner
                                    ? 'bg-[var(--accent-muted)]/20 border-[var(--accent)] ring-1 ring-[var(--accent)]/40 shadow-sm'
                                    : 'bg-[var(--surface-alt)] border-[var(--divider)]'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {isT2Winner && (
                                      <Trophy className="w-3.5 h-3.5 text-[var(--accent)] fill-[var(--accent)] shrink-0" />
                                    )}
                                    <span
                                      className={`text-xs sm:text-sm font-bold truncate ${
                                        isT2Winner ? 'text-[var(--accent)]' : 'text-[var(--text)]'
                                      }`}
                                    >
                                      {session.team2Name}
                                    </span>
                                  </div>
                                  {session.team2Players && session.team2Players.length > 0 && (session.mode ?? '2vs2') === '2vs2' && (
                                    <span className="text-[11px] text-[var(--text-muted)] truncate block mt-0.5">
                                      {session.team2Players.join(' & ')}
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={`text-lg sm:text-xl font-mono font-black tabular-nums shrink-0 ${
                                    isT2Winner ? 'text-[var(--accent-text)]' : 'text-[var(--text-muted)]'
                                  }`}
                                >
                                  {session.team2Wins}
                                </span>
                              </div>
                            </div>
                          )}
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
                            {dailySummary.championTeam.playerIds.length === 1
                              ? 'Campione più vincente del giorno'
                              : 'Squadra più vincente del giorno'}
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
                      Partite Singole ({dailySummary.matches.length})
                    </h4>

                    <div className="space-y-2">
                      {dailySummary.matches.map((m) => {
                        const t1 = teamMap.get(m.team1Id);
                        const t2 = teamMap.get(m.team2Id);
                        const isT1Winner =
                          m.winnerTeamId === m.team1Id ||
                          (m.scoreTeam1 !== undefined && m.scoreTeam2 !== undefined && m.scoreTeam1 > m.scoreTeam2);
                        const isT2Winner =
                          m.winnerTeamId === m.team2Id ||
                          (m.scoreTeam1 !== undefined && m.scoreTeam2 !== undefined && m.scoreTeam2 > m.scoreTeam1);
                        const winnerName = isT1Winner ? (t1?.name || 'Squadra 1') : isT2Winner ? (t2?.name || 'Squadra 2') : '';

                        const matchTime = new Date(m.timestamp).toLocaleTimeString('it-IT', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <div
                            key={m.id}
                            className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--divider)] hover:border-[var(--control-border)] interactive-card space-y-2.5"
                          >
                            <div className="flex items-center justify-between text-xs text-[var(--text-subtle)] font-mono gap-2">
                              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                <span className="tabular-nums">{matchTime}</span>
                                {winnerName && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--accent-text)] bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full shadow-sm font-sans">
                                    <Trophy className="w-3 h-3 text-[var(--accent)] fill-[var(--accent)] shrink-0" />
                                    <span className="truncate max-w-[130px] sm:max-w-[180px]">Vinto da {winnerName}</span>
                                  </span>
                                )}
                                {m.notes && (
                                  <span className="text-[11px] text-[var(--text-muted)] truncate max-w-[160px] pl-1 font-sans">
                                    • {m.notes}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteMatch(m.id)}
                                aria-label="Elimina partita"
                                className="touch-target p-1 rounded-lg text-[var(--text-subtle)] hover:text-rose-400 hover:bg-[var(--surface-alt)] transition-colors cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Scoreboard: Due box squadra strutturati con evidenziazione vincitore */}
                            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3 pt-0.5">
                              {/* Team 1 (Left Box) */}
                              <div
                                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 min-w-0 transition-all ${
                                  isT1Winner
                                    ? 'bg-[var(--accent-muted)]/20 border-[var(--accent)] ring-1 ring-[var(--accent)]/40 shadow-sm'
                                    : 'bg-[var(--surface-alt)] border-[var(--divider)]'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {isT1Winner && (
                                    <Trophy className="w-3.5 h-3.5 text-[var(--accent)] fill-[var(--accent)] shrink-0" />
                                  )}
                                  <span
                                    className={`text-xs sm:text-sm font-bold truncate ${
                                      isT1Winner ? 'text-[var(--accent)]' : 'text-[var(--text)]'
                                    }`}
                                  >
                                    {t1?.name || 'Squadra 1'}
                                  </span>
                                </div>
                                <span
                                  className={`text-base sm:text-lg font-mono font-black tabular-nums shrink-0 ${
                                    isT1Winner ? 'text-[var(--accent-text)]' : 'text-[var(--text-muted)]'
                                  }`}
                                >
                                  {m.scoreTeam1 !== undefined ? m.scoreTeam1 : (isT1Winner ? '1' : '0')}
                                </span>
                              </div>

                              {/* VS divider */}
                              <span className="text-xs font-mono font-bold text-[var(--text-subtle)] px-1 shrink-0">VS</span>

                              {/* Team 2 (Right Box) */}
                              <div
                                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 min-w-0 transition-all ${
                                  isT2Winner
                                    ? 'bg-[var(--accent-muted)]/20 border-[var(--accent)] ring-1 ring-[var(--accent)]/40 shadow-sm'
                                    : 'bg-[var(--surface-alt)] border-[var(--divider)]'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {isT2Winner && (
                                    <Trophy className="w-3.5 h-3.5 text-[var(--accent)] fill-[var(--accent)] shrink-0" />
                                  )}
                                  <span
                                    className={`text-xs sm:text-sm font-bold truncate ${
                                      isT2Winner ? 'text-[var(--accent)]' : 'text-[var(--text)]'
                                    }`}
                                  >
                                    {t2?.name || 'Squadra 2'}
                                  </span>
                                </div>
                                <span
                                  className={`text-base sm:text-lg font-mono font-black tabular-nums shrink-0 ${
                                    isT2Winner ? 'text-[var(--accent-text)]' : 'text-[var(--text-muted)]'
                                  }`}
                                >
                                  {m.scoreTeam2 !== undefined ? m.scoreTeam2 : (isT2Winner ? '1' : '0')}
                                </span>
                              </div>
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
