import type { TournamentSession, Match, Team, Player } from '@/types/game';
import type { HouseMember } from '@/types/house';
import {
  getStoredItem,
  setStoredItem,
  getDeletedIds,
  mergeDeletedIds,
  isRecentlyMutatedLocally,
} from './storagePrimitives.ts';

const DEFAULT_ROOM = 'carte_briscola_live_casa';
const NTFY_BASE_URL = 'https://ntfy.sh';

function getActiveHouseId(): string {
  return (
    getStoredItem('carte_active_house_id_v2') ||
    getStoredItem('carte_active_house_id') ||
    ''
  );
}

export interface FullSyncPayload {
  type: 'FULL_SYNC';
  matches: Match[];
  sessions: TournamentSession[];
  teams: Team[];
  players: Player[];
  members?: HouseMember[];
  deletedIds?: string[];
  houseId?: string;
  senderId: string;
  timestamp: number;
}

const CLIENT_ID =
  typeof window !== 'undefined'
    ? 'client_' + Math.random().toString(36).substring(2, 9)
    : 'server';

let currentEventSource: EventSource | null = null;
let activeRoom = DEFAULT_ROOM;
let broadcastDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingBroadcastPayload: FullSyncPayload | null = null;

const isTestEnv = (): boolean => {
  if (typeof process !== 'undefined') {
    if (
      process.env.NODE_ENV === 'test' ||
      process.execArgv?.includes('--test') ||
      process.argv?.includes('--test') ||
      process.argv?.some((a) => typeof a === 'string' && a.includes('.test.'))
    ) {
      return true;
    }
  }
  return false;
};

interface NtfyMessageEvent {
  event?: string;
  message?: string;
  attachment?: {
    url?: string;
  };
}

async function parseOrFetchNtfyMessage(data: NtfyMessageEvent): Promise<FullSyncPayload | null> {
  if (!data || data.event !== 'message') return null;

  // 1. Inline JSON message (< 4096 bytes)
  if (typeof data.message === 'string' && data.message.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(data.message) as FullSyncPayload;
      if (parsed && parsed.type === 'FULL_SYNC') return parsed;
    } catch {
      // fall through to attachment check
    }
  }

  // 2. Attachment JSON message (> 4096 bytes converted to attachment by ntfy.sh)
  if (data.attachment?.url) {
    try {
      const res = await fetch(data.attachment.url);
      if (res.ok) {
        const parsed = (await res.json()) as FullSyncPayload;
        if (parsed && parsed.type === 'FULL_SYNC') return parsed;
      }
    } catch {
      // ignore attachment fetch failure
    }
  }

  return null;
}

export function mergeTwoSessions(locS: TournamentSession, remoteS: TournamentSession): TournamentSession {
  // Never overwrite a session that was just mutated locally on this device
  if (isRecentlyMutatedLocally(locS.id)) {
    return {
      ...remoteS,
      ...locS,
      history: (locS.history?.length || 0) >= (remoteS.history?.length || 0) ? locS.history : remoteS.history,
      scopaRounds: (locS.scopaRounds?.length || 0) >= (remoteS.scopaRounds?.length || 0) ? locS.scopaRounds : remoteS.scopaRounds,
    };
  }

  const locTime = locS.updatedAt ? new Date(locS.updatedAt).getTime() : 0;
  const remTime = remoteS.updatedAt ? new Date(remoteS.updatedAt).getTime() : 0;

  const mergedHistory =
    (remoteS.history?.length || 0) >= (locS.history?.length || 0)
      ? remoteS.history
      : locS.history;
  const mergedScopaRounds =
    (remoteS.scopaRounds?.length || 0) >= (locS.scopaRounds?.length || 0)
      ? remoteS.scopaRounds
      : locS.scopaRounds;

  // If either side completed the tournament, keep it completed
  if (remoteS.status === 'completed' && locS.status !== 'completed') {
    return {
      ...locS,
      ...remoteS,
      status: 'completed',
      history: mergedHistory,
      scopaRounds: mergedScopaRounds,
    };
  }
  if (locS.status === 'completed' && remoteS.status !== 'completed') {
    return {
      ...remoteS,
      ...locS,
      status: 'completed',
      history: mergedHistory,
      scopaRounds: mergedScopaRounds,
    };
  }

  if (locTime > remTime) {
    return {
      ...remoteS,
      ...locS,
      history: mergedHistory,
      scopaRounds: mergedScopaRounds,
      team1Players: locS.team1Players?.length ? locS.team1Players : remoteS.team1Players,
      team2Players: locS.team2Players?.length ? locS.team2Players : remoteS.team2Players,
    };
  }

  return {
    ...locS,
    ...remoteS,
    history: mergedHistory,
    scopaRounds: mergedScopaRounds,
    team1Players: remoteS.team1Players?.length ? remoteS.team1Players : locS.team1Players,
    team2Players: remoteS.team2Players?.length ? remoteS.team2Players : locS.team2Players,
  };
}

