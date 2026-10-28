import type { Player, Team, Match, TournamentSession } from './game.ts';

export interface House {
  id: string;          // e.g. "casa_v8a9f2"
  name: string;        // e.g. "Casa Garibaldi"
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

export interface HouseMember {
  houseId: string;
  userId: string;
  displayName: string;
  nickname?: string; // soprannome personalizzato solo in questa casa
  avatarUrl?: string;
  role?: 'owner' | 'member';
  joinedAt: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  displayName: string;
  avatarUrl?: string;
  isGoogleUser: boolean;
}

export interface HouseExportData {
  house: House;
  players: Player[];
  teams: Team[];
  matches: Match[];
  tournamentSessions: TournamentSession[];
}
