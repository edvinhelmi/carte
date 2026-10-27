import React from 'react';
import { CardSuit } from '@/types/game';

interface SuitIconProps {
  suit: CardSuit;
  className?: string;
  size?: number;
}

export function SuitIcon({ suit, className = 'w-5 h-5', size }: SuitIconProps) {
  const style = size ? { width: size, height: size } : undefined;

  switch (suit) {
    case 'coppe':
      // Golden Chalice / Cup
      return (
        <svg
          style={style}
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 3h12v5c0 3.314-2.686 6-6 6s-6-2.686-6-6V3z" fill="currentColor" fillOpacity="0.2" />
          <path d="M12 14v6" />
          <path d="M7 20h10" />
          <path d="M4 6h2" />
          <path d="M18 6h2" />
        </svg>
      );
    case 'denari':
      // Golden Sun Coin
      return (
        <svg
          style={style}
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="8" fill="currentColor" fillOpacity="0.2" />
          <circle cx="12" cy="12" r="4" strokeDasharray="2 2" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="m4.93 19.07 1.41-1.41" />
          <path d="m17.66 6.34 1.41-1.41" />
        </svg>
      );
    case 'spade':
      // Curved Sabre / Sword
      return (
        <svg
          style={style}
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5 3.5C12 6 9 10 9 14l3 3c4 0 8-3 10.5-5.5a1.5 1.5 0 0 0-2-2C18 12 16 13 14 13c0-2 1-4 3.5-6.5a1.5 1.5 0 0 0-3-3z" fill="currentColor" fillOpacity="0.2" />
          <path d="m5 19 4-4" />
          <path d="M4 17l3 3" />
          <path d="m3 21 2-2" />
        </svg>
      );
    case 'bastoni':
      // Knotted Club / Scepter
      return (
        <svg
          style={style}
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 18c2-2 4-5 5-9l3 1c-1 4-2 7-4 9-2 2-4 1-4-1z" fill="currentColor" fillOpacity="0.2" />
          <path d="m12 7 2-2a2 2 0 1 1 3 3l-2 2" />
          <path d="M5 19c-1 1-2 3-1 4s3 0 4-1" />
          <path d="m10 13 2 1" />
          <path d="m8 16 1.5.5" />
        </svg>
      );
  }
}

export function SuitBadge({ suit, label }: { suit: CardSuit; label?: string }) {
  const suitMeta = {
    coppe: { name: 'Coppe', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    denari: { name: 'Denari', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    spade: { name: 'Spade', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    bastoni: { name: 'Bastoni', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  }[suit];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${suitMeta.color}`}>
      <SuitIcon suit={suit} className="w-3.5 h-3.5" />
      <span>{label || suitMeta.name}</span>
    </span>
  );
}
