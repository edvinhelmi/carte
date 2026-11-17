import type {
  Player,
  Team,
  Match,
  TournamentSession,
  TournamentMode,
  CardSuit,
  GameType,
  ScopaVariant,
  ScopaRound,
  TournamentMatchEntry,
} from '@/types/game';
import { RealtimeSyncService } from './realtimeSync.ts';
import { HouseService, getHouseResourceKey } from './houseService.ts';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient.ts';
import {
  getStoredItem,
  setStoredItem,
  removeStoredItem,
  markLocalMutation,
  markIdDeleted,
} from './storagePrimitives.ts';

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
if (typeof window !== 'undefined' && typeof window.location !== 'undefined' && 'BroadcastChannel' in window) {
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
    playerNames: ['Marghe', 'Irins'],
    color: '#f59e0b',
    createdAt: '2026-10-01T10:20:00Z',
  },
  {
    id: 't2',
    name: 'Edd & Simon',
    playerIds: ['p4', 'p3'],
    playerNames: ['Edd', 'Simon'],
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

export function computeSessionWinner(session: TournamentSession): void {
  if (session.mode === 'a5' && session.players5 && session.players5.length > 0) {
    const allZero = session.players5.every((p) => (p.wins || 0) === 0);
    if (allZero) {
      session.winnerTeam = 'pareggio';
      session.winnerPlayerName = 'Nessuno (0 vittorie)';
    } else {
      const maxWins = Math.max(...session.players5.map((p) => p.wins || 0));
      const topPlayers = session.players5.filter((p) => (p.wins || 0) === maxWins);
      if (topPlayers.length === 1) {
        const leaderIdx = session.players5.findIndex((p) => p.name === topPlayers[0].name);
        session.winnerTeam = (leaderIdx + 1) as 1 | 2 | 3 | 4 | 5;
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
}

export function serializeSessionForSupabase(session: TournamentSession, fallbackHouseId?: string) {
  const houseId = session.houseId || fallbackHouseId || HouseService.getActiveHouseId();
  return {
    id: session.id,
    house_id: houseId,
    date_key: session.dateKey || formatDateKey(session.startedAt ? new Date(session.startedAt) : undefined),
    mode: session.mode || '2vs2',
    team1_name: session.team1Name || 'Squadra 1',
    team2_name: session.team2Name || 'Squadra 2',
    team3_name: session.team3Name ?? null,
    team1_players: session.team1Players ?? [],
    team2_players: session.team2Players ?? [],
    team3_players: session.team3Players ?? null,
    team1_wins: session.team1Wins ?? 0,
    team2_wins: session.team2Wins ?? 0,
    team3_wins: session.team3Wins ?? 0,
    players5: session.players5 ?? null,
    game_type: session.gameType || 'briscola',
    scopa_variant: session.scopaVariant ?? null,
    target_points: session.targetPoints ?? null,
    scopa_rounds: session.scopaRounds ?? [],
    history: session.history ?? [],
    is_active: session.status === 'in_progress',
    winner_team: session.winnerTeam !== undefined ? String(session.winnerTeam) : null,
    winner_player_name: session.winnerPlayerName ?? null,
    created_at: session.startedAt || new Date().toISOString(),
    ended_at: session.endedAt ?? null,
    updated_at: session.updatedAt || new Date().toISOString(),
  };
}

function upsertSessionToCloud(session: TournamentSession): void {
  if (!isSupabaseConfigured()) return;
  const client = getSupabaseClient();
  if (!client) return;
  const row = serializeSessionForSupabase(session);
  if (!row.house_id || row.house_id === 'casa_none') return;
  client
    .from('tournament_sessions')
    .upsert(row, { onConflict: 'house_id,id' })
    .then(({ error }) => {
      if (error) {
        console.warn('Errore upsert tournament_session su Supabase:', error);
      }
    });
}

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
    markLocalMutation(player.id);
    const players = this.getPlayers();
    const index = players.findIndex((p) => p.id === player.id);
    if (index >= 0) {
      players[index] = player;
    } else {
      players.push(player);
    }
    setStoredItem(getActiveResourceKey('players'), JSON.stringify(players));

    if (isSupabaseConfigured() && activeHouseId) {
      const client = getSupabaseClient();
      client
        ?.from('players')
        .upsert(
          {
            id: player.id,
            house_id: activeHouseId,
            name: player.name,
            nickname: player.nickname || null,
            avatar_suit: player.avatarSuit,
            created_at: player.createdAt,
            is_friend: Boolean(player.isFriend),
          },
          { onConflict: 'house_id,id' }
        )
        .then();
    }

    this.broadcastStateChange();
  },

  deletePlayer(playerId: string): void {
    const activeHouseId = HouseService.getActiveHouseId();
    if (activeHouseId) markIdDeleted(activeHouseId, playerId);
    const players = this.getPlayers().filter((p) => p.id !== playerId);
    setStoredItem(getActiveResourceKey('players'), JSON.stringify(players));

    if (isSupabaseConfigured() && activeHouseId) {
      const client = getSupabaseClient();
      client?.from('players').delete().eq('id', playerId).eq('house_id', activeHouseId).then();
    }

    this.broadcastStateChange();
  },

  registerFriendPlayerIfNew(name: string): Player | null {
    const cleanName = typeof name === 'string' ? name.trim() : '';
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
    markLocalMutation(team.id);
    const teams = this.getTeams();
    const index = teams.findIndex((t) => t.id === team.id);
    if (index >= 0) {
      teams[index] = team;
    } else {
      teams.push(team);
    }
    setStoredItem(getActiveResourceKey('teams'), JSON.stringify(teams));

    if (isSupabaseConfigured() && activeHouseId) {
      const client = getSupabaseClient();
      client
        ?.from('teams')
        .upsert(
          {
            id: team.id,
            house_id: activeHouseId,
            name: team.name,
            player_ids: team.playerIds ?? [],
            player_names: team.playerNames ?? [],
            color: team.color,
            created_at: team.createdAt,
          },
          { onConflict: 'house_id,id' }
        )
        .then();
    }

    this.broadcastStateChange();
  },

  deleteTeam(teamId: string): void {
    const activeHouseId = HouseService.getActiveHouseId();
    if (activeHouseId) markIdDeleted(activeHouseId, teamId);
    const teams = this.getTeams().filter((t) => t.id !== teamId);
    setStoredItem(getActiveResourceKey('teams'), JSON.stringify(teams));

    if (isSupabaseConfigured() && activeHouseId) {
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
    markLocalMutation(match.id);
    const matches = this.getMatches();
    const index = matches.findIndex((m) => m.id === match.id);
    if (index >= 0) {
      matches[index] = match;
    } else {
      matches.unshift(match);
    }
    setStoredItem(getActiveResourceKey('matches'), JSON.stringify(matches));

    if (isSupabaseConfigured() && activeHouseId) {
      const client = getSupabaseClient();
      client
        ?.from('matches')
        .upsert(
          {
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
          },
          { onConflict: 'house_id,id' }
        )
        .then();
    }

    this.broadcastStateChange();
  },

  deleteMatch(matchId: string): void {
    const activeHouseId = HouseService.getActiveHouseId();
    if (activeHouseId) markIdDeleted(activeHouseId, matchId);
    const matches = this.getMatches().filter((m) => m.id !== matchId);
    setStoredItem(getActiveResourceKey('matches'), JSON.stringify(matches));

    if (isSupabaseConfigured() && activeHouseId) {
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

  getActiveTournamentSession(gameType?: GameType): TournamentSession | null {
    const sessions = this.getTournamentSessions();
    if (gameType) {
      return sessions.find((s) => s.status === 'in_progress' && (s.gameType || 'briscola') === gameType) || null;
    }
    const currentCategory = this.getActiveGameCategory();
    return (
      sessions.find((s) => s.status === 'in_progress' && (s.gameType || 'briscola') === currentCategory) ||
      sessions.find((s) => s.status === 'in_progress') ||
      null
    );
  },

  getActiveGameCategory(): GameType {
    if (typeof window === 'undefined') return 'briscola';
    const val = getStoredItem('carte_active_game_category_v1');
    if (val === 'scopa') return 'scopa';
    return 'briscola';
  },

  setActiveGameCategory(game: GameType): void {
    if (typeof window === 'undefined') return;
    setStoredItem('carte_active_game_category_v1', game);
    window.dispatchEvent(new Event('carte_game_category_change'));
    window.dispatchEvent(new Event('carte_storage_update'));
  },

  startTournamentSession(
    team1Name: string,
    team1Players: string[],
    team2Name: string,
    team2Players: string[],
    mode: TournamentMode = '2vs2',
    team3Name?: string,
    team3Players?: string[],
    players5Names?: string[],
    gameType?: GameType,
    scopaVariant?: ScopaVariant,
    targetPoints?: number
  ): TournamentSession {
    const effectiveGameType: GameType = gameType || this.getActiveGameCategory() || 'briscola';
    const sessions = this.getTournamentSessions();
    const nowIso = new Date().toISOString();

    for (const s of sessions) {
      if (s.status === 'in_progress' && (s.gameType || 'briscola') === effectiveGameType) {
        s.status = 'completed';
        if (!s.endedAt) s.endedAt = nowIso;
        s.updatedAt = nowIso;
        if (!s.winnerTeam) {
          computeSessionWinner(s);
        }
        markLocalMutation(s.id);
        upsertSessionToCloud(s);
      }
    }

    const cleanT1 = (typeof team1Name === 'string' ? team1Name.trim() : '') || (mode === '2vs2' ? 'Squadra 1' : 'Giocatore 1');
    const cleanT2 = (typeof team2Name === 'string' ? team2Name.trim() : '') || (mode === '2vs2' ? 'Squadra 2' : 'Giocatore 2');

    const newSession: TournamentSession = {
      id: `tour_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      houseId: HouseService.getActiveHouseId() || 'casa_none',
      dateKey: formatDateKey(),
      startedAt: nowIso,
      updatedAt: nowIso,
      gameType: effectiveGameType,
      scopaVariant: effectiveGameType === 'scopa' ? (scopaVariant || 'scopa_normale') : undefined,
      targetPoints: effectiveGameType === 'scopa' ? (targetPoints || 21) : undefined,
      scopaRounds: [],
      history: [],
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

    markLocalMutation(newSession.id);
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

    upsertSessionToCloud(newSession);
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

    const nowIso = new Date().toISOString();
    if (!Array.isArray(session.history)) {
      session.history = [];
    }

    const winnerName =
      session.mode === 'a5' && session.players5
        ? session.players5[teamIndex - 1]?.name || `Giocatore ${teamIndex}`
        : teamIndex === 1
          ? session.team1Name
          : teamIndex === 2
            ? session.team2Name
            : session.team3Name || 'Giocatore 3';

    const matchEntry: TournamentMatchEntry = {
      id: `tm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      matchNumber: session.history.length + 1,
      winnerTeamIndex: (teamIndex as 1 | 2 | 3 | 4 | 5) || 1,
      winnerName,
      timestamp: nowIso,
      scoreTeam1: session.team1Wins || 0,
      scoreTeam2: session.team2Wins || 0,
      scoreTeam3: session.team3Wins,
    };
    session.history.push(matchEntry);

    session.updatedAt = nowIso;
    markLocalMutation(session.id);
    setStoredItem(getActiveResourceKey('sessions'), JSON.stringify(sessions));

    upsertSessionToCloud(session);
    this.broadcastStateChange();
    return session;
  },

  decrementTournamentWin(sessionId: string, teamIndex: number): TournamentSession | null {
    const sessions = this.getTournamentSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session || session.status !== 'in_progress') return null;

    let decremented = false;
    if (session.mode === 'a5' && session.players5 && session.players5.length > 0) {
      const playerIdx = teamIndex - 1;
      if (session.players5[playerIdx]) {
        session.players5[playerIdx].wins = (session.players5[playerIdx].wins || 0) - 1;
        decremented = true;
      }
      if (playerIdx === 0) session.team1Wins = session.players5[0].wins;
      if (playerIdx === 1) session.team2Wins = session.players5[1].wins;
      if (playerIdx === 2) session.team3Wins = session.players5[2].wins;
    } else {
      if (teamIndex === 1 && (session.team1Wins || 0) > 0) {
        session.team1Wins = (session.team1Wins || 0) - 1;
        decremented = true;
      } else if (teamIndex === 2 && (session.team2Wins || 0) > 0) {
        session.team2Wins = (session.team2Wins || 0) - 1;
        decremented = true;
      } else if (teamIndex === 3 && (session.team3Wins || 0) > 0) {
        session.team3Wins = (session.team3Wins || 0) - 1;
        decremented = true;
      }
    }

    if (decremented && Array.isArray(session.history) && session.history.length > 0) {
      for (let i = session.history.length - 1; i >= 0; i--) {
        if (session.history[i].winnerTeamIndex === teamIndex) {
          session.history.splice(i, 1);
          break;
        }
      }
      session.history.forEach((h, idx) => {
        h.matchNumber = idx + 1;
      });
    }

    session.updatedAt = new Date().toISOString();
    markLocalMutation(session.id);
    setStoredItem(getActiveResourceKey('sessions'), JSON.stringify(sessions));

    upsertSessionToCloud(session);
    this.broadcastStateChange();
    return session;
  },

  addScopaRound(
    sessionId: string,
    roundData: Omit<import('@/types/game').ScopaRound, 'id' | 'roundNumber' | 'timestamp'>
  ): TournamentSession | null {
    const sessions = this.getTournamentSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session || session.status !== 'in_progress') return null;

    if (!Array.isArray(session.scopaRounds)) {
      session.scopaRounds = [];
    }

    const nowIso = new Date().toISOString();
    const roundNumber = session.scopaRounds.length + 1;
    const newRound: ScopaRound = {
      id: `rnd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      roundNumber,
      ...roundData,
      timestamp: nowIso,
    };

    session.scopaRounds.push(newRound);
    session.team1Wins = (session.team1Wins || 0) + roundData.totalPointsTeam1;
    session.team2Wins = (session.team2Wins || 0) + roundData.totalPointsTeam2;
    session.updatedAt = nowIso;

    markLocalMutation(session.id);
    setStoredItem(getActiveResourceKey('sessions'), JSON.stringify(sessions));

    upsertSessionToCloud(session);
    this.broadcastStateChange();
    return session;
  },

  removeLastScopaRound(sessionId: string): TournamentSession | null {
    const sessions = this.getTournamentSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session || session.status !== 'in_progress' || !session.scopaRounds || session.scopaRounds.length === 0) return null;

    const removedRound = session.scopaRounds.pop();
    if (removedRound) {
      session.team1Wins = Math.max(0, (session.team1Wins || 0) - removedRound.totalPointsTeam1);
      session.team2Wins = Math.max(0, (session.team2Wins || 0) - removedRound.totalPointsTeam2);
      session.updatedAt = new Date().toISOString();

      markLocalMutation(session.id);
      setStoredItem(getActiveResourceKey('sessions'), JSON.stringify(sessions));

      upsertSessionToCloud(session);
      this.broadcastStateChange();
    }

    return session;
  },

  endTournamentSession(sessionId: string): TournamentSession | null {
    const sessions = this.getTournamentSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return null;

    const nowIso = new Date().toISOString();
    session.status = 'completed';
    session.endedAt = nowIso;
    computeSessionWinner(session);
    session.updatedAt = nowIso;

    markLocalMutation(session.id);
    setStoredItem(getActiveResourceKey('sessions'), JSON.stringify(sessions));

    upsertSessionToCloud(session);
    this.broadcastStateChange();
    return session;
  },

  deleteTournamentSession(sessionId: string): void {
    const activeHouseId = HouseService.getActiveHouseId();
    if (activeHouseId) markIdDeleted(activeHouseId, sessionId);
    const sessions = this.getTournamentSessions().filter((s) => s.id !== sessionId);
    setStoredItem(getActiveResourceKey('sessions'), JSON.stringify(sessions));

    if (isSupabaseConfigured() && activeHouseId) {
      const client = getSupabaseClient();
      client?.from('tournament_sessions').delete().eq('id', sessionId).eq('house_id', activeHouseId).then();
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
    const activeHouseId = HouseService.getActiveHouseId();
    if (Array.isArray(data.players)) {
      const normalized = data.players.map((p) => ({ ...p, houseId: p.houseId || activeHouseId }));
      setStoredItem(getActiveResourceKey('players'), JSON.stringify(normalized));
      for (const p of normalized) this.savePlayer(p);
    }
    if (Array.isArray(data.teams)) {
      const normalized = data.teams.map((t) => ({ ...t, houseId: t.houseId || activeHouseId }));
      setStoredItem(getActiveResourceKey('teams'), JSON.stringify(normalized));
      for (const t of normalized) this.saveTeam(t);
    }
    if (Array.isArray(data.matches)) {
      const normalized = data.matches.map((m) => ({ ...m, houseId: m.houseId || activeHouseId }));
      setStoredItem(getActiveResourceKey('matches'), JSON.stringify(normalized));
      for (const m of normalized) this.saveMatch(m);
    }
    if (Array.isArray(data.tournamentSessions)) {
      const normalized = data.tournamentSessions.map((s) => ({ ...s, houseId: s.houseId || activeHouseId }));
      setStoredItem(getActiveResourceKey('sessions'), JSON.stringify(normalized));
      for (const s of normalized) upsertSessionToCloud(s);
    }
    this.broadcastStateChange();
  },

  resetToDemo() {
    const activeHouseId = HouseService.getActiveHouseId();
    if (!activeHouseId) return;
    const demoPlayers = DEMO_PLAYERS.map((p) => ({ ...p, houseId: activeHouseId }));
    const demoTeams = DEMO_TEAMS.map((t) => ({ ...t, houseId: activeHouseId }));
    const demoMatches = generateDemoMatches().map((m) => ({ ...m, houseId: activeHouseId }));
    setStoredItem(getActiveResourceKey('players'), JSON.stringify(demoPlayers));
    setStoredItem(getActiveResourceKey('teams'), JSON.stringify(demoTeams));
    setStoredItem(getActiveResourceKey('matches'), JSON.stringify(demoMatches));
    setStoredItem(getActiveResourceKey('sessions'), JSON.stringify(generateDemoSessions()));
    for (const p of demoPlayers) this.savePlayer(p);
    for (const t of demoTeams) this.saveTeam(t);
    for (const m of demoMatches) this.saveMatch(m);
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
