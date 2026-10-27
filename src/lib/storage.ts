import type { Player, Team, Match, TournamentSession, TournamentMode } from '@/types/game';
import { RealtimeSyncService } from './realtimeSync.ts';

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

// Fallback in memoria quando localStorage non è disponibile (SSR, worker, test)
const memoryStore: Record<string, string> = {};

function getStoredItem(key: string): string | null {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem(key);
    } catch {
      return memoryStore[key] ?? null;
    }
  }
  return memoryStore[key] ?? null;
}

function setStoredItem(key: string, value: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, value);
    } catch {
      memoryStore[key] = value;
    }
  } else {
    memoryStore[key] = value;
  }
}

function removeStoredItem(key: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(key);
    } catch {
      delete memoryStore[key];
    }
  } else {
    delete memoryStore[key];
  }
}

export const StorageService = {
  init() {
    try {
      if (!getStoredItem(STORAGE_KEYS.PLAYERS)) {
        setStoredItem(STORAGE_KEYS.PLAYERS, JSON.stringify(DEMO_PLAYERS));
      }
      if (!getStoredItem(STORAGE_KEYS.TEAMS)) {
        setStoredItem(STORAGE_KEYS.TEAMS, JSON.stringify(DEMO_TEAMS));
      }
      if (!getStoredItem(STORAGE_KEYS.MATCHES)) {
        setStoredItem(STORAGE_KEYS.MATCHES, JSON.stringify(generateDemoMatches()));
      }
      if (!getStoredItem(STORAGE_KEYS.TOURNAMENT_SESSIONS)) {
        setStoredItem(STORAGE_KEYS.TOURNAMENT_SESSIONS, JSON.stringify(generateDemoSessions()));
      }
    } catch (e) {
      console.error('Storage init error:', e);
    }
  },

  // Emette l'aggiornamento locale e contemporaneamente trasmette a tutti i telefoni connessi
  broadcastStateChange() {
    if (typeof window === 'undefined') return;
    notifyRealtimeUpdate();
    RealtimeSyncService.broadcastFullSync({
      matches: this.getMatches(),
      sessions: this.getTournamentSessions(),
      teams: this.getTeams(),
      players: this.getPlayers(),
    });
  },

  getPlayers(): Player[] {
    try {
      const data = getStoredItem(STORAGE_KEYS.PLAYERS);
      return data ? JSON.parse(data) : DEMO_PLAYERS;
    } catch {
      return DEMO_PLAYERS;
    }
  },

  savePlayer(player: Player): void {
    const players = this.getPlayers();
    const index = players.findIndex((p) => p.id === player.id);
    if (index >= 0) {
      players[index] = player;
    } else {
      players.push(player);
    }
    setStoredItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    this.broadcastStateChange();
  },

  deletePlayer(playerId: string): void {
    const players = this.getPlayers().filter((p) => p.id !== playerId);
    setStoredItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    this.broadcastStateChange();
  },

  getTeams(): Team[] {
    try {
      const data = getStoredItem(STORAGE_KEYS.TEAMS);
      return data ? JSON.parse(data) : DEMO_TEAMS;
    } catch {
      return DEMO_TEAMS;
    }
  },

  saveTeam(team: Team): void {
    const teams = this.getTeams();
    const index = teams.findIndex((t) => t.id === team.id);
    if (index >= 0) {
      teams[index] = team;
    } else {
      teams.push(team);
    }
    setStoredItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
    this.broadcastStateChange();
  },

  deleteTeam(teamId: string): void {
    const teams = this.getTeams().filter((t) => t.id !== teamId);
    setStoredItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
    this.broadcastStateChange();
  },

  getMatches(): Match[] {
    try {
      const data = getStoredItem(STORAGE_KEYS.MATCHES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveMatch(match: Match): void {
    const matches = this.getMatches();
    const index = matches.findIndex((m) => m.id === match.id);
    if (index >= 0) {
      matches[index] = match;
    } else {
      matches.unshift(match);
    }
    setStoredItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
    this.broadcastStateChange();
  },

  deleteMatch(matchId: string): void {
    const matches = this.getMatches().filter((m) => m.id !== matchId);
    setStoredItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
    this.broadcastStateChange();
  },

  getTournamentSessions(): TournamentSession[] {
    try {
      const data = getStoredItem(STORAGE_KEYS.TOURNAMENT_SESSIONS);
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
    team2Players: string[],
    mode: TournamentMode = '2vs2',
    team3Name?: string,
    team3Players?: string[]
  ): TournamentSession {
    const sessions = this.getTournamentSessions();
    const cleanT1 = (typeof team1Name === 'string' ? team1Name.trim() : '') || (mode === '2vs2' ? 'Squadra 1' : 'Giocatore 1');
    const cleanT2 = (typeof team2Name === 'string' ? team2Name.trim() : '') || (mode === '2vs2' ? 'Squadra 2' : 'Giocatore 2');

    const newSession: TournamentSession = {
      id: `tour_${Date.now()}`,
      dateKey: formatDateKey(),
      startedAt: new Date().toISOString(),
      mode,
      team1Name: cleanT1,
      team1Players: Array.isArray(team1Players) ? team1Players : [],
      team2Name: cleanT2,
      team2Players: Array.isArray(team2Players) ? team2Players : [],
      team1Wins: 0,
      team2Wins: 0,
      status: 'in_progress',
    };

    if (mode === '1vs1vs1' || team3Name) {
      newSession.team3Name = (typeof team3Name === 'string' ? team3Name.trim() : '') || 'Giocatore 3';
      newSession.team3Players = Array.isArray(team3Players)
        ? team3Players
        : (team3Name ? [team3Name.trim()] : ['Giocatore 3']);
      newSession.team3Wins = 0;
    }

    sessions.unshift(newSession);
    setStoredItem(STORAGE_KEYS.TOURNAMENT_SESSIONS, JSON.stringify(sessions));
    this.broadcastStateChange();
    return newSession;
  },

  incrementTournamentWin(sessionId: string, teamIndex: 1 | 2 | 3): TournamentSession | null {
    const sessions = this.getTournamentSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session || session.status !== 'in_progress') return null;

    if (teamIndex === 1) {
      session.team1Wins = (session.team1Wins || 0) + 1;
    } else if (teamIndex === 2) {
      session.team2Wins = (session.team2Wins || 0) + 1;
    } else if (teamIndex === 3) {
      session.team3Wins = (session.team3Wins || 0) + 1;
    }

    setStoredItem(STORAGE_KEYS.TOURNAMENT_SESSIONS, JSON.stringify(sessions));
    this.broadcastStateChange();
    return session;
  },

  decrementTournamentWin(sessionId: string, teamIndex: 1 | 2 | 3): TournamentSession | null {
    const sessions = this.getTournamentSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session || session.status !== 'in_progress') return null;

    if (teamIndex === 1 && (session.team1Wins || 0) > 0) {
      session.team1Wins = (session.team1Wins || 0) - 1;
    } else if (teamIndex === 2 && (session.team2Wins || 0) > 0) {
      session.team2Wins = (session.team2Wins || 0) - 1;
    } else if (teamIndex === 3 && (session.team3Wins || 0) > 0) {
      session.team3Wins = (session.team3Wins || 0) - 1;
    }

    setStoredItem(STORAGE_KEYS.TOURNAMENT_SESSIONS, JSON.stringify(sessions));
    this.broadcastStateChange();
    return session;
  },

  endTournamentSession(sessionId: string): TournamentSession | null {
    const sessions = this.getTournamentSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return null;

    session.status = 'completed';
    session.endedAt = new Date().toISOString();

    const isThreeWay = session.mode === '1vs1vs1' || !!session.team3Name;
    const w1 = session.team1Wins || 0;
    const w2 = session.team2Wins || 0;
    const w3 = session.team3Wins || 0;

    if (isThreeWay) {
      if (w1 > w2 && w1 > w3) {
        session.winnerTeam = 1;
      } else if (w2 > w1 && w2 > w3) {
        session.winnerTeam = 2;
      } else if (w3 > w1 && w3 > w2) {
        session.winnerTeam = 3;
      } else {
        session.winnerTeam = 'pareggio';
      }
    } else {
      if (w1 > w2) {
        session.winnerTeam = 1;
      } else if (w2 > w1) {
        session.winnerTeam = 2;
      } else {
        session.winnerTeam = 'pareggio';
      }
    }

    setStoredItem(STORAGE_KEYS.TOURNAMENT_SESSIONS, JSON.stringify(sessions));
    this.broadcastStateChange();
    return session;
  },

  deleteTournamentSession(sessionId: string): void {
    const sessions = this.getTournamentSessions().filter((s) => s.id !== sessionId);
    setStoredItem(STORAGE_KEYS.TOURNAMENT_SESSIONS, JSON.stringify(sessions));
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
    if (Array.isArray(data.players)) {
      setStoredItem(STORAGE_KEYS.PLAYERS, JSON.stringify(data.players));
    }
    if (Array.isArray(data.teams)) {
      setStoredItem(STORAGE_KEYS.TEAMS, JSON.stringify(data.teams));
    }
    if (Array.isArray(data.matches)) {
      setStoredItem(STORAGE_KEYS.MATCHES, JSON.stringify(data.matches));
    }
    if (Array.isArray(data.tournamentSessions)) {
      setStoredItem(STORAGE_KEYS.TOURNAMENT_SESSIONS, JSON.stringify(data.tournamentSessions));
    }
    this.broadcastStateChange();
  },

  resetToDemo() {
    setStoredItem(STORAGE_KEYS.PLAYERS, JSON.stringify(DEMO_PLAYERS));
    setStoredItem(STORAGE_KEYS.TEAMS, JSON.stringify(DEMO_TEAMS));
    setStoredItem(STORAGE_KEYS.MATCHES, JSON.stringify(generateDemoMatches()));
    setStoredItem(STORAGE_KEYS.TOURNAMENT_SESSIONS, JSON.stringify(generateDemoSessions()));
    this.broadcastStateChange();
  },

  clearAll() {
    removeStoredItem(STORAGE_KEYS.PLAYERS);
    removeStoredItem(STORAGE_KEYS.TEAMS);
    removeStoredItem(STORAGE_KEYS.MATCHES);
    removeStoredItem(STORAGE_KEYS.TOURNAMENT_SESSIONS);
    this.broadcastStateChange();
  },
};
