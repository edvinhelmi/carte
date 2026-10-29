'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { useStorageData } from '@/lib/useStorageData';
import { RealtimeSyncService } from '@/lib/realtimeSync';
import { HouseService } from '@/lib/houseService';
import { installReferenceReveals } from '@/lib/reveal';
import { Header, TabType } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { CalendarView } from '@/components/CalendarView';
import { TorneoSerataView } from '@/components/TorneoSerataView';
import { LeaderboardView } from '@/components/LeaderboardView';
import { TeamsAndPlayersView } from '@/components/TeamsAndPlayersView';
import { SettingsView } from '@/components/SettingsView';
import { QuickMatchModal } from '@/components/QuickMatchModal';
import { EmptyHouseState } from '@/components/EmptyHouseState';
import { ProfileModal } from '@/components/ProfileModal';
import { CookieBanner } from '@/components/CookieBanner';
import { LegalModal, type LegalTab } from '@/components/LegalModal';
import { Footer } from '@/components/Footer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Trophy, ArrowUp } from 'lucide-react';

const emptySubscribe = () => () => {};

export default function Home() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [activeTab, setActiveTab] = useState<TabType>('torneo');
  const [joinNotification, setJoinNotification] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>('privacy');
  const [hasHouse, setHasHouse] = useState<boolean>(() => HouseService.hasActiveHouse());

  const { players, teams, matches, tournamentSessions, activeSession, refresh } =
    useStorageData();

  // Monitora cambiamenti alle case note e casa attiva
  useEffect(() => {
    const checkHouse = () => {
      setHasHouse(HouseService.hasActiveHouse());
    };
    window.addEventListener('carte_storage_update', checkHouse);
    window.addEventListener('carte_house_change', checkHouse);
    return () => {
      window.removeEventListener('carte_storage_update', checkHouse);
      window.removeEventListener('carte_house_change', checkHouse);
    };
  }, []);

  // Rileva parametro ?casa=... da QR Code o link invito
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      const casaParam = url.searchParams.get('casa');
      if (casaParam) {
        HouseService.joinHouseByCodeOrId(casaParam).then((res) => {
          if (res.success && res.house) {
            setJoinNotification(`Sei entrato in ${res.house.name}!`);
            setTimeout(() => setJoinNotification(null), 4000);
            url.searchParams.delete('casa');
            window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
            setHasHouse(true);
            refresh();
          }
        });
      }
    } catch {
      // ignore
    }
  }, [refresh]);

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

  // Sincronizzazione automatica casa con Supabase all'avvio e listener realtime per membri e partite
  useEffect(() => {
    const activeId = HouseService.getActiveHouseId();
    if (activeId) {
      HouseService.setupCloudSync(activeId);
      HouseService.pullHouseDataFromCloud(activeId).then(() => {
        refresh();
      });
    }
  }, [hasHouse, refresh]);

  // TasteCode Motion: initialize reveal lifecycle for active tab
  useEffect(() => {
    if (!mounted) return;
    const cleanup = installReferenceReveals();
    return cleanup;
  }, [mounted, activeTab, hasHouse]);

  // Gestione visibilità pulsante "Torna in alto" per dispositivi mobili
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 280);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text)] flex flex-col font-sans pb-28 md:pb-12 selection:bg-amber-500/20 selection:text-amber-200 overflow-x-clip">
      {/* Header di Navigazione */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickMatch={handleOpenStandardQuickMatch}
        onOpenProfile={() => setIsProfileOpen(true)}
        hasActiveHouse={hasHouse}
      />

      {/* Toast Notifica Casa */}
      {joinNotification && (
        <div className="fixed top-[calc(env(safe-area-inset-top,0px)+3.75rem)] left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[var(--surface-raised)] border border-emerald-500/40 text-emerald-400 font-bold text-xs shadow-xl backdrop-blur-md animate-fade-in flex items-center gap-2">
          <span>🏠</span>
          <span>{joinNotification}</span>
        </div>
      )}

      {/* Contenuto Principale: Schermata Vuota (se nessuna casa) oppure Viste Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16 overflow-x-clip">
        {!hasHouse ? (
          <EmptyHouseState
            onHouseJoinedOrCreated={() => {
              setHasHouse(HouseService.hasActiveHouse());
              refresh();
            }}
          />
        ) : (
          <div key={activeTab} className="view-transition">
            {activeTab === 'torneo' && (
              <ErrorBoundary fallbackTitle="Impossibile caricare il torneo">
                <TorneoSerataView
                  sessions={tournamentSessions}
                  activeSession={activeSession}
                  teams={teams}
                  players={players}
                  onDataUpdated={refresh}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'calendar' && (
              <ErrorBoundary fallbackTitle="Impossibile caricare il calendario">
                <CalendarView
                  matches={matches}
                  teams={teams}
                  tournamentSessions={tournamentSessions}
                  onOpenQuickMatchWithDate={handleOpenQuickMatchWithDate}
                  onMatchesUpdated={refresh}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'leaderboard' && (
              <ErrorBoundary fallbackTitle="Impossibile caricare la classifica">
                <LeaderboardView
                  teams={teams}
                  players={players}
                  matches={matches}
                  tournamentSessions={tournamentSessions}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'teams' && (
              <ErrorBoundary fallbackTitle="Impossibile caricare la gestione squadre">
                <TeamsAndPlayersView players={players} teams={teams} onDataUpdated={refresh} />
              </ErrorBoundary>
            )}

            {activeTab === 'settings' && (
              <ErrorBoundary fallbackTitle="Impossibile caricare le impostazioni">
                <SettingsView
                  onDataUpdated={refresh}
                  onOpenLegal={(tab) => {
                    setLegalModalTab(tab);
                    setIsLegalModalOpen(true);
                  }}
                />
              </ErrorBoundary>
            )}
          </div>
        )}
      </main>

      {/* Footer con note legali, GDPR e preferenze cookie */}
      <Footer
        onOpenLegalModal={(tab) => {
          setLegalModalTab(tab);
          setIsLegalModalOpen(true);
        }}
      />

      {/* Banner Cookie & Consenso GDPR Tecnico */}
      <CookieBanner
        onOpenLegalModal={(tab) => {
          setLegalModalTab(tab);
          setIsLegalModalOpen(true);
        }}
      />

      {/* Modale Completa Privacy Policy, Cookie & Termini */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />

      {/* Modale Registrazione Partita / Vittoria Rapida (attiva solo se in una casa) */}
      {hasHouse && (
        <QuickMatchModal
          isOpen={isQuickMatchOpen}
          onClose={() => setIsQuickMatchOpen(false)}
          teams={teams}
          onMatchSaved={refresh}
          defaultDateKey={quickMatchDateKey}
        />
      )}

      {/* Modale Profilo Utente & Nickname */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false);
          refresh();
        }}
      />

      {/* Barra Inferiore Mobile (visibile solo se c'è una casa attiva) */}
      {hasHouse && (
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenQuickMatch={handleOpenStandardQuickMatch}
        />
      )}

      {/* Pulsante Floating "Torna in alto" per mobile/desktop */}
      {showScrollTop && (
        <button
          type="button"
          onClick={handleScrollToTop}
          aria-label="Torna in cima"
          className="fixed bottom-20 md:bottom-6 right-4 z-40 p-3 rounded-full bg-[var(--surface-raised)]/95 backdrop-blur-md border border-[var(--control-border)] text-[var(--accent)] hover:text-[var(--accent-hover)] shadow-xl btn-tactile cursor-pointer transition-all animate-fade-in"
        >
          <ArrowUp className="w-4 h-4 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
}
