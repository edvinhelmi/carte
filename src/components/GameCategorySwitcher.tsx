'use client';

import React, { useState, useEffect } from 'react';
import { StorageService } from '@/lib/storage';
import type { GameType } from '@/types/game';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClone, faBroom } from '@fortawesome/free-solid-svg-icons';

interface GameCategorySwitcherProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function GameCategorySwitcher({ className = '', size = 'md' }: GameCategorySwitcherProps) {
  const [activeCategory, setActiveCategory] = useState<GameType>(() => StorageService.getActiveGameCategory());

  useEffect(() => {
    const handleCategoryChange = () => {
      setActiveCategory(StorageService.getActiveGameCategory());
    };
    window.addEventListener('carte_game_category_change', handleCategoryChange);
    window.addEventListener('carte_storage_update', handleCategoryChange);
    return () => {
      window.removeEventListener('carte_game_category_change', handleCategoryChange);
      window.removeEventListener('carte_storage_update', handleCategoryChange);
    };
  }, []);

  const handleSelect = (category: GameType) => {
    if (category === activeCategory) return;
    StorageService.setActiveGameCategory(category);
    setActiveCategory(category);
  };

  const isSmall = size === 'sm';

  return (
    <div
      role="radiogroup"
      aria-label="Seleziona gioco attivo"
      className={`inline-flex items-center p-1 glass-ios-island rounded-full shadow-2xl ${className}`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={activeCategory === 'briscola'}
        onClick={() => handleSelect('briscola')}
        className={`flex items-center justify-center gap-1.5 font-bold transition-all duration-160 btn-ios-tactile cursor-pointer select-none min-h-[44px] ${
          isSmall ? 'px-4 py-1.5 text-xs rounded-full' : 'px-5 py-2 text-xs sm:text-sm rounded-full'
        } ${
          activeCategory === 'briscola'
            ? 'bg-[var(--accent)] text-[var(--on-accent)] font-black shadow-md shadow-amber-500/25 ring-1 ring-amber-300/40'
            : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/5'
        }`}
      >
        <FontAwesomeIcon icon={faClone} className="text-xs shrink-0" aria-hidden="true" />
        <span>Briscola</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={activeCategory === 'scopa'}
        onClick={() => handleSelect('scopa')}
        className={`flex items-center justify-center gap-1.5 font-bold transition-all duration-160 btn-ios-tactile cursor-pointer select-none min-h-[44px] ${
          isSmall ? 'px-4 py-1.5 text-xs rounded-full' : 'px-5 py-2 text-xs sm:text-sm rounded-full'
        } ${
          activeCategory === 'scopa'
            ? 'bg-[var(--accent)] text-[var(--on-accent)] font-black shadow-md shadow-amber-500/25 ring-1 ring-amber-300/40'
            : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/5'
        }`}
      >
        <FontAwesomeIcon icon={faBroom} className="text-xs shrink-0" aria-hidden="true" />
        <span>Scopa</span>
      </button>
    </div>
  );
}
