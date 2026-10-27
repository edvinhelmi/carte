'use client';

import React, { useState } from 'react';
import { X, Plus, LogIn, Home, Users, AlertCircle } from 'lucide-react';
import { HouseService } from '@/lib/houseService';

interface CreateOrJoinHouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'create' | 'join';
}

export function CreateOrJoinHouseModal({
  isOpen,
  onClose,
  initialTab = 'create',
}: CreateOrJoinHouseModalProps) {
  const [tab, setTab] = useState<'create' | 'join'>(initialTab);
  const [houseName, setHouseName] = useState('');
  const [membersInput, setMembersInput] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = houseName.trim();
    if (!cleanName) {
      setErrorMsg('Inserisci un nome per la casa');
      return;
    }

    const memberNames = membersInput
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      HouseService.createHouse(cleanName, memberNames);
      onClose();
    } catch {
      setErrorMsg('Errore durante la creazione della casa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanCode = joinCode.trim();
    if (!cleanCode) {
      setErrorMsg('Inserisci un codice o un link valido');
      return;
    }

    // Se l'utente ha incollato un link intero tipo https://...?casa=XYZ
    try {
      if (cleanCode.includes('casa=')) {
        const url = new URL(cleanCode);
        const param = url.searchParams.get('casa');
        if (param) cleanCode = param;
      }
    } catch {
      // continua con cleanCode
    }

    setIsSubmitting(true);
    setErrorMsg('');
    const res = await HouseService.joinHouseByCodeOrId(cleanCode);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Casa non trovata. Controlla il codice o chiedi un nuovo invito.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--divider)] shadow-2xl p-6 space-y-5 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pulsante Chiusura */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--surface-raised)] transition-colors cursor-pointer"
          aria-label="Chiudi"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded-xl bg-[var(--surface-raised)] border border-[var(--control-border)]">
          <button
            type="button"
            onClick={() => {
              setTab('create');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === 'create'
                ? 'bg-[var(--surface-alt)] text-[var(--text)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crea Casa</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('join');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === 'join'
                ? 'bg-[var(--surface-alt)] text-[var(--text)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Entra con Codice</span>
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label
                htmlFor="house-name"
                className="block text-xs font-semibold text-[var(--text)] mb-1.5"
              >
                Nome della Casa / Gruppo
              </label>
              <div className="relative">
                <input
                  id="house-name"
                  type="text"
                  required
                  value={houseName}
                  onChange={(e) => setHouseName(e.target.value)}
                  placeholder="es. Appartamento Trento, Casa Mare, Circolo"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--control-border)] text-[var(--text)] placeholder:text-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--accent)]"
                />
                <Home className="w-4 h-4 text-[var(--text-muted)] absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label
                htmlFor="house-members"
                className="block text-xs font-semibold text-[var(--text)] mb-1"
              >
                Membri della casa (facoltativo)
              </label>
              <p className="text-[11px] text-[var(--text-muted)] mb-1.5">
                Inserisci i nomi separati da virgola. Saranno i nomi che ti usciranno tra i suggerimenti.
              </p>
              <div className="relative">
                <input
                  id="house-members"
                  type="text"
                  value={membersInput}
                  onChange={(e) => setMembersInput(e.target.value)}
                  placeholder="es. Marco, Giulia, Ale, Simon"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--control-border)] text-[var(--text)] placeholder:text-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--accent)]"
                />
                <Users className="w-4 h-4 text-[var(--text-muted)] absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] font-bold text-sm btn-tactile cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{isSubmitting ? 'Creazione in corso...' : 'Crea Casa e Inizia'}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label
                htmlFor="join-code"
                className="block text-xs font-semibold text-[var(--text)] mb-1.5"
              >
                Codice Casa o Link Invito
              </label>
              <input
                id="join-code"
                type="text"
                required
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="es. BRIS-4821 oppure incolla il link"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--control-border)] text-[var(--text)] placeholder:text-[var(--text-muted)] text-sm font-mono focus:outline-none focus:border-[var(--accent)] uppercase"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                Puoi anche inquadrare il QR Code della casa direttamente con la fotocamera del tuo telefono.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] text-[var(--text)] font-bold text-sm btn-tactile cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'Verifica in corso...' : 'Entra nella Casa'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
