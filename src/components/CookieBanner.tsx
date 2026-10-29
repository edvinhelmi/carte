'use client';

import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'carte_cookie_consent';

interface CookieBannerProps {
  onOpenLegalModal: (tab: 'privacy' | 'cookie' | 'terms') => void;
}

export function CookieBanner({ onOpenLegalModal }: CookieBannerProps) {
  const [hasConsent, setHasConsent] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkConsent = () => {
      try {
        const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
        setHasConsent(Boolean(stored));
      } catch {
        setHasConsent(true);
      }
    };

    checkConsent();
    window.addEventListener('carte_cookie_consent_change', checkConsent);
    return () => window.removeEventListener('carte_cookie_consent_change', checkConsent);
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(
        COOKIE_CONSENT_KEY,
        JSON.stringify({
          accepted: true,
          date: new Date().toISOString(),
          version: '1.0',
        })
      );
    } catch {
      // ignore
    }
    setHasConsent(true);
  };

  if (!mounted || hasConsent) return null;

  return (
    <div
      role="region"
      aria-label="Informativa Cookie e Privacy"
      className="fixed bottom-0 inset-x-0 z-[95] p-3 sm:p-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pointer-events-none animate-slide-up"
    >
      <div className="max-w-2xl mx-auto bg-[var(--surface-raised)] border border-[var(--control-border-hover)] ring-1 ring-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-black/80 pointer-events-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-muted)] border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent)] shrink-0 mt-0.5 sm:mt-0">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading text-sm font-bold text-[var(--text)]">
                Informativa Cookie &amp; Privacy (GDPR)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                Solo Tecnici
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Utilizziamo memoria locale e cookie tecnici strettamente necessari per il funzionamento del segnapunti e la sincronizzazione delle partite. <strong>Nessun cookie di profilazione o pubblicità di terze parti.</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
          <button
            type="button"
            onClick={() => onOpenLegalModal('cookie')}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[var(--surface-alt)] hover:bg-[var(--surface-hover)] border border-[var(--control-border)] text-xs font-semibold text-[var(--text)] btn-tactile cursor-pointer"
          >
            Dettagli &amp; Cookie
          </button>

          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] text-xs font-bold btn-tactile cursor-pointer shadow-sm"
          >
            Accetta Tecnici
          </button>
        </div>
      </div>
    </div>
  );
}
