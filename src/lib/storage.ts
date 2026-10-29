import type { Player, Team, Match, TournamentSession, TournamentMode, CardSuit } from '@/types/game';
import { RealtimeSyncService } from './realtimeSync.ts';
import { HouseService, getHouseResourceKey } from './houseService.ts';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient.ts';

function getActiveResourceKey(resource: 'players' | 'teams' | 'matches' | 'sessions'): string {
  const activeHouseId = HouseService.getActiveHouseId();
  return getHouseResourceKey(activeHouseId, resource);
}

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

// Dati iniziali puliti: Marghe, Irins, Simon, Edd, Luca
const DEMO_PLAYERS: Player[] = [
  { id: 'p1', name: 'Marghe', nickname: 'Regina di Coppe', avatarSuit: 'coppe', createdAt: '2026-10-01T10:00:00Z' },
  { id: 'p2', name: 'Irins', nickname: 'Asso di Denari', avatarSuit: 'denari', createdAt: '2026-10-01T10:05:00Z' },
  { id: 'p3', name: 'Simon', nickname: 'Il Carico', avatarSuit: 'bastoni', createdAt: '2026-10-01T10:10:00Z' },
  { id: 'p4', name: 'Edd', nickname: 'Spada Affilata', avatarSuit: 'spade', createdAt: '2026-10-01T10:15:00Z' },
  { id: 'p5', name: 'Luca', nickname: 'Il Jolly', avatarSuit: 'coppe', createdAt: '2026-10-01T10:20:00Z' },
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

import { getStoredItem, setStoredItem, removeStoredItem } from './storagePrimitives.ts';

export const StorageService = {
  init() {
    try {
      HouseService.init();
      const playersKey = getActiveResourceKey('players');
      const teamsKey = getActiveResourceKey('teams');
      const matchesKey = getActiveResourceKey('matches');
      const sessionsKey = getActiveResourceKey('sessions');

      if (!getStoredItem(playersKey)) setStoredItem(playersKey, JSON.stringify([]));
      if (!getStoredItem(teamsKey)) setStoredItem(teamsKey, JSON.stringify([]));
      if (!getStoredItem(matchesKey)) setStoredItem(matchesKey, JSON.stringify([]));
      if (!getStoredItem(sessionsKey)) setStoredItem(sessionsKey, JSON.stringify([]));
    } catch (e) {
      console.error('Storage init error:', e);
    }
  },

  // Emette l'aggiornamento locale e contemporaneamente trasmette a tutti i telefoni connessi
  broadcastStateChange() {
    if (typeof window === 'undefined') return;
    notifyRealtimeUpdate();
    try {
      const activeHouseId = HouseService.getActiveHouseId();
      RealtimeSyncService.setRoom(`carte_house_${activeHouseId}`);
      RealtimeSyncService.broadcastFullSync({
        matches: this.getMatches(),
        sessions: this.getTournamentSessions(),
        teams: this.getTeams(),
        players: this.getPlayers(),
        members: activeHouseId ? HouseService.getHouseMembers(activeHouseId) : [],
        houseId: activeHouseId || undefined,
      });
    } catch {
      // ignore
    }
  },

  getPlayers(): Player[] {
    try {
      this.init();
      const key = getActiveResourceKey('players');
      const data = getStoredItem(key);
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  savePlayer(player: Player): void {
    const activeHouseId = HouseService.getActiveHouseId();
    player.houseId = player.houseId || activeHouseId;
    const players = this.getPlayers();
    const index = players.findIndex((p) => p.id === player.id);
    if (index >= 0) {
      players[index] = player;
    } else {
      players.push(player);
    }
    setStoredItem(getActiveResourceKey('players'), JSON.stringify(players));

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      client?.from('players').upsert({
        id: player.id,
        house_id: activeHouseId,
        name: player.name,
        nickname: player.nickname || null,
        avatar_suit: player.avatarSuit,
        created_at: player.createdAt,
      }).then();
    }

    this.broadcastStateChange();
  },

  deletePlayer(playerId: string): void {
    const activeHouseId = HouseService.getActiveHouseId();
    const players = this.getPlayers().filter((p) => p.id !== playerId);
    setStoredItem(getActiveResourceKey('players'), JSON.stringify(players));

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      client?.from('players').delete().eq('id', playerId).eq('house_id', activeHouseId).then();
    }

    this.broadcastStateChange();
  },

  registerFriendPlayerIfNew(name: string): Player | null {
    const cleanName = (typeof name === 'string' ? name.trim() : '');
    if (!cleanName) return null;

    const houseId = HouseService.getActiveHouseId();
    const members = houseId ? HouseService.getHouseMembers(houseId) : [];

    // Se il nome appartiene già a un membro della casa, non serve aggiungerlo come amico esterno
    const isMember = members.some(
      (m) =>
        (typeof m?.displayName === 'string' && m.displayName.trim().toLowerCase() === cleanName.toLowerCase()) ||
        (typeof m?.nickname === 'string' && m.nickname.trim().toLowerCase() === cleanName.toLowerCase())
    );
    if (isMember) return null;

    // Se è già presente tra i giocatori registrati della casa, restituiscilo
    const players = this.getPlayers();
    const existing = players.find(
      (p) =>
        (typeof p?.name === 'string' && p.name.trim().toLowerCase() === cleanName.toLowerCase()) ||
        (typeof p?.nickname === 'string' && p.nickname.trim().toLowerCase() === cleanName.toLowerCase())
    );
    if (existing) return existing;

    // Crea un nuovo giocatore amico
    const suits: CardSuit[] = ['coppe', 'denari', 'spade', 'bastoni'];
    const newFriend: Player = {
      id: `p_friend_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      houseId: houseId || undefined,
      name: cleanName,
      avatarSuit: suits[players.length % suits.length],
      createdAt: new Date().toISOString(),
      isFriend: true,
    };

    this.savePlayer(newFriend);
    return newFriend;
  },

  getTeams(): Team[] {
    try {
      this.init();
      const key = getActiveResourceKey('teams');
      const data = getStoredItem(key);
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  saveTeam(team: Team): void {
    const activeHouseId = HouseService.getActiveHouseId();
    team.houseId = team.houseId || activeHouseId;
    const teams = this.getTeams();
    const index = teams.findIndex((t) => t.id === team.id);
    if (index >= 0) {
      teams[index] = team;
    } else {
      teams.push(team);
    }
    setStoredItem(getActiveResourceKey('teams'), JSON.stringify(teams));

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      client?.from('teams').upsert({
        id: team.id,
        house_id: activeHouseId,
        name: team.name,
        player_ids: team.playerIds,
        color: team.color,
        created_at: team.createdAt,
      }).then();
    }

    this.broadcastStateChange();
  },

  deleteTeam(teamId: string): void {
    const activeHouseId = HouseService.getActiveHouseId();
    const teams = this.getTeams().filter((t) => t.id !== teamId);
    setStoredItem(getActiveResourceKey('teams'), JSON.stringify(teams));

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      client?.from('teams').delete().eq('id', teamId).eq('house_id', activeHouseId).then();
    }

    this.broadcastStateChange();
  },

  getMatches(): Match[] {
    try {
      this.init();
      const key = getActiveResourceKey('matches');
      const data = getStoredItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveMatch(match: Match): void {
    const activeHouseId = HouseService.getActiveHouseId();
    match.houseId = match.houseId || activeHouseId;
    const matches = this.getMatches();
    const index = matches.findIndex((m) => m.id === match.id);
    if (index >= 0) {
      matches[index] = match;
    } else {
      matches.unshift(match);
    }
    setStoredItem(getActiveResourceKey('matches'), JSON.stringify(matches));

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      client?.from('matches').upsert({
        id: match.id,
        house_id: activeHouseId,
        game_type: match.gameType,
        timestamp: match.timestamp,
        date_key: match.dateKey,
        team1_id: match.team1Id,
        team2_id: match.team2Id,
        winner_team_id: match.winnerTeamId,
        score_team1: match.scoreTeam1 ?? null,
        score_team2: match.scoreTeam2 ?? null,
        notes: match.notes ?? null,
      }).then();
    }

    this.broadcastStateChange();
  },

  deleteMatch(matchId: string): void {
    const activeHouseId = HouseService.getActiveHouseId();
    const matches = this.getMatches().filter((m) => m.id !== matchId);
    setStoredItem(getActiveResourceKey('matches'), JSON.stringify(matches));

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      client?.from('matches').delete().eq('id', matchId).eq('house_id', activeHouseId).then();
    }

    this.broadcastStateChange();
  },

  getTournamentSessions(): TournamentSession[] {
    try {
      this.init();
      const key = getActiveResourceKey('sessions');
      const data = getStoredItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
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
    team3Players?: string[],
    players5Names?: string[]
  ): TournamentSession {
    const sessions = this.getTournamentSessions();
    for (const s of sessions) {
      if (s.status === 'in_progress') {
        s.status = 'completed';
        if (!s.endedAt) s.endedAt = new Date().toISOString();
      }
    }
    const cleanT1 = (typeof team1Name === 'string' ? team1Name.trim() : '') || (mode === '2vs2' ? 'Squadra 1' : 'Giocatore 1');
    const cleanT2 = (typeof team2Name === 'string' ? team2Name.trim() : '') || (mode === '2vs2' ? 'Squadra 2' : 'Giocatore 2');

    const newSession: TournamentSession = {
      id: `tour_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      houseId: HouseService.getActiveHouseId() || 'casa_none',
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

    if (mode === 'a5') {
      const names = Array.isArray(players5Names) && players5Names.length > 0
        ? players5Names
        : [cleanT1, cleanT2, team3Name || 'Giocatore 3', 'Giocatore 4', 'Giocatore 5'];
      newSession.players5 = names.map((n, i) => ({
        name: (typeof n === 'string' ? n.trim() : '') || `Giocatore ${i + 1}`,
        wins: 0,
      }));
      newSession.team1Name = newSession.players5[0]?.name || 'Giocatore 1';
      newSession.team1Players = [newSession.team1Name];
      newSession.team2Name = newSession.players5[1]?.name || 'Giocatore 2';
      newSession.team2Players = [newSession.team2Name];
      newSession.team3Name = newSession.players5[2]?.name || 'Giocatore 3';
      newSession.team3Players = [newSession.team3Name];
      newSession.team3Wins = 0;
    }

    sessions.unshift(newSession);
    setStoredItem(getActiveResourceKey('sessions'), JSON.stringify(sessions));

    // Registra automaticamente come giocatori amici eventuali partecipanti non della casa
    const participantNames: string[] = [
      ...(Array.isArray(team1Players) ? team1Players : [cleanT1]),
      ...(Array.isArray(team2Players) ? team2Players : [cleanT2]),
      ...(team3Players ? team3Players : (team3Name ? [team3Name] : [])),
      ...(Array.isArray(players5Names) ? players5Names : []),
    ];
    for (const pName of participantNames) {
      if (typeof pName === 'string' && pName.trim()) {
        this.registerFriendPlayerIfNew(pName.trim());
      }
    }

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      client?.from('tournament_sessions').upsert({
        id: newSession.id,
        house_id: newSession.houseId,
        date_key: newSession.dateKey,
        mode: newSession.mode,
        team1_name: newSession.team1Name,
        team2_name: newSession.team2Name,
        team3_name: newSession.team3Name ?? null,
        team1_players: newSession.team1Players,
        team2_players: newSession.team2Players,
        team3_players: newSession.team3Players ?? null,
        team1_wins: newSession.team1Wins,
        team2_wins: newSession.team2Wins,
        team3_wins: newSession.team3Wins ?? null,
        players5: newSession.players5 ?? null,
        is_active: true,
      }).then();
    }

    this.broadcastStateChange();
    return newSession;
  },

  incrementTournamentWin(sessionId: string, teamIndex: number): TournamentSession | null {
    const sessions = this.getTournamentSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session || session.status !== 'in_progress') return null;

    if (session.mode === 'a5' && session.players5 && session.players5.length > 0) {
      const playerIdx = teamIndex - 1;
      if (session.players5[playerIdx]) {
        session.players5[playerIdx].wins = (session.players5[playerIdx].wins || 0) + 1;
      }
      if (playerIdx === 0) session.team1Wins = session.players5[0].wins;
      if (playerIdx === 1) session.team2Wins = session.players5[1].wins;
      if (playerIdx === 2) session.team3Wins = session.players5[2].wins;
    } else {
      if (teamIndex === 1) {
        session.team1Wins = (session.team1Wins || 0) + 1;
      } else if (teamIndex === 2) {
        session.team2Wins = (session.team2Wins || 0) + 1;
      } else if (teamIndex === 3) {
        session.team3Wins = (session.team3Wins || 0) + 1;
      }
    }

    setStoredItem(getActiveResourceKey('sessions'), JSON.stringify(sessions));

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      client?.from('tournament_sessions').update({
        team1_wins: session.team1Wins,
        team2_wins: session.team2Wins,
        team3_wins: session.team3Wins ?? null,
        players5: session.players5 ?? null,
      }).eq('id', session.id).eq('house_id', session.houseId || HouseService.getActiveHouseId()).then();
    }

    this.broadcastStateChange();
    return session;
  },

  decrementTournamentWin(sessionId: string, teamIndex: number): TournamentSession | null {
    const sessions = this.getTournamentSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session || session.status !== 'in_progress') return null;

    if (session.mode === 'a5' && session.players5 && session.players5.length > 0) {
      const playerIdx = teamIndex - 1;
      if (session.players5[playerIdx] && (session.players5[playerIdx].wins || 0) > 0) {
        session.players5[playerIdx].wins = session.players5[playerIdx].wins - 1;
      }
      if (playerIdx === 0) session.team1Wins = session.players5[0].wins;
      if (playerIdx === 1) session.team2Wins = session.players5[1].wins;
      if (playerIdx === 2) session.team3Wins = session.players5[2].wins;
    } else {
      if (teamIndex === 1 && (session.team1Wins || 0) > 0) {
        session.team1Wins = (session.team1Wins || 0) - 1;
      } else if (teamIndex === 2 && (session.team2Wins || 0) > 0) {
        session.team2Wins = (session.team2Wins || 0) - 1;
      } else if (teamIndex === 3 && (session.team3Wins || 0) > 0) {
        session.team3Wins = (session.team3Wins || 0) - 1;
      }
    }

    setStoredItem(getActiveResourceKey('sessions'), JSON.stringify(sessions));

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      client?.from('tournament_sessions').update({
        team1_wins: session.team1Wins,
        team2_wins: session.team2Wins,
        team3_wins: session.team3Wins ?? null,
        players5: session.players5 ?? null,
      }).eq('id', session.id).eq('house_id', session.houseId || HouseService.getActiveHouseId()).then();
    }

    this.broadcastStateChange();
    return session;
  },

  endTournamentSession(sessionId: string): TournamentSession | null {
    const sessions = this.getTournamentSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return null;

    session.status = 'completed';
    session.endedAt = new Date().toISOString();

    if (session.mode === 'a5' && session.players5 && session.players5.length > 0) {
      const maxWins = Math.max(...session.players5.map((p) => p.wins || 0));
      if (maxWins === 0) {
        session.winnerTeam = 'pareggio';
        session.winnerPlayerName = 'Nessuno (0 vittorie)';
      } else {
        const topPlayers = session.players5.filter((p) => (p.wins || 0) === maxWins);
        if (topPlayers.length === 1) {
          const leaderIdx = session.players5.findIndex((p) => p.name === topPlayers[0].name);
          session.winnerTeam = ((leaderIdx + 1) as 1 | 2 | 3 | 4 | 5);
          session.winnerPlayerName = topPlayers[0].name;
        } else {
          session.winnerTeam = 'pareggio';
          session.winnerPlayerName = topPlayers.map((p) => p.name).join(' & ');
        }
      }
    } else {
      const isThreeWay = session.mode === '1vs1vs1' || !!session.team3Name;
      const w1 = session.team1Wins || 0;
      const w2 = session.team2Wins || 0;
      const w3 = session.team3Wins || 0;

      if (isThreeWay) {
        if (w1 > w2 && w1 > w3) {
          session.winnerTeam = 1;
          session.winnerPlayerName = session.team1Name;
        } else if (w2 > w1 && w2 > w3) {
          session.winnerTeam = 2;
          session.winnerPlayerName = session.team2Name;
        } else if (w3 > w1 && w3 > w2) {
          session.winnerTeam = 3;
          session.winnerPlayerName = session.team3Name || 'Giocatore 3';
        } else {
          session.winnerTeam = 'pareggio';
          session.winnerPlayerName = 'Pareggio';
        }
      } else {
        if (w1 > w2) {
          session.winnerTeam = 1;
          session.winnerPlayerName = session.team1Name;
        } else if (w2 > w1) {
          session.winnerTeam = 2;
          session.winnerPlayerName = session.team2Name;
        } else {
          session.winnerTeam = 'pareggio';
          session.winnerPlayerName = 'Pareggio';
        }
      }
    }

    setStoredItem(getActiveResourceKey('sessions'), JSON.stringify(sessions));

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      client?.from('tournament_sessions').update({
        is_active: false,
        ended_at: session.endedAt,
        winner_team: String(session.winnerTeam),
        winner_player_name: session.winnerPlayerName ?? null,
        players5: session.players5 ?? null,
      }).eq('id', session.id).eq('house_id', session.houseId || HouseService.getActiveHouseId()).then();
    }

    this.broadcastStateChange();
    return session;
  },

  deleteTournamentSession(sessionId: string): void {
    const sessions = this.getTournamentSessions().filter((s) => s.id !== sessionId);
    setStoredItem(getActiveResourceKey('sessions'), JSON.stringify(sessions));

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      client?.from('tournament_sessions').delete().eq('id', sessionId).eq('house_id', HouseService.getActiveHouseId()).then();
    }

    this.broadcastStateChange();
  },

  exportAllData() {
    return {
      version: '2.0',
      house: HouseService.getActiveHouse(),
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
      setStoredItem(getActiveResourceKey('players'), JSON.stringify(data.players));
    }
    if (Array.isArray(data.teams)) {
      setStoredItem(getActiveResourceKey('teams'), JSON.stringify(data.teams));
    }
    if (Array.isArray(data.matches)) {
      setStoredItem(getActiveResourceKey('matches'), JSON.stringify(data.matches));
    }
    if (Array.isArray(data.tournamentSessions)) {
      setStoredItem(getActiveResourceKey('sessions'), JSON.stringify(data.tournamentSessions));
    }
    this.broadcastStateChange();
  },

  resetToDemo() {
    const activeHouseId = HouseService.getActiveHouseId();
    if (!activeHouseId) return;
    setStoredItem(getActiveResourceKey('players'), JSON.stringify(DEMO_PLAYERS.map(p => ({ ...p, houseId: activeHouseId }))));
    setStoredItem(getActiveResourceKey('teams'), JSON.stringify(DEMO_TEAMS.map(t => ({ ...t, houseId: activeHouseId }))));
    setStoredItem(getActiveResourceKey('matches'), JSON.stringify(generateDemoMatches().map(m => ({ ...m, houseId: activeHouseId }))));
    setStoredItem(getActiveResourceKey('sessions'), JSON.stringify(generateDemoSessions()));
    this.broadcastStateChange();
  },

  clearAll() {
    removeStoredItem(getActiveResourceKey('players'));
    removeStoredItem(getActiveResourceKey('teams'));
    removeStoredItem(getActiveResourceKey('matches'));
    removeStoredItem(getActiveResourceKey('sessions'));
    this.broadcastStateChange();
  },
};
