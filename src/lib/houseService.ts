import type { House, KnownHouse } from '../types/house.ts';
import type { Player, CardSuit, Match, TournamentSession } from '../types/game.ts';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient.ts';

import { getStoredItem as getStorageItem, setStoredItem as setStorageItem, removeStoredItem as removeStorageItem } from './storagePrimitives.ts';

export const HOUSE_STORAGE_KEYS = {
  ACTIVE_ID: 'carte_active_house_id_v2',
  KNOWN_HOUSES: 'carte_known_houses_v2',
  LEGACY_PLAYERS: 'carte_briscola_players_v4',
  LEGACY_TEAMS: 'carte_briscola_teams_v4',
  LEGACY_MATCHES: 'carte_briscola_matches_v4',
  LEGACY_SESSIONS: 'carte_tournament_sessions_v4',
};

export const DEFAULT_HOUSE: House = {
  id: 'casa_principale',
  name: 'Casa Principale',
  inviteCode: 'BRIS-1001',
  createdAt: '2026-10-01T10:00:00Z',
  updatedAt: '2026-10-01T10:00:00Z',
};

// Genera un codice casuale di 6 caratteri (es. BRIS-4821)
export function generateInviteCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `BRIS-${num}`;
}

// Genera un ID univoco pulito per la casa (es. casa_a8f2k9)
export function generateHouseId(): string {
  return `casa_${Math.random().toString(36).substring(2, 8)}`;
}

export function getHouseResourceKey(
  houseId: string,
  resource: 'players' | 'teams' | 'matches' | 'sessions' | 'meta'
): string {
  const safeId = houseId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'casa_principale';
  return `carte_house_${safeId}_${resource}`;
}

let activeRealtimeChannel: ReturnType<NonNullable<ReturnType<typeof getSupabaseClient>>['channel']> | null = null;

