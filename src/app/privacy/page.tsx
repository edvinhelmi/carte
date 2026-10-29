import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ShieldCheck, Cookie, CheckCircle2 } from 'lucide-react';
import { PRIVACY_POLICY, COOKIE_POLICY, LEGAL_METADATA } from '@/lib/legalContent';

export const metadata: Metadata = {
  title: 'Privacy Policy & Cookie • Briscola Club',
  description: 'Informativa sul trattamento dei dati personali e utilizzo dei cookie di Briscola Club ai sensi del Regolamento UE 2016/679 (GDPR).',
};

export default function PrivacyPage() {
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
            <ShieldCheck className="w-4 h-4" />
            <span>Conforme GDPR (Regolamento UE 2016/679)</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight">
            Informativa sulla Privacy &amp; Cookie
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-mono">
            Ultimo aggiornamento: {LEGAL_METADATA.lastUpdated} • {LEGAL_METADATA.jurisdiction}
          </p>
        </div>

        {/* Sezione 1: Privacy Policy */}
        <section className="bg-[var(--surface)] rounded-2xl border border-[var(--divider)] p-5 sm:p-7 space-y-6 shadow-sm">
          <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--divider)] space-y-1">
            <h2 className="font-heading font-bold text-base text-[var(--accent-text)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <span>{PRIVACY_POLICY.title}</span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{PRIVACY_POLICY.intro}</p>
          </div>

          <div className="space-y-6 text-xs text-[var(--text)] leading-relaxed divide-y divide-[var(--divider)]">
            {PRIVACY_POLICY.sections.map((sec, idx) => (
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

        {/* Sezione 2: Cookie Policy & Storage */}
        <section className="bg-[var(--surface)] rounded-2xl border border-[var(--divider)] p-5 sm:p-7 space-y-6 shadow-sm">
          <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--divider)] space-y-1">
            <h2 className="font-heading font-bold text-base text-[var(--accent-text)] flex items-center gap-2">
              <Cookie className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <span>{COOKIE_POLICY.title}</span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{COOKIE_POLICY.intro}</p>
          </div>

          <div className="space-y-6 text-xs text-[var(--text)] leading-relaxed divide-y divide-[var(--divider)]">
            {COOKIE_POLICY.sections.map((sec, idx) => (
              <div key={idx} className={idx > 0 ? 'pt-6 space-y-2' : 'space-y-2'}>
                <h3 className="font-bold text-sm text-[var(--text)]">{sec.title}</h3>
                {sec.content.map((p, pIdx) => (
                  <p key={pIdx} className="text-[var(--text-muted)] leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            ))}

            {/* Tabella Cookie */}
            <div className="pt-6 space-y-3">
              <h3 className="font-bold text-sm text-[var(--text)]">
                Dettaglio Tecnologie di Memorizzazione Locale
              </h3>
              <div className="overflow-x-auto rounded-xl border border-[var(--divider)]">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-[var(--surface-raised)] border-b border-[var(--divider)] text-[var(--text-subtle)] font-bold">
                      <th className="p-2.5">Nome Chiave</th>
                      <th className="p-2.5">Fornitore</th>
                      <th className="p-2.5">Finalità</th>
                      <th className="p-2.5">Durata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--divider)] font-mono text-[var(--text-muted)]">
                    {COOKIE_POLICY.cookieTable.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[var(--surface-raised)]/40 transition-colors">
                        <td className="p-2.5 font-bold text-[var(--accent-text)]">{row.name}</td>
                        <td className="p-2.5 font-sans">{row.provider}</td>
                        <td className="p-2.5 font-sans">{row.purpose}</td>
                        <td className="p-2.5">{row.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-[var(--text-subtle)] pt-4 pb-12">
          Per informazioni o richieste sul trattamento dei dati: {LEGAL_METADATA.contactEmail}
        </div>
      </div>
    </main>
  );
}
