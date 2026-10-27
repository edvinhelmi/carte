import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, Calendar } from 'lucide-react';
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

  // Gestione click esterno per dismiss (compatibile con modern-web-guidance)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const isOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;
    if (isOutside) {
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
      className="m-auto p-0 rounded-2xl bg-zinc-900 text-zinc-100 border border-zinc-700/80 shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm max-w-lg w-[95vw] overflow-hidden"
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* Header Modal */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h2 id="quick-match-title" className="font-bold text-base text-zinc-100">
              Registra Risultato Briscola
            </h2>
            <p className="text-xs text-zinc-400">Assegna la vittoria con un solo tocco</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
        {teams.length < 2 ? (
          <div className="text-center py-6 space-y-3">
            <p className="text-sm text-zinc-300">
              Servono almeno due squadre per registrare una partita!
            </p>
            <p className="text-xs text-zinc-400">
              Crea le squadre nella sezione &quot;Squadre &amp; Giocatori&quot; oppure ricarica i dati demo dalle Impostazioni.
            </p>
          </div>
        ) : (
          <>
            {/* Selettore Data & Gioco */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 pb-1">
              <div className="flex items-center gap-1.5 bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700/60">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <input
                  type="date"
                  value={dateKey}
                  onChange={(e) => setCustomDateKey(e.target.value)}
                  className="bg-transparent text-zinc-200 focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-lg font-medium">
                <SuitIcon suit="denari" className="w-3.5 h-3.5" />
                <span>Briscola (2v2 o 1v1)</span>
              </div>
            </div>

            {/* Confronto Squadre: Team 1 vs Team 2 */}
            <div className="grid grid-cols-2 gap-3 items-center">
              {/* Selezione Squadra 1 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Squadra 1
                </label>
                <select
                  value={team1Id}
                  onChange={(e) => setCustomTeam1Id(e.target.value)}
                  className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id} disabled={t.id === team2Id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selezione Squadra 2 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Squadra 2
                </label>
                <select
                  value={team2Id}
                  onChange={(e) => setCustomTeam2Id(e.target.value)}
                  className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id} disabled={t.id === team1Id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* BOTTONI TOUCH-FRIENDLY DI ASSEGNAZIONE VITTORIA */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-zinc-300 block mb-2 text-center">
                👉 Tocca la squadra che ha VINTO la partita:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tasto Vittoria Team 1 */}
                <button
                  type="button"
                  onClick={() => handleRegisterWin(team1?.id || '')}
                  disabled={!team1 || team1.id === team2?.id}
                  className="group relative flex flex-col items-center justify-center p-4 rounded-xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-950/40 via-zinc-900 to-zinc-900 hover:border-emerald-400 hover:from-emerald-900/50 active:scale-95 transition-all text-center cursor-pointer shadow-lg shadow-emerald-950/20"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold tracking-wider uppercase mb-0.5">
                    Ha vinto
                  </span>
                  <span className="text-base font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors line-clamp-1">
                    {team1?.name || 'Squadra 1'}
                  </span>
                </button>

                {/* Tasto Vittoria Team 2 */}
                <button
                  type="button"
                  onClick={() => handleRegisterWin(team2?.id || '')}
                  disabled={!team2 || team1?.id === team2.id}
                  className="group relative flex flex-col items-center justify-center p-4 rounded-xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-950/40 via-zinc-900 to-zinc-900 hover:border-amber-400 hover:from-amber-900/50 active:scale-95 transition-all text-center cursor-pointer shadow-lg shadow-amber-950/20"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-amber-400 font-semibold tracking-wider uppercase mb-0.5">
                    Ha vinto
                  </span>
                  <span className="text-base font-bold text-zinc-100 group-hover:text-amber-300 transition-colors line-clamp-1">
                    {team2?.name || 'Squadra 2'}
                  </span>
                </button>
              </div>
            </div>

            {/* Dettagli Opzionali (Punteggio, Note) */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Dettagli opzionali (punteggi &amp; note)</span>
                <button
                  type="button"
                  onClick={() => setIsQuickWinMode(!isQuickWinMode)}
                  className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 cursor-pointer"
                >
                  {isQuickWinMode ? '+ Aggiungi punti/note' : 'Nascondi dettagli'}
                </button>
              </div>

              {!isQuickWinMode && (
                <div className="space-y-3 bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800">
                  {/* Punteggio Briscola (opzionale) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">
                        Punti {team1?.name} (es. 64)
                      </label>
                      <input
                        type="number"
                        placeholder="Es. 65"
                        value={score1}
                        onChange={(e) => setScore1(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">
                        Punti {team2?.name} (es. 56)
                      </label>
                      <input
                        type="number"
                        placeholder="Es. 55"
                        value={score2}
                        onChange={(e) => setScore2(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Note e tag veloci */}
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Note sulla mano:</label>
                    <input
                      type="text"
                      placeholder="Es. Capotto all'ultima mano..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:outline-none mb-2"
                    />

                    {/* Tag rapidi cliccabili */}
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setNotes((prev) => (prev ? `${prev} - ${tag}` : tag))}
                          className="px-2 py-0.5 rounded-full text-[11px] bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700/60 cursor-pointer transition-colors"
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
