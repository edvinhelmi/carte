import type { TournamentSession, Match, Team, Player } from '@/types/game';
import type { HouseMember } from '@/types/house';
import { getStoredItem, setStoredItem } from './storagePrimitives.ts';

const DEFAULT_ROOM = 'carte_briscola_live_casa';
const NTFY_BASE_URL = 'https://ntfy.sh';

function getActiveHouseId(): string {
  return getStoredItem('carte_active_house_id') || '';
}

export interface FullSyncPayload {
  type: 'FULL_SYNC';
  matches: Match[];
  sessions: TournamentSession[];
  teams: Team[];
  players: Player[];
  members?: HouseMember[];
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

export const RealtimeSyncService = {
  getRoom(): string {
    if (typeof window === 'undefined') return DEFAULT_ROOM;
    try {
      const urlParam = new URLSearchParams(window.location.search).get('room');
      if (urlParam) {
        const clean = urlParam.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        if (clean) {
          localStorage.setItem('carte_live_room_id', clean);
          return clean;
        }
      }
    } catch {
      // fallback
    }
    return localStorage.getItem('carte_live_room_id') || DEFAULT_ROOM;
  },

  setRoom(room: string) {
    if (typeof window === 'undefined') return;
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
    if (typeof window === 'undefined') return;

    activeRoom = this.getRoom();

    if (currentEventSource) {
      currentEventSource.close();
      currentEventSource = null;
    }

    // 1. Fetch dello stato cloud al momento della connessione (solo messaggi da altri client)
    fetch(`${NTFY_BASE_URL}/${activeRoom}/json?poll=1`)
      .then((res) => res.text())
      .then((text) => {
        if (!text) return;
        const lines = text.trim().split('\n');
        for (let i = lines.length - 1; i >= 0; i--) {
          try {
            const data = JSON.parse(lines[i]);
            if (data.event === 'message' && data.message) {
              const payload: FullSyncPayload = JSON.parse(data.message);
              if (payload.type === 'FULL_SYNC' && payload.senderId !== CLIENT_ID) {
                this.applyRemoteFullSync(payload);
                break;
              }
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

      currentEventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'message' && data.message) {
            const payload: FullSyncPayload = JSON.parse(data.message);
            if (payload.type === 'FULL_SYNC' && payload.senderId !== CLIENT_ID) {
              this.applyRemoteFullSync(payload);
            }
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
          const mergedMatches = [...payload.matches];
          for (const locM of localMatches) {
            if (!mergedMatches.some((m) => m.id === locM.id)) {
              mergedMatches.unshift(locM);
            }
          }
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
          const mergedSessions = [...payload.sessions];
          for (const locS of localSessions) {
            const remoteIdx = mergedSessions.findIndex((s) => s.id === locS.id);
            if (remoteIdx >= 0) {
              // Se la sessione locale è in corso, mantienila sempre attiva
              if (locS.status === 'in_progress') {
                mergedSessions[remoteIdx] = {
                  ...mergedSessions[remoteIdx],
                  ...locS,
                  team1Wins: Math.max(locS.team1Wins, mergedSessions[remoteIdx].team1Wins),
                  team2Wins: Math.max(locS.team2Wins, mergedSessions[remoteIdx].team2Wins),
                  team3Wins: Math.max(locS.team3Wins || 0, mergedSessions[remoteIdx].team3Wins || 0),
                  status: 'in_progress',
                };
              }
            } else if (locS.status === 'in_progress') {
              mergedSessions.unshift(locS);
            }
          }
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
          const mergedTeams = [...payload.teams];
          for (const locT of localTeams) {
            if (!mergedTeams.some((t) => t.id === locT.id)) {
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
          const mergedPlayers = [...payload.players];
          for (const locP of localPlayers) {
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
            if (!combined.some((c) => c.userId === m.userId)) {
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

  // Emette a tutti i dispositivi connessi lo stato aggiornato
  broadcastFullSync(state: {
    matches: Match[];
    sessions: TournamentSession[];
    teams: Team[];
    players: Player[];
    members?: HouseMember[];
    houseId?: string;
  }) {
    if (typeof window === 'undefined') return;

    activeRoom = this.getRoom();
    const payload: FullSyncPayload = {
      type: 'FULL_SYNC',
      matches: state.matches,
      sessions: state.sessions,
      teams: state.teams,
      players: state.players,
      members: state.members,
      houseId: state.houseId,
      senderId: CLIENT_ID,
      timestamp: Date.now(),
    };

    fetch(`${NTFY_BASE_URL}/${activeRoom}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
    }).catch((e) => {
      console.warn('Cloud broadcast error:', e);
    });
  },

  disconnect() {
    if (currentEventSource) {
      currentEventSource.close();
      currentEventSource = null;
    }
  },
};
