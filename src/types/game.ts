export type GameType = 'briscola' | 'scopa' | 'tressette' | 'burraco';

export type CardSuit = 'coppe' | 'denari' | 'spade' | 'bastoni';

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  avatarSuit: CardSuit;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  playerIds: string[]; // 1 player for 1v1, 2 players for 2v2
  color: string;
  createdAt: string;
}

export interface Match {
  id: string;
  gameType: GameType;
  timestamp: string; // ISO string e.g. 2026-10-27T21:30:00Z
  dateKey: string;   // YYYY-MM-DD
  team1Id: string;
  team2Id: string;
  winnerTeamId: string;
  scoreTeam1?: number; // optional score or points (e.g. 64)
  scoreTeam2?: number; // optional score or points (e.g. 56)
  notes?: string;      // e.g. "Capotto", "Rimonta pazzesca"
}

export interface TeamStats {
  team: Team;
  players: Player[];
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number; // 0 to 100
  streak: number;  // positive for winning streak, 0 otherwise
}

export interface PlayerStats {
  player: Player;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number; // 0 to 100
  streak: number;
}

export interface HeadToHeadStats {
  team1: Team;
  team2: Team;
  team1Wins: number;
  team2Wins: number;
  totalMatches: number;
  lastMatches: Match[];
}

export type TournamentMode = '2vs2' | '1vs1' | '1vs1vs1';

// Sessione di Torneo / Serata di partite consecutive tra due o tre partecipanti
export interface TournamentSession {
  id: string;
  dateKey: string; // YYYY-MM-DD
  startedAt: string;
  endedAt?: string;
  mode?: TournamentMode;
  team1Name: string;
  team1Players: string[];
  team2Name: string;
  team2Players: string[];
  team3Name?: string;
  team3Players?: string[];
  team1Wins: number;
  team2Wins: number;
  team3Wins?: number;
  status: 'in_progress' | 'completed';
  winnerTeam?: 1 | 2 | 3 | 'pareggio';
}
