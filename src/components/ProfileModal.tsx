'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Check, Home, ShieldCheck, LogOut } from 'lucide-react';
import { AuthService } from '@/lib/authService';
import { HouseService } from '@/lib/houseService';
import type { UserProfile } from '@/types/house';

const emptySubscribe = () => () => {};

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ProfileModalContent({ onClose }: { onClose: () => void }) {
  const activeHouse = HouseService.getActiveHouse();

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => AuthService.getCurrentUser());
  const [globalNickname, setGlobalNickname] = useState(() => AuthService.getCurrentUser().displayName);
  const [houseNickname, setHouseNickname] = useState(() =>
    activeHouse ? AuthService.getHouseNickname(activeHouse.id) || '' : ''
  );
  const [savedGlobalMsg, setSavedGlobalMsg] = useState(false);
  const [savedHouseMsg, setSavedHouseMsg] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Body scroll lock & Escape listener
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleSaveGlobalNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalNickname.trim()) return;
    await AuthService.updateGlobalNickname(globalNickname);
    setCurrentUser(AuthService.getCurrentUser());
    setSavedGlobalMsg(true);
    setTimeout(() => setSavedGlobalMsg(false), 2000);
  };

  const handleSaveHouseNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHouse) return;
    await AuthService.updateHouseNickname(activeHouse.id, houseNickname);
    setSavedHouseMsg(true);
    setTimeout(() => setSavedHouseMsg(false), 2000);
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    const res = await AuthService.signInWithGoogle();
    setIsLoggingIn(false);
    if (!res.success && res.error) {
      setLoginError(res.error);
    }
  };

  const handleSignOut = async () => {
    await AuthService.signOut();
    const guest = AuthService.getCurrentUser();
    setCurrentUser(guest);
    setGlobalNickname(guest.displayName);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-md animate-fade-in"
      style={{ overscrollBehavior: 'contain' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-full items-center justify-center p-3.5 sm:p-6">
        <div
          className="relative z-10 w-full max-w-md my-auto rounded-2xl bg-[var(--surface-raised)] border border-[var(--control-border-hover)] ring-1 ring-white/10 shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[min(90vh,calc(100dvh-2rem))] animate-scale-in text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pinned Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--divider)] bg-[var(--surface-raised)] shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[var(--accent-muted)] border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent)] shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="font-heading font-bold text-base text-[var(--text)] leading-tight truncate">
                  Il tuo Profilo
                </h2>
                <p className="text-[11px] text-[var(--text-muted)] truncate">
                  Gestisci nickname e identità al tavolo da gioco
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="touch-target p-2 text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--surface-alt)] transition-colors cursor-pointer shrink-0 ml-2"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Modal Content */}
          <div className="p-5 overflow-y-auto space-y-5 flex-1 min-h-0">
            {/* User Identity Card */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--divider)]">
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

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-sm text-[var(--text)] truncate">
                    {currentUser.displayName}
                  </span>
                  {currentUser.isGoogleUser ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Google</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--surface-alt)] text-[var(--text-muted)] border border-[var(--control-border)] shrink-0">
                      <span>Ospite</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {currentUser.email || 'Profilo memorizzato localmente'}
                </p>
              </div>
            </div>

            {/* Global Nickname Form */}
            <form onSubmit={handleSaveGlobalNickname} className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="global-nickname"
                  className="block text-xs font-semibold text-[var(--text)]"
                >
                  Nickname Globale (in tutte le case)
                </label>
                {savedGlobalMsg && (
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-fade-in">
                    <Check className="w-3 h-3" />
                    <span>Salvato!</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Questo è il nome che apparirà tra i suggerimenti quando crei squadre o tornei in qualsiasi casa.
              </p>
              <div className="flex gap-2">
                <input
                  id="global-nickname"
                  type="text"
                  required
                  value={globalNickname}
                  onChange={(e) => setGlobalNickname(e.target.value)}
                  placeholder="Il tuo nickname..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--control-border)] text-[var(--text)] placeholder:text-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="submit"
                  className="touch-target px-4 py-2.5 rounded-xl bg-[var(--surface-alt)] hover:bg-[var(--surface-hover)] border border-[var(--control-border)] text-xs font-bold text-[var(--text)] btn-tactile cursor-pointer"
                >
                  Salva
                </button>
              </div>
            </form>

            {/* House-Specific Nickname Form (Visible only if an active house exists) */}
            {activeHouse && (
              <form onSubmit={handleSaveHouseNickname} className="space-y-2 pt-2 border-t border-[var(--divider)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Home className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                    <label
                      htmlFor="house-nickname"
                      className="block text-xs font-semibold text-[var(--text)] truncate"
                    >
                      Soprannome in {activeHouse.name}
                    </label>
                  </div>
                  {savedHouseMsg && (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-fade-in">
                      <Check className="w-3 h-3" />
                      <span>Salvato!</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Solo in questa casa comparirai con questo soprannome. Lascia vuoto per continuare a usare il tuo nickname globale.
                </p>
                <div className="flex gap-2">
                  <input
                    id="house-nickname"
                    type="text"
                    value={houseNickname}
                    onChange={(e) => setHouseNickname(e.target.value)}
                    placeholder={`es. ${currentUser.displayName} il Grande (opzionale)`}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--control-border)] text-[var(--text)] placeholder:text-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    type="submit"
                    className="touch-target px-4 py-2.5 rounded-xl bg-[var(--surface-alt)] hover:bg-[var(--surface-hover)] border border-[var(--control-border)] text-xs font-bold text-[var(--text)] btn-tactile cursor-pointer"
                  >
                    Salva
                  </button>
                </div>
              </form>
            )}

            {/* Google Authentication Actions */}
            <div className="pt-3 border-t border-[var(--divider)]">
              {currentUser.isGoogleUser ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="touch-target w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-[var(--surface-alt)] hover:bg-rose-500/10 border border-[var(--control-border)] text-xs font-bold text-[var(--text-muted)] hover:text-rose-400 btn-tactile cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Disconnetti Account Google</span>
                </button>
              ) : (
                <div className="space-y-2.5">
                  {loginError && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
                      {loginError}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoggingIn}
                    className="touch-target w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-[var(--surface-alt)] hover:bg-[var(--surface-hover)] border border-[var(--control-border-hover)] text-xs font-bold text-[var(--text)] btn-tactile cursor-pointer flex items-center justify-center gap-2.5"
                  >
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
                    <span>{isLoggingIn ? 'Collegamento in corso...' : 'Collega Account Google'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  if (!isOpen || !mounted) return null;
  return <ProfileModalContent onClose={onClose} />;
}
