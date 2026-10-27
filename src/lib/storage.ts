import { Player, Team, Match, TournamentSession } from '@/types/game';
import { RealtimeSyncService } from './realtimeSync';

const STORAGE_KEYS = {
  PLAYERS: 'carte_briscola_players_v4',
  TEAMS: 'carte_briscola_teams_v4',
  MATCHES: 'carte_briscola_matches_v4',
  TOURNAMENT_SESSIONS: 'carte_tournament_sessions_v4',
  SETTINGS: 'carte_briscola_settings_v4',
};

// Formatta data come YYYY-MM-DD
export function formatDateKey(date?: Date): string {
  const target = date ? new Date(date) : new Date();
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Canale Broadcast per sincronizzazione multi-scheda locale
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('carte_realtime_sync');
    broadcastChannel.onmessage = () => {
      window.dispatchEvent(new Event('carte_storage_update'));
    };
  } catch (e) {
    console.warn('BroadcastChannel non disponibile:', e);
  }
}

export function notifyRealtimeUpdate() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('carte_storage_update'));
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ timestamp: Date.now() });
    } catch (e) {
      console.warn('BroadcastChannel send error:', e);
    }
  }
}

// Dati iniziali puliti: solo Marghe, Irins, Simon, Edd
const DEMO_PLAYERS: Player[] = [
  { id: 'p1', name: 'Marghe', nickname: 'Regina di Coppe', avatarSuit: 'coppe', createdAt: '2026-10-01T10:00:00Z' },
  { id: 'p2', name: 'Irins', nickname: 'Asso di Denari', avatarSuit: 'denari', createdAt: '2026-10-01T10:05:00Z' },
  { id: 'p3', name: 'Simon', nickname: 'Il Carico', avatarSuit: 'bastoni', createdAt: '2026-10-01T10:10:00Z' },
  { id: 'p4', name: 'Edd', nickname: 'Spada Affilata', avatarSuit: 'spade', createdAt: '2026-10-01T10:15:00Z' },
];

const DEMO_TEAMS: Team[] = [
  {
    id: 't1',
    name: 'Marghe & Irins',
    playerIds: ['p1', 'p2'],
    color: '#f59e0b',
    createdAt: '2026-10-01T10:20:00Z',
  },
  {
    id: 't2',
    name: 'Edd & Simon',
    playerIds: ['p4', 'p3'],
    color: '#10b981',
    createdAt: '2026-10-01T10:25:00Z',
  },
];

// Rimanere solo la partita di oggi
function generateDemoMatches(): Match[] {
  const todayKey = formatDateKey();
  return [
    {
      id: 'm_today_1',
      gameType: 'briscola',
      timestamp: new Date().toISOString(),
      dateKey: todayKey,
      team1Id: 't1',
      team2Id: 't2',
      winnerTeamId: 't1',
      scoreTeam1: 64,
      scoreTeam2: 56,
      notes: 'Partita di oggi',
    },
  ];
}

function generateDemoSessions(): TournamentSession[] {
  return [];
}

