'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { useStorageData } from '@/lib/useStorageData';
import { RealtimeSyncService } from '@/lib/realtimeSync';
import { installReferenceReveals } from '@/lib/reveal';
import { Header, TabType } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { CalendarView } from '@/components/CalendarView';
import { TorneoSerataView } from '@/components/TorneoSerataView';
import { LeaderboardView } from '@/components/LeaderboardView';
import { TeamsAndPlayersView } from '@/components/TeamsAndPlayersView';
import { SettingsView } from '@/components/SettingsView';
import { QuickMatchModal } from '@/components/QuickMatchModal';
import { Trophy } from 'lucide-react';

const emptySubscribe = () => () => {};

export default function Home() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [activeTab, setActiveTab] = useState<TabType>('torneo');
  const { players, teams, matches, tournamentSessions, activeSession, refresh } =
    useStorageData();

  // Stato Modale Quick Match
  const [isQuickMatchOpen, setIsQuickMatchOpen] = useState(false);
  const [quickMatchDateKey, setQuickMatchDateKey] = useState<string | undefined>(undefined);

  // Connessione Real-time Cloud SSE per sincronizzazione multi-telefono e multi-dispositivo
  useEffect(() => {
    RealtimeSyncService.connect();
    return () => {
      RealtimeSyncService.disconnect();
    };
  }, []);

  // TasteCode Motion: initialize reveal lifecycle for active tab
  useEffect(() => {
    if (!mounted) return;
    const cleanup = installReferenceReveals();
    return cleanup;
  }, [mounted, activeTab]);

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
      <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center text-[var(--text-muted)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[var(--surface-raised)] border border-[var(--control-border)] flex items-center justify-center shadow-sm">
            <Trophy className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <span className="text-xs font-semibold text-[var(--text)] tracking-tight">
            Caricamento Briscola Club...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text)] flex flex-col font-sans pb-28 md:pb-12 selection:bg-amber-500/20 selection:text-amber-200 overflow-x-hidden">
      {/* Header di Navigazione */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickMatch={handleOpenStandardQuickMatch}
      />

      {/* Contenuto Principale con Tab Switch */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 overflow-x-hidden">
        <div key={activeTab} className="view-transition">
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
            <LeaderboardView
              teams={teams}
              players={players}
              matches={matches}
              tournamentSessions={tournamentSessions}
            />
          )}

          {activeTab === 'teams' && (
            <TeamsAndPlayersView players={players} teams={teams} onDataUpdated={refresh} />
          )}

          {activeTab === 'settings' && <SettingsView onDataUpdated={refresh} />}
        </div>
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
