import type { Player, Team, Match, TournamentSession } from './game.ts';

export interface House {
  id: string;          // e.g. "casa_v8a9f2" or "casa_principale"
  name: string;        // e.g. "Casa Garibaldi", "Casa Principale"
  inviteCode: string;  // e.g. "BRIS-4821"
  createdAt: string;
  updatedAt: string;
}

export interface KnownHouse {
  id: string;
  name: string;
  inviteCode: string;
  joinedAt: string;
  lastActiveAt: string;
}

export interface HouseExportData {
  house: House;
  players: Player[];
  teams: Team[];
  matches: Match[];
  tournamentSessions: TournamentSession[];
}
