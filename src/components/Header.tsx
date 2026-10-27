import React from 'react';
import { Trophy, Calendar as CalendarIcon, Users, Settings, Swords, Play } from 'lucide-react';
import { SuitIcon } from './SuitIcon';

export type TabType = 'torneo' | 'calendar' | 'leaderboard' | 'teams' | 'settings';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenQuickMatch?: () => void;
}

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  const navItems = [
    { id: 'torneo' as TabType, label: 'Torneo Serata', icon: Swords },
    { id: 'calendar' as TabType, label: 'Calendario', icon: CalendarIcon },
    { id: 'leaderboard' as TabType, label: 'Classifica', icon: Trophy },
    { id: 'teams' as TabType, label: 'Squadre & Giocatori', icon: Users },
    { id: 'settings' as TabType, label: 'Impostazioni', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          onClick={() => setActiveTab('torneo')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 via-emerald-500/10 to-zinc-900 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/5 group-hover:border-amber-400 transition-all">
            <SuitIcon suit="coppe" className="w-5 h-5 text-amber-400" />
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-zinc-950">
              B
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-zinc-100 tracking-tight">Briscola</span>
              <span className="text-xs uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Club
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">Torneo &amp; Segnapunti Casa</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-900/70 p-1 rounded-xl border border-zinc-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-zinc-800 text-amber-300 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Action Button: Torneo Serata */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('torneo')}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-zinc-950 font-semibold text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-zinc-950" />
            <span>Torneo Live</span>
          </button>
        </div>
      </div>
    </header>
  );
}
