'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, Cookie, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { PRIVACY_POLICY, COOKIE_POLICY, TERMS_OF_SERVICE, LEGAL_METADATA } from '@/lib/legalContent';

export type LegalTab = 'privacy' | 'cookie' | 'terms';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

export function LegalModal({ isOpen, onClose, initialTab = 'privacy' }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] overflow-y-auto bg-black/80 backdrop-blur-md animate-fade-in"
      style={{ overscrollBehavior: 'contain' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="flex min-h-full items-center justify-center p-3 sm:p-6 modal-safe-container">
        <div
          className="relative z-10 w-full max-w-2xl my-auto rounded-2xl bg-[var(--surface)] text-[var(--text)] border border-[var(--control-border-hover)] ring-1 ring-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[min(90vh,calc(100dvh-2rem))] animate-scale-in text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Modale */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--divider)] bg-[var(--surface-raised)] shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[var(--accent-muted)] border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent)] shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 id="legal-modal-title" className="font-heading font-bold text-base text-[var(--text)] truncate">
                  Centro Privacy &amp; Note Legali
                </h2>
                <p className="text-[11px] text-[var(--text-muted)] truncate">
                  Conforme GDPR (Regolamento UE 2016/679) • Aggiornato al {LEGAL_METADATA.lastUpdated}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="touch-target p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer shrink-0 ml-2"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="px-5 pt-3 border-b border-[var(--divider)] bg-[var(--surface)] shrink-0 flex gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`touch-target pb-2.5 px-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'privacy'
                  ? 'border-[var(--accent)] text-[var(--accent-text)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cookie')}
              className={`touch-target pb-2.5 px-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'cookie'
                  ? 'border-[var(--accent)] text-[var(--accent-text)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Cookie className="w-3.5 h-3.5" />
              <span>Cookie &amp; Storage</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`touch-target pb-2.5 px-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'terms'
                  ? 'border-[var(--accent)] text-[var(--accent-text)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Termini di Servizio</span>
            </button>
          </div>

          {/* Contenuto Documento */}
          <div className="p-5 overflow-y-auto flex-1 min-h-0 space-y-5 text-xs text-[var(--text)] leading-relaxed">
            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--divider)] space-y-1">
                  <h3 className="font-heading font-bold text-sm text-[var(--accent-text)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0" />
                    <span>{PRIVACY_POLICY.title}</span>
                  </h3>
                  <p className="text-[var(--text-muted)] leading-relaxed">{PRIVACY_POLICY.intro}</p>
                </div>

                {PRIVACY_POLICY.sections.map((sec, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <h4 className="font-bold text-sm text-[var(--text)]">{sec.title}</h4>
                    {sec.content.map((paragraph, pIdx) => (
                      <p key={pIdx} className="text-[var(--text-muted)] leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'cookie' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--divider)] space-y-1">
                  <h3 className="font-heading font-bold text-sm text-[var(--accent-text)] flex items-center gap-1.5">
                    <Cookie className="w-4 h-4 text-[var(--accent)] shrink-0" />
                    <span>{COOKIE_POLICY.title}</span>
                  </h3>
                  <p className="text-[var(--text-muted)] leading-relaxed">{COOKIE_POLICY.intro}</p>
                </div>

                {COOKIE_POLICY.sections.map((sec, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <h4 className="font-bold text-sm text-[var(--text)]">{sec.title}</h4>
                    {sec.content.map((paragraph, pIdx) => (
                      <p key={pIdx} className="text-[var(--text-muted)] leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ))}

                {/* Tabella Dettagliata Cookie & Storage */}
                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-sm text-[var(--text)]">
                    Tabella delle Tecnologie di Archiviazione Utilizzate
                  </h4>
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
            )}

            {activeTab === 'terms' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--divider)] space-y-1">
                  <h3 className="font-heading font-bold text-sm text-[var(--accent-text)] flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-[var(--accent)] shrink-0" />
                    <span>{TERMS_OF_SERVICE.title}</span>
                  </h3>
                  <p className="text-[var(--text-muted)] leading-relaxed">{TERMS_OF_SERVICE.intro}</p>
                </div>

                {TERMS_OF_SERVICE.sections.map((sec, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <h4 className="font-bold text-sm text-[var(--text)]">{sec.title}</h4>
                    {sec.content.map((paragraph, pIdx) => (
                      <p key={pIdx} className="text-[var(--text-muted)] leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Modale */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--divider)] bg-[var(--surface-raised)] shrink-0 text-xs">
            <span className="text-[var(--text-subtle)] font-mono">
              Contatto DPO: {LEGAL_METADATA.contactEmail}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] font-bold btn-tactile cursor-pointer"
            >
              Ho Letto e Compreso
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
