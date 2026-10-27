'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Share2, QrCode } from 'lucide-react';
import type { House } from '@/types/house';
import { HouseService } from '@/lib/houseService';

interface ShareHouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  house: House;
}

export function ShareHouseModal({ isOpen, onClose, house }: ShareHouseModalProps) {
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

  if (!isOpen) return null;

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-[var(--surface)] border border-[var(--divider)] shadow-2xl p-6 text-center space-y-5 animate-scale-in"
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

        {/* Titolo e Casa */}
        <div>
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--surface-raised)] border border-[var(--control-border)] text-[var(--accent)] mb-3">
            <QrCode className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-heading font-extrabold text-[var(--text)] tracking-tight">
            Condividi {house.name}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Fai inquadrare il codice con la fotocamera per entrare subito senza registrazione.
          </p>
        </div>

        {/* Riquadro QR Code */}
        <div className="flex justify-center p-3 rounded-xl bg-white shadow-inner max-w-[240px] mx-auto border border-slate-200">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt={`QR Code per unirsi a ${house.name}`}
              className="w-full h-auto rounded-lg select-none"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
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
            className="p-2 text-xs font-medium text-[var(--text)] hover:text-[var(--accent)] rounded-lg hover:bg-[var(--surface-alt)] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
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
            className="w-full py-3 px-4 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] text-[var(--text)] font-bold text-sm btn-tactile cursor-pointer flex items-center justify-center gap-2"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Link copiato negli appunti!' : 'Copia Link Diretto'}</span>
          </button>

          {canShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-3 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] font-bold text-sm btn-tactile cursor-pointer flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Invia su WhatsApp / Condividi</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
