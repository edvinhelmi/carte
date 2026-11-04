import React from 'react';
import { Calendar, Trophy, Swords, Users, Settings } from 'lucide-react';
import { TabType } from './Header';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenQuickMatch?: () => void;
}

export function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const navItems = [
    { id: 'torneo' as TabType, label: 'Torneo', icon: Swords },
    { id: 'calendar' as TabType, label: 'Calendario', icon: Calendar },
    { id: 'leaderboard' as TabType, label: 'Classifica', icon: Trophy },
    { id: 'teams' as TabType, label: 'Squadre', icon: Users },
    { id: 'settings' as TabType, label: 'Opzioni', icon: Settings },
  ];

  return (
    <nav
      aria-label="Navigazione Principale Mobile"
      className="md:hidden fixed bottom-3 left-3 right-3 z-40 max-w-md mx-auto"
    >
      <div className="glass-ios-island rounded-[26px] px-1.5 py-1 grid grid-cols-5 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full min-h-[48px] flex flex-col items-center justify-center py-1 px-0.5 rounded-2xl transition-all duration-150 btn-ios-tactile cursor-pointer select-none relative ${
                isActive
                  ? 'text-[var(--accent)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] active:text-[var(--accent)]'
              }`}
            >
              {isActive && (
                <span className="absolute -top-0.5 w-7 h-1 rounded-full bg-[var(--accent)] shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
              )}
              <div
                className={`w-6 h-6 flex items-center justify-center shrink-0 mb-0.5 transition-all duration-200 ${
                  isActive ? 'scale-110 -translate-y-0.5 text-[var(--accent)]' : 'scale-100 opacity-70'
                }`}
              >
                <Icon size={19} />
              </div>
              <span
                className={`text-[10px] leading-none tracking-tight text-center truncate max-w-full block whitespace-nowrap transition-colors duration-150 ${
                  isActive ? 'font-bold text-[var(--accent)]' : 'font-medium text-[var(--text-muted)]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
