import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, Calendar, ChevronDown } from 'lucide-react';
import { Team, Match, GameType } from '@/types/game';
import { StorageService, formatDateKey } from '@/lib/storage';
import { fireWinConfetti } from '@/lib/confetti';
import { SuitIcon } from './SuitIcon';

interface QuickMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  onMatchSaved: () => void;
  defaultDateKey?: string;
}

export function QuickMatchModal({
  isOpen,
  onClose,
  teams,
  onMatchSaved,
  defaultDateKey,
}: QuickMatchModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [customTeam1Id, setCustomTeam1Id] = useState<string>('');
  const [customTeam2Id, setCustomTeam2Id] = useState<string>('');
  const [score1, setScore1] = useState<string>('');
  const [score2, setScore2] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [gameType] = useState<GameType>('briscola');
  const [customDateKey, setCustomDateKey] = useState<string>('');
  const [isQuickWinMode, setIsQuickWinMode] = useState<boolean>(true);

  // Quick notes tags
  const QUICK_TAGS = ['Capotto!', 'Rimonta epica', 'Asso all’ultima mano', 'Presa decisiva', 'Mazzo fortunato'];

  const dateKey = customDateKey || defaultDateKey || formatDateKey();

  const team1Id = customTeam1Id || teams[0]?.id || '';
  const team2Id =
    customTeam2Id ||
    (teams.length > 1 ? (teams[1].id !== team1Id ? teams[1].id : teams[0].id) : teams[0]?.id) ||
    '';

  const team1 = teams.find((t) => t.id === team1Id);
  const team2 = teams.find((t) => t.id === team2Id);

  // Gestione apertura / chiusura modale con dialog HTML5
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Gestione click esterno per dismiss
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  const handleRegisterWin = (winnerId: string) => {
    if (!team1 || !team2) return;
    if (team1.id === team2.id) {
      alert('Seleziona due squadre diverse!');
      return;
    }

    const newMatch: Match = {
      id: 'm_' + Date.now(),
      gameType,
      timestamp: new Date().toISOString(),
      dateKey,
      team1Id: team1.id,
      team2Id: team2.id,
      winnerTeamId: winnerId,
      scoreTeam1: score1 !== '' ? Number(score1) : undefined,
      scoreTeam2: score2 !== '' ? Number(score2) : undefined,
      notes: notes.trim() || undefined,
    };

    StorageService.saveMatch(newMatch);
    fireWinConfetti();
    onMatchSaved();
    // Reset opzionale
    setScore1('');
    setScore2('');
    setNotes('');
    setCustomDateKey('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={onClose}
      aria-labelledby="quick-match-title"
      className="m-auto p-0 rounded-2xl bg-[var(--surface)] text-[var(--text)] border border-[var(--control-border)] shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-md max-w-lg w-[95vw] max-h-[min(90vh,calc(100dvh-2rem))] overflow-hidden flex flex-col"
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* Header Modal */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--divider)] bg-[var(--surface-raised)] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-muted)] border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent)] shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 id="quick-match-title" className="font-heading font-bold text-base text-[var(--text)] leading-tight truncate">
              Registra Risultato Briscola
            </h2>
            <p className="text-xs text-[var(--text-muted)] truncate">Assegna la vittoria con un solo tocco</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="touch-target p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer shrink-0 ml-2"
          aria-label="Chiudi"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-5 overflow-y-auto flex-1 min-h-0 max-h-[calc(100dvh-7rem)] sm:max-h-[75vh]">
        {teams.length < 2 ? (
          <div className="text-center py-6 space-y-3">
            <p className="text-sm font-semibold text-[var(--text)]">
              Servono almeno due squadre per registrare una partita!
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Crea le squadre nella sezione &quot;Squadre &amp; Giocatori&quot; oppure ricarica i dati demo dalle Impostazioni.
            </p>
          </div>
        ) : (
          <>
            {/* Selettore Data & Gioco */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)] pb-1">
              <div className="flex items-center gap-1.5 bg-[var(--surface-raised)] px-3 py-1.5 rounded-xl border border-[var(--control-border)]">
                <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
                <input
                  type="date"
                  value={dateKey}
                  onChange={(e) => setCustomDateKey(e.target.value)}
                  className="bg-transparent text-[var(--text)] font-mono focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-[var(--accent-muted)] text-[var(--accent-text)] border border-[var(--accent-border)] px-3 py-1.5 rounded-xl font-medium">
                <SuitIcon suit="denari" className="w-3.5 h-3.5" />
                <span>Briscola (2v2 o 1v1)</span>
              </div>
            </div>

            {/* Confronto Squadre: Team 1 vs Team 2 */}
            <div className="grid grid-cols-2 gap-3 items-center">
              {/* Selezione Squadra 1 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-muted)] block">
                  Squadra 1
                </label>
                <div className="relative">
                  <select
                    value={team1Id}
                    onChange={(e) => setCustomTeam1Id(e.target.value)}
                    className="w-full appearance-none bg-[var(--surface-raised)] border border-[var(--control-border)] rounded-xl pl-3 pr-8 py-2 text-xs sm:text-sm text-[var(--text)] font-semibold focus:ring-2 focus:ring-[var(--focus-ring)] focus:outline-none cursor-pointer truncate"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id} disabled={t.id === team2Id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 shrink-0" />
                </div>
              </div>

              {/* Selezione Squadra 2 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-muted)] block">
                  Squadra 2
                </label>
                <div className="relative">
                  <select
                    value={team2Id}
                    onChange={(e) => setCustomTeam2Id(e.target.value)}
                    className="w-full appearance-none bg-[var(--surface-raised)] border border-[var(--control-border)] rounded-xl pl-3 pr-8 py-2 text-xs sm:text-sm text-[var(--text)] font-semibold focus:ring-2 focus:ring-[var(--focus-ring)] focus:outline-none cursor-pointer truncate"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id} disabled={t.id === team1Id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 shrink-0" />
                </div>
              </div>
            </div>

            {/* BOTTONI TOUCH-FRIENDLY DI ASSEGNAZIONE VITTORIA */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-[var(--text)] block mb-2.5 text-center">
                Tocca la squadra che ha vinto:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tasto Vittoria Team 1 */}
                <button
                  type="button"
                  onClick={() => handleRegisterWin(team1?.id || '')}
                  disabled={!team1 || team1.id === team2?.id}
                  className="group relative flex flex-col items-center justify-center p-4 rounded-xl border border-[var(--accent-border)] bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] hover:border-[var(--accent)] hover:shadow-[0_0_16px_rgba(245,158,11,0.2)] btn-tactile text-center cursor-pointer shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent-border)] flex items-center justify-center mb-2 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                    <Trophy className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  <span className="text-xs text-[var(--accent-text)] font-semibold mb-0.5">
                    Ha vinto
                  </span>
                  <span className="font-heading text-base font-extrabold text-[var(--text)] line-clamp-1">
                    {team1?.name || 'Squadra 1'}
                  </span>
                </button>

                {/* Tasto Vittoria Team 2 */}
                <button
                  type="button"
                  onClick={() => handleRegisterWin(team2?.id || '')}
                  disabled={!team2 || team1?.id === team2.id}
                  className="group relative flex flex-col items-center justify-center p-4 rounded-xl border border-[var(--control-border)] bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] hover:border-sky-400 hover:shadow-[0_0_16px_rgba(56,189,248,0.2)] btn-tactile text-center cursor-pointer shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/25 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:-rotate-6 transition-transform">
                    <Trophy className="w-5 h-5 text-sky-400" />
                  </div>
                  <span className="text-xs text-sky-300 font-semibold mb-0.5">
                    Ha vinto
                  </span>
                  <span className="font-heading text-base font-extrabold text-[var(--text)] line-clamp-1">
                    {team2?.name || 'Squadra 2'}
                  </span>
                </button>
              </div>
            </div>

            {/* Dettagli Opzionali (Punteggio, Note) */}
            <div className="pt-2 border-t border-[var(--divider)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">Dettagli opzionali (punti e note)</span>
                <button
                  type="button"
                  onClick={() => setIsQuickWinMode(!isQuickWinMode)}
                  className="touch-target text-xs text-[var(--accent-text)] hover:underline cursor-pointer font-medium"
                >
                  {isQuickWinMode ? '+ Aggiungi punti/note' : 'Nascondi dettagli'}
                </button>
              </div>

              {!isQuickWinMode && (
                <div className="space-y-3 bg-[var(--surface-raised)] p-4 rounded-xl border border-[var(--divider)]">
                  {/* Punteggio Briscola (opzionale) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-[var(--text-muted)] block mb-1">
                        Punti {team1?.name}
                      </label>
                      <input
                        type="number"
                        placeholder="Es. 64"
                        value={score1}
                        onChange={(e) => setScore1(e.target.value)}
                        className="w-full bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--text)] font-mono tabular-nums focus:ring-1 focus:ring-[var(--focus-ring)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[var(--text-muted)] block mb-1">
                        Punti {team2?.name}
                      </label>
                      <input
                        type="number"
                        placeholder="Es. 56"
                        value={score2}
                        onChange={(e) => setScore2(e.target.value)}
                        className="w-full bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--text)] font-mono tabular-nums focus:ring-1 focus:ring-[var(--focus-ring)] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Note e tag veloci */}
                  <div>
                    <label className="text-[11px] text-[var(--text-muted)] block mb-1">Note sulla partita:</label>
                    <input
                      type="text"
                      placeholder="Es. Capotto all'ultima mano..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--text)] focus:ring-1 focus:ring-[var(--focus-ring)] focus:outline-none mb-2"
                    />

                    {/* Tag rapidi cliccabili */}
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setNotes((prev) => (prev ? `${prev} - ${tag}` : tag))}
                          className="touch-target px-2.5 py-1 rounded-full text-[11px] bg-[var(--surface-alt)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--divider)] cursor-pointer transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
