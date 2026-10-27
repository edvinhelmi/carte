import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Trophy,
  Swords,
  Plus,
  Trash2,
  Clock,
  Share2,
  Check,
  RotateCcw,
} from 'lucide-react';
import { TournamentSession, Team, Player } from '@/types/game';
import { StorageService } from '@/lib/storage';
import { RealtimeSyncService } from '@/lib/realtimeSync';
import { fireWinConfetti } from '@/lib/confetti';

interface TorneoSerataViewProps {
  sessions: TournamentSession[];
  activeSession: TournamentSession | null;
  teams: Team[];
  players: Player[];
  onDataUpdated: () => void;
}

export function TorneoSerataView({
  sessions,
  activeSession,
  teams,
  players,
  onDataUpdated,
}: TorneoSerataViewProps) {
  // Score bump animation triggers
  const [bumpTeam1, setBumpTeam1] = useState(false);
  const [bumpTeam2, setBumpTeam2] = useState(false);
  const prevWinsRef = useRef<{ id: string; t1: number; t2: number } | null>(null);

  useEffect(() => {
    if (!activeSession) {
      prevWinsRef.current = null;
      return;
    }
    if (prevWinsRef.current && prevWinsRef.current.id === activeSession.id) {
      if (activeSession.team1Wins > prevWinsRef.current.t1) {
        setBumpTeam1(true);
      }
      if (activeSession.team2Wins > prevWinsRef.current.t2) {
        setBumpTeam2(true);
      }
    }
    prevWinsRef.current = {
      id: activeSession.id,
      t1: activeSession.team1Wins,
      t2: activeSession.team2Wins,
    };
  }, [activeSession]);

  // Form creazione nuovo torneo
  const [team1Name, setTeam1Name] = useState('');
  const [team1SelectedPlayers, setTeam1SelectedPlayers] = useState<string[]>([]);
  const [team2Name, setTeam2Name] = useState('');
  const [team2SelectedPlayers, setTeam2SelectedPlayers] = useState<string[]>([]);
  const [customPlayerInput1, setCustomPlayerInput1] = useState('');
  const [customPlayerInput2, setCustomPlayerInput2] = useState('');
  const [copied, setCopied] = useState(false);

  // Suggerimenti predefiniti richiesti: Marghe, Irins, Simon, Edd
  const availablePlayerNames = useMemo(() => {
    const list = ['Marghe', 'Irins', 'Simon', 'Edd'];
    for (const p of players) {
      if (p.name && !list.includes(p.name)) {
        list.push(p.name);
      }
    }
    return list;
  }, [players]);

  const handleShareLink = () => {
    if (typeof window === 'undefined') return;
    const room = RealtimeSyncService.getRoom();
    const url = `${window.location.origin}?room=${room}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    } else {
      prompt('Copia questo link e invialo a chi gioca al tavolo:', url);
    }
  };

  // Seleziona una squadra esistente come preset
  const handleSelectTeam1Preset = (teamId: string) => {
    const t = teams.find((item) => item.id === teamId);
    if (!t) return;
    setTeam1Name(t.name);
    const pNames = t.playerIds
      .map((pId) => players.find((p) => p.id === pId)?.name)
      .filter(Boolean) as string[];
    setTeam1SelectedPlayers(pNames);
  };

  const handleSelectTeam2Preset = (teamId: string) => {
    const t = teams.find((item) => item.id === teamId);
    if (!t) return;
    setTeam2Name(t.name);
    const pNames = t.playerIds
      .map((pId) => players.find((p) => p.id === pId)?.name)
      .filter(Boolean) as string[];
    setTeam2SelectedPlayers(pNames);
  };

  // Toggle giocatore
  const togglePlayer1 = (name: string) => {
    if (team1SelectedPlayers.includes(name)) {
      setTeam1SelectedPlayers(team1SelectedPlayers.filter((p) => p !== name));
    } else {
      setTeam1SelectedPlayers([...team1SelectedPlayers, name]);
    }
  };

  const togglePlayer2 = (name: string) => {
    if (team2SelectedPlayers.includes(name)) {
      setTeam2SelectedPlayers(team2SelectedPlayers.filter((p) => p !== name));
    } else {
      setTeam2SelectedPlayers([...team2SelectedPlayers, name]);
    }
  };

  // Avvio torneo
  const handleStartTournament = (e: React.FormEvent) => {
    e.preventDefault();
    const t1 = team1Name.trim() || 'Squadra 1';
    const t2 = team2Name.trim() || 'Squadra 2';

    if (t1.toLowerCase() === t2.toLowerCase()) {
      alert('Inserisci due nomi di squadra diversi!');
      return;
    }

    StorageService.startTournamentSession(
      t1,
      team1SelectedPlayers,
      t2,
      team2SelectedPlayers
    );
    onDataUpdated();
  };

  // Incremento / Decremento vittorie in tempo reale
  const handleAddWin = (teamIndex: 1 | 2) => {
    if (!activeSession) return;
    if (teamIndex === 1) setBumpTeam1(true);
    if (teamIndex === 2) setBumpTeam2(true);
    StorageService.incrementTournamentWin(activeSession.id, teamIndex);
    fireWinConfetti();
    onDataUpdated();
  };

  const handleRemoveWin = (teamIndex: 1 | 2) => {
    if (!activeSession) return;
    StorageService.decrementTournamentWin(activeSession.id, teamIndex);
    onDataUpdated();
  };

  // Fine torneo
  const handleEndTournament = () => {
    if (!activeSession) return;
    const confirmEnd = confirm(
      `Concludere il torneo? Punteggio attuale: ${activeSession.team1Name} (${activeSession.team1Wins}) - (${activeSession.team2Wins}) ${activeSession.team2Name}. Verrà registrato nel calendario!`
    );
    if (!confirmEnd) return;

    const completed = StorageService.endTournamentSession(activeSession.id);
    if (completed && completed.winnerTeam !== 'pareggio') {
      fireWinConfetti();
    }
    onDataUpdated();
  };

  // Eliminazione
  const handleDeleteSession = (id: string) => {
    if (confirm('Vuoi rimuovere questo torneo dallo storico?')) {
      StorageService.deleteTournamentSession(id);
      onDataUpdated();
    }
  };

  const pastSessions = useMemo(
    () => sessions.filter((s) => s.status === 'completed'),
    [sessions]
  );

  const totalMatchesTonight = activeSession
    ? activeSession.team1Wins + activeSession.team2Wins
    : 0;

  return (
    <div className="space-y-6">
      {/* BARRA SINCRONIZZAZIONE LIVE & CONDIVISIONE */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--surface)] border border-[var(--divider)] px-4 sm:px-5 py-3 rounded-2xl shadow-sm">
        <div className="text-xs text-[var(--text)]">
          <span className="font-semibold text-[var(--text)]">Sincronizzazione live:</span>{' '}
          <span className="text-[var(--text-muted)]">
            Condividi il link con chi è al tavolo per vedere e aggiornare i punteggi da qualsiasi telefono.
          </span>
        </div>

        <button
          type="button"
          onClick={handleShareLink}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] text-[var(--text)] text-xs font-semibold border border-[var(--control-border)] hover:border-[var(--control-border-hover)] btn-tactile cursor-pointer"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
          ) : (
            <Share2 className="w-3.5 h-3.5 text-[var(--accent)]" />
          )}
          <span>{copied ? 'Link Copiato!' : 'Condividi Link Tavolo'}</span>
        </button>
      </div>

      {/* SEZIONE 1: TABELLONE IN TEMPO REALE SE C'È UN TORNEO ATTIVO */}
      {activeSession ? (
        <div className="space-y-6" data-reveal="rise">
          {/* Header Torneo Attivo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface)] border border-[var(--divider)] p-5 sm:p-6 rounded-2xl shadow-sm">
            <div>
              <div className="mb-1">
                <span className="text-xs font-semibold text-[var(--accent)] tracking-wide">
                  Torneo live in corso stasera
                </span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
                {activeSession.team1Name}{' '}
                <span className="text-[var(--accent)] font-normal">contro</span>{' '}
                {activeSession.team2Name}
              </h1>
            </div>

            <button
              type="button"
              onClick={handleEndTournament}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--surface-raised)] hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 border border-rose-500/30 hover:border-rose-500/50 font-bold text-xs btn-tactile cursor-pointer shadow-sm"
            >
              <Trophy className="w-4 h-4 text-[var(--accent)]" />
              <span>Concludi Serata Torneo</span>
            </button>
          </div>

          {/* GRANDE SEGNAPUNTI LIVE AFFIANCATO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* PANNELLO SQUADRA 1 */}
            <div
              className={`relative rounded-2xl p-6 sm:p-8 flex flex-col justify-between text-center transition-[border-color,box-shadow] duration-200 ${
                activeSession.team1Wins > activeSession.team2Wins
                  ? 'bg-[var(--surface)] border border-[var(--accent)] shadow-md shadow-amber-500/10 ring-1 ring-[var(--accent)]/30'
                  : 'bg-[var(--surface)] border border-[var(--divider)]'
              }`}
            >
              <div>
                <span className="text-xs font-medium text-[var(--text-muted)] block mb-1">
                  Squadra 1
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
                  {activeSession.team1Name}
                </h2>
                {activeSession.team1Players.length > 0 && (
                  <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">
                    {activeSession.team1Players.join(' & ')}
                  </p>
                )}
              </div>

              {/* Numero Vittorie Gigante con animazione pop su incremento */}
              <div className="my-6">
                <span
                  className={`text-7xl sm:text-8xl font-black text-[var(--text)] font-mono tabular-nums tracking-tight select-none block ${
                    bumpTeam1 ? 'animate-score-bump' : ''
                  }`}
                  onAnimationEnd={() => setBumpTeam1(false)}
                >
                  {activeSession.team1Wins}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-medium mt-1 block">
                  {activeSession.team1Wins === 1 ? 'partita vinta' : 'partite vinte'}
                </span>
              </div>

              {/* Tasto Touch +1 Vittoria */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleAddWin(1)}
                  className="w-full py-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] font-extrabold text-base sm:text-lg shadow-md shadow-amber-500/20 btn-tactile cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <Plus className="w-5 h-5 stroke-[3] transition-transform duration-200 group-hover:rotate-90" />
                  <span>+1 Vittoria {activeSession.team1Name}</span>
                </button>

                {activeSession.team1Wins > 0 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveWin(1)}
                    className="touch-target inline-flex items-center gap-1.5 text-xs text-[var(--text-subtle)] hover:text-[var(--text-muted)] py-1.5 px-3 rounded-lg hover:bg-[var(--surface-raised)] transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Correggi (-1)</span>
                  </button>
                )}
              </div>
            </div>

            {/* PANNELLO SQUADRA 2 */}
            <div
              className={`relative rounded-2xl p-6 sm:p-8 flex flex-col justify-between text-center transition-[border-color,box-shadow] duration-200 ${
                activeSession.team2Wins > activeSession.team1Wins
                  ? 'bg-[var(--surface)] border border-sky-400 shadow-md shadow-sky-500/10 ring-1 ring-sky-400/30'
                  : 'bg-[var(--surface)] border border-[var(--divider)]'
              }`}
            >
              <div>
                <span className="text-xs font-medium text-[var(--text-muted)] block mb-1">
                  Squadra 2
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
                  {activeSession.team2Name}
                </h2>
                {activeSession.team2Players.length > 0 && (
                  <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">
                    {activeSession.team2Players.join(' & ')}
                  </p>
                )}
              </div>

              {/* Numero Vittorie Gigante con animazione pop su incremento */}
              <div className="my-6">
                <span
                  className={`text-7xl sm:text-8xl font-black text-[var(--text)] font-mono tabular-nums tracking-tight select-none block ${
                    bumpTeam2 ? 'animate-score-bump-sky' : ''
                  }`}
                  onAnimationEnd={() => setBumpTeam2(false)}
                >
                  {activeSession.team2Wins}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-medium mt-1 block">
                  {activeSession.team2Wins === 1 ? 'partita vinta' : 'partite vinte'}
                </span>
              </div>

              {/* Tasto Touch +1 Vittoria */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleAddWin(2)}
                  className="w-full py-4 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] hover:border-[var(--control-border-hover)] text-[var(--text)] font-extrabold text-base sm:text-lg btn-tactile cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <Plus className="w-5 h-5 stroke-[3] text-[var(--accent)] transition-transform duration-200 group-hover:rotate-90" />
                  <span>+1 Vittoria {activeSession.team2Name}</span>
                </button>

                {activeSession.team2Wins > 0 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveWin(2)}
                    className="touch-target inline-flex items-center gap-1.5 text-xs text-[var(--text-subtle)] hover:text-[var(--text-muted)] py-1.5 px-3 rounded-lg hover:bg-[var(--surface-raised)] transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Correggi (-1)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Barra riassunto serie */}
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--divider)] p-5 text-center space-y-3">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
              <span>{activeSession.team1Name}: <strong className="text-[var(--text)] font-mono tabular-nums">{activeSession.team1Wins}</strong></span>
              <span>Totale partite stasera: <strong className="text-[var(--text)] font-mono tabular-nums">{totalMatchesTonight}</strong></span>
              <span>{activeSession.team2Name}: <strong className="text-[var(--text)] font-mono tabular-nums">{activeSession.team2Wins}</strong></span>
            </div>

            <div className="w-full bg-[var(--surface-alt)] h-2.5 rounded-full overflow-hidden flex">
              <div
                className="bg-[var(--accent)] h-full transition-[width] duration-300 ease-out"
                style={{
                  width: `${
                    totalMatchesTonight > 0
                      ? (activeSession.team1Wins / totalMatchesTonight) * 100
                      : 0
                  }%`,
                }}
              />
              <div
                className="bg-sky-400 h-full transition-[width] duration-300 ease-out"
                style={{
                  width: `${
                    totalMatchesTonight > 0
                      ? (activeSession.team2Wins / totalMatchesTonight) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        /* SEZIONE 2: NESSUN TORNEO ATTIVO -> FORM ELEGANTE PER AVVIARE */
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--divider)] p-6 sm:p-8 shadow-sm space-y-6" data-reveal="rise">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-muted)] text-[var(--accent-text)] text-xs font-semibold border border-[var(--accent-border)] mb-3">
              <Swords className="w-3.5 h-3.5" />
              <span>Nuova Serata di Torneo</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
              Avvia la Sfida di Stasera
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5 max-w-xl leading-relaxed">
              Scegli le due squadre e chi gioca al tavolo. Segna le vittorie mano dopo mano con un tocco e a fine serata premi &quot;Concludi Serata Torneo&quot; per archiviare il risultato nel calendario.
            </p>
          </div>

          <form onSubmit={handleStartTournament} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* SQUADRA 1 */}
              <div className="bg-[var(--surface-raised)] p-5 rounded-xl border border-[var(--control-border)] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--accent)]">
                    Squadra 1
                  </span>
                  {teams.length > 0 && (
                    <select
                      onChange={(e) => handleSelectTeam1Preset(e.target.value)}
                      defaultValue=""
                      className="bg-[var(--surface-alt)] border border-[var(--control-border)] text-xs text-[var(--text)] rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)]"
                    >
                      <option value="" disabled>
                        Scegli da squadre salvate...
                      </option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1.5">Nome Squadra:</label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Marghe & Irins"
                    value={team1Name}
                    onChange={(e) => setTeam1Name(e.target.value)}
                    className="w-full bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text)] font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  />
                </div>

                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-2">
                    Giocatori in squadra:
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {availablePlayerNames.map((name) => {
                      const isSelected = team1SelectedPlayers.includes(name);
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => togglePlayer1(name)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors btn-tactile cursor-pointer select-none ${
                            isSelected
                              ? 'bg-[var(--accent-muted)] text-[var(--accent-text)] border-[var(--accent-border)] font-bold'
                              : 'bg-[var(--surface-alt)] text-[var(--text-muted)] border-[var(--divider)] hover:text-[var(--text)] hover:border-[var(--control-border)]'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Input manuale se vuoi aggiungere altri nomi */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Altro nome..."
                      value={customPlayerInput1}
                      onChange={(e) => setCustomPlayerInput1(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (customPlayerInput1.trim()) {
                            togglePlayer1(customPlayerInput1.trim());
                            setCustomPlayerInput1('');
                          }
                        }
                      }}
                      className="flex-1 bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customPlayerInput1.trim()) {
                          togglePlayer1(customPlayerInput1.trim());
                          setCustomPlayerInput1('');
                        }
                      }}
                      className="px-3 py-1.5 bg-[var(--surface-alt)] border border-[var(--control-border)] text-[var(--text)] rounded-lg text-xs hover:bg-[var(--surface-hover)] btn-tactile cursor-pointer"
                    >
                      Aggiungi
                    </button>
                  </div>

                  {team1SelectedPlayers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {team1SelectedPlayers.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-[var(--accent-muted)] text-[var(--accent-text)] border border-[var(--accent-border)]"
                        >
                          <span>{name}</span>
                          <button
                            type="button"
                            onClick={() => togglePlayer1(name)}
                            className="hover:text-rose-400 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SQUADRA 2 */}
              <div className="bg-[var(--surface-raised)] p-5 rounded-xl border border-[var(--control-border)] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-400">
                    Squadra 2
                  </span>
                  {teams.length > 0 && (
                    <select
                      onChange={(e) => handleSelectTeam2Preset(e.target.value)}
                      defaultValue=""
                      className="bg-[var(--surface-alt)] border border-[var(--control-border)] text-xs text-[var(--text)] rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)]"
                    >
                      <option value="" disabled>
                        Scegli da squadre salvate...
                      </option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1.5">Nome Squadra:</label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Edd & Simon"
                    value={team2Name}
                    onChange={(e) => setTeam2Name(e.target.value)}
                    className="w-full bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text)] font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  />
                </div>

                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-2">
                    Giocatori in squadra:
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {availablePlayerNames.map((name) => {
                      const isSelected = team2SelectedPlayers.includes(name);
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => togglePlayer2(name)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors btn-tactile cursor-pointer select-none ${
                            isSelected
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/35 font-bold'
                              : 'bg-[var(--surface-alt)] text-[var(--text-muted)] border-[var(--divider)] hover:text-[var(--text)] hover:border-[var(--control-border)]'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Input manuale squadra 2 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Altro nome..."
                      value={customPlayerInput2}
                      onChange={(e) => setCustomPlayerInput2(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (customPlayerInput2.trim()) {
                            togglePlayer2(customPlayerInput2.trim());
                            setCustomPlayerInput2('');
                          }
                        }
                      }}
                      className="flex-1 bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customPlayerInput2.trim()) {
                          togglePlayer2(customPlayerInput2.trim());
                          setCustomPlayerInput2('');
                        }
                      }}
                      className="px-3 py-1.5 bg-[var(--surface-alt)] border border-[var(--control-border)] text-[var(--text)] rounded-lg text-xs hover:bg-[var(--surface-hover)] btn-tactile cursor-pointer"
                    >
                      Aggiungi
                    </button>
                  </div>

                  {team2SelectedPlayers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {team2SelectedPlayers.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30"
                        >
                          <span>{name}</span>
                          <button
                            type="button"
                            onClick={() => togglePlayer2(name)}
                            className="hover:text-rose-400 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                type="submit"
                className="px-8 py-3.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] font-extrabold text-sm shadow-md shadow-amber-500/20 btn-tactile cursor-pointer inline-flex items-center gap-2"
              >
                <Swords className="w-4 h-4 stroke-[2.5]" />
                <span>Inizia Torneo Serata</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SEZIONE 3: STORICO TORNEI / SERATE CONCLUSI */}
      <div className="space-y-4 pt-2">
        <h2 className="font-heading text-lg font-bold text-[var(--text)] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--accent)]" />
          <span>Serate Concluse ({pastSessions.length})</span>
        </h2>

        {pastSessions.length === 0 ? (
          <div className="text-center py-8 bg-[var(--surface)] rounded-2xl border border-[var(--divider)] text-[var(--text-muted)] text-xs">
            Nessun torneo concluso registrato. Avvia una sfida per iniziare lo storico di casa!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pastSessions.map((session) => {
              const isT1Winner = session.winnerTeam === 1;
              const isT2Winner = session.winnerTeam === 2;

              return (
                <div
                  key={session.id}
                  className="bg-[var(--surface)] rounded-xl border border-[var(--divider)] hover:border-[var(--control-border)] p-4 interactive-card flex items-center justify-between"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <span className="font-mono tabular-nums">{session.dateKey}</span>
                      <span>•</span>
                      <span className="font-semibold text-[var(--accent-text)]">
                        {isT1Winner
                          ? `Campioni: ${session.team1Name} 🏆`
                          : isT2Winner
                          ? `Campioni: ${session.team2Name} 🏆`
                          : 'Pareggio'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <span
                        className={`font-bold font-mono tabular-nums ${
                          isT1Winner ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {session.team1Name} ({session.team1Wins})
                      </span>
                      <span className="text-xs text-[var(--text-subtle)] font-bold">vs</span>
                      <span
                        className={`font-bold font-mono tabular-nums ${
                          isT2Winner ? 'text-sky-400' : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {session.team2Name} ({session.team2Wins})
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteSession(session.id)}
                    aria-label="Elimina torneo"
                    className="touch-target p-2 rounded-lg text-[var(--text-subtle)] hover:text-rose-400 hover:bg-[var(--surface-raised)] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
