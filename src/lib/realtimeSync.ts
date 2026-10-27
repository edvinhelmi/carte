import { TournamentSession } from '@/types/game';
import { StorageService } from './storage';

const DEFAULT_ROOM = 'carte_briscola_live_casa';
const NTFY_BASE_URL = 'https://ntfy.sh';

export interface SyncMessage {
  type: 'TOURNAMENT_UPDATE' | 'TOURNAMENT_END' | 'TOURNAMENT_START';
  session: TournamentSession | null;
  senderId: string;
  timestamp: number;
}

// Genera un ID casuale per il client corrente (per non processare i propri messaggi in loop)
const CLIENT_ID = typeof window !== 'undefined' ? 'client_' + Math.random().toString(36).substring(2, 9) : 'server';

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
    this.connect();
  },

  // Inizializza la connessione EventSource SSE e fa il fetch dello stato attuale
  connect(onStateReceived?: (session: TournamentSession | null) => void) {
    if (typeof window === 'undefined') return;

    activeRoom = this.getRoom();

    // Chiudi connessione precedente se presente
    if (currentEventSource) {
      currentEventSource.close();
      currentEventSource = null;
    }

    // 1. Fetch immediato dell'ultimo messaggio inviato nella stanza
    fetch(`${NTFY_BASE_URL}/${activeRoom}/json?poll=1`)
      .then((res) => res.text())
      .then((text) => {
        if (!text) return;
        const lines = text.trim().split('\n');
        // Prendi l'ultimo messaggio valido
        for (let i = lines.length - 1; i >= 0; i--) {
          try {
            const data = JSON.parse(lines[i]);
            if (data.event === 'message' && data.message) {
              const parsed: SyncMessage = JSON.parse(data.message);
              this.applyRemoteUpdate(parsed, onStateReceived);
              break;
            }
          } catch {
            // ignora righe non json
          }
        }
      })
      .catch((err) => {
        console.warn('Realtime fetch error (fallback locale attivo):', err);
      });

    // 2. Connessione persistente Server-Sent Events (SSE)
    try {
      const sseUrl = `${NTFY_BASE_URL}/${activeRoom}/sse`;
      currentEventSource = new EventSource(sseUrl);

      currentEventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'message' && data.message) {
            const message: SyncMessage = JSON.parse(data.message);
            // Se il messaggio è stato inviato da un altro dispositivo, applicalo
            if (message.senderId !== CLIENT_ID) {
              this.applyRemoteUpdate(message, onStateReceived);
            }
          }
        } catch {
          // ignora ping o eventi non messaggio
        }
      };

      currentEventSource.onerror = () => {
        // EventSource si riconnette automaticamente da solo
      };
    } catch (e) {
      console.warn('EventSource non supportato o bloccato:', e);
    }
  },

  // Applica un aggiornamento ricevuto dal cloud
  applyRemoteUpdate(message: SyncMessage, callback?: (session: TournamentSession | null) => void) {
    if (!message || !message.type) return;

    const sessions = StorageService.getTournamentSessions();
    const remoteSession = message.session;

    if (remoteSession) {
      const idx = sessions.findIndex((s) => s.id === remoteSession.id);
      if (idx >= 0) {
        sessions[idx] = remoteSession;
      } else {
        sessions.unshift(remoteSession);
      }
      localStorage.setItem('carte_tournament_sessions_v2', JSON.stringify(sessions));
      window.dispatchEvent(new Event('carte_storage_update'));
      if (callback) callback(remoteSession);
    } else if (message.type === 'TOURNAMENT_END') {
      window.dispatchEvent(new Event('carte_storage_update'));
      if (callback) callback(null);
    }
  },

  // Invia un aggiornamento al cloud (broadcast a tutti i telefoni connessi)
  publishUpdate(type: SyncMessage['type'], session: TournamentSession | null) {
    if (typeof window === 'undefined') return;

    activeRoom = this.getRoom();
    const payload: SyncMessage = {
      type,
      session,
      senderId: CLIENT_ID,
      timestamp: Date.now(),
    };

    try {
      fetch(`${NTFY_BASE_URL}/${activeRoom}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload),
      }).catch((e) => {
        console.warn('Cloud sync publish error:', e);
      });
    } catch (e) {
      console.warn('Publish error:', e);
    }
  },

  disconnect() {
    if (currentEventSource) {
      currentEventSource.close();
      currentEventSource = null;
    }
  },
};
