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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/95 backdrop-blur-xl border-t border-[var(--divider)] px-1 pt-1.5 bottom-nav-safe shadow-lg"
    >
      <div className="grid grid-cols-5 w-full max-w-md mx-auto items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full min-h-[48px] flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all btn-tactile cursor-pointer select-none relative ${
                isActive
                  ? 'text-[var(--accent)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-6 h-0.5 rounded-full bg-[var(--accent)]" />
              )}
              <div className="w-5 h-5 flex items-center justify-center shrink-0 mb-0.5">
                <Icon className="w-4.5 h-4.5" />
              </div>
              <span className="text-[10px] leading-none font-medium tracking-tight text-center truncate max-w-full block whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
