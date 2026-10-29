import type { TournamentSession, Match, Team, Player } from '@/types/game';
import type { HouseMember } from '@/types/house';

const DEFAULT_ROOM = 'carte_briscola_live_casa';
const NTFY_BASE_URL = 'https://ntfy.sh';

function getActiveHouseId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('carte_active_house_id') || '';
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
    localStorage.setItem('carte_live_room_id', cleanRoom);
    activeRoom = cleanRoom;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('room', cleanRoom);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
    this.connect();
  },

  connect() {
    if (typeof window === 'undefined') return;

    activeRoom = this.getRoom();

    if (currentEventSource) {
      currentEventSource.close();
      currentEventSource = null;
    }

    // 1. Fetch immediato dello stato cloud al momento della connessione
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
              if (payload.type === 'FULL_SYNC') {
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
    if (typeof window === 'undefined') return;
    try {
      const activeHouseId = payload.houseId || getActiveHouseId();

      // Sincronizzazione con chiavi isolate della casa
      if (activeHouseId) {
        if (Array.isArray(payload.matches)) {
          localStorage.setItem(`carte_house_${activeHouseId}_matches`, JSON.stringify(payload.matches));
        }
        if (Array.isArray(payload.sessions)) {
          localStorage.setItem(`carte_house_${activeHouseId}_sessions`, JSON.stringify(payload.sessions));
        }
        if (Array.isArray(payload.teams)) {
          localStorage.setItem(`carte_house_${activeHouseId}_teams`, JSON.stringify(payload.teams));
        }
        if (Array.isArray(payload.players)) {
          localStorage.setItem(`carte_house_${activeHouseId}_players`, JSON.stringify(payload.players));
        }
        if (Array.isArray(payload.members) && payload.members.length > 0) {
          const membersKey = `carte_house_${activeHouseId}_members`;
          let existing: HouseMember[] = [];
          try {
            const raw = localStorage.getItem(membersKey);
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
          localStorage.setItem(membersKey, JSON.stringify(combined));
        }
      }

      // Compatibilità retroattiva per chiavi globali
      if (Array.isArray(payload.matches)) {
        localStorage.setItem('carte_briscola_matches_v4', JSON.stringify(payload.matches));
      }
      if (Array.isArray(payload.sessions)) {
        localStorage.setItem('carte_tournament_sessions_v4', JSON.stringify(payload.sessions));
      }
      if (Array.isArray(payload.teams)) {
        localStorage.setItem('carte_briscola_teams_v4', JSON.stringify(payload.teams));
      }
      if (Array.isArray(payload.players)) {
        localStorage.setItem('carte_briscola_players_v4', JSON.stringify(payload.players));
      }

      window.dispatchEvent(new Event('carte_storage_update'));
      window.dispatchEvent(new Event('carte_house_change'));
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
