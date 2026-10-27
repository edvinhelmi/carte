import React from 'react';
import { CardSuit } from '@/types/game';

interface SuitIconProps {
  suit: CardSuit;
  className?: string;
  size?: number;
}

export function SuitIcon({ suit, className = 'w-4 h-4', size }: SuitIconProps) {
  const style = size ? { width: size, height: size } : undefined;

  switch (suit) {
    case 'coppe':
      // Golden Chalice / Cup of Briscola
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
          aria-hidden="true"
        >
          <path d="M6 3h12v5c0 3.314-2.686 6-6 6s-6-2.686-6-6V3z" fill="currentColor" fillOpacity="0.18" />
          <path d="M12 14v6" />
          <path d="M7 20h10" />
          <path d="M4 6h2" />
          <path d="M18 6h2" />
        </svg>
      );
    case 'denari':
      // Radiant Gold Sun Coin of Denari
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
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="8" fill="currentColor" fillOpacity="0.18" />
          <circle cx="12" cy="12" r="3.5" strokeDasharray="2 2" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m5 5 1.5 1.5" />
          <path d="m17.5 17.5 1.5 1.5" />
          <path d="m5 19 1.5-1.5" />
          <path d="m17.5 6.5 1.5-1.5" />
        </svg>
      );
    case 'spade':
      // Curved Scimitar of Spade
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
          aria-hidden="true"
        >
          <path
            d="M14.5 3.5C12 6 9 10 9 14l3 3c4 0 8-3 10.5-5.5a1.5 1.5 0 0 0-2-2C18 12 16 13 14 13c0-2 1-4 3.5-6.5a1.5 1.5 0 0 0-3-3z"
            fill="currentColor"
            fillOpacity="0.18"
          />
          <path d="m5 19 4-4" />
          <path d="M4 17l3 3" />
          <path d="m3 21 2-2" />
        </svg>
      );
    case 'bastoni':
      // Knotted Scepter / Club of Bastoni
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
          aria-hidden="true"
        >
          <path
            d="M6 18c2-2 4-5 5-9l3 1c-1 4-2 7-4 9-2 2-4 1-4-1z"
            fill="currentColor"
            fillOpacity="0.18"
          />
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
    coppe: {
      name: 'Coppe',
      classes: 'text-amber-300 bg-amber-500/10 border-amber-500/25',
    },
    denari: {
      name: 'Denari',
      classes: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/25',
    },
    spade: {
      name: 'Spade',
      classes: 'text-sky-300 bg-sky-500/10 border-sky-500/25',
    },
    bastoni: {
      name: 'Bastoni',
      classes: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
    },
  }[suit];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border tabular-nums ${suitMeta.classes}`}
    >
      <SuitIcon suit={suit} className="w-3.5 h-3.5 shrink-0" />
      <span>{label || suitMeta.name}</span>
    </span>
  );
}
