'use client';

import { useSyncExternalStore } from 'react';
import { StorageService } from './storage';
import { Player, Team, Match } from '@/types/game';

interface StorageData {
  players: Player[];
  teams: Team[];
  matches: Match[];
}

let cachedData: StorageData = {
  players: [],
  teams: [],
  matches: [],
};

function getSnapshot(): StorageData {
  if (typeof window === 'undefined') return cachedData;
  StorageService.init();
  const players = StorageService.getPlayers();
  const teams = StorageService.getTeams();
  const matches = StorageService.getMatches();

  // Confronto semplice per mantenere lo stesso riferimento se i dati non sono cambiati
  if (
    cachedData.players.length !== players.length ||
    cachedData.teams.length !== teams.length ||
    cachedData.matches.length !== matches.length ||
    JSON.stringify(cachedData) !== JSON.stringify({ players, teams, matches })
  ) {
    cachedData = { players, teams, matches };
  }
  return cachedData;
}

function getServerSnapshot(): StorageData {
  return {
    players: [],
    teams: [],
    matches: [],
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
