'use client';

import React, { useState } from 'react';
import { Plus, Minus, RotateCcw, Check, Sparkles, History } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom, faClone, faCoins, faCrown, faStar } from '@fortawesome/free-solid-svg-icons';
import { StorageService } from '@/lib/storage';
import type { TournamentSession, ScopaRound } from '@/types/game';

interface ScopaRoundScorerProps {
  session: TournamentSession;
  onRoundAdded: () => void;
}

type TieWinner = 1 | 2 | 'patta';
type SingleWinner = 1 | 2;

export function ScopaRoundScorer({ session, onRoundAdded }: ScopaRoundScorerProps) {
  // Categorie punteggio per la smazzata corrente
  const [scopeT1, setScopeT1] = useState<number>(0);
  const [scopeT2, setScopeT2] = useState<number>(0);
  const [carteWinner, setCarteWinner] = useState<TieWinner>('patta');
  const [denariWinner, setDenariWinner] = useState<TieWinner>('patta');
  const [settebelloWinner, setSettebelloWinner] = useState<SingleWinner | null>(null);
  const [primieraWinner, setPrimieraWinner] = useState<TieWinner>('patta');
  const [napolaT1, setNapolaT1] = useState<number>(0);
  const [napolaT2, setNapolaT2] = useState<number>(0);
  const [showNapola, setShowNapola] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const team1Name = session.team1Name || 'Squadra 1';
  const team2Name = session.team2Name || 'Squadra 2';

  // Calcolo punti per la smazzata corrente
  const calcRoundPoints = () => {
    let pts1 = scopeT1 + napolaT1;
    let pts2 = scopeT2 + napolaT2;

    if (carteWinner === 1) pts1 += 1;
    else if (carteWinner === 2) pts2 += 1;

    if (denariWinner === 1) pts1 += 1;
    else if (denariWinner === 2) pts2 += 1;

    if (settebelloWinner === 1) pts1 += 1;
    else if (settebelloWinner === 2) pts2 += 1;

    if (primieraWinner === 1) pts1 += 1;
    else if (primieraWinner === 2) pts2 += 1;

    return { pts1, pts2 };
  };

  const { pts1, pts2 } = calcRoundPoints();

  const resetForm = () => {
    setScopeT1(0);
    setScopeT2(0);
    setCarteWinner('patta');
    setDenariWinner('patta');
    setSettebelloWinner(null);
    setPrimieraWinner('patta');
    setNapolaT1(0);
    setNapolaT2(0);
  };

  const handleConfirmRound = () => {
    if (pts1 === 0 && pts2 === 0) return;

    StorageService.addScopaRound(session.id, {
      scopeTeam1: scopeT1,
      scopeTeam2: scopeT2,
      carteWinner,
      denariWinner,
      settebelloWinner: settebelloWinner ?? undefined,
      primieraWinner,
      napolaPointsTeam1: napolaT1 > 0 ? napolaT1 : undefined,
      napolaPointsTeam2: napolaT2 > 0 ? napolaT2 : undefined,
      totalPointsTeam1: pts1,
      totalPointsTeam2: pts2,
    });

    resetForm();
    onRoundAdded();
  };

  const handleUndoLastRound = () => {
    if (!session.scopaRounds || session.scopaRounds.length === 0) return;
    if (window.confirm('Vuoi davvero annullare l\'ultima smazzata registrata?')) {
      StorageService.removeLastScopaRound(session.id);
      onRoundAdded();
    }
  };

  const rounds = session.scopaRounds || [];
  const currentRoundNum = rounds.length + 1;

  return (
    <div className="glass-ios-raised border border-[var(--control-border)] rounded-[26px] p-4 sm:p-6 shadow-xl space-y-4.5">
      {/* Header del Calcolatore Turno */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--divider)]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm shadow-sm">
            <FontAwesomeIcon icon={faBroom} className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="font-heading font-black text-sm sm:text-base text-[var(--text)] tracking-tight">
              Calcola Smazzata #{currentRoundNum}
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Assegna i punti per categoria alla fine della mano
            </p>
          </div>
        </div>

        {rounds.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] btn-ios-tactile cursor-pointer min-h-[44px]"
            title="Storico turni"
          >
            <History className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Storico ({rounds.length})</span>
          </button>
        )}
      </div>

      {/* Sezione Scope Fatte */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5 text-[var(--text)] font-bold">
            <FontAwesomeIcon icon={faBroom} className="w-3.5 h-3.5 text-amber-400" />
            <span>Scope (1 pt ciascuna)</span>
          </span>
          <span className="font-mono text-[11px] tabular-nums">
            {scopeT1} - {scopeT2} pt
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
          {/* Scope Team 1 */}
          <div className="p-2.5 sm:p-3 rounded-2xl bg-[var(--surface)]/90 border border-[var(--control-border)] flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold text-[var(--text)] truncate max-w-[80px] sm:max-w-[110px]" title={team1Name}>
              {team1Name}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setScopeT1(Math.max(0, scopeT1 - 1))}
                aria-label={`Rimuovi scopa a ${team1Name}`}
                className="w-8 h-8 rounded-xl bg-[var(--surface-raised)] border border-[var(--control-border)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center btn-ios-tactile cursor-pointer disabled:opacity-30"
                disabled={scopeT1 === 0}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-7 text-center font-mono font-black text-sm sm:text-base text-[var(--text)] tabular-nums">
                {scopeT1}
              </span>
              <button
                type="button"
                onClick={() => setScopeT1(scopeT1 + 1)}
                aria-label={`Aggiungi scopa a ${team1Name}`}
                className="w-8 h-8 rounded-xl bg-[var(--accent)] text-[var(--on-accent)] flex items-center justify-center btn-ios-tactile cursor-pointer shadow-sm shadow-amber-500/20"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Scope Team 2 */}
          <div className="p-2.5 sm:p-3 rounded-2xl bg-[var(--surface)]/90 border border-[var(--control-border)] flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold text-[var(--text)] truncate max-w-[80px] sm:max-w-[110px]" title={team2Name}>
              {team2Name}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setScopeT2(Math.max(0, scopeT2 - 1))}
                aria-label={`Rimuovi scopa a ${team2Name}`}
                className="w-8 h-8 rounded-xl bg-[var(--surface-raised)] border border-[var(--control-border)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center btn-ios-tactile cursor-pointer disabled:opacity-30"
                disabled={scopeT2 === 0}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-7 text-center font-mono font-black text-sm sm:text-base text-[var(--text)] tabular-nums">
                {scopeT2}
              </span>
              <button
                type="button"
                onClick={() => setScopeT2(scopeT2 + 1)}
                aria-label={`Aggiungi scopa a ${team2Name}`}
                className="w-8 h-8 rounded-xl bg-[var(--accent)] text-[var(--on-accent)] flex items-center justify-center btn-ios-tactile cursor-pointer shadow-sm shadow-amber-500/20"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Categorie a Scelta: Carte, Denari, Settebello, Primiera */}
      <div className="space-y-3.5 pt-1">
        {/* 1. Carte (>20) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--text)] flex items-center gap-1.5">
              <FontAwesomeIcon icon={faClone} className="w-3.5 h-3.5 text-sky-400" />
              <span>Carte (&gt;20 carte prese = 1 pt)</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[var(--surface)] rounded-2xl border border-[var(--control-border)] shadow-inner">
            <button
              type="button"
              onClick={() => setCarteWinner(1)}
              className={`min-h-[44px] py-1.5 px-2 rounded-xl text-xs font-bold truncate btn-ios-tactile cursor-pointer ${
                carteWinner === 1
                  ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-md shadow-amber-500/20 font-black'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {team1Name}
            </button>
            <button
              type="button"
              onClick={() => setCarteWinner('patta')}
              className={`min-h-[44px] py-1.5 px-2 rounded-xl text-xs font-bold truncate btn-ios-tactile cursor-pointer ${
                carteWinner === 'patta'
                  ? 'bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--control-border)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Patta (20-20)
            </button>
            <button
              type="button"
              onClick={() => setCarteWinner(2)}
              className={`min-h-[44px] py-1.5 px-2 rounded-xl text-xs font-bold truncate btn-ios-tactile cursor-pointer ${
                carteWinner === 2
                  ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-md shadow-amber-500/20 font-black'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {team2Name}
            </button>
          </div>
        </div>

        {/* 2. Denari (>5) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--text)] flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCoins} className="w-3.5 h-3.5 text-amber-400" />
              <span>Denari / Ori (&gt;5 denari = 1 pt)</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[var(--surface)] rounded-2xl border border-[var(--control-border)] shadow-inner">
            <button
              type="button"
              onClick={() => setDenariWinner(1)}
              className={`min-h-[44px] py-1.5 px-2 rounded-xl text-xs font-bold truncate btn-ios-tactile cursor-pointer ${
                denariWinner === 1
                  ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-md shadow-amber-500/20 font-black'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {team1Name}
            </button>
            <button
              type="button"
              onClick={() => setDenariWinner('patta')}
              className={`min-h-[44px] py-1.5 px-2 rounded-xl text-xs font-bold truncate btn-ios-tactile cursor-pointer ${
                denariWinner === 'patta'
                  ? 'bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--control-border)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Patta (5-5)
            </button>
            <button
              type="button"
              onClick={() => setDenariWinner(2)}
              className={`min-h-[44px] py-1.5 px-2 rounded-xl text-xs font-bold truncate btn-ios-tactile cursor-pointer ${
                denariWinner === 2
                  ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-md shadow-amber-500/20 font-black'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {team2Name}
            </button>
          </div>
        </div>

        {/* 3. Settebello */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--text)] flex items-center gap-1.5">
              <FontAwesomeIcon icon={faStar} className="w-3.5 h-3.5 text-amber-400" />
              <span>Settebello (7 di denari = 1 pt)</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[var(--surface)] rounded-2xl border border-[var(--control-border)] shadow-inner">
            <button
              type="button"
              onClick={() => setSettebelloWinner(1)}
              className={`min-h-[44px] py-1.5 px-2 rounded-xl text-xs font-bold truncate btn-ios-tactile cursor-pointer flex items-center justify-center gap-1.5 ${
                settebelloWinner === 1
                  ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-md shadow-amber-500/20 font-black'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {settebelloWinner === 1 && <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />}
              <span className="truncate">{team1Name}</span>
            </button>
            <button
              type="button"
              onClick={() => setSettebelloWinner(2)}
              className={`min-h-[44px] py-1.5 px-2 rounded-xl text-xs font-bold truncate btn-ios-tactile cursor-pointer flex items-center justify-center gap-1.5 ${
                settebelloWinner === 2
                  ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-md shadow-amber-500/20 font-black'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {settebelloWinner === 2 && <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />}
              <span className="truncate">{team2Name}</span>
            </button>
          </div>
        </div>

        {/* 4. Primiera */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--text)] flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCrown} className="w-3.5 h-3.5 text-amber-300" />
              <span>Primiera / Settanta (1 pt)</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[var(--surface)] rounded-2xl border border-[var(--control-border)] shadow-inner">
            <button
              type="button"
              onClick={() => setPrimieraWinner(1)}
              className={`min-h-[44px] py-1.5 px-2 rounded-xl text-xs font-bold truncate btn-ios-tactile cursor-pointer ${
                primieraWinner === 1
                  ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-md shadow-amber-500/20 font-black'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {team1Name}
            </button>
            <button
              type="button"
              onClick={() => setPrimieraWinner('patta')}
              className={`min-h-[44px] py-1.5 px-2 rounded-xl text-xs font-bold truncate btn-ios-tactile cursor-pointer ${
                primieraWinner === 'patta'
                  ? 'bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--control-border)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Patta
            </button>
            <button
              type="button"
              onClick={() => setPrimieraWinner(2)}
              className={`min-h-[44px] py-1.5 px-2 rounded-xl text-xs font-bold truncate btn-ios-tactile cursor-pointer ${
                primieraWinner === 2
                  ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-md shadow-amber-500/20 font-black'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {team2Name}
            </button>
          </div>
        </div>

        {/* Napola */}
        <div>
          <button
            type="button"
            onClick={() => setShowNapola(!showNapola)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] btn-ios-tactile cursor-pointer py-1 min-h-[44px]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Regola Napola / Napoletana (A-2-3 di denari)?</span>
            <span className="text-[11px] text-[var(--accent)] font-bold">
              {showNapola ? 'Nascondi ▲' : 'Mostra ▼'}
            </span>
          </button>

          {showNapola && (
            <div className="mt-2 p-3 rounded-2xl bg-[var(--surface)] border border-[var(--control-border)] grid grid-cols-2 gap-2.5 animate-fade-in shadow-inner">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[var(--text-muted)] truncate block">
                  Napola {team1Name}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setNapolaT1(Math.max(0, napolaT1 === 3 ? 0 : napolaT1 - 1))}
                    className="w-8 h-8 rounded-xl bg-[var(--surface-raised)] border border-[var(--control-border)] text-xs font-bold flex items-center justify-center btn-ios-tactile cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-mono font-bold text-sm tabular-nums">
                    {napolaT1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNapolaT1(napolaT1 === 0 ? 3 : Math.min(10, napolaT1 + 1))}
                    className="w-8 h-8 rounded-xl bg-[var(--surface-raised)] border border-[var(--control-border)] text-xs font-bold flex items-center justify-center btn-ios-tactile cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[var(--text-muted)] truncate block">
                  Napola {team2Name}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setNapolaT2(Math.max(0, napolaT2 === 3 ? 0 : napolaT2 - 1))}
                    className="w-8 h-8 rounded-xl bg-[var(--surface-raised)] border border-[var(--control-border)] text-xs font-bold flex items-center justify-center btn-ios-tactile cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-mono font-bold text-sm tabular-nums">
                    {napolaT2}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNapolaT2(napolaT2 === 0 ? 3 : Math.min(10, napolaT2 + 1))}
                    className="w-8 h-8 rounded-xl bg-[var(--surface-raised)] border border-[var(--control-border)] text-xs font-bold flex items-center justify-center btn-ios-tactile cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Box Anteprima Punti Smazzata e Pulsante di Conferma */}
      <div className="pt-2.5 border-t border-[var(--divider)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-xs">
            <span className="text-[var(--text-muted)] block text-[11px]">Punti Smazzata:</span>
            <div className="flex items-center gap-2 font-mono font-black text-base sm:text-lg tabular-nums">
              <span className="text-[var(--text)]">+{pts1}</span>
              <span className="text-[var(--text-muted)] text-sm">vs</span>
              <span className="text-[var(--text)]">+{pts2}</span>
            </div>
          </div>

          {(pts1 > 0 || pts2 > 0) && (
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] text-[var(--text-muted)] hover:text-[var(--text)] text-xs font-semibold btn-ios-tactile cursor-pointer flex items-center gap-1 min-h-[44px]"
              title="Azzera selezione"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Azzera</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleConfirmRound}
          disabled={pts1 === 0 && pts2 === 0}
          className="px-6 py-3 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] font-extrabold text-sm shadow-md shadow-amber-500/25 btn-ios-tactile cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Assegna Punti Smazzata (+{pts1} / +{pts2})</span>
        </button>
      </div>

      {/* Storico Turni / Smazzate Espandibile */}
      {showHistory && rounds.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[var(--divider)] space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[var(--text)]">Storico Smazzate ({rounds.length})</h4>
            <button
              type="button"
              onClick={handleUndoLastRound}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 btn-tactile cursor-pointer px-2 py-1 min-h-[44px] flex items-center"
            >
              Annulla Ultima Smazzata
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {rounds
              .slice()
              .reverse()
              .map((r, idx) => {
                const roundNum = rounds.length - idx;
                const details: string[] = [];
                if (r.scopeTeam1 > 0 || r.scopeTeam2 > 0) details.push(`Scope: ${r.scopeTeam1}-${r.scopeTeam2}`);
                if (r.carteWinner && r.carteWinner !== 'patta') details.push(`Carte: ${r.carteWinner === 1 ? team1Name : team2Name}`);
                if (r.denariWinner && r.denariWinner !== 'patta') details.push(`Denari: ${r.denariWinner === 1 ? team1Name : team2Name}`);
                if (r.settebelloWinner) details.push(`Settebello: ${r.settebelloWinner === 1 ? team1Name : team2Name}`);
                if (r.primieraWinner && r.primieraWinner !== 'patta') details.push(`Primiera: ${r.primieraWinner === 1 ? team1Name : team2Name}`);
                if ((r.napolaPointsTeam1 || 0) > 0 || (r.napolaPointsTeam2 || 0) > 0) {
                  details.push(`Napola: ${r.napolaPointsTeam1 || 0}-${r.napolaPointsTeam2 || 0}`);
                }

                return (
                  <div
                    key={r.id || idx}
                    className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--control-border)] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-[var(--text)]">
                        Smazzata #{roundNum}: +{r.totalPointsTeam1} vs +{r.totalPointsTeam2}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {details.length > 0 ? details.join(' • ') : 'Punti manuali'}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-[var(--text-muted)]">
                      {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
