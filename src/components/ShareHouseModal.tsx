'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { X, Copy, Check, Share2, QrCode } from 'lucide-react';
import type { House } from '@/types/house';
import { HouseService } from '@/lib/houseService';

const emptySubscribe = () => () => {};

interface ShareHouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  house: House;
}

export function ShareHouseModal({ isOpen, onClose, house }: ShareHouseModalProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [canShare] = useState(() => typeof navigator !== 'undefined' && typeof navigator.share === 'function');

  const shareUrl = HouseService.getShareUrl(house.id);

  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(shareUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a', // slate-900 per scansione ottimale ad alto contrasto
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.warn('Errore generazione QR code:', err));
  }, [isOpen, shareUrl]);

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(house.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Unisciti a ${house.name} su Briscola Club`,
          text: `Entra nella casa "${house.name}" per giocare a Briscola e registrare le partite!`,
          url: shareUrl,
        });
      } catch {
        // ignora cancellazione utente
      }
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-md animate-fade-in"
      style={{ overscrollBehavior: 'contain' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-full items-center justify-center p-3.5 sm:p-6 modal-safe-container">
        <div
          className="relative z-10 w-full max-w-sm my-auto rounded-2xl bg-[var(--surface-raised)] border border-[var(--control-border-hover)] ring-1 ring-white/10 shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[min(90vh,calc(100dvh-2rem))] animate-scale-in text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pinned Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--divider)] bg-[var(--surface-raised)] shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[var(--accent-muted)] border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent)] shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="min-w-0 text-left">
                <h2 className="font-heading font-bold text-sm sm:text-base text-[var(--text)] leading-tight truncate">
                  Condividi {house.name}
                </h2>
                <p className="text-[11px] text-[var(--text-muted)] truncate">
                  Codice e QR per unirsi
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

          {/* Scrollable Body */}
          <div className="p-5 overflow-y-auto space-y-4 text-center flex-1 min-h-0">
            <p className="text-xs text-[var(--text-muted)]">
              Fai inquadrare il codice con la fotocamera per entrare subito senza registrazione.
            </p>

            {/* Riquadro QR Code */}
            <div className="flex justify-center p-3 rounded-xl bg-white shadow-inner max-w-[210px] sm:max-w-[240px] mx-auto border border-slate-200">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={`QR Code per unirsi a ${house.name}`}
                  className="w-full h-auto rounded-lg select-none"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                  Generazione QR in corso...
                </div>
              )}
            </div>

            {/* Codice Breve Invito */}
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--control-border)]">
              <div className="text-left">
                <span className="text-[10px] text-[var(--text-muted)] font-medium block">
                  Codice Casa
                </span>
                <span className="font-mono text-base font-bold text-[var(--accent)] tracking-wider">
                  {house.inviteCode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="touch-target p-2 text-xs font-medium text-[var(--text)] hover:text-[var(--accent)] rounded-lg hover:bg-[var(--surface-alt)] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copiato' : 'Copia'}</span>
              </button>
            </div>

            {/* Azioni Condivisione */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] text-[var(--text)] font-bold text-sm btn-tactile cursor-pointer flex items-center justify-center gap-2"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link copiato negli appunti!' : 'Copia Link Diretto'}</span>
              </button>

              {canShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] font-bold text-sm btn-tactile cursor-pointer flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Invia su WhatsApp / Condividi</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
