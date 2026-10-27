'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Home, ChevronDown, Check, Plus, QrCode } from 'lucide-react';
import { HouseService } from '@/lib/houseService';
import type { House, KnownHouse } from '@/types/house';
import { ShareHouseModal } from './ShareHouseModal';
import { CreateOrJoinHouseModal } from './CreateOrJoinHouseModal';

export function HouseSwitcher() {
  const [activeHouse, setActiveHouse] = useState<House>(() => HouseService.getActiveHouse());
  const [knownHouses, setKnownHouses] = useState<KnownHouse[]>(() => HouseService.getKnownHouses());
  const [isOpen, setIsOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const refreshHouses = () => {
    setActiveHouse(HouseService.getActiveHouse());
    setKnownHouses(HouseService.getKnownHouses());
  };

  useEffect(() => {
    const handleUpdate = () => {
      setActiveHouse(HouseService.getActiveHouse());
      setKnownHouses(HouseService.getKnownHouses());
    };

    window.addEventListener('carte_storage_update', handleUpdate);
    window.addEventListener('carte_house_change', handleUpdate);

    return () => {
      window.removeEventListener('carte_storage_update', handleUpdate);
      window.removeEventListener('carte_house_change', handleUpdate);
    };
  }, []);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectHouse = (houseId: string) => {
    HouseService.setActiveHouse(houseId);
    refreshHouses();
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative inline-block" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="touch-target inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] hover:border-[var(--accent)]/40 text-[var(--text)] transition-colors cursor-pointer group select-none max-w-[190px] sm:max-w-[240px]"
          aria-haspopup="true"
          aria-expanded={isOpen}
          title={`Casa attiva: ${activeHouse.name}`}
        >
          <Home className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
          <span className="text-xs font-bold truncate tracking-tight">{activeHouse.name}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-64 rounded-2xl bg-[var(--surface)] border border-[var(--divider)] shadow-2xl p-1.5 z-50 animate-scale-in">
            {/* Intestazione */}
            <div className="px-3 py-2 border-b border-[var(--divider)] mb-1 flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--text-muted)]">
                Le tue Case
              </span>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">
                {knownHouses.length} {knownHouses.length === 1 ? 'casa' : 'case'}
              </span>
            </div>

            {/* Lista Case note */}
            <div className="max-h-52 overflow-y-auto space-y-0.5">
              {knownHouses.map((house) => {
                const isCurrent = house.id === activeHouse.id;
                return (
                  <button
                    key={house.id}
                    type="button"
                    onClick={() => handleSelectHouse(house.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-[var(--surface-raised)] text-[var(--text)] font-bold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)]/60'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="block truncate">{house.name}</span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        {house.inviteCode}
                      </span>
                    </div>
                    {isCurrent && <Check className="w-4 h-4 text-[var(--accent)] shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="my-1 border-t border-[var(--divider)]" />

            {/* Azioni */}
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowShareModal(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-raised)] transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Condividi con QR / Link</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowCreateModal(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-raised)] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>Nuova o Entra in una Casa</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <ShareHouseModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        house={activeHouse}
      />

      <CreateOrJoinHouseModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          refreshHouses();
        }}
      />
    </>
  );
}
