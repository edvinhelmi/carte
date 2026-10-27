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
  ChevronDown,
  Users,
  User,
} from 'lucide-react';
import { TournamentSession, Team, Player, TournamentMode } from '@/types/game';
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
  const [bumpTeam3, setBumpTeam3] = useState(false);
  const prevWinsRef = useRef<{ id: string; t1: number; t2: number; t3: number } | null>(null);

  useEffect(() => {
    if (!activeSession) {
      prevWinsRef.current = null;
      return;
    }
    const t3Wins = activeSession.team3Wins || 0;
    if (prevWinsRef.current && prevWinsRef.current.id === activeSession.id) {
      if (activeSession.team1Wins > prevWinsRef.current.t1) {
        setBumpTeam1(true);
      }
      if (activeSession.team2Wins > prevWinsRef.current.t2) {
        setBumpTeam2(true);
      }
      if (t3Wins > prevWinsRef.current.t3) {
        setBumpTeam3(true);
      }
    }
    prevWinsRef.current = {
      id: activeSession.id,
      t1: activeSession.team1Wins,
      t2: activeSession.team2Wins,
      t3: t3Wins,
    };
  }, [activeSession]);

  // Modalità di torneo selezionata: 2vs2 (squadre), 1vs1 (singoli), 1vs1vs1 (a tre)
  const [tournamentMode, setTournamentMode] = useState<TournamentMode>('2vs2');

  // Form 2vs2 (Squadre)
  const [team1Name, setTeam1Name] = useState('');
  const [team1SelectedPlayers, setTeam1SelectedPlayers] = useState<string[]>([]);
  const [team2Name, setTeam2Name] = useState('');
  const [team2SelectedPlayers, setTeam2SelectedPlayers] = useState<string[]>([]);
  const [customPlayerInput1, setCustomPlayerInput1] = useState('');
  const [customPlayerInput2, setCustomPlayerInput2] = useState('');

  // Form 1vs1 (Singolo)
  const [singlePlayer1, setSinglePlayer1] = useState('');
  const [singlePlayer2, setSinglePlayer2] = useState('');

  // Form 1vs1vs1 (A tre)
  const [trioPlayer1, setTrioPlayer1] = useState('');
  const [trioPlayer2, setTrioPlayer2] = useState('');
  const [trioPlayer3, setTrioPlayer3] = useState('');

  const [copied, setCopied] = useState(false);

  // Suggerimenti predefiniti richiesti: Marghe, Irins, Simon, Edd
  const availablePlayerNames = useMemo(() => {
    const list = ['Marghe', 'Irins', 'Simon', 'Edd'];
    for (const p of players) {
      if (p.name && !list.some((n) => n.toLowerCase() === p.name.toLowerCase())) {
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

  // Seleziona una squadra esistente come preset (solo 2vs2)
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

  // Toggle giocatore 2vs2
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

    if (tournamentMode === '1vs1') {
      const p1 = singlePlayer1.trim();
      const p2 = singlePlayer2.trim();
      if (!p1 || !p2) {
        alert('Seleziona o inserisci entrambi i giocatori per la sfida 1 vs 1!');
        return;
      }
      if (p1.toLowerCase() === p2.toLowerCase()) {
        alert('I due giocatori devono avere nomi diversi!');
        return;
      }
      StorageService.startTournamentSession(p1, [p1], p2, [p2], '1vs1');
      setSinglePlayer1('');
      setSinglePlayer2('');
      onDataUpdated();
      return;
    }

    if (tournamentMode === '1vs1vs1') {
      const p1 = trioPlayer1.trim();
      const p2 = trioPlayer2.trim();
      const p3 = trioPlayer3.trim();
      if (!p1 || !p2 || !p3) {
        alert('Seleziona o inserisci tutti e 3 i giocatori per la sfida 1 vs 1 vs 1!');
        return;
      }
      if (
        p1.toLowerCase() === p2.toLowerCase() ||
        p1.toLowerCase() === p3.toLowerCase() ||
        p2.toLowerCase() === p3.toLowerCase()
      ) {
        alert('I 3 giocatori devono avere nomi tutti diversi!');
        return;
      }
      StorageService.startTournamentSession(p1, [p1], p2, [p2], '1vs1vs1', p3, [p3]);
      setTrioPlayer1('');
      setTrioPlayer2('');
      setTrioPlayer3('');
      onDataUpdated();
      return;
    }

    // Modalità 2vs2
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
      team2SelectedPlayers,
      '2vs2'
    );
    setTeam1Name('');
    setTeam2Name('');
    setTeam1SelectedPlayers([]);
    setTeam2SelectedPlayers([]);
    onDataUpdated();
  };

  // Incremento / Decremento vittorie in tempo reale
  const handleAddWin = (teamIndex: 1 | 2 | 3) => {
    if (!activeSession) return;
    if (teamIndex === 1) setBumpTeam1(true);
    if (teamIndex === 2) setBumpTeam2(true);
    if (teamIndex === 3) setBumpTeam3(true);
    StorageService.incrementTournamentWin(activeSession.id, teamIndex);
    fireWinConfetti();
    onDataUpdated();
  };

  const handleRemoveWin = (teamIndex: 1 | 2 | 3) => {
    if (!activeSession) return;
    StorageService.decrementTournamentWin(activeSession.id, teamIndex);
    onDataUpdated();
  };

  // Fine torneo
  const handleEndTournament = () => {
    if (!activeSession) return;
    const isThree = activeSession.mode === '1vs1vs1' || !!activeSession.team3Name;
    const scoreText = isThree
      ? `${activeSession.team1Name} (${activeSession.team1Wins}) - ${activeSession.team2Name} (${activeSession.team2Wins}) - ${activeSession.team3Name || 'Giocatore 3'} (${activeSession.team3Wins || 0})`
      : `${activeSession.team1Name} (${activeSession.team1Wins}) - ${activeSession.team2Name} (${activeSession.team2Wins})`;

    const confirmEnd = confirm(
      `Concludere il torneo? Punteggio attuale: ${scoreText}. Verrà registrato nel calendario!`
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

  const isThreeWay = Boolean(
    activeSession && (activeSession.mode === '1vs1vs1' || activeSession.team3Name)
  );

  const totalMatchesTonight = activeSession
    ? activeSession.team1Wins + activeSession.team2Wins + (activeSession.team3Wins || 0)
    : 0;

  // Rilevamento leader attuale nel tabellone
  const w1 = activeSession ? activeSession.team1Wins : 0;
  const w2 = activeSession ? activeSession.team2Wins : 0;
  const w3 = activeSession ? activeSession.team3Wins || 0 : 0;
  const isT1Leading = isThreeWay ? w1 > w2 && w1 > w3 : w1 > w2;
  const isT2Leading = isThreeWay ? w2 > w1 && w2 > w3 : w2 > w1;
  const isT3Leading = isThreeWay && w3 > w1 && w3 > w2;

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
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--accent)] tracking-wide">
                  Torneo live in corso stasera
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-muted)] text-[var(--accent-text)] border border-[var(--accent-border)] font-bold">
                  {activeSession.mode === '1vs1vs1'
                    ? '1 vs 1 vs 1'
                    : activeSession.mode === '1vs1'
                    ? '1 vs 1'
                    : '2 vs 2'}
                </span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
                {activeSession.team1Name}{' '}
                <span className="text-[var(--accent)] font-normal">vs</span>{' '}
                {activeSession.team2Name}
                {isThreeWay && (
                  <>
                    {' '}
                    <span className="text-[var(--accent)] font-normal">vs</span>{' '}
                    {activeSession.team3Name}
                  </>
                )}
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

          {/* GRANDE SEGNAPUNTI LIVE AFFIANCATO (2 O 3 PARTECIPANTI) */}
          <div
            className={`grid gap-4 sm:gap-6 ${
              isThreeWay ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'
            }`}
          >
            {/* PANNELLO 1 */}
            <div
              className={`relative rounded-2xl p-6 sm:p-8 flex flex-col justify-between text-center transition-[border-color,box-shadow] duration-200 ${
                isT1Leading
                  ? 'bg-[var(--surface)] border border-[var(--accent)] shadow-md shadow-amber-500/10 ring-1 ring-[var(--accent)]/30'
                  : 'bg-[var(--surface)] border border-[var(--divider)]'
              }`}
            >
              <div>
                <span className="text-xs font-medium text-[var(--text-muted)] block mb-1">
                  {(activeSession.mode ?? '2vs2') === '2vs2' ? 'Squadra 1' : 'Giocatore 1'}
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
                  {activeSession.team1Name}
                </h2>
                {activeSession.team1Players && activeSession.team1Players.length > 0 && (activeSession.mode ?? '2vs2') === '2vs2' && (
                  <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">
                    {activeSession.team1Players.join(' & ')}
                  </p>
                )}
              </div>

              {/* Numero Vittorie Gigante */}
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

            {/* PANNELLO 2 */}
            <div
              className={`relative rounded-2xl p-6 sm:p-8 flex flex-col justify-between text-center transition-[border-color,box-shadow] duration-200 ${
                isT2Leading
                  ? 'bg-[var(--surface)] border border-sky-400 shadow-md shadow-sky-500/10 ring-1 ring-sky-400/30'
                  : 'bg-[var(--surface)] border border-[var(--divider)]'
              }`}
            >
              <div>
                <span className="text-xs font-medium text-[var(--text-muted)] block mb-1">
                  {(activeSession.mode ?? '2vs2') === '2vs2' ? 'Squadra 2' : 'Giocatore 2'}
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
                  {activeSession.team2Name}
                </h2>
                {activeSession.team2Players && activeSession.team2Players.length > 0 && (activeSession.mode ?? '2vs2') === '2vs2' && (
                  <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">
                    {activeSession.team2Players.join(' & ')}
                  </p>
                )}
              </div>

              {/* Numero Vittorie Gigante */}
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
                  className="w-full py-4 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] hover:border-sky-500/40 text-[var(--text)] font-extrabold text-base sm:text-lg btn-tactile cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <Plus className="w-5 h-5 stroke-[3] text-sky-400 transition-transform duration-200 group-hover:rotate-90" />
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

            {/* PANNELLO 3 (SE IN 3 / 1vs1vs1) */}
            {isThreeWay && (
              <div
                className={`relative rounded-2xl p-6 sm:p-8 flex flex-col justify-between text-center transition-[border-color,box-shadow] duration-200 ${
                  isT3Leading
                    ? 'bg-[var(--surface)] border border-emerald-400 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-400/30'
                    : 'bg-[var(--surface)] border border-[var(--divider)]'
                }`}
              >
                <div>
                  <span className="text-xs font-medium text-[var(--text-muted)] block mb-1">
                    Giocatore 3
                  </span>
                  <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
                    {activeSession.team3Name || 'Giocatore 3'}
                  </h2>
                </div>

                {/* Numero Vittorie Gigante */}
                <div className="my-6">
                  <span
                    className={`text-7xl sm:text-8xl font-black text-[var(--text)] font-mono tabular-nums tracking-tight select-none block ${
                      bumpTeam3 ? 'animate-score-bump-emerald' : ''
                    }`}
                    onAnimationEnd={() => setBumpTeam3(false)}
                  >
                    {activeSession.team3Wins || 0}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-medium mt-1 block">
                    {(activeSession.team3Wins || 0) === 1 ? 'partita vinta' : 'partite vinte'}
                  </span>
                </div>

                {/* Tasto Touch +1 Vittoria */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleAddWin(3)}
                    className="w-full py-4 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] hover:border-emerald-500/40 text-[var(--text)] font-extrabold text-base sm:text-lg btn-tactile cursor-pointer flex items-center justify-center gap-2 group"
                  >
                    <Plus className="w-5 h-5 stroke-[3] text-emerald-400 transition-transform duration-200 group-hover:rotate-90" />
                    <span>+1 Vittoria {activeSession.team3Name || 'Giocatore 3'}</span>
                  </button>

                  {(activeSession.team3Wins || 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveWin(3)}
                      className="touch-target inline-flex items-center gap-1.5 text-xs text-[var(--text-subtle)] hover:text-[var(--text-muted)] py-1.5 px-3 rounded-lg hover:bg-[var(--surface-raised)] transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Correggi (-1)</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Barra riassunto serie */}
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--divider)] p-5 text-center space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)] font-medium">
              <span>
                {activeSession.team1Name}:{' '}
                <strong className="text-[var(--text)] font-mono tabular-nums">
                  {activeSession.team1Wins}
                </strong>
              </span>
              <span>
                Totale partite stasera:{' '}
                <strong className="text-[var(--text)] font-mono tabular-nums">
                  {totalMatchesTonight}
                </strong>
              </span>
              <span>
                {activeSession.team2Name}:{' '}
                <strong className="text-[var(--text)] font-mono tabular-nums">
                  {activeSession.team2Wins}
                </strong>
              </span>
              {isThreeWay && (
                <span>
                  {activeSession.team3Name || 'Giocatore 3'}:{' '}
                  <strong className="text-[var(--text)] font-mono tabular-nums">
                    {activeSession.team3Wins || 0}
                  </strong>
                </span>
              )}
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
              {isThreeWay && (
                <div
                  className="bg-emerald-400 h-full transition-[width] duration-300 ease-out"
                  style={{
                    width: `${
                      totalMatchesTonight > 0
                        ? ((activeSession.team3Wins || 0) / totalMatchesTonight) * 100
                        : 0
                    }%`,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        /* SEZIONE 2: NESSUN TORNEO ATTIVO -> FORM ELEGANTE PER AVVIARE */
        <div
          className="bg-[var(--surface)] rounded-2xl border border-[var(--divider)] p-6 sm:p-8 shadow-sm space-y-6"
          data-reveal="rise"
        >
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-muted)] text-[var(--accent-text)] text-xs font-semibold border border-[var(--accent-border)] mb-3">
              <Swords className="w-3.5 h-3.5" />
              <span>Nuova Serata di Torneo</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
              Avvia la Sfida di Stasera
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5 max-w-xl leading-relaxed">
              Scegli la modalità di gioco (a squadre, 1 contro 1 o tutti contro tutti in 3), inserisci i partecipanti e segna le vittorie mano dopo mano con un tocco.
            </p>
          </div>

          {/* SELETTORE MODALITÀ (Segmented Control) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-muted)] block">
              Modalità Torneo:
            </label>
            <div className="inline-flex p-1 rounded-xl bg-[var(--surface-raised)] border border-[var(--control-border)] w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setTournamentMode('2vs2')}
                className={`flex-1 sm:flex-initial py-2 px-4 rounded-lg text-xs font-semibold btn-tactile cursor-pointer flex items-center justify-center gap-1.5 ${
                  tournamentMode === '2vs2'
                    ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>2 vs 2 (Coppie)</span>
              </button>
              <button
                type="button"
                onClick={() => setTournamentMode('1vs1')}
                className={`flex-1 sm:flex-initial py-2 px-4 rounded-lg text-xs font-semibold btn-tactile cursor-pointer flex items-center justify-center gap-1.5 ${
                  tournamentMode === '1vs1'
                    ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>1 vs 1 (Singolo)</span>
              </button>
              <button
                type="button"
                onClick={() => setTournamentMode('1vs1vs1')}
                className={`flex-1 sm:flex-initial py-2 px-4 rounded-lg text-xs font-semibold btn-tactile cursor-pointer flex items-center justify-center gap-1.5 ${
                  tournamentMode === '1vs1vs1'
                    ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                <span>1 vs 1 vs 1 (In 3)</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleStartTournament} className="space-y-6">
            {/* MODALITÀ 2vs2 */}
            {tournamentMode === '2vs2' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* SQUADRA 1 */}
                <div className="bg-[var(--surface-raised)] p-5 rounded-xl border border-[var(--control-border)] space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--accent)] shrink-0">
                      Squadra 1
                    </span>
                    {teams.length > 0 && (
                      <div className="relative inline-flex items-center min-w-0 max-w-[200px] sm:max-w-xs">
                        <select
                          onChange={(e) => handleSelectTeam1Preset(e.target.value)}
                          defaultValue=""
                          className="appearance-none bg-[var(--surface-alt)] hover:bg-[var(--surface-hover)] border border-[var(--control-border)] text-xs text-[var(--text)] rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)] cursor-pointer truncate w-full transition-[border-color,background-color] duration-150"
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
                        <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 shrink-0" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1.5">
                      Nome Squadra:
                    </label>
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
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-sky-400 shrink-0">
                      Squadra 2
                    </span>
                    {teams.length > 0 && (
                      <div className="relative inline-flex items-center min-w-0 max-w-[200px] sm:max-w-xs">
                        <select
                          onChange={(e) => handleSelectTeam2Preset(e.target.value)}
                          defaultValue=""
                          className="appearance-none bg-[var(--surface-alt)] hover:bg-[var(--surface-hover)] border border-[var(--control-border)] text-xs text-[var(--text)] rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)] cursor-pointer truncate w-full transition-[border-color,background-color] duration-150"
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
                        <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 shrink-0" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1.5">
                      Nome Squadra:
                    </label>
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
            )}

            {/* MODALITÀ 1vs1 (SINGOLO) */}
            {tournamentMode === '1vs1' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* GIOCATORE 1 */}
                <div className="bg-[var(--surface-raised)] p-5 rounded-xl border border-[var(--control-border)] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--accent)]">
                      Giocatore 1
                    </span>
                  </div>

                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1.5">
                      Nome o seleziona:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Es. Marghe"
                      value={singlePlayer1}
                      onChange={(e) => setSinglePlayer1(e.target.value)}
                      className="w-full bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text)] font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                    />
                  </div>

                  <div>
                    <span className="text-xs text-[var(--text-muted)] block mb-2">
                      Scelta rapida:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {availablePlayerNames.map((name) => {
                        const isSelected = singlePlayer1 === name;
                        const isTaken = singlePlayer2.trim().toLowerCase() === name.toLowerCase();
                        return (
                          <button
                            key={name}
                            type="button"
                            disabled={isTaken}
                            onClick={() => setSinglePlayer1(name)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors btn-tactile select-none ${
                              isTaken
                                ? 'opacity-40 cursor-not-allowed bg-[var(--surface-alt)] text-[var(--text-subtle)] border-transparent'
                                : isSelected
                                ? 'bg-[var(--accent-muted)] text-[var(--accent-text)] border-[var(--accent-border)] font-bold cursor-pointer'
                                : 'bg-[var(--surface-alt)] text-[var(--text-muted)] border-[var(--divider)] hover:text-[var(--text)] cursor-pointer'
                            }`}
                          >
                            {isSelected ? '✓ ' : ''}
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* GIOCATORE 2 */}
                <div className="bg-[var(--surface-raised)] p-5 rounded-xl border border-[var(--control-border)] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400">
                      Giocatore 2
                    </span>
                  </div>

                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1.5">
                      Nome o seleziona:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Es. Simon"
                      value={singlePlayer2}
                      onChange={(e) => setSinglePlayer2(e.target.value)}
                      className="w-full bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text)] font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                    />
                  </div>

                  <div>
                    <span className="text-xs text-[var(--text-muted)] block mb-2">
                      Scelta rapida:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {availablePlayerNames.map((name) => {
                        const isSelected = singlePlayer2 === name;
                        const isTaken = singlePlayer1.trim().toLowerCase() === name.toLowerCase();
                        return (
                          <button
                            key={name}
                            type="button"
                            disabled={isTaken}
                            onClick={() => setSinglePlayer2(name)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors btn-tactile select-none ${
                              isTaken
                                ? 'opacity-40 cursor-not-allowed bg-[var(--surface-alt)] text-[var(--text-subtle)] border-transparent'
                                : isSelected
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/35 font-bold cursor-pointer'
                                : 'bg-[var(--surface-alt)] text-[var(--text-muted)] border-[var(--divider)] hover:text-[var(--text)] cursor-pointer'
                            }`}
                          >
                            {isSelected ? '✓ ' : ''}
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODALITÀ 1vs1vs1 (A TRE) */}
            {tournamentMode === '1vs1vs1' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* GIOCATORE 1 */}
                <div className="bg-[var(--surface-raised)] p-5 rounded-xl border border-[var(--control-border)] space-y-4">
                  <span className="text-xs font-bold text-[var(--accent)] block">
                    Giocatore 1
                  </span>

                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1.5">
                      Nome o seleziona:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Es. Marghe"
                      value={trioPlayer1}
                      onChange={(e) => setTrioPlayer1(e.target.value)}
                      className="w-full bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-xl px-3.5 py-2 text-sm text-[var(--text)] font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                    />
                  </div>

                  <div>
                    <span className="text-xs text-[var(--text-muted)] block mb-2">
                      Scelta rapida:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {availablePlayerNames.map((name) => {
                        const isSelected = trioPlayer1 === name;
                        const isTaken = [trioPlayer2, trioPlayer3].some(
                          (p) => p.trim().toLowerCase() === name.toLowerCase()
                        );
                        return (
                          <button
                            key={name}
                            type="button"
                            disabled={isTaken}
                            onClick={() => setTrioPlayer1(name)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors btn-tactile select-none ${
                              isTaken
                                ? 'opacity-40 cursor-not-allowed bg-[var(--surface-alt)] text-[var(--text-subtle)] border-transparent'
                                : isSelected
                                ? 'bg-[var(--accent-muted)] text-[var(--accent-text)] border-[var(--accent-border)] font-bold cursor-pointer'
                                : 'bg-[var(--surface-alt)] text-[var(--text-muted)] border-[var(--divider)] hover:text-[var(--text)] cursor-pointer'
                            }`}
                          >
                            {isSelected ? '✓ ' : ''}
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* GIOCATORE 2 */}
                <div className="bg-[var(--surface-raised)] p-5 rounded-xl border border-[var(--control-border)] space-y-4">
                  <span className="text-xs font-bold text-sky-400 block">
                    Giocatore 2
                  </span>

                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1.5">
                      Nome o seleziona:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Es. Simon"
                      value={trioPlayer2}
                      onChange={(e) => setTrioPlayer2(e.target.value)}
                      className="w-full bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-xl px-3.5 py-2 text-sm text-[var(--text)] font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                    />
                  </div>

                  <div>
                    <span className="text-xs text-[var(--text-muted)] block mb-2">
                      Scelta rapida:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {availablePlayerNames.map((name) => {
                        const isSelected = trioPlayer2 === name;
                        const isTaken = [trioPlayer1, trioPlayer3].some(
                          (p) => p.trim().toLowerCase() === name.toLowerCase()
                        );
                        return (
                          <button
                            key={name}
                            type="button"
                            disabled={isTaken}
                            onClick={() => setTrioPlayer2(name)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors btn-tactile select-none ${
                              isTaken
                                ? 'opacity-40 cursor-not-allowed bg-[var(--surface-alt)] text-[var(--text-subtle)] border-transparent'
                                : isSelected
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/35 font-bold cursor-pointer'
                                : 'bg-[var(--surface-alt)] text-[var(--text-muted)] border-[var(--divider)] hover:text-[var(--text)] cursor-pointer'
                            }`}
                          >
                            {isSelected ? '✓ ' : ''}
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* GIOCATORE 3 */}
                <div className="bg-[var(--surface-raised)] p-5 rounded-xl border border-[var(--control-border)] space-y-4">
                  <span className="text-xs font-bold text-emerald-400 block">
                    Giocatore 3
                  </span>

                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1.5">
                      Nome o seleziona:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Es. Edd"
                      value={trioPlayer3}
                      onChange={(e) => setTrioPlayer3(e.target.value)}
                      className="w-full bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-xl px-3.5 py-2 text-sm text-[var(--text)] font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                    />
                  </div>

                  <div>
                    <span className="text-xs text-[var(--text-muted)] block mb-2">
                      Scelta rapida:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {availablePlayerNames.map((name) => {
                        const isSelected = trioPlayer3 === name;
                        const isTaken = [trioPlayer1, trioPlayer2].some(
                          (p) => p.trim().toLowerCase() === name.toLowerCase()
                        );
                        return (
                          <button
                            key={name}
                            type="button"
                            disabled={isTaken}
                            onClick={() => setTrioPlayer3(name)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors btn-tactile select-none ${
                              isTaken
                                ? 'opacity-40 cursor-not-allowed bg-[var(--surface-alt)] text-[var(--text-subtle)] border-transparent'
                                : isSelected
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35 font-bold cursor-pointer'
                                : 'bg-[var(--surface-alt)] text-[var(--text-muted)] border-[var(--divider)] hover:text-[var(--text)] cursor-pointer'
                            }`}
                          >
                            {isSelected ? '✓ ' : ''}
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

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
              const isThree = session.mode === '1vs1vs1' || !!session.team3Name;
              const isT1Winner = session.winnerTeam === 1;
              const isT2Winner = session.winnerTeam === 2;
              const isT3Winner = session.winnerTeam === 3;

              let champText = 'Pareggio';
              if (isT1Winner) champText = `Campione: ${session.team1Name} 🏆`;
              else if (isT2Winner) champText = `Campione: ${session.team2Name} 🏆`;
              else if (isT3Winner) champText = `Campione: ${session.team3Name || 'Giocatore 3'} 🏆`;

              return (
                <div
                  key={session.id}
                  className="bg-[var(--surface)] rounded-xl border border-[var(--divider)] hover:border-[var(--control-border)] p-4 interactive-card flex items-center justify-between"
                >
                  <div className="space-y-1 min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <span className="font-mono tabular-nums">{session.dateKey}</span>
                      <span>•</span>
                      <span className="font-semibold text-[var(--accent-text)]">
                        {champText}
                      </span>
                      <span>•</span>
                      <span className="text-[var(--text-subtle)] font-medium">
                        {session.mode === '1vs1vs1'
                          ? '1 vs 1 vs 1'
                          : session.mode === '1vs1'
                          ? '1 vs 1'
                          : '2 vs 2'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm pt-0.5">
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
                      {isThree && (
                        <>
                          <span className="text-xs text-[var(--text-subtle)] font-bold">vs</span>
                          <span
                            className={`font-bold font-mono tabular-nums ${
                              isT3Winner ? 'text-emerald-400' : 'text-[var(--text-muted)]'
                            }`}
                          >
                            {session.team3Name || 'Giocatore 3'} ({session.team3Wins || 0})
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteSession(session.id)}
                    aria-label="Elimina torneo"
                    className="touch-target p-2 rounded-lg text-[var(--text-subtle)] hover:text-rose-400 hover:bg-[var(--surface-raised)] transition-colors cursor-pointer shrink-0"
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
