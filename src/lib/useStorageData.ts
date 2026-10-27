'use client';

import { useSyncExternalStore } from 'react';
import { StorageService } from './storage';
import { Player, Team, Match, Tournament } from '@/types/game';

interface StorageData {
  players: Player[];
  teams: Team[];
  matches: Match[];
  tournaments: Tournament[];
}

let cachedData: StorageData = {
  players: [],
  teams: [],
  matches: [],
  tournaments: [],
};

function getSnapshot(): StorageData {
  if (typeof window === 'undefined') return cachedData;
  StorageService.init();
  const players = StorageService.getPlayers();
  const teams = StorageService.getTeams();
  const matches = StorageService.getMatches();
  const tournaments = StorageService.getTournaments();

  // Confronto per mantenere lo stesso riferimento se non è cambiato nulla
  if (
    cachedData.players.length !== players.length ||
    cachedData.teams.length !== teams.length ||
    cachedData.matches.length !== matches.length ||
    cachedData.tournaments.length !== tournaments.length ||
    JSON.stringify(cachedData) !== JSON.stringify({ players, teams, matches, tournaments })
  ) {
    cachedData = { players, teams, matches, tournaments };
  }
  return cachedData;
}

function getServerSnapshot(): StorageData {
  return {
    players: [],
    teams: [],
    matches: [],
    tournaments: [],
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
