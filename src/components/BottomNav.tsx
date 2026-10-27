import React from 'react';
import { Sparkles, Calendar, Trophy, Users, Plus } from 'lucide-react';
import { TabType } from './Header';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenQuickMatch: () => void;
}

export function BottomNav({ activeTab, setActiveTab, onOpenQuickMatch }: BottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 px-2 pb-[max(env(safe-area-inset-bottom),0.6rem)] pt-1.5">
      <div className="flex items-center justify-around relative">
        {/* Tab 1: Partite */}
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
            activeTab === 'matches' ? 'text-amber-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Partite</span>
        </button>

        {/* Tab 2: Calendario */}
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
            activeTab === 'calendar' ? 'text-amber-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Calendario</span>
        </button>

        {/* Center Elevato: Quick Add Button */}
        <div className="-mt-5 flex flex-col items-center">
          <button
            onClick={onOpenQuickMatch}
            aria-label="Registra Nuova Partita"
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-zinc-950 flex items-center justify-center shadow-lg shadow-amber-500/30 border-2 border-zinc-900 active:scale-90 transition-transform cursor-pointer"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
          <span className="text-[10px] text-amber-400/90 font-medium mt-0.5">Vittoria</span>
        </div>

        {/* Tab 3: Classifica */}
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
            activeTab === 'leaderboard' ? 'text-amber-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Trophy className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Classifica</span>
        </button>

        {/* Tab 4: Squadre & Giocatori */}
        <button
          onClick={() => setActiveTab('teams')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
            activeTab === 'teams' ? 'text-amber-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Squadre</span>
        </button>
      </div>
    </div>
  );
}