export const StorageService = {
  init() {
    if (typeof window === 'undefined') return;
    try {
      if (!localStorage.getItem(STORAGE_KEYS.PLAYERS)) {
        localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(DEMO_PLAYERS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.TEAMS)) {
        localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(DEMO_TEAMS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.MATCHES)) {
        localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(generateDemoMatches()));
      }
      if (!localStorage.getItem(STORAGE_KEYS.TOURNAMENT_SESSIONS)) {
        localStorage.setItem(STORAGE_KEYS.TOURNAMENT_SESSIONS, JSON.stringify(generateDemoSessions()));
      }
    } catch (e) {
      console.error('Storage init error:', e);
    }
  },

  // Emette l'aggiornamento locale e contemporaneamente trasmette a tutti i telefoni connessi
  broadcastStateChange() {
    notifyRealtimeUpdate();
    RealtimeSyncService.broadcastFullSync({
      matches: this.getMatches(),
      sessions: this.getTournamentSessions(),
      teams: this.getTeams(),
      players: this.getPlayers(),
    });
  },

  getPlayers(): Player[] {
    if (typeof window === 'undefined') return DEMO_PLAYERS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLAYERS);
      return data ? JSON.parse(data) : DEMO_PLAYERS;
    } catch {
      return DEMO_PLAYERS;
    }
  },

  savePlayer(player: Player): void {
    if (typeof window === 'undefined') return;
    const players = this.getPlayers();
    const index = players.findIndex((p) => p.id === player.id);
    if (index >= 0) {
      players[index] = player;
    } else {
      players.push(player);
    }
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    this.broadcastStateChange();
  },

  deletePlayer(playerId: string): void {
    if (typeof window === 'undefined') return;
    const players = this.getPlayers().filter((p) => p.id !== playerId);
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    this.broadcastStateChange();
  },

  getTeams(): Team[] {
    if (typeof window === 'undefined') return DEMO_TEAMS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEAMS);
      return data ? JSON.parse(data) : DEMO_TEAMS;
    } catch {
      return DEMO_TEAMS;
    }
  },

  saveTeam(team: Team): void {
    if (typeof window === 'undefined') return;
    const teams = this.getTeams();
    const index = teams.findIndex((t) => t.id === team.id);
    if (index >= 0) {
      teams[index] = team;
    } else {
      teams.push(team);
    }
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
    this.broadcastStateChange();
  },

  deleteTeam(teamId: string): void {
    if (typeof window === 'undefined') return;
    const teams = this.getTeams().filter((t) => t.id !== teamId);
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
    this.broadcastStateChange();
  },

  getMatches(): Match[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MATCHES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveMatch(match: Match): void {
    if (typeof window === 'undefined') return;
    const matches = this.getMatches();
    const index = matches.findIndex((m) => m.id === match.id);
    if (index >= 0) {
      matches[index] = match;
    } else {
      matches.unshift(match);
    }
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
    this.broadcastStateChange();
  },

  deleteMatch(matchId: string): void {
    if (typeof window === 'undefined') return;
    const matches = this.getMatches().filter((m) => m.id !== matchId);
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
    this.broadcastStateChange();
  },

  getTournamentSessions(): TournamentSession[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TOURNAMENT_SESSIONS);
      return data ? JSON.parse(data) : generateDemoSessions();
    } catch {
      return generateDemoSessions();
    }
  },

  getActiveTournamentSession(): TournamentSession | null {
    const sessions = this.getTournamentSessions();
    return sessions.find((s) => s.status === 'in_progress') || null;
  },

  startTournamentSession(
    team1Name: string,
    team1Players: string[],
    team2Name: string,
    team2Players: string[]
  ): TournamentSession {
    const sessions = this.getTournamentSessions();
    const newSession: TournamentSession = {
      id: `tour_${Date.now()}`,
      dateKey: formatDateKey(),
      startedAt: new Date().toISOString(),
      team1Name: team1Name.trim() || 'Squadra 1',
      team1Players,
      team2Name: team2Name.trim() || 'Squadra 2',
      team2Players,
      team1Wins: 0,
      team2Wins: 0,
      status: 'in_progress',
    };

    sessions.unshift(newSession);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TOURNAMENT_SESSIONS, JSON.stringify(sessions));
      this.broadcastStateChange();
    }
    return newSession;
  },

  incrementTournamentWin(sessionId: string, teamIndex: 1 | 2): void {
    const sessions = this.getTournamentSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session || session.status !== 'in_progress') return;

    if (teamIndex === 1) {
      session.team1Wins += 1;
    } else {
      session.team2Wins += 1;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TOURNAMENT_SESSIONS, JSON.stringify(sessions));
      this.broadcastStateChange();
    }
  },

  decrementTournamentWin(sessionId: string, teamIndex: 1 | 2): void {
    const sessions = this.getTournamentSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session || session.status !== 'in_progress') return;

    if (teamIndex === 1 && session.team1Wins > 0) {
      session.team1Wins -= 1;
    } else if (teamIndex === 2 && session.team2Wins > 0) {
      session.team2Wins -= 1;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TOURNAMENT_SESSIONS, JSON.stringify(sessions));
      this.broadcastStateChange();
    }
  },

  endTournamentSession(sessionId: string): TournamentSession | null {
    const sessions = this.getTournamentSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return null;

    session.status = 'completed';
    session.endedAt = new Date().toISOString();

    if (session.team1Wins > session.team2Wins) {
      session.winnerTeam = 1;
    } else if (session.team2Wins > session.team1Wins) {
      session.winnerTeam = 2;
    } else {
      session.winnerTeam = 'pareggio';
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TOURNAMENT_SESSIONS, JSON.stringify(sessions));
      this.broadcastStateChange();
    }
    return session;
  },

  deleteTournamentSession(sessionId: string): void {
    if (typeof window === 'undefined') return;
    const sessions = this.getTournamentSessions().filter((s) => s.id !== sessionId);
    localStorage.setItem(STORAGE_KEYS.TOURNAMENT_SESSIONS, JSON.stringify(sessions));
    this.broadcastStateChange();
  },

  exportAllData() {
    return {
      version: '1.4',
      exportedAt: new Date().toISOString(),
      players: this.getPlayers(),
      teams: this.getTeams(),
      matches: this.getMatches(),
      tournamentSessions: this.getTournamentSessions(),
    };
  },

  importAllData(data: {
    players?: Player[];
    teams?: Team[];
    matches?: Match[];
    tournamentSessions?: TournamentSession[];
  }) {
    if (typeof window === 'undefined') return;
    if (Array.isArray(data.players)) {
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(data.players));
    }
    if (Array.isArray(data.teams)) {
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(data.teams));
    }
    if (Array.isArray(data.matches)) {
      localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(data.matches));
    }
    if (Array.isArray(data.tournamentSessions)) {
      localStorage.setItem(STORAGE_KEYS.TOURNAMENT_SESSIONS, JSON.stringify(data.tournamentSessions));
    }
    this.broadcastStateChange();
  },

  resetToDemo() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(DEMO_PLAYERS));
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(DEMO_TEAMS));
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(generateDemoMatches()));
    localStorage.setItem(STORAGE_KEYS.TOURNAMENT_SESSIONS, JSON.stringify(generateDemoSessions()));
    this.broadcastStateChange();
  },

  clearAll() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.PLAYERS);
    localStorage.removeItem(STORAGE_KEYS.TEAMS);
    localStorage.removeItem(STORAGE_KEYS.MATCHES);
    localStorage.removeItem(STORAGE_KEYS.TOURNAMENT_SESSIONS);
    this.broadcastStateChange();
  },
};
