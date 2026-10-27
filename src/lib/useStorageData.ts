'use client';

import { useSyncExternalStore } from 'react';
import { StorageService } from './storage';
import { Player, Team, Match, TournamentSession } from '@/types/game';

interface StorageData {
  players: Player[];
  teams: Team[];
  matches: Match[];
  tournamentSessions: TournamentSession[];
  activeSession: TournamentSession | null;
}

let cachedData: StorageData = {
  players: [],
  teams: [],
  matches: [],
  tournamentSessions: [],
  activeSession: null,
};

function getSnapshot(): StorageData {
  if (typeof window === 'undefined') return cachedData;
  StorageService.init();
  const players = StorageService.getPlayers();
  const teams = StorageService.getTeams();
  const matches = StorageService.getMatches();
  const tournamentSessions = StorageService.getTournamentSessions();
  const activeSession = StorageService.getActiveTournamentSession();

  if (
    cachedData.players.length !== players.length ||
    cachedData.teams.length !== teams.length ||
    cachedData.matches.length !== matches.length ||
    cachedData.tournamentSessions.length !== tournamentSessions.length ||
    JSON.stringify(cachedData.activeSession) !== JSON.stringify(activeSession) ||
    JSON.stringify(cachedData) !==
      JSON.stringify({ players, teams, matches, tournamentSessions, activeSession })
  ) {
    cachedData = { players, teams, matches, tournamentSessions, activeSession };
  }
  return cachedData;
}

function getServerSnapshot(): StorageData {
  return {
    players: [],
    teams: [],
    matches: [],
    tournamentSessions: [],
    activeSession: null,
  };
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('carte_storage_update', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('carte_storage_update', callback);
    window.removeEventListener('storage', callback);
  };
}

export function useStorageData() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    ...data,
    refresh: () => {
      window.dispatchEvent(new Event('carte_storage_update'));
    },
  };
}
