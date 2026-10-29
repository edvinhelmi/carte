import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import { TERMS_OF_SERVICE, LEGAL_METADATA } from '@/lib/legalContent';

export const metadata: Metadata = {
  title: 'Termini di Servizio • Briscola Club',
  description: 'Termini e condizioni d\'uso del servizio e note legali per l\'applicazione Briscola Club.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--text)] py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Torna indietro */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-[var(--accent-text)] hover:underline py-2 px-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--control-border)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Torna all&apos;app</span>
          </Link>
        </div>

        {/* Intestazione */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-muted)] border border-[var(--accent-border)] text-xs font-bold text-[var(--accent-text)]">
            <FileText className="w-4 h-4" />
            <span>Condizioni di Utilizzo &amp; Note Legali</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight">
            Termini di Servizio
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-mono">
            Ultimo aggiornamento: {LEGAL_METADATA.lastUpdated} • {LEGAL_METADATA.jurisdiction}
          </p>
        </div>

        {/* Contenuto Termini */}
        <section className="bg-[var(--surface)] rounded-2xl border border-[var(--divider)] p-5 sm:p-7 space-y-6 shadow-sm">
          <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--divider)] space-y-1">
            <h2 className="font-heading font-bold text-base text-[var(--accent-text)] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <span>{TERMS_OF_SERVICE.title}</span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{TERMS_OF_SERVICE.intro}</p>
          </div>

          <div className="space-y-6 text-xs text-[var(--text)] leading-relaxed divide-y divide-[var(--divider)]">
            {TERMS_OF_SERVICE.sections.map((sec, idx) => (
              <div key={idx} className={idx > 0 ? 'pt-6 space-y-2' : 'space-y-2'}>
                <h3 className="font-bold text-sm text-[var(--text)]">{sec.title}</h3>
                {sec.content.map((p, pIdx) => (
                  <p key={pIdx} className="text-[var(--text-muted)] leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-[var(--text-subtle)] pt-4 pb-12">
          Per informazioni o segnalazioni legali: {LEGAL_METADATA.contactEmail}
        </div>
      </div>
    </main>
  );
}
