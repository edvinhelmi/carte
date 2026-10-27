import React, { useState } from 'react';
import { Users, User, Plus, Trash2, Shield } from 'lucide-react';
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
  const [teamSuit, setTeamSuit] = useState<CardSuit>('bastoni');

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

  // Salvataggio nuova squadra
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
      suit: teamSuit,
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
    <div className="space-y-8">
      {/* Intestazione */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-amber-400" />
          <span>Squadre &amp; Giocatori di Casa</span>
        </h1>
        <p className="text-sm text-zinc-400">
          Configura gli amici e i familiari che giocano e componi le coppie per la Briscola.
        </p>
      </div>

      {/* SEZIONE 1: SQUADRE (TEAMS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-zinc-100">Squadre Registrate ({teams.length})</h2>
          </div>
          <button
            onClick={() => setShowTeamModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition-all cursor-pointer shadow-sm shadow-amber-500/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crea Nuova Squadra</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => {
            const teamPlayers = team.playerIds.map((id) => playerMap.get(id)).filter(Boolean) as Player[];
            return (
              <div
                key={team.id}
                className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-4 sm:p-5 hover:border-zinc-700 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {team.suit && (
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400">
                          <SuitIcon suit={team.suit} className="w-4 h-4" />
                        </div>
                      )}
                      <h3 className="font-bold text-base text-zinc-100">{team.name}</h3>
                    </div>

                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      aria-label="Elimina squadra"
                      className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                      Formazione:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {teamPlayers.length > 0 ? (
                        teamPlayers.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-200 border border-zinc-700/60"
                          >
                            <SuitIcon suit={p.avatarSuit} className="w-3 h-3 text-amber-400" />
                            <span>{p.name}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-zinc-500">Nessun giocatore</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-500">
                  {teamPlayers.length === 2 ? 'Squadra da 2 (Coppia standard)' : 'Giocatore singolo (1v1)'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEZIONE 2: GIOCATORI (PLAYERS) */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-zinc-100">Singoli Giocatori ({players.length})</h2>
          </div>
          <button
            onClick={() => setShowPlayerModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold text-xs border border-zinc-700 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Aggiungi Giocatore</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {players.map((player) => (
            <div
              key={player.id}
              className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-3 flex items-center justify-between hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center shrink-0">
                  <SuitIcon suit={player.avatarSuit} className="w-4 h-4 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-sm text-zinc-200 block truncate">
                    {player.name}
                  </span>
                  {player.nickname && (
                    <span className="text-[11px] text-zinc-400 block truncate">
                      &quot;{player.nickname}&quot;
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDeletePlayer(player.id)}
                aria-label="Elimina giocatore"
                className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer ml-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL AGGIUNGI GIOCATORE */}
      {showPlayerModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-5 max-w-sm w-full space-y-4">
            <h3 className="font-bold text-base text-zinc-100">Nuovo Giocatore</h3>

            <form onSubmit={handleSavePlayer} className="space-y-3.5">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Nome:</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Luca"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Soprannome (opzionale):</label>
                <input
                  type="text"
                  placeholder="Es. Il Re delle Coppe"
                  value={playerNickname}
                  onChange={(e) => setPlayerNickname(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Seme preferito:</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['coppe', 'denari', 'spade', 'bastoni'] as CardSuit[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPlayerSuit(s)}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer ${
                        playerSuit === s
                          ? 'bg-amber-500/20 border-amber-400 text-amber-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <SuitIcon suit={s} className="w-5 h-5 mb-1" />
                      <span className="text-[10px] capitalize">{s}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPlayerModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-5 max-w-md w-full space-y-4">
            <h3 className="font-bold text-base text-zinc-100">Crea Nuova Squadra</h3>

            <form onSubmit={handleSaveTeam} className="space-y-3.5">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Nome Squadra:</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Gli Invincibili"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Giocatore 1:</label>
                  <select
                    required
                    value={selectedPlayer1}
                    onChange={(e) => setSelectedPlayer1(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Seleziona...</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">
                    Giocatore 2 (opzionale per 1v1):
                  </label>
                  <select
                    value={selectedPlayer2}
                    onChange={(e) => setSelectedPlayer2(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Nessuno (giocatore singolo)</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id} disabled={p.id === selectedPlayer1}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Seme distintivo squadra:</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['coppe', 'denari', 'spade', 'bastoni'] as CardSuit[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTeamSuit(s)}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer ${
                        teamSuit === s
                          ? 'bg-amber-500/20 border-amber-400 text-amber-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <SuitIcon suit={s} className="w-5 h-5 mb-1" />
                      <span className="text-[10px] capitalize">{s}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs cursor-pointer"
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
