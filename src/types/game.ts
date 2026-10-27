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
  suit?: CardSuit;
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

export type TournamentFormat = 'round_robin' | 'knockout';

export interface TournamentMatch {
  id: string;
  roundIndex: number;
  roundName: string;
  team1Id: string | null;
  team2Id: string | null;
  scoreTeam1?: number;
  scoreTeam2?: number;
  winnerTeamId?: string | null;
  status: 'pending' | 'completed';
  nextMatchId?: string; // per eliminazione diretta: id della partita successiva
  nextMatchSlot?: 'team1' | 'team2'; // quale slot occupare nella partita successiva
}

export interface Tournament {
  id: string;
  name: string;
  gameType: GameType;
  format: TournamentFormat;
  teamIds: string[];
  status: 'in_progress' | 'completed';
  createdAt: string;
  matches: TournamentMatch[];
  winnerTeamId?: string | null;
}

