'use client';

import React from 'react';
import { ShieldCheck, Cookie, FileText, Heart } from 'lucide-react';
import { LEGAL_METADATA } from '@/lib/legalContent';

interface FooterProps {
  onOpenLegalModal: (tab: 'privacy' | 'cookie' | 'terms') => void;
}

export function Footer({ onOpenLegalModal }: FooterProps) {
  return (
    <footer className="mt-auto border-t border-[var(--divider)] bg-[var(--surface)]/60 text-center py-6 px-4 text-xs text-[var(--text-muted)] space-y-3 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
        <div>
          <p className="font-heading font-bold text-sm text-[var(--text)]">
            {LEGAL_METADATA.appName}
          </p>
          <p className="text-[11px] text-[var(--text-subtle)] mt-0.5">
            Tracker statistico amatoriale e segnapunti per serate di carte in compagnia.
          </p>
        </div>

        {/* Link Legali */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-[var(--text-muted)]">
          <button
            type="button"
            onClick={() => onOpenLegalModal('privacy')}
            className="hover:text-[var(--accent-text)] transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>

          <span>•</span>

          <button
            type="button"
            onClick={() => onOpenLegalModal('cookie')}
            className="hover:text-[var(--accent-text)] transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <Cookie className="w-3.5 h-3.5" />
            <span>Cookie &amp; Storage</span>
          </button>

          <span>•</span>

          <button
            type="button"
            onClick={() => onOpenLegalModal('terms')}
            className="hover:text-[var(--accent-text)] transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Termini di Servizio</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto pt-2 border-t border-[var(--divider)]/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-[var(--text-subtle)]">
        <span>
          © {new Date().getFullYear()} {LEGAL_METADATA.appName} • Conforme GDPR (Regolamento UE 2016/679)
        </span>
        <span className="flex items-center gap-1">
          Nessun gioco d&apos;azzardo • Nessuna scommessa o denaro reale
        </span>
      </div>
    </footer>
  );
}
