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
    { id: 'settings' as TabType, label: 'Impostazioni', icon: Settings },
  ];

  return (
    <nav
      aria-label="Navigazione Principale Mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/95 backdrop-blur-xl border-t border-[var(--divider)] px-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-1.5"
    >
      <div className="flex items-center justify-around relative max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 min-h-[44px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors btn-tactile cursor-pointer select-none ${
                isActive
                  ? 'text-[var(--accent)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
