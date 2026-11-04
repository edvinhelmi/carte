export type GameType = 'briscola' | 'scopa' | 'tressette' | 'burraco';

export type CardSuit = 'coppe' | 'denari' | 'spade' | 'bastoni';

export interface Player {
  id: string;
  houseId?: string;
  name: string;
  nickname?: string;
  avatarSuit: CardSuit;
  createdAt: string;
  isFriend?: boolean;
}

export interface Team {
  id: string;
  houseId?: string;
  name: string;
  playerIds: string[]; // 1 player for 1v1, 2 players for 2v2
  playerNames?: string[]; // Nomi espliciti dei componenti per fallback e visualizzazione
  color: string;
  createdAt: string;
}

export interface Match {
  id: string;
  houseId?: string;
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

export type TournamentMode = '2vs2' | '1vs1' | '1vs1vs1' | 'a5';

export type ScopaVariant = 'scopa_normale' | 'scopone_scientifico';

export interface ScopaRound {
  id: string;
  roundNumber: number;
  scopeTeam1: number;       // Numero di scope fatte dalla Squadra 1
  scopeTeam2: number;       // Numero di scope fatte dalla Squadra 2
  carteWinner?: 1 | 2 | 'patta';    // Carte (>20 = 1pt, patta = 0pt)
  denariWinner?: 1 | 2 | 'patta';   // Denari (>5 = 1pt, patta = 0pt)
  settebelloWinner?: 1 | 2;         // Sette di denari (1pt, va sempre a una squadra)
  primieraWinner?: 1 | 2 | 'patta'; // Primiera / settanta (1pt, patta = 0pt)
  napolaPointsTeam1?: number;       // Napola Squadra 1 (almeno 3 punti per A-2-3 di denari)
  napolaPointsTeam2?: number;       // Napola Squadra 2
  extraPointsTeam1?: number;        // Punti extra/manuali Squadra 1
  extraPointsTeam2?: number;        // Punti extra/manuali Squadra 2
  totalPointsTeam1: number;         // Totale punti assegnati alla Squadra 1 in questa smazzata
  totalPointsTeam2: number;         // Totale punti assegnati alla Squadra 2 in questa smazzata
  timestamp: string;
}

export interface Player5Score {
  name: string;
  wins: number;
}

// Sessione di Torneo / Partita Serata tra partecipanti
export interface TournamentSession {
  id: string;
  houseId?: string;
  dateKey: string; // YYYY-MM-DD
  startedAt: string;
  endedAt?: string;
  updatedAt?: string; // ISO string dell'ultimo aggiornamento punti per sincronizzazione perfetta multi-telefono
  gameType?: GameType; // 'briscola' | 'scopa' (default 'briscola')
  scopaVariant?: ScopaVariant; // 'scopa_normale' | 'scopone_scientifico'
  targetPoints?: number; // es. 11, 21, 31 (tipico per Scopa e Scopone)
  scopaRounds?: ScopaRound[]; // Storico smazzate con punteggi per categoria
  mode?: TournamentMode;
  team1Name: string;
  team1Players: string[];
  team2Name: string;
  team2Players: string[];
  team3Name?: string;
  team3Players?: string[];
  players5?: Player5Score[];
  team1Wins: number;
  team2Wins: number;
  team3Wins?: number;
  status: 'in_progress' | 'completed';
  winnerTeam?: 1 | 2 | 3 | 4 | 5 | 'pareggio' | string;
  winnerPlayerName?: string;
}