export const RealtimeSyncService = {
  getRoom(): string {
    if (typeof window === 'undefined') return DEFAULT_ROOM;
    try {
      const urlParam = new URLSearchParams(window.location.search).get('room');
      if (urlParam) {
        const clean = urlParam.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        if (clean) return clean;
      }
    } catch {
      // fallback
    }
    const houseId = getActiveHouseId();
    if (houseId) {
      return `carte_house_${houseId}`;
    }
    return getStoredItem('carte_live_room_id') || DEFAULT_ROOM;
  },

  setRoom(room: string) {
    if (typeof window === 'undefined' || typeof window.location === 'undefined' || isTestEnv()) return;
    const cleanRoom = room.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || DEFAULT_ROOM;
    const prevRoom = localStorage.getItem('carte_live_room_id');
    localStorage.setItem('carte_live_room_id', cleanRoom);
    const roomChanged = activeRoom !== cleanRoom || prevRoom !== cleanRoom;
    activeRoom = cleanRoom;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('room') !== cleanRoom) {
        url.searchParams.set('room', cleanRoom);
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      // ignore
    }
    if (roomChanged || !currentEventSource) {
      this.connect();
    }
  },

  connect() {
    if (typeof window === 'undefined' || typeof window.location === 'undefined' || isTestEnv()) return;

    activeRoom = this.getRoom();

    if (currentEventSource) {
      currentEventSource.close();
      currentEventSource = null;
    }

    // 1. Fetch dello stato cloud al momento della connessione (solo messaggi da altri client)
    fetch(`${NTFY_BASE_URL}/${activeRoom}/json?poll=1`)
      .then((res) => res.text())
      .then(async (text) => {
        if (!text) return;
        const lines = text.trim().split('\n');
        for (let i = lines.length - 1; i >= 0; i--) {
          try {
            const data = JSON.parse(lines[i]) as NtfyMessageEvent;
            const payload = await parseOrFetchNtfyMessage(data);
            if (payload && payload.type === 'FULL_SYNC' && payload.senderId !== CLIENT_ID) {
              this.applyRemoteFullSync(payload);
              break;
            }
          } catch {
            // ignora righe non json
          }
        }
      })
      .catch((err) => {
        console.warn('Realtime fetch cloud error:', err);
      });

    // 2. Connessione persistente Server-Sent Events (SSE)
    try {
      const sseUrl = `${NTFY_BASE_URL}/${activeRoom}/sse`;
      currentEventSource = new EventSource(sseUrl);

      currentEventSource.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data) as NtfyMessageEvent;
          const payload = await parseOrFetchNtfyMessage(data);
          if (payload && payload.type === 'FULL_SYNC' && payload.senderId !== CLIENT_ID) {
            this.applyRemoteFullSync(payload);
          }
        } catch {
          // ignora ping
        }
      };

      currentEventSource.onerror = () => {
        // Riconnessione automatica gestita nativamente dal browser
      };
    } catch (e) {
      console.warn('EventSource non disponibile:', e);
    }
  },

  applyRemoteFullSync(payload: FullSyncPayload) {
    try {
      const activeHouseId = payload.houseId || getActiveHouseId();

      // Sincronizzazione con chiavi isolate della casa
      if (activeHouseId) {
        const deletedSet = mergeDeletedIds(activeHouseId, payload.deletedIds);

        if (Array.isArray(payload.matches)) {
          const matchesKey = `carte_house_${activeHouseId}_matches`;
          let localMatches: Match[] = [];
          try {
            const raw = getStoredItem(matchesKey);
            if (raw) localMatches = JSON.parse(raw);
            if (!Array.isArray(localMatches)) localMatches = [];
          } catch {
            localMatches = [];
          }
          const mergedMatches = payload.matches.filter((m) => m && m.id && !deletedSet.has(m.id));
          for (const locM of localMatches) {
            if (!locM || !locM.id || deletedSet.has(locM.id)) continue;
            const existingIdx = mergedMatches.findIndex((m) => m.id === locM.id);
            if (existingIdx >= 0) {
              if (isRecentlyMutatedLocally(locM.id)) {
                mergedMatches[existingIdx] = locM;
              }
            } else {
              mergedMatches.unshift(locM);
            }
          }
          mergedMatches.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setStoredItem(matchesKey, JSON.stringify(mergedMatches));
        }

        if (Array.isArray(payload.sessions)) {
          const sessionsKey = `carte_house_${activeHouseId}_sessions`;
          let localSessions: TournamentSession[] = [];
          try {
            const raw = getStoredItem(sessionsKey);
            if (raw) localSessions = JSON.parse(raw);
            if (!Array.isArray(localSessions)) localSessions = [];
          } catch {
            localSessions = [];
          }
          const mergedSessions = payload.sessions.filter((s) => s && s.id && !deletedSet.has(s.id));
          for (const locS of localSessions) {
            if (!locS || !locS.id || deletedSet.has(locS.id)) continue;
            const remoteIdx = mergedSessions.findIndex((s) => s.id === locS.id);
            if (remoteIdx >= 0) {
              mergedSessions[remoteIdx] = mergeTwoSessions(locS, mergedSessions[remoteIdx]);
            } else {
              // Preserva SEMPRE tutte le sessioni locali (sia in_progress che completed!)
              // non eliminate esplicitamente, evitando qualsiasi perdita di storico!
              mergedSessions.unshift(locS);
            }
          }
          mergedSessions.sort(
            (a, b) => new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime()
          );
          setStoredItem(sessionsKey, JSON.stringify(mergedSessions));
        }

        if (Array.isArray(payload.teams)) {
          const teamsKey = `carte_house_${activeHouseId}_teams`;
          let localTeams: Team[] = [];
          try {
            const raw = getStoredItem(teamsKey);
            if (raw) localTeams = JSON.parse(raw);
            if (!Array.isArray(localTeams)) localTeams = [];
          } catch {
            localTeams = [];
          }
          interface TeamRaw {
            id: string;
            houseId?: string;
            house_id?: string;
            name: string;
            playerIds?: string[];
            player_ids?: string[];
            playerNames?: string[];
            player_names?: string[];
            color?: string;
            createdAt?: string;
            created_at?: string;
          }
          const normalizedPayloadTeams: Team[] = (payload.teams as TeamRaw[])
            .filter((t) => t && t.id && !deletedSet.has(t.id))
            .map((t) => ({
              id: t.id,
              houseId: t.houseId || t.house_id || activeHouseId,
              name: t.name,
              playerIds: Array.isArray(t.playerIds)
                ? t.playerIds
                : Array.isArray(t.player_ids)
                  ? t.player_ids
                  : [],
              playerNames: Array.isArray(t.playerNames)
                ? t.playerNames
                : Array.isArray(t.player_names)
                  ? t.player_names
                  : undefined,
              color: t.color || '#10b981',
              createdAt: t.createdAt || t.created_at || new Date().toISOString(),
            }));

          const mergedTeams = [...normalizedPayloadTeams];
          for (const locT of localTeams) {
            if (!locT || !locT.id || deletedSet.has(locT.id)) continue;
            const matchIdx = mergedTeams.findIndex((t) => t.id === locT.id);
            if (matchIdx >= 0) {
              if (
                (!mergedTeams[matchIdx].playerIds || mergedTeams[matchIdx].playerIds.length === 0) &&
                locT.playerIds &&
                locT.playerIds.length > 0
              ) {
                mergedTeams[matchIdx].playerIds = locT.playerIds;
              }
              if (
                (!mergedTeams[matchIdx].playerNames || mergedTeams[matchIdx].playerNames.length === 0) &&
                locT.playerNames &&
                locT.playerNames.length > 0
              ) {
                mergedTeams[matchIdx].playerNames = locT.playerNames;
              }
            } else {
              mergedTeams.push(locT);
            }
          }
          setStoredItem(teamsKey, JSON.stringify(mergedTeams));
        }

        if (Array.isArray(payload.players)) {
          const playersKey = `carte_house_${activeHouseId}_players`;
          let localPlayers: Player[] = [];
          try {
            const raw = getStoredItem(playersKey);
            if (raw) localPlayers = JSON.parse(raw);
            if (!Array.isArray(localPlayers)) localPlayers = [];
          } catch {
            localPlayers = [];
          }
          const mergedPlayers = payload.players.filter((p) => p && p.id && !deletedSet.has(p.id));
          for (const locP of localPlayers) {
            if (!locP || !locP.id || deletedSet.has(locP.id)) continue;
            if (!mergedPlayers.some((p) => p.id === locP.id)) {
              mergedPlayers.push(locP);
            }
          }
          setStoredItem(playersKey, JSON.stringify(mergedPlayers));
        }

        if (Array.isArray(payload.members) && payload.members.length > 0) {
          const membersKey = `carte_house_${activeHouseId}_members`;
          let existing: HouseMember[] = [];
          try {
            const raw = getStoredItem(membersKey);
            if (raw) existing = JSON.parse(raw);
          } catch {
            existing = [];
          }
          const combined = [...existing];
          for (const m of payload.members) {
            if (!m || !m.userId || deletedSet.has(m.userId)) continue;
            const idx = combined.findIndex((c) => c.userId === m.userId);
            if (idx >= 0) {
              combined[idx] = {
                ...combined[idx],
                ...m,
                nickname: m.nickname || combined[idx].nickname,
                avatarUrl: m.avatarUrl || combined[idx].avatarUrl,
              };
            } else {
              combined.push(m);
            }
          }
          setStoredItem(membersKey, JSON.stringify(combined));
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('carte_storage_update'));
        window.dispatchEvent(new Event('carte_house_change'));
      }
    } catch (e) {
      console.warn('Errore applicazione sync remoto:', e);
    }
  },

  // Emette a tutti i dispositivi connessi lo stato aggiornato (con debounce anti-flood e payload compatto < 4KB)
  broadcastFullSync(state: {
    matches: Match[];
    sessions: TournamentSession[];
    teams: Team[];
    players: Player[];
    members?: HouseMember[];
    houseId?: string;
  }) {
    if (typeof window === 'undefined' || typeof window.location === 'undefined' || isTestEnv()) return;

    activeRoom = this.getRoom();
    const houseId = state.houseId || getActiveHouseId();

    // Strip long Google avatar URLs in ntfy broadcast so payload stays < 4,096 bytes
    const compactMembers = state.members?.map((m) => ({
      ...m,
      avatarUrl: undefined,
    }));

    pendingBroadcastPayload = {
      type: 'FULL_SYNC',
      matches: state.matches,
      sessions: state.sessions,
      teams: state.teams,
      players: state.players,
      members: compactMembers,
      deletedIds: houseId ? getDeletedIds(houseId) : undefined,
      houseId,
      senderId: CLIENT_ID,
      timestamp: Date.now(),
    };

    if (broadcastDebounceTimer) {
      clearTimeout(broadcastDebounceTimer);
    }

    broadcastDebounceTimer = setTimeout(() => {
      broadcastDebounceTimer = null;
      const payloadToSend = pendingBroadcastPayload;
      pendingBroadcastPayload = null;
      if (!payloadToSend) return;

      fetch(`${NTFY_BASE_URL}/${activeRoom}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payloadToSend),
      }).catch((e) => {
        console.warn('Cloud broadcast error:', e);
      });
    }, 120);
  },

  disconnect() {
    if (broadcastDebounceTimer) {
      clearTimeout(broadcastDebounceTimer);
      broadcastDebounceTimer = null;
    }
    if (currentEventSource) {
      currentEventSource.close();
      currentEventSource = null;
    }
  },
};
