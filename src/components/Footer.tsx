'use client';

import React from 'react';
import { ShieldCheck, Cookie, FileText, Heart } from 'lucide-react';
import { LEGAL_METADATA } from '@/lib/legalContent';

interface FooterProps {
  onOpenLegalModal: (tab: 'privacy' | 'cookie' | 'terms') => void;
}

export function Footer({ onOpenLegalModal }: FooterProps) {
  return (
    <footer className="mt-16 sm:mt-24 border-t border-[var(--divider)] bg-[var(--surface)]/70 backdrop-blur-sm text-center pt-10 sm:pt-12 pb-28 md:pb-12 px-4 text-xs text-[var(--text-muted)] space-y-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
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
            className="hover:text-[var(--accent-text)] transition-colors cursor-pointer inline-flex items-center gap-1.5 touch-target"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Privacy Policy</span>
          </button>

          <span className="text-[var(--divider)]">•</span>

          <button
            type="button"
            onClick={() => onOpenLegalModal('cookie')}
            className="hover:text-[var(--accent-text)] transition-colors cursor-pointer inline-flex items-center gap-1.5 touch-target"
          >
            <Cookie className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Cookie &amp; Storage</span>
          </button>

          <span className="text-[var(--divider)]">•</span>

          <button
            type="button"
            onClick={() => onOpenLegalModal('terms')}
            className="hover:text-[var(--accent-text)] transition-colors cursor-pointer inline-flex items-center gap-1.5 touch-target"
          >
            <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Termini di Servizio</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto pt-3 border-t border-[var(--divider)]/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-[var(--text-subtle)]">
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
