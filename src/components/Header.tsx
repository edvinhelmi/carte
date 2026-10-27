import React from 'react';
import { Trophy, Calendar as CalendarIcon, Users, Settings, Swords, Plus } from 'lucide-react';
import { SuitIcon } from './SuitIcon';
import { RealtimeSyncService } from '@/lib/realtimeSync';

export type TabType = 'torneo' | 'calendar' | 'leaderboard' | 'teams' | 'settings';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenQuickMatch?: () => void;
}

export function Header({ activeTab, setActiveTab, onOpenQuickMatch }: HeaderProps) {
  const room = typeof window !== 'undefined' ? RealtimeSyncService.getRoom() : '';

  const navItems = [
    { id: 'torneo' as TabType, label: 'Torneo Serata', icon: Swords },
    { id: 'calendar' as TabType, label: 'Calendario', icon: CalendarIcon },
    { id: 'leaderboard' as TabType, label: 'Classifica', icon: Trophy },
    { id: 'teams' as TabType, label: 'Squadre & Giocatori', icon: Users },
    { id: 'settings' as TabType, label: 'Impostazioni', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[var(--canvas)]/90 backdrop-blur-xl border-b border-[var(--divider)] px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand / Logo */}
        <button
          type="button"
          onClick={() => setActiveTab('torneo')}
          className="flex items-center gap-2.5 sm:gap-3 text-left group cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-xl min-w-0"
        >
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--surface-raised)] border border-[var(--control-border)] flex items-center justify-center shadow-sm group-hover:border-[var(--accent)]/60 transition-colors shrink-0">
            <SuitIcon suit="coppe" className="w-5 h-5 text-[var(--accent)]" />
            <span
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--canvas)]"
              title={room ? `Live Cloud: stanza ${room}` : 'Sincronizzazione Live Cloud Attiva'}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-heading font-extrabold text-base sm:text-lg text-[var(--text)] tracking-tight truncate">
                Briscola Club
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--accent-muted)] text-[var(--accent-text)] border border-[var(--accent-border)] shrink-0">
                Casa
              </span>
            </div>
            <p className="text-[11px] sm:text-[12px] text-[var(--text-muted)] flex items-center gap-1.5 font-medium truncate">
              <span className="hidden sm:inline">Torneo &amp; Tracker</span>
              <span className="hidden sm:inline text-[var(--text-subtle)]">•</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 inline-block sm:hidden" />
              <span className="text-emerald-400 font-mono text-[11px]">Live Cloud</span>
            </p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-[var(--surface)] p-1 rounded-xl border border-[var(--divider)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold btn-tactile transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[var(--surface-alt)] text-[var(--text)] border border-[var(--control-border)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)] border border-transparent'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenQuickMatch && (
            <button
              type="button"
              onClick={onOpenQuickMatch}
              aria-label="Registra vittoria rapida"
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] hover:border-[var(--control-border-hover)] text-xs font-semibold text-[var(--text)] btn-tactile cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="text-xs">+ Vittoria</span>
            </button>
          )}

          {/* Desktop Live Tournament Button */}
          <button
            type="button"
            onClick={() => setActiveTab('torneo')}
            className={`hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold btn-tactile cursor-pointer shadow-sm ${
              activeTab === 'torneo'
                ? 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] shadow-[0_2px_12px_rgba(245,158,11,0.25)]'
                : 'bg-[var(--surface-alt)] hover:bg-[var(--surface-hover)] border border-[var(--control-border)] text-[var(--text)]'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Tabellone Live</span>
          </button>
        </div>
      </div>
    </header>
  );
}
