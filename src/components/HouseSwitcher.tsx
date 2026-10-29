'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Home, ChevronDown, Check, Plus, QrCode } from 'lucide-react';
import { HouseService } from '@/lib/houseService';
import type { House, KnownHouse } from '@/types/house';
import { ShareHouseModal } from './ShareHouseModal';
import { CreateOrJoinHouseModal } from './CreateOrJoinHouseModal';

const emptySubscribe = () => () => {};

export function HouseSwitcher() {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [activeHouse, setActiveHouse] = useState<House | null>(() => HouseService.getActiveHouse());
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

  // Click outside listener & Escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectHouse = (houseId: string) => {
    HouseService.setActiveHouse(houseId);
    refreshHouses();
    setIsOpen(false);
  };

  const houseName = activeHouse?.name || 'Nessuna Casa';

  return (
    <>
      <div className="relative inline-block max-w-full" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="touch-target inline-flex items-center justify-center gap-2 px-3 py-2 sm:px-3 sm:py-1.5 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] hover:border-[var(--accent)]/40 text-[var(--text)] transition-colors cursor-pointer group select-none max-w-[200px] min-[375px]:max-w-[230px] min-[410px]:max-w-[270px] sm:max-w-[240px] min-h-[44px]"
          aria-haspopup="true"
          aria-expanded={isOpen}
          title={activeHouse ? `Casa attiva: ${activeHouse.name}` : 'Nessuna casa attiva'}
        >
          <Home className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${activeHouse ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} shrink-0`} />
          <span className="text-sm sm:text-xs font-bold truncate tracking-tight">{houseName}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 sm:w-3 sm:h-3 text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[var(--accent)]' : ''
            }`}
          />
        </button>

        {/* Dropdown desktop */}
        {isOpen && (
          <div className="hidden sm:block absolute top-full left-0 mt-2 w-64 rounded-2xl bg-[var(--surface-raised)] border border-[var(--control-border-hover)] ring-1 ring-white/10 shadow-2xl p-1.5 z-50 animate-scale-in">
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
            {knownHouses.length > 0 ? (
              <div className="max-h-52 overflow-y-auto space-y-0.5">
                {knownHouses.map((house) => {
                  const isCurrent = activeHouse ? house.id === activeHouse.id : false;
                  return (
                    <button
                      key={house.id}
                      type="button"
                      onClick={() => handleSelectHouse(house.id)}
                      className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-[var(--surface-alt)] text-[var(--text)] font-bold'
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
            ) : (
              <div className="px-3 py-3 text-center text-xs text-[var(--text-muted)]">
                Non hai ancora nessuna casa.
              </div>
            )}

            <div className="my-1 border-t border-[var(--divider)]" />

            {/* Azioni */}
            <div className="space-y-0.5">
              {activeHouse && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setShowShareModal(true);
                  }}
                  className="w-full min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Condividi con QR / Link</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowCreateModal(true);
                }}
                className="w-full min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>Nuova o Entra in una Casa</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dropdown mobile portalled directly to document.body to avoid header stacking context trapping */}
      {isOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-[90] sm:hidden overflow-y-auto bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="fixed left-3 right-3 top-[calc(env(safe-area-inset-top,0px)+3.75rem)] max-w-sm mx-auto rounded-2xl bg-[var(--surface-raised)] border border-[var(--control-border-hover)] ring-1 ring-white/10 shadow-2xl shadow-black/80 p-2 z-[91] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
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
            {knownHouses.length > 0 ? (
              <div className="max-h-52 overflow-y-auto space-y-0.5">
                {knownHouses.map((house) => {
                  const isCurrent = activeHouse ? house.id === activeHouse.id : false;
                  return (
                    <button
                      key={house.id}
                      type="button"
                      onClick={() => handleSelectHouse(house.id)}
                      className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-[var(--surface-alt)] text-[var(--text)] font-bold'
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
            ) : (
              <div className="px-3 py-3 text-center text-xs text-[var(--text-muted)]">
                Non hai ancora nessuna casa.
              </div>
            )}

            <div className="my-1 border-t border-[var(--divider)]" />

            {/* Azioni */}
            <div className="space-y-0.5">
              {activeHouse && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setShowShareModal(true);
                  }}
                  className="w-full min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Condividi con QR / Link</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowCreateModal(true);
                }}
                className="w-full min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>Nuova o Entra in una Casa</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {activeHouse && (
        <ShareHouseModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          house={activeHouse}
        />
      )}

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
