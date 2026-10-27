'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { useStorageData } from '@/lib/useStorageData';
import { Header, TabType } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { MatchesHomeView } from '@/components/MatchesHomeView';
import { CalendarView } from '@/components/CalendarView';
import { TorneoSerataView } from '@/components/TorneoSerataView';
import { LeaderboardView } from '@/components/LeaderboardView';
import { TeamsAndPlayersView } from '@/components/TeamsAndPlayersView';
import { SettingsView } from '@/components/SettingsView';
import { QuickMatchModal } from '@/components/QuickMatchModal';

const emptySubscribe = () => () => {};

export default function Home() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [activeTab, setActiveTab] = useState<TabType>('matches');
  const { players, teams, matches, tournamentSessions, activeSession, refresh } =
    useStorageData();

  // Stato Modale Quick Match
  const [isQuickMatchOpen, setIsQuickMatchOpen] = useState(false);
  const [quickMatchDateKey, setQuickMatchDateKey] = useState<string | undefined>(undefined);

  // Apertura modale per registrare partita con data specifica
  const handleOpenQuickMatchWithDate = (dateKey: string) => {
    setQuickMatchDateKey(dateKey);
    setIsQuickMatchOpen(true);
  };

  const handleOpenStandardQuickMatch = () => {
    setQuickMatchDateKey(undefined);
    setIsQuickMatchOpen(true);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Caricamento Briscola Club...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans pb-24 md:pb-12">
      {/* Header di Navigazione */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickMatch={handleOpenStandardQuickMatch}
      />

      {/* Contenuto Principale con Tab Switch */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'matches' && (
          <MatchesHomeView
            matches={matches}
            teams={teams}
            players={players}
            onOpenQuickMatch={handleOpenStandardQuickMatch}
            setActiveTab={setActiveTab}
            onMatchesUpdated={refresh}
          />
        )}

        {activeTab === 'torneo' && (
          <TorneoSerataView
            sessions={tournamentSessions}
            activeSession={activeSession}
            teams={teams}
            players={players}
            onDataUpdated={refresh}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            matches={matches}
            teams={teams}
            tournamentSessions={tournamentSessions}
            onOpenQuickMatchWithDate={handleOpenQuickMatchWithDate}
            onMatchesUpdated={refresh}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardView teams={teams} players={players} matches={matches} />
        )}

        {activeTab === 'teams' && (
          <TeamsAndPlayersView players={players} teams={teams} onDataUpdated={refresh} />
        )}

        {activeTab === 'settings' && <SettingsView onDataUpdated={refresh} />}
      </main>

      {/* Modale Registrazione Partita / Vittoria Rapida */}
      <QuickMatchModal
        isOpen={isQuickMatchOpen}
        onClose={() => setIsQuickMatchOpen(false)}
        teams={teams}
        onMatchSaved={refresh}
        defaultDateKey={quickMatchDateKey}
      />

      {/* Barra Inferiore Mobile */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickMatch={handleOpenStandardQuickMatch}
      />
    </div>
  );
}
