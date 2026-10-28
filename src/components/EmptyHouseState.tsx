'use client';

import React, { useState, useEffect } from 'react';
import { Home, Plus, LogIn, Sparkles, User, ShieldCheck, LogOut, Edit3 } from 'lucide-react';
import { AuthService } from '@/lib/authService';
import type { UserProfile } from '@/types/house';
import { CreateOrJoinHouseModal } from './CreateOrJoinHouseModal';
import { ProfileModal } from './ProfileModal';

interface EmptyHouseStateProps {
  onHouseJoinedOrCreated?: () => void;
}

export function EmptyHouseState({ onHouseJoinedOrCreated }: EmptyHouseStateProps) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => AuthService.getCurrentUser());
  const [isHouseModalOpen, setIsHouseModalOpen] = useState(false);
  const [houseModalTab, setHouseModalTab] = useState<'create' | 'join'>('create');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(AuthService.getCurrentUser());
    };
    window.addEventListener('carte_auth_change', handleAuthChange);
    return () => {
      window.removeEventListener('carte_auth_change', handleAuthChange);
    };
  }, []);

  const handleOpenCreateHouse = () => {
    setHouseModalTab('create');
    setIsHouseModalOpen(true);
  };

  const handleOpenJoinHouse = () => {
    setHouseModalTab('join');
    setIsHouseModalOpen(true);
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    const res = await AuthService.signInWithGoogle();
    setIsLoggingIn(false);
    if (!res.success && res.error) {
      setAuthError(res.error);
    }
  };

  const handleSignOut = async () => {
    await AuthService.signOut();
  };

  return (
    <div
      className="w-full max-w-xl mx-auto px-4 py-8 sm:py-14 flex flex-col items-center text-center"
      data-reveal="rise"
    >
      {/* Visual Badge */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-[var(--surface-raised)] border border-[var(--control-border-hover)] ring-1 ring-white/10 shadow-2xl flex items-center justify-center relative">
          <Home className="w-9 h-9 text-[var(--accent)]" />
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[var(--accent)] text-[var(--on-accent)] flex items-center justify-center shadow-md">
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Main Title & Tagline */}
      <h1 className="font-heading font-black text-2xl sm:text-3xl text-[var(--text)] tracking-tight leading-tight mb-3">
        Nessuna casa attiva al momento
      </h1>
      <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-md mx-auto leading-relaxed mb-8">
        Per registrare partite e avviare tornei, crea la tua casa oppure unisciti a una casa già aperta con il codice o link invito.
      </p>

      {/* Primary House Actions */}
      <div className="w-full flex flex-col sm:flex-row gap-3.5 sm:gap-4 mb-8">
        <button
          type="button"
          onClick={handleOpenCreateHouse}
          className="touch-target flex-1 min-h-[52px] px-6 py-3.5 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] font-heading font-bold text-sm sm:text-base shadow-[0_4px_20px_rgba(245,158,11,0.25)] hover:shadow-[0_6px_24px_rgba(245,158,11,0.35)] btn-tactile cursor-pointer flex items-center justify-center gap-2.5 transition-transform"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Crea Nuova Casa</span>
        </button>

        <button
          type="button"
          onClick={handleOpenJoinHouse}
          className="touch-target flex-1 min-h-[52px] px-6 py-3.5 rounded-2xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] hover:border-[var(--control-border-hover)] text-[var(--text)] font-heading font-bold text-sm sm:text-base shadow-sm hover:shadow-md btn-tactile cursor-pointer flex items-center justify-center gap-2.5 transition-colors"
        >
          <LogIn className="w-5 h-5 text-[var(--accent)]" />
          <span>Entra in una Casa</span>
        </button>
      </div>

      {/* Google User Identity Section */}
      <div className="w-full rounded-2xl bg-[var(--surface-raised)] border border-[var(--control-border)] p-5 text-left relative overflow-hidden">
        {currentUser.isGoogleUser ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {currentUser.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-12 h-12 rounded-full ring-2 ring-[var(--accent)]/40 object-cover shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[var(--surface-alt)] border border-[var(--control-border)] flex items-center justify-center text-[var(--accent)] shrink-0">
                  <User className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-heading font-bold text-sm text-[var(--text)] truncate">
                    {currentUser.displayName}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Google</span>
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {currentUser.email || 'Account sincronizzato'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="touch-target px-3.5 py-2 rounded-xl bg-[var(--surface-alt)] hover:bg-[var(--surface-hover)] border border-[var(--control-border)] text-xs font-semibold text-[var(--text)] btn-tactile cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Modifica Profilo</span>
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                aria-label="Esci"
                className="touch-target p-2 rounded-xl bg-[var(--surface-alt)] hover:bg-rose-500/10 border border-[var(--control-border)] text-xs text-[var(--text-muted)] hover:text-rose-400 btn-tactile cursor-pointer"
                title="Disconnetti"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-heading font-bold text-sm text-[var(--text)] mb-1">
                  Accedi con Google per sincronizzare il tuo profilo
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Entrando con Google il tuo nome utente e i tuoi soprannomi compariranno automaticamente tra i suggerimenti delle partite in tutte le case in cui entri.
                </p>
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
                {authError}
              </div>
            )}

            <div className="pt-1 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="touch-target w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[var(--surface-alt)] hover:bg-[var(--surface-hover)] border border-[var(--control-border-hover)] text-xs font-bold text-[var(--text)] btn-tactile cursor-pointer flex items-center justify-center gap-2.5 transition-colors"
              >
                {/* Google G SVG */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isLoggingIn ? 'Collegamento in corso...' : 'Continua con Google'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="touch-target text-xs text-[var(--text-muted)] hover:text-[var(--text)] underline decoration-[var(--control-border)] hover:decoration-[var(--accent)] underline-offset-4 py-2 cursor-pointer"
              >
                Usa come ospite con nickname locale ({currentUser.displayName})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modali Create/Join e Profilo */}
      <CreateOrJoinHouseModal
        isOpen={isHouseModalOpen}
        onClose={() => {
          setIsHouseModalOpen(false);
          onHouseJoinedOrCreated?.();
        }}
        initialTab={houseModalTab}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
