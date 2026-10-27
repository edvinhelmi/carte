import React, { useState } from 'react';
import { Users, User, Plus, Trash2, Shield, X, ChevronDown } from 'lucide-react';
import { Player, Team, CardSuit } from '@/types/game';
import { StorageService } from '@/lib/storage';
import { SuitIcon } from './SuitIcon';

interface TeamsAndPlayersViewProps {
  players: Player[];
  teams: Team[];
  onDataUpdated: () => void;
}

export function TeamsAndPlayersView({ players, teams, onDataUpdated }: TeamsAndPlayersViewProps) {
  // Gestione stato form Giocatore
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerNickname, setPlayerNickname] = useState('');
  const [playerSuit, setPlayerSuit] = useState<CardSuit>('denari');

  // Gestione stato form Squadra
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [selectedPlayer1, setSelectedPlayer1] = useState('');
  const [selectedPlayer2, setSelectedPlayer2] = useState('');

  const playerMap = new Map(players.map((p) => [p.id, p]));

  // Salvataggio nuovo giocatore
  const handleSavePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    const newPlayer: Player = {
      id: 'p_' + Date.now(),
      name: playerName.trim(),
      nickname: playerNickname.trim() || undefined,
      avatarSuit: playerSuit,
      createdAt: new Date().toISOString(),
    };

    StorageService.savePlayer(newPlayer);
    setPlayerName('');
    setPlayerNickname('');
    setShowPlayerModal(false);
    onDataUpdated();
  };

  // Eliminazione giocatore
  const handleDeletePlayer = (playerId: string) => {
    if (confirm('Sei sicuro di voler eliminare questo giocatore?')) {
      StorageService.deletePlayer(playerId);
      onDataUpdated();
    }
  };

  // Salvataggio nuova squadra predefinita
  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    if (!selectedPlayer1) {
      alert('Seleziona almeno il primo giocatore per la squadra');
      return;
    }

    const playerIds = [selectedPlayer1];
    if (selectedPlayer2 && selectedPlayer2 !== selectedPlayer1) {
      playerIds.push(selectedPlayer2);
    }

    const newTeam: Team = {
      id: 't_' + Date.now(),
      name: teamName.trim(),
      playerIds,
      color: '#10b981',
      createdAt: new Date().toISOString(),
    };

    StorageService.saveTeam(newTeam);
    setTeamName('');
    setSelectedPlayer1('');
    setSelectedPlayer2('');
    setShowTeamModal(false);
    onDataUpdated();
  };

  // Eliminazione squadra
  const handleDeleteTeam = (teamId: string) => {
    if (confirm('Sei sicuro di voler eliminare questa squadra?')) {
      StorageService.deleteTeam(teamId);
      onDataUpdated();
    }
  };

  return (
    <div className="space-y-8" data-reveal="rise">
      {/* Intestazione */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight flex items-center gap-2.5">
          <Users className="w-6 h-6 text-[var(--accent)]" />
          <span>Squadre &amp; Giocatori di Casa</span>
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
          Configura gli amici e i familiari che giocano e componi le coppie per la Briscola.
        </p>
      </div>

      {/* SEZIONE 1: SQUADRE (TEAMS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="font-heading text-lg font-bold text-[var(--text)]">
              Squadre Registrate ({teams.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowTeamModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] hover:border-[var(--control-border-hover)] text-xs font-semibold text-[var(--text)] btn-tactile cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Nuova Squadra</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => {
            const teamPlayers = team.playerIds
              .map((id) => playerMap.get(id))
              .filter(Boolean) as Player[];
            return (
              <div
                key={team.id}
                className="bg-[var(--surface)] rounded-2xl border border-[var(--divider)] hover:border-[var(--control-border)] p-5 interactive-card flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[var(--surface-raised)] border border-[var(--control-border)] flex items-center justify-center text-[var(--accent)] font-bold text-xs font-mono">
                        {team.name.slice(0, 2).toUpperCase()}
                      </div>
                      <h3 className="font-heading font-bold text-base text-[var(--text)]">{team.name}</h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTeam(team.id)}
                      aria-label="Elimina squadra"
                      className="touch-target p-1.5 rounded-lg text-[var(--text-subtle)] hover:text-rose-400 hover:bg-[var(--surface-raised)] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3.5 space-y-1.5">
                    <span className="text-[11px] font-semibold text-[var(--text-subtle)] block">
                      Formazione:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {teamPlayers.length > 0 ? (
                        teamPlayers.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--divider)]"
                          >
                            <SuitIcon suit={p.avatarSuit} className="w-3.5 h-3.5 text-[var(--accent)]" />
                            <span>{p.name}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">Nessun giocatore</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--divider)] text-[11px] text-[var(--text-subtle)]">
                  {teamPlayers.length === 2 ? 'Squadra da 2 (Coppia standard)' : 'Giocatore singolo (1v1)'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEZIONE 2: GIOCATORI (PLAYERS) */}
      <div className="space-y-4 pt-4 border-t border-[var(--divider)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="font-heading text-lg font-bold text-[var(--text)]">
              Singoli Giocatori ({players.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowPlayerModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] hover:border-[var(--control-border-hover)] text-xs font-semibold text-[var(--text)] btn-tactile cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Nuovo Giocatore</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {players.map((player) => (
            <div
              key={player.id}
              className="bg-[var(--surface)] rounded-xl border border-[var(--divider)] hover:border-[var(--control-border)] p-3.5 flex items-center justify-between interactive-card group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[var(--surface-raised)] border border-[var(--control-border)] flex items-center justify-center shrink-0 group-hover:border-[var(--accent)]/50 transition-colors">
                  <SuitIcon suit={player.avatarSuit} className="w-4 h-4 text-[var(--accent)] icon-hover-tilt" />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-sm text-[var(--text)] block truncate">
                    {player.name}
                  </span>
                  {player.nickname && (
                    <span className="text-[11px] text-[var(--text-muted)] block truncate italic">
                      &quot;{player.nickname}&quot;
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDeletePlayer(player.id)}
                aria-label="Elimina giocatore"
                className="touch-target p-1.5 rounded-md text-[var(--text-subtle)] hover:text-rose-400 hover:bg-[var(--surface-raised)] transition-colors shrink-0 cursor-pointer ml-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL AGGIUNGI GIOCATORE */}
      {showPlayerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--control-border)] p-6 max-w-sm w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-[var(--text)]">Nuovo Giocatore</h3>
              <button
                type="button"
                onClick={() => setShowPlayerModal(false)}
                className="touch-target p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlayer} className="space-y-4">
              <div>
                <label className="text-xs text-[var(--text-muted)] block mb-1.5 font-medium">Nome:</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Luca"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-xl px-3.5 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                />
              </div>

              <div>
                <label className="text-xs text-[var(--text-muted)] block mb-1.5 font-medium">
                  Soprannome (opzionale):
                </label>
                <input
                  type="text"
                  placeholder="Es. Il Re delle Coppe"
                  value={playerNickname}
                  onChange={(e) => setPlayerNickname(e.target.value)}
                  className="w-full bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-xl px-3.5 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                />
              </div>

              <div>
                <label className="text-xs text-[var(--text-muted)] block mb-1.5 font-medium">
                  Seme preferito:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['coppe', 'denari', 'spade', 'bastoni'] as CardSuit[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPlayerSuit(s)}
                      className={`p-2.5 rounded-xl flex flex-col items-center justify-center border btn-tactile cursor-pointer ${
                        playerSuit === s
                          ? 'bg-[var(--accent-muted)] border-[var(--accent)] text-[var(--accent-text)]'
                          : 'bg-[var(--surface-alt)] border-[var(--divider)] text-[var(--text-muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      <SuitIcon suit={s} className="w-5 h-5 mb-1" />
                      <span className="text-[10px] capitalize font-medium">{s}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPlayerModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)] cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] font-bold text-xs btn-tactile cursor-pointer shadow-sm"
                >
                  Salva Giocatore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREA SQUADRA */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--control-border)] p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-[var(--text)]">Crea Nuova Squadra</h3>
              <button
                type="button"
                onClick={() => setShowTeamModal(false)}
                className="touch-target p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="space-y-4">
              <div>
                <label className="text-xs text-[var(--text-muted)] block mb-1.5 font-medium">Nome Squadra:</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Gli Invincibili"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-xl px-3.5 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1.5 font-medium">Giocatore 1:</label>
                  <div className="relative">
                    <select
                      required
                      value={selectedPlayer1}
                      onChange={(e) => setSelectedPlayer1(e.target.value)}
                      className="w-full appearance-none bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-xl pl-3 pr-8 py-2 text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] cursor-pointer truncate"
                    >
                      <option value="">Seleziona...</option>
                      {players.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 shrink-0" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1.5 font-medium">
                    Giocatore 2 (opzionale):
                  </label>
                  <div className="relative">
                    <select
                      value={selectedPlayer2}
                      onChange={(e) => setSelectedPlayer2(e.target.value)}
                      className="w-full appearance-none bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-xl pl-3 pr-8 py-2 text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] cursor-pointer truncate"
                    >
                      <option value="">Nessuno (1v1)</option>
                      {players.map((p) => (
                        <option key={p.id} value={p.id} disabled={p.id === selectedPlayer1}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 shrink-0" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)] cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] font-bold text-xs btn-tactile cursor-pointer shadow-sm"
                >
                  Salva Squadra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