export const HouseService = {
  init(): void {
    const knownRaw = getStorageItem(HOUSE_STORAGE_KEYS.KNOWN_HOUSES);
    let known: KnownHouse[] = [];

    if (knownRaw) {
      try {
        known = JSON.parse(knownRaw);
      } catch {
        known = [];
      }
    }

    // Se non ci sono case registrate, effettua la migrazione dei dati legacy o crea casa_principale
    if (!Array.isArray(known) || known.length === 0) {
      const metaKey = getHouseResourceKey(DEFAULT_HOUSE.id, 'meta');
      const existingMeta = getStorageItem(metaKey);

      const baseHouse: House = existingMeta ? JSON.parse(existingMeta) : DEFAULT_HOUSE;

      // Migrazione dati legacy se presenti
      const legacyPlayers = getStorageItem(HOUSE_STORAGE_KEYS.LEGACY_PLAYERS);
      const targetPlayersKey = getHouseResourceKey(baseHouse.id, 'players');
      if (legacyPlayers && !getStorageItem(targetPlayersKey)) {
        try {
          const players: Player[] = JSON.parse(legacyPlayers);
          const tagged = players.map((p) => ({ ...p, houseId: baseHouse.id }));
          setStorageItem(targetPlayersKey, JSON.stringify(tagged));
        } catch {
          setStorageItem(targetPlayersKey, legacyPlayers);
        }
      }

      const legacyTeams = getStorageItem(HOUSE_STORAGE_KEYS.LEGACY_TEAMS);
      const targetTeamsKey = getHouseResourceKey(baseHouse.id, 'teams');
      if (legacyTeams && !getStorageItem(targetTeamsKey)) {
        setStorageItem(targetTeamsKey, legacyTeams);
      }

      const legacyMatches = getStorageItem(HOUSE_STORAGE_KEYS.LEGACY_MATCHES);
      const targetMatchesKey = getHouseResourceKey(baseHouse.id, 'matches');
      if (legacyMatches && !getStorageItem(targetMatchesKey)) {
        setStorageItem(targetMatchesKey, legacyMatches);
      }

      const legacySessions = getStorageItem(HOUSE_STORAGE_KEYS.LEGACY_SESSIONS);
      const targetSessionsKey = getHouseResourceKey(baseHouse.id, 'sessions');
      if (legacySessions && !getStorageItem(targetSessionsKey)) {
        setStorageItem(targetSessionsKey, legacySessions);
      }

      setStorageItem(metaKey, JSON.stringify(baseHouse));

      known = [
        {
          id: baseHouse.id,
          name: baseHouse.name,
          inviteCode: baseHouse.inviteCode,
          joinedAt: baseHouse.createdAt,
          lastActiveAt: new Date().toISOString(),
        },
      ];
      setStorageItem(HOUSE_STORAGE_KEYS.KNOWN_HOUSES, JSON.stringify(known));
      setStorageItem(HOUSE_STORAGE_KEYS.ACTIVE_ID, baseHouse.id);
    }

    // Assicura che ci sia una casa attiva valida
    let activeId = getStorageItem(HOUSE_STORAGE_KEYS.ACTIVE_ID);
    if (!activeId || !known.some((k) => k.id === activeId)) {
      activeId = known[0]?.id || DEFAULT_HOUSE.id;
      setStorageItem(HOUSE_STORAGE_KEYS.ACTIVE_ID, activeId);
    }
  },

  getActiveHouseId(): string {
    this.init();
    return getStorageItem(HOUSE_STORAGE_KEYS.ACTIVE_ID) || DEFAULT_HOUSE.id;
  },

  getActiveHouse(): House {
    const activeId = this.getActiveHouseId();
    const metaKey = getHouseResourceKey(activeId, 'meta');
    const metaRaw = getStorageItem(metaKey);
    if (metaRaw) {
      try {
        return JSON.parse(metaRaw);
      } catch {
        // fallback
      }
    }

    const known = this.getKnownHouses();
    const found = known.find((k) => k.id === activeId);
    if (found) {
      return {
        id: found.id,
        name: found.name,
        inviteCode: found.inviteCode,
        createdAt: found.joinedAt,
        updatedAt: found.lastActiveAt,
      };
    }

    return DEFAULT_HOUSE;
  },

  getKnownHouses(): KnownHouse[] {
    this.init();
    const raw = getStorageItem(HOUSE_STORAGE_KEYS.KNOWN_HOUSES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  setActiveHouse(houseId: string): void {
    const cleanId = houseId.trim();
    if (!cleanId) return;

    setStorageItem(HOUSE_STORAGE_KEYS.ACTIVE_ID, cleanId);

    // Aggiorna timestamp lastActiveAt
    const known = this.getKnownHouses();
    const index = known.findIndex((k) => k.id === cleanId);
    if (index >= 0) {
      known[index].lastActiveAt = new Date().toISOString();
      setStorageItem(HOUSE_STORAGE_KEYS.KNOWN_HOUSES, JSON.stringify(known));
    }

    this.notifyUpdate();
    this.setupCloudSync(cleanId);
  },

  createHouse(name: string, initialPlayerNames: string[] = []): House {
    this.init();
    const cleanName = name.trim() || 'Nuova Casa';
    const id = generateHouseId();
    const inviteCode = generateInviteCode();
    const now = new Date().toISOString();

    const house: House = {
      id,
      name: cleanName,
      inviteCode,
      createdAt: now,
      updatedAt: now,
    };

    // Salva metadati
    setStorageItem(getHouseResourceKey(id, 'meta'), JSON.stringify(house));

    // Crea giocatori iniziali se specificati
    const suits: CardSuit[] = ['coppe', 'denari', 'spade', 'bastoni'];
    const players: Player[] = initialPlayerNames
      .map((n) => n.trim())
      .filter(Boolean)
      .map((playerName, idx) => ({
        id: `p_${id}_${idx + 1}`,
        houseId: id,
        name: playerName,
        avatarSuit: suits[idx % suits.length],
        createdAt: now,
      }));

    setStorageItem(getHouseResourceKey(id, 'players'), JSON.stringify(players));
    setStorageItem(getHouseResourceKey(id, 'teams'), JSON.stringify([]));
    setStorageItem(getHouseResourceKey(id, 'matches'), JSON.stringify([]));
    setStorageItem(getHouseResourceKey(id, 'sessions'), JSON.stringify([]));

    // Aggiungi a case note
    const known = this.getKnownHouses().filter((k) => k.id !== id);
    known.unshift({
      id,
      name: cleanName,
      inviteCode,
      joinedAt: now,
      lastActiveAt: now,
    });
    setStorageItem(HOUSE_STORAGE_KEYS.KNOWN_HOUSES, JSON.stringify(known));
    setStorageItem(HOUSE_STORAGE_KEYS.ACTIVE_ID, id);

    // Sync cloud immediato se Supabase è attivo
    this.pushHouseToCloud(house, players);

    this.notifyUpdate();
    this.setupCloudSync(id);
    return house;
  },

  async joinHouseByCodeOrId(codeOrId: string): Promise<{ success: boolean; house?: House; error?: string }> {
    this.init();
    const clean = codeOrId.trim();
    if (!clean) {
      return { success: false, error: 'Codice non valido' };
    }

    const cleanUpper = clean.toUpperCase();
    const known = this.getKnownHouses();

    // 1. Controlla se è già tra le case locali
    const localMatch = known.find(
      (k) => k.id.toLowerCase() === clean.toLowerCase() || k.inviteCode.toUpperCase() === cleanUpper
    );

    if (localMatch) {
      this.setActiveHouse(localMatch.id);
      return {
        success: true,
        house: {
          id: localMatch.id,
          name: localMatch.name,
          inviteCode: localMatch.inviteCode,
          createdAt: localMatch.joinedAt,
          updatedAt: localMatch.lastActiveAt,
        },
      };
    }

    // 2. Se Supabase è configurato, cerca nel database cloud
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data, error } = await client
            .from('houses')
            .select('*')
            .or(`id.eq.${clean},invite_code.eq.${cleanUpper}`)
            .maybeSingle();

          if (error) {
            console.warn('Errore query Supabase house:', error);
          } else if (data) {
            const fetchedHouse: House = {
              id: data.id,
              name: data.name,
              inviteCode: data.invite_code,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            };

            // Salva metadati locali
            setStorageItem(getHouseResourceKey(fetchedHouse.id, 'meta'), JSON.stringify(fetchedHouse));

            // Aggiungi a known houses
            const updatedKnown = this.getKnownHouses().filter((k) => k.id !== fetchedHouse.id);
            updatedKnown.unshift({
              id: fetchedHouse.id,
              name: fetchedHouse.name,
              inviteCode: fetchedHouse.inviteCode,
              joinedAt: new Date().toISOString(),
              lastActiveAt: new Date().toISOString(),
            });
            setStorageItem(HOUSE_STORAGE_KEYS.KNOWN_HOUSES, JSON.stringify(updatedKnown));
            setStorageItem(HOUSE_STORAGE_KEYS.ACTIVE_ID, fetchedHouse.id);

            // Scarica tutti i dati della casa dal cloud
            await this.pullHouseDataFromCloud(fetchedHouse.id);

            this.notifyUpdate();
            this.setupCloudSync(fetchedHouse.id);
            return { success: true, house: fetchedHouse };
          }
        } catch (err) {
          console.warn('Eccezione durante ricerca casa su Supabase:', err);
        }
      }
    }

    // 3. Fallback locale: se ha la forma di un ID casa (es. casa_...), creala localmente
    if (clean.startsWith('casa_')) {
      const fallbackHouse: House = {
        id: clean,
        name: `Casa ${clean.replace('casa_', '').toUpperCase()}`,
        inviteCode: generateInviteCode(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setStorageItem(getHouseResourceKey(fallbackHouse.id, 'meta'), JSON.stringify(fallbackHouse));
      const updatedKnown = this.getKnownHouses().filter((k) => k.id !== fallbackHouse.id);
      updatedKnown.unshift({
        id: fallbackHouse.id,
        name: fallbackHouse.name,
        inviteCode: fallbackHouse.inviteCode,
        joinedAt: fallbackHouse.createdAt,
        lastActiveAt: fallbackHouse.updatedAt,
      });
      setStorageItem(HOUSE_STORAGE_KEYS.KNOWN_HOUSES, JSON.stringify(updatedKnown));
      setStorageItem(HOUSE_STORAGE_KEYS.ACTIVE_ID, fallbackHouse.id);
      this.notifyUpdate();
      return { success: true, house: fallbackHouse };
    }

    return { success: false, error: 'Casa non trovata. Verifica il codice o il link.' };
  },

  renameHouse(houseId: string, newName: string): void {
    const cleanName = newName.trim();
    if (!cleanName) return;

    const metaKey = getHouseResourceKey(houseId, 'meta');
    const existingRaw = getStorageItem(metaKey);
    if (existingRaw) {
      try {
        const house: House = JSON.parse(existingRaw);
        house.name = cleanName;
        house.updatedAt = new Date().toISOString();
        setStorageItem(metaKey, JSON.stringify(house));
      } catch {
        // ignore
      }
    }

    const known = this.getKnownHouses();
    const index = known.findIndex((k) => k.id === houseId);
    if (index >= 0) {
      known[index].name = cleanName;
      known[index].lastActiveAt = new Date().toISOString();
      setStorageItem(HOUSE_STORAGE_KEYS.KNOWN_HOUSES, JSON.stringify(known));
    }

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      client?.from('houses').update({ name: cleanName, updated_at: new Date().toISOString() }).eq('id', houseId).then();
    }

    this.notifyUpdate();
  },

  removeHouse(houseId: string): void {
    const known = this.getKnownHouses().filter((k) => k.id !== houseId);
    setStorageItem(HOUSE_STORAGE_KEYS.KNOWN_HOUSES, JSON.stringify(known));

    // Se stiamo eliminando la casa attiva, passa alla prima disponibile o a quella di default
    if (this.getActiveHouseId() === houseId) {
      const nextId = known[0]?.id || DEFAULT_HOUSE.id;
      setStorageItem(HOUSE_STORAGE_KEYS.ACTIVE_ID, nextId);
    }

    // Rimuovi dati locali della casa
    removeStorageItem(getHouseResourceKey(houseId, 'meta'));
    removeStorageItem(getHouseResourceKey(houseId, 'players'));
    removeStorageItem(getHouseResourceKey(houseId, 'teams'));
    removeStorageItem(getHouseResourceKey(houseId, 'matches'));
    removeStorageItem(getHouseResourceKey(houseId, 'sessions'));

    this.notifyUpdate();
  },

  getShareUrl(houseId: string): string {
    const id = houseId || this.getActiveHouseId();
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      return `${origin}/?casa=${encodeURIComponent(id)}`;
    }
    return `https://carte-briscola.vercel.app/?casa=${encodeURIComponent(id)}`;
  },

  notifyUpdate(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('carte_storage_update'));
      window.dispatchEvent(new Event('carte_house_change'));
    }
  },

  // Sincronizzazione Cloud Supabase
  async pushHouseToCloud(house: House, initialPlayers: Player[] = []): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const client = getSupabaseClient();
    if (!client) return;

    try {
      await client.from('houses').upsert({
        id: house.id,
        name: house.name,
        invite_code: house.inviteCode,
        created_at: house.createdAt,
        updated_at: house.updatedAt,
      });

      if (initialPlayers.length > 0) {
        const payload = initialPlayers.map((p) => ({
          id: p.id,
          house_id: house.id,
          name: p.name,
          nickname: p.nickname || null,
          avatar_suit: p.avatarSuit,
          created_at: p.createdAt,
        }));
        await client.from('players').upsert(payload);
      }
    } catch (err) {
      console.warn('Errore push house to cloud:', err);
    }
  },

  async pullHouseDataFromCloud(houseId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const client = getSupabaseClient();
    if (!client) return;

    try {
      // 1. Players
      const { data: players } = await client.from('players').select('*').eq('house_id', houseId);
      if (Array.isArray(players) && players.length > 0) {
        const mappedPlayers: Player[] = players.map((p) => ({
          id: p.id,
          houseId: p.house_id,
          name: p.name,
          nickname: p.nickname ?? undefined,
          avatarSuit: p.avatar_suit as CardSuit,
          createdAt: p.created_at,
        }));
        setStorageItem(getHouseResourceKey(houseId, 'players'), JSON.stringify(mappedPlayers));
      }

      // 2. Teams
      const { data: teams } = await client.from('teams').select('*').eq('house_id', houseId);
      if (Array.isArray(teams)) {
        setStorageItem(getHouseResourceKey(houseId, 'teams'), JSON.stringify(teams));
      }

      // 3. Matches
      const { data: matches } = await client.from('matches').select('*').eq('house_id', houseId);
      if (Array.isArray(matches)) {
        const mappedMatches: Match[] = matches.map((m) => ({
          id: m.id,
          houseId: m.house_id,
          gameType: m.game_type || m.gameType || 'briscola',
          timestamp: m.timestamp,
          dateKey: m.date_key || m.dateKey,
          team1Id: m.team1_id || m.team1Id,
          team2Id: m.team2_id || m.team2Id,
          winnerTeamId: m.winner_team_id || m.winnerTeamId,
          scoreTeam1: m.score_team1 ?? m.scoreTeam1,
          scoreTeam2: m.score_team2 ?? m.scoreTeam2,
          notes: m.notes ?? undefined,
        }));
        setStorageItem(getHouseResourceKey(houseId, 'matches'), JSON.stringify(mappedMatches));
      }

      // 4. Tournament Sessions
      const { data: sessions } = await client.from('tournament_sessions').select('*').eq('house_id', houseId);
      if (Array.isArray(sessions)) {
        const mappedSessions: TournamentSession[] = sessions.map((s) => ({
          id: s.id,
          houseId: s.house_id,
          dateKey: s.date_key,
          startedAt: s.created_at || s.started_at || new Date().toISOString(),
          endedAt: s.ended_at || undefined,
          mode: s.mode || '2vs2',
          team1Name: s.team1_name || s.team1Name || '',
          team1Players: s.team1_players || s.team1Players || [],
          team2Name: s.team2_name || s.team2Name || '',
          team2Players: s.team2_players || s.team2Players || [],
          team3Name: s.team3_name || s.team3Name || undefined,
          team3Players: s.team3_players || s.team3Players || undefined,
          players5: s.players5 || undefined,
          team1Wins: s.team1_wins ?? s.team1Wins ?? 0,
          team2Wins: s.team2_wins ?? s.team2Wins ?? 0,
          team3Wins: s.team3_wins ?? s.team3Wins ?? 0,
          status: s.is_active ? 'in_progress' : 'completed',
          winnerTeam: s.winner_team || s.winnerTeam,
          winnerPlayerName: s.winner_player_name || s.winnerPlayerName,
        }));
        setStorageItem(getHouseResourceKey(houseId, 'sessions'), JSON.stringify(mappedSessions));
      }
    } catch (err) {
      console.warn('Errore pull house data from cloud:', err);
    }
  },

  setupCloudSync(houseId: string): void {
    if (!isSupabaseConfigured() || typeof window === 'undefined') return;
    const client = getSupabaseClient();
    if (!client) return;

    // Chiudi canale precedente
    if (activeRealtimeChannel) {
      client.removeChannel(activeRealtimeChannel);
      activeRealtimeChannel = null;
    }

    try {
      activeRealtimeChannel = client
        .channel(`realtime_house_${houseId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', filter: `house_id=eq.${houseId}` },
          () => {
            // Sincronizza i dati e notifica la UI
            this.pullHouseDataFromCloud(houseId).then(() => {
              this.notifyUpdate();
            });
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('Errore setup realtime Supabase:', e);
    }
  },
};
