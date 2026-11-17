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
      className="md:hidden fixed left-3 right-3 z-40 max-w-md mx-auto bottom-[max(env(safe-area-inset-bottom,0px),0.75rem)]"
    >
      <div className="glass-ios-island rounded-[28px] p-1.5 grid grid-cols-5 items-center gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative w-full min-h-[52px] flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 rounded-[22px] btn-ios-tactile cursor-pointer select-none transition-colors duration-200 ${
                isActive ? 'glass-thumb text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Icon
                size={21}
                strokeWidth={isActive ? 2.4 : 1.9}
                className={isActive ? 'text-[var(--accent)]' : ''}
              />
              <span
                className={`text-[10.5px] leading-none text-center truncate max-w-full whitespace-nowrap ${
                  isActive ? 'font-semibold' : 'font-medium'
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
