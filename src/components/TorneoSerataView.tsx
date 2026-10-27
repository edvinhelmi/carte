import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Swords,
  Plus,
  Minus,
  Trash2,
  Clock,
  Share2,
  Check,
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
  // Form creazione nuovo torneo
  const [team1Name, setTeam1Name] = useState('');
  const [team1SelectedPlayers, setTeam1SelectedPlayers] = useState<string[]>([]);
  const [team2Name, setTeam2Name] = useState('');
  const [team2SelectedPlayers, setTeam2SelectedPlayers] = useState<string[]>([]);
  const [customPlayerInput1, setCustomPlayerInput1] = useState('');
  const [customPlayerInput2, setCustomPlayerInput2] = useState('');
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* BARRA LIVE CLOUD SYNC & CONDIVISIONE */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-emerald-950/40 border border-emerald-500/30 px-4 py-2.5 rounded-2xl text-xs shadow-md">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-emerald-300 font-medium">
            <strong>Sincronizzazione Live Cloud:</strong> Chiunque apre il link dal telefono vede e modifica i punteggi in tempo reale.
          </span>
        </div>

        <button
          type="button"
          onClick={handleShareLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40 transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'Link Copiato!' : 'Condividi con chi gioca'}</span>
        </button>
      </div>

      {/* SEZIONE 1: TABELLONE IN TEMPO REALE SE C'È UN TORNEO ATTIVO */}
      {activeSession ? (
        <div className="space-y-6">
          {/* Header Torneo Attivo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/90 border border-amber-500/30 p-4 sm:p-5 rounded-2xl shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs uppercase tracking-wider font-bold text-emerald-400">
                  Torneo in corso stasera • Aggiornamento in Tempo Reale
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight mt-1">
                {activeSession.team1Name}{' '}
                <span className="text-amber-400 font-normal">vs</span>{' '}
                {activeSession.team2Name}
              </h1>
            </div>

            <button
              onClick={handleEndTournament}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-red-900/30 transition-all cursor-pointer"
            >
              <Trophy className="w-4 h-4 stroke-[2.5]" />
              <span>Fine Torneo (Concludi Serata)</span>
            </button>
          </div>

          {/* GRANDE SEGNAPUNTI LIVE AFFIANCATO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* PANNELLO SQUADRA 1 */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-950/30 via-zinc-900 to-zinc-900 border-2 border-emerald-500/40 p-6 sm:p-8 flex flex-col justify-between text-center shadow-2xl">
              <div>
                <span className="text-xs uppercase tracking-widest font-bold text-emerald-400 block mb-1">
                  Squadra 1
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
                  {activeSession.team1Name}
                </h2>
                {activeSession.team1Players.length > 0 && (
                  <p className="text-xs text-zinc-400 mt-1">
                    {activeSession.team1Players.join(' & ')}
                  </p>
                )}
              </div>

              {/* Numero Vittorie Gigante */}
              <div className="my-6">
                <span className="text-7xl sm:text-8xl font-black text-emerald-400 font-mono tracking-tight select-none">
                  {activeSession.team1Wins}
                </span>
                <span className="text-xs text-zinc-400 uppercase tracking-wider block mt-1 font-semibold">
                  {activeSession.team1Wins === 1 ? 'Vittoria' : 'Vittorie'}
                </span>
              </div>

              {/* Tasto Touch +1 Vittoria */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleAddWin(1)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:scale-95 text-zinc-950 font-black text-lg shadow-xl shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-6 h-6 stroke-[3]" />
                  <span>+1 Vittoria {activeSession.team1Name}</span>
                </button>

                {activeSession.team1Wins > 0 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveWin(1)}
                    className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 py-1 px-3 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Correggi (-1)</span>
                  </button>
                )}
              </div>
            </div>

            {/* PANNELLO SQUADRA 2 */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-950/30 via-zinc-900 to-zinc-900 border-2 border-amber-500/40 p-6 sm:p-8 flex flex-col justify-between text-center shadow-2xl">
              <div>
                <span className="text-xs uppercase tracking-widest font-bold text-amber-400 block mb-1">
                  Squadra 2
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
                  {activeSession.team2Name}
                </h2>
                {activeSession.team2Players.length > 0 && (
                  <p className="text-xs text-zinc-400 mt-1">
                    {activeSession.team2Players.join(' & ')}
                  </p>
                )}
              </div>

              {/* Numero Vittorie Gigante */}
              <div className="my-6">
                <span className="text-7xl sm:text-8xl font-black text-amber-400 font-mono tracking-tight select-none">
                  {activeSession.team2Wins}
                </span>
                <span className="text-xs text-zinc-400 uppercase tracking-wider block mt-1 font-semibold">
                  {activeSession.team2Wins === 1 ? 'Vittoria' : 'Vittorie'}
                </span>
              </div>

              {/* Tasto Touch +1 Vittoria */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleAddWin(2)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-95 text-zinc-950 font-black text-lg shadow-xl shadow-amber-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-6 h-6 stroke-[3]" />
                  <span>+1 Vittoria {activeSession.team2Name}</span>
                </button>

                {activeSession.team2Wins > 0 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveWin(2)}
                    className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 py-1 px-3 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Correggi (-1)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Barra riassunto serie */}
          <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-4 text-center">
            <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold block mb-2">
              Totale partite giocate stasera: {activeSession.team1Wins + activeSession.team2Wins}
            </span>
            <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-400 h-full transition-all duration-300"
                style={{
                  width: `${
                    activeSession.team1Wins + activeSession.team2Wins > 0
                      ? (activeSession.team1Wins /
                          (activeSession.team1Wins + activeSession.team2Wins)) *
                        100
                      : 50
                  }%`,
                }}
              />
              <div
                className="bg-amber-400 h-full transition-all duration-300"
                style={{
                  width: `${
                    activeSession.team1Wins + activeSession.team2Wins > 0
                      ? (activeSession.team2Wins /
                          (activeSession.team1Wins + activeSession.team2Wins)) *
                        100
                      : 50
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        /* SEZIONE 2: NESSUN TORNEO ATTIVO -> FORM SEMPLICE PER AVVIARE */
        <div className="bg-zinc-900/80 rounded-3xl border border-zinc-800 p-6 sm:p-8 shadow-2xl space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20 mb-2">
              <Swords className="w-3.5 h-3.5" />
              <span>Torneo Serata Briscola</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
              Avvia una Sfida per Stasera
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-xl">
              Scegli le due squadre e chi gioca. Non serve inserire nessun nome per il torneo: segna le vittorie mano dopo mano e a fine serata premi &quot;Fine Torneo&quot; per registrarlo nel calendario!
            </p>
          </div>

          <form onSubmit={handleStartTournament} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SQUADRA 1 */}
              <div className="bg-zinc-950/60 p-5 rounded-2xl border border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Squadra 1
                  </span>
                  {teams.length > 0 && (
                    <select
                      onChange={(e) => handleSelectTeam1Preset(e.target.value)}
                      defaultValue=""
                      className="bg-zinc-900 border border-zinc-700 text-[11px] text-zinc-300 rounded-lg px-2 py-1 focus:outline-none"
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
                  <label className="text-xs text-zinc-400 block mb-1">Nome Squadra:</label>
                  <input
                    type="text"
                    required
                    placeholder="Es. I Bastonatori"
                    value={team1Name}
                    onChange={(e) => setTeam1Name(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1.5">
                    Chi c&apos;è dentro la squadra:
                  </label>
                  {players.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {players.map((p) => {
                        const isSelected = team1SelectedPlayers.includes(p.name);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => togglePlayer1(p.name)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            + {p.name}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Input manuale se vuoi aggiungere altri nomi */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Aggiungi nome..."
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
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customPlayerInput1.trim()) {
                          togglePlayer1(customPlayerInput1.trim());
                          setCustomPlayerInput1('');
                        }
                      }}
                      className="px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded-lg text-xs hover:bg-zinc-700"
                    >
                      Aggiungi
                    </button>
                  </div>

                  {team1SelectedPlayers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {team1SelectedPlayers.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                        >
                          <span>{name}</span>
                          <button
                            type="button"
                            onClick={() => togglePlayer1(name)}
                            className="hover:text-red-400"
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
              <div className="bg-zinc-950/60 p-5 rounded-2xl border border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Squadra 2
                  </span>
                  {teams.length > 0 && (
                    <select
                      onChange={(e) => handleSelectTeam2Preset(e.target.value)}
                      defaultValue=""
                      className="bg-zinc-900 border border-zinc-700 text-[11px] text-zinc-300 rounded-lg px-2 py-1 focus:outline-none"
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
                  <label className="text-xs text-zinc-400 block mb-1">Nome Squadra:</label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Regine di Coppe"
                    value={team2Name}
                    onChange={(e) => setTeam2Name(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1.5">
                    Chi c&apos;è dentro la squadra:
                  </label>
                  {players.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {players.map((p) => {
                        const isSelected = team2SelectedPlayers.includes(p.name);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => togglePlayer2(p.name)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            + {p.name}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Input manuale squadra 2 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Aggiungi nome..."
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
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customPlayerInput2.trim()) {
                          togglePlayer2(customPlayerInput2.trim());
                          setCustomPlayerInput2('');
                        }
                      }}
                      className="px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded-lg text-xs hover:bg-zinc-700"
                    >
                      Aggiungi
                    </button>
                  </div>

                  {team2SelectedPlayers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {team2SelectedPlayers.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30"
                        >
                          <span>{name}</span>
                          <button
                            type="button"
                            onClick={() => togglePlayer2(name)}
                            className="hover:text-red-400"
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
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-95 text-zinc-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Swords className="w-5 h-5 stroke-[2.5]" />
                <span>Inizia Torneo Serata</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SEZIONE 3: STORICO TORNEI / SERATE CONCLUSI */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          <span>Serate &amp; Tornei Conclusi ({pastSessions.length})</span>
        </h2>

        {pastSessions.length === 0 ? (
          <div className="text-center py-8 bg-zinc-900/40 rounded-2xl border border-zinc-800 text-zinc-400 text-xs">
            Nessun torneo concluso finora. Avviane uno per stasera!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pastSessions.map((session) => {
              const isT1Winner = session.winnerTeam === 1;
              const isT2Winner = session.winnerTeam === 2;

              return (
                <div
                  key={session.id}
                  className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-4 hover:border-zinc-700 transition-colors flex items-center justify-between"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span>{session.dateKey}</span>
                      <span>•</span>
                      <span className="font-semibold text-amber-400">
                        {isT1Winner
                          ? `Campioni: ${session.team1Name} 🏆`
                          : isT2Winner
                          ? `Campioni: ${session.team2Name} 🏆`
                          : 'Pareggio'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <span
                        className={`font-bold ${
                          isT1Winner ? 'text-emerald-400' : 'text-zinc-300'
                        }`}
                      >
                        {session.team1Name} ({session.team1Wins})
                      </span>
                      <span className="text-xs text-zinc-500 font-bold">vs</span>
                      <span
                        className={`font-bold ${
                          isT2Winner ? 'text-amber-400' : 'text-zinc-300'
                        }`}
                      >
                        {session.team2Name} ({session.team2Wins})
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    aria-label="Elimina torneo"
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
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
