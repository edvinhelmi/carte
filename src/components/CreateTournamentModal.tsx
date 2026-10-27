import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, Swords, Shuffle, Check } from 'lucide-react';
import { Team, TournamentFormat, Tournament } from '@/types/game';
import { createKnockoutTournament, createRoundRobinTournament } from '@/lib/tournamentEngine';
import { StorageService } from '@/lib/storage';
import { SuitIcon } from './SuitIcon';

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  onTournamentCreated: (tournament: Tournament) => void;
}

export function CreateTournamentModal({
  isOpen,
  onClose,
  teams,
  onTournamentCreated,
}: CreateTournamentModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [name, setName] = useState('');
  const [format, setFormat] = useState<TournamentFormat>('knockout');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(() =>
    teams.slice(0, 4).map((t) => t.id)
  );
  const [shuffleTeams, setShuffleTeams] = useState(false);

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

  const toggleTeamSelection = (teamId: string) => {
    if (selectedTeamIds.includes(teamId)) {
      setSelectedTeamIds(selectedTeamIds.filter((id) => id !== teamId));
    } else {
      setSelectedTeamIds([...selectedTeamIds, teamId]);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Inserisci un nome per il torneo!');
      return;
    }

    if (format === 'knockout') {
      if (selectedTeamIds.length !== 4 && selectedTeamIds.length !== 8 && selectedTeamIds.length !== 2) {
        alert('Per il tabellone a eliminazione diretta, seleziona 2, 4 o 8 squadre!');
        return;
      }
    } else {
      if (selectedTeamIds.length < 3) {
        alert('Per un girone all’italiana servono almeno 3 squadre!');
        return;
      }
    }

    let finalTeamIds = [...selectedTeamIds];
    if (shuffleTeams) {
      // Mischia casualmente
      finalTeamIds = finalTeamIds.sort(() => Math.random() - 0.5);
    }

    let newTournament: Tournament;
    if (format === 'knockout') {
      newTournament = createKnockoutTournament(name.trim(), finalTeamIds, 'briscola');
    } else {
      newTournament = createRoundRobinTournament(name.trim(), finalTeamIds, 'briscola');
    }

    StorageService.saveTournament(newTournament);
    onTournamentCreated(newTournament);
    setName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={onClose}
      aria-labelledby="create-tournament-title"
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
            <h2 id="create-tournament-title" className="font-bold text-base text-zinc-100">
              Crea Nuovo Torneo di Briscola
            </h2>
            <p className="text-xs text-zinc-400">Aggiornamenti e tabellone in tempo reale</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleCreate} className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
        {/* Nome Torneo */}
        <div>
          <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
            Nome del Torneo:
          </label>
          <input
            type="text"
            required
            placeholder="Es. Coppa Briscola di Natale, Torneo del Sabato..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Scelta Formato Torneo */}
        <div>
          <label className="text-xs font-semibold text-zinc-300 block mb-2">
            Formato di Gara:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Formato 1: Eliminazione diretta */}
            <button
              type="button"
              onClick={() => setFormat('knockout')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                format === 'knockout'
                  ? 'bg-amber-500/15 border-amber-400/80 shadow-md shadow-amber-500/10'
                  : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                  <Swords className="w-4 h-4 text-amber-400" />
                  <span>Eliminazione Diretta</span>
                </span>
                {format === 'knockout' && <Check className="w-4 h-4 text-amber-400" />}
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Tabellone a semifinali e finale. Chi vince avanza in tempo reale verso la coppa! (2, 4 o 8 squadre)
              </p>
            </button>

            {/* Formato 2: Girone all'Italiana */}
            <button
              type="button"
              onClick={() => setFormat('round_robin')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                format === 'round_robin'
                  ? 'bg-amber-500/15 border-amber-400/80 shadow-md shadow-amber-500/10'
                  : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  <span>Girone all’Italiana</span>
                </span>
                {format === 'round_robin' && <Check className="w-4 h-4 text-amber-400" />}
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Tutti contro tutti. Classifica a punti live sempre aggiornata per ogni vittoria.
              </p>
            </button>
          </div>
        </div>

        {/* Selezione Squadre */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-zinc-300">
              Seleziona Squadre Partecipanti ({selectedTeamIds.length} scelte):
            </label>
            <button
              type="button"
              onClick={() => setShuffleTeams(!shuffleTeams)}
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                shuffleTeams
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <Shuffle className="w-3 h-3" />
              <span>Sorteggio casuale</span>
            </button>
          </div>

          {teams.length === 0 ? (
            <p className="text-xs text-zinc-400 py-3 text-center">
              Nessuna squadra presente. Creane prima qualcuna nella sezione Squadre.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {teams.map((team) => {
                const isSelected = selectedTeamIds.includes(team.id);
                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => toggleTeamSelection(team.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800 border-amber-500/50 text-zinc-100 font-semibold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isSelected
                          ? 'bg-amber-500 border-amber-500 text-zinc-950'
                          : 'border-zinc-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    {team.suit && <SuitIcon suit={team.suit} className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    <span className="truncate">{team.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {format === 'knockout' && (
            <p className="text-[11px] text-amber-400/90 mt-1.5">
              💡 Per l&apos;eliminazione diretta seleziona esattamente <strong>4 squadre</strong> (2 semifinali + finale) o <strong>8 squadre</strong> (quarti + semifinali + finale).
            </p>
          )}
        </div>

        {/* Azioni */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
          >
            Annulla
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
          >
            Crea e Avvia Torneo 🚀
          </button>
        </div>
      </form>
    </dialog>
  );
}
