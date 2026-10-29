import type { House, KnownHouse, HouseMember } from '../types/house.ts';
import type { Player, CardSuit, Match, TournamentSession } from '../types/game.ts';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient.ts';
import { AuthService } from './authService.ts';
import {
  getStoredItem as getStorageItem,
  setStoredItem as setStorageItem,
  removeStoredItem as removeStorageItem,
} from './storagePrimitives.ts';

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
  resource: 'players' | 'teams' | 'matches' | 'sessions' | 'meta' | 'members'
): string {
  const safeId = houseId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'casa_none';
  return `carte_house_${safeId}_${resource}`;
}

let activeRealtimeChannel: ReturnType<NonNullable<ReturnType<typeof getSupabaseClient>>['channel']> | null = null;
let syncHousesPromise: Promise<void> | null = null;

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

    if (!Array.isArray(known)) {
      known = [];
      setStorageItem(HOUSE_STORAGE_KEYS.KNOWN_HOUSES, JSON.stringify(known));
    }

    // Rimuovi 'casa_principale' residuo del vecchio sistema demo se presente
    const hadCasaPrincipale = known.some((k) => k.id === 'casa_principale');
    if (hadCasaPrincipale) {
      known = known.filter((k) => k.id !== 'casa_principale');
      setStorageItem(HOUSE_STORAGE_KEYS.KNOWN_HOUSES, JSON.stringify(known));
      if (getStorageItem(HOUSE_STORAGE_KEYS.ACTIVE_ID) === 'casa_principale') {
        removeStorageItem(HOUSE_STORAGE_KEYS.ACTIVE_ID);
      }
    }

    // Se non ci sono case registrate, non creiamo alcuna casa di default (Schermata Vuota)
    if (known.length === 0) {
      removeStorageItem(HOUSE_STORAGE_KEYS.ACTIVE_ID);
      return;
    }

    // Assicura che ci sia una casa attiva valida tra quelle note
    const activeId = getStorageItem(HOUSE_STORAGE_KEYS.ACTIVE_ID);
    if (!activeId || !known.some((k) => k.id === activeId)) {
      setStorageItem(HOUSE_STORAGE_KEYS.ACTIVE_ID, known[0].id);
    }
  },

  hasActiveHouse(): boolean {
    return Boolean(this.getActiveHouseId());
  },

  getActiveHouseId(): string {
    this.init();
    const activeId = getStorageItem(HOUSE_STORAGE_KEYS.ACTIVE_ID);
    if (!activeId) return '';
    const known = this.getKnownHouses();
    if (known.some((k) => k.id === activeId)) {
      return activeId;
    }
    return known[0]?.id || '';
  },

  getActiveHouse(): House | null {
    const activeId = this.getActiveHouseId();
    if (!activeId) return null;

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

    return null;
  },

  getHouse(houseId: string): House | null {
    if (!houseId) return null;
    const metaKey = getHouseResourceKey(houseId, 'meta');
    const metaRaw = getStorageItem(metaKey);
    if (metaRaw) {
      try {
        return JSON.parse(metaRaw);
      } catch {
        // fallback
      }
    }
    const known = this.getKnownHouses();
    const found = known.find((k) => k.id === houseId);
    if (found) {
      return {
        id: found.id,
        name: found.name,
        inviteCode: found.inviteCode,
        createdAt: found.joinedAt,
        updatedAt: found.lastActiveAt,
      };
    }
    return null;
  },

  getHousePlayers(houseId: string): Player[] {
    if (!houseId) return [];
    const raw = getStorageItem(getHouseResourceKey(houseId, 'players'));
    if (!raw) return [];
    try {
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },

  getKnownHouses(): KnownHouse[] {
    const raw = getStorageItem(HOUSE_STORAGE_KEYS.KNOWN_HOUSES);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  setActiveHouse(houseId: string): void {
    const cleanId = houseId.trim();
    if (!cleanId) {
      removeStorageItem(HOUSE_STORAGE_KEYS.ACTIVE_ID);
      this.notifyUpdate();
      return;
    }

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

  // Membri della Casa
  getHouseMembers(houseId: string): HouseMember[] {
    if (!houseId) return [];
    const key = getHouseResourceKey(houseId, 'members');
    const raw = getStorageItem(key);
    let list: HouseMember[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed;
      } catch {
        list = [];
      }
    }

    // Assicura che l'utente corrente sia presente tra i membri se questa è la sua casa attiva
    const currentUser = AuthService.getCurrentUser();
    if (currentUser?.id) {
      const activeId = getStorageItem(HOUSE_STORAGE_KEYS.ACTIVE_ID);
      if (activeId === houseId) {
        const existingIdx = list.findIndex((m) => m.userId === currentUser.id);
        const myNick = AuthService.getEffectiveNickname(houseId);
        if (existingIdx === -1) {
          list.unshift({
            houseId,
            userId: currentUser.id,
            displayName: currentUser.displayName,
            nickname: myNick,
            avatarUrl: currentUser.avatarUrl,
            role: 'owner',
            joinedAt: new Date().toISOString(),
          });
          setStorageItem(key, JSON.stringify(list));
        } else if (myNick && list[existingIdx].nickname !== myNick) {
          list[existingIdx].nickname = myNick;
          setStorageItem(key, JSON.stringify(list));
        }
      }
    }

    // Recupera eventuali membri creati con la casa salvati in precedenza nella lista players
    const playersRaw = getStorageItem(getHouseResourceKey(houseId, 'players'));
    if (playersRaw) {
      try {
        const players: Player[] = JSON.parse(playersRaw);
        let updated = false;
        for (const p of players) {
          if (!p || p.isFriend) continue;
          if (p.id && p.id.startsWith('p_mem_')) continue;
          const pNameClean = typeof p.name === 'string' ? p.name.trim().toLowerCase() : '';
          const pNickClean = typeof p.nickname === 'string' ? p.nickname.trim().toLowerCase() : pNameClean;
          if (!pNameClean && !pNickClean) continue;

          const isAlreadyMember = list.some((m) => {
            if (!m) return false;
            const mDisp = typeof m.displayName === 'string' ? m.displayName.trim().toLowerCase() : '';
            const mNick = typeof m.nickname === 'string' ? m.nickname.trim().toLowerCase() : '';
            return (
              (mDisp && pNameClean && mDisp === pNameClean) ||
              (mNick && pNickClean && mNick === pNickClean) ||
              (mNick && pNameClean && mNick === pNameClean)
            );
          });
          if (!isAlreadyMember) {
            const fallbackName = (p.name && typeof p.name === 'string') ? p.name : (p.nickname || 'Membro');
            list.push({
              houseId,
              userId: `mem_${p.id || Date.now()}`,
              displayName: fallbackName,
              nickname: p.nickname || fallbackName,
              role: 'member',
              joinedAt: p.createdAt || new Date().toISOString(),
            });
            updated = true;
          }
        }
        if (updated) {
          setStorageItem(key, JSON.stringify(list));
        }
      } catch {
        // ignore
      }
    }

    return list;
  },

  deleteHouseMember(houseId: string, userId: string): void {
    if (!houseId || !userId) return;
    const key = getHouseResourceKey(houseId, 'members');
    const members = this.getHouseMembers(houseId).filter((m) => m.userId !== userId);
    setStorageItem(key, JSON.stringify(members));

    // Rimuovi anche da players della casa se presente
    const playersKey = getHouseResourceKey(houseId, 'players');
    const raw = getStorageItem(playersKey);
    if (raw) {
      try {
        const players: Player[] = JSON.parse(raw);
        const filtered = players.filter(
          (p) =>
            p.id !== `p_mem_${userId}` &&
            p.id !== `p_${userId}` &&
            p.id !== userId.replace('mem_', '')
        );
        setStorageItem(playersKey, JSON.stringify(filtered));
      } catch {
        // ignore
      }
    }

    if (isSupabaseConfigured() && !userId.startsWith('guest_')) {
      const client = getSupabaseClient();
      client?.from('house_members').delete().eq('house_id', houseId).eq('user_id', userId).then();
      client?.from('players').delete().eq('id', `p_mem_${userId}`).eq('house_id', houseId).then();
    }

    this.notifyUpdate();
  },

  // Sincronizza il membro della casa nella tabella dei giocatori (Player) di quella casa
  syncMemberToPlayer(member: HouseMember): void {
    if (!member.houseId || !member.userId) return;
    const playersKey = getHouseResourceKey(member.houseId, 'players');
    const raw = getStorageItem(playersKey);
    let players: Player[] = [];
    if (raw) {
      try {
        players = JSON.parse(raw);
        if (!Array.isArray(players)) players = [];
      } catch {
        players = [];
      }
    }

    const playerId = `p_mem_${member.userId}`;
    const suitOrder: CardSuit[] = ['denari', 'coppe', 'spade', 'bastoni'];
    const memberDisp = typeof member.displayName === 'string' ? member.displayName.trim().toLowerCase() : '';
    const existingIndex = players.findIndex(
      (p) =>
        p &&
        (p.id === playerId ||
          (p.name && memberDisp && p.name.trim().toLowerCase() === memberDisp))
    );

    const effectiveName = member.displayName;
    const effectiveNickname = member.nickname;

    if (existingIndex >= 0) {
      players[existingIndex] = {
        ...players[existingIndex],
        id: playerId,
        name: effectiveName,
        nickname: effectiveNickname || undefined,
      };
    } else {
      players.push({
        id: playerId,
        houseId: member.houseId,
        name: effectiveName,
        nickname: effectiveNickname || undefined,
        avatarSuit: suitOrder[players.length % suitOrder.length],
        createdAt: member.joinedAt || new Date().toISOString(),
      });
    }

    setStorageItem(playersKey, JSON.stringify(players));
  },

  async saveHouseMember(member: HouseMember): Promise<void> {
    if (!member.houseId || !member.userId) return;
    const members = this.getHouseMembers(member.houseId);
    const index = members.findIndex((m) => m.userId === member.userId);
    if (index >= 0) {
      members[index] = { ...members[index], ...member };
    } else {
      members.push(member);
    }
    setStorageItem(getHouseResourceKey(member.houseId, 'members'), JSON.stringify(members));

    // Sincronizza anche la presenza del giocatore nella lista players della casa
    this.syncMemberToPlayer(member);

    // Se l'utente ha un account Supabase (non guest), effettua l'upsert su cloud
    if (isSupabaseConfigured() && member.userId && !member.userId.startsWith('guest_')) {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from('house_members').upsert({
            house_id: member.houseId,
            user_id: member.userId,
            nickname: member.nickname || null,
            role: member.role || 'member',
            joined_at: member.joinedAt || new Date().toISOString(),
          });

          await client.from('players').upsert({
            id: `p_mem_${member.userId}`,
            house_id: member.houseId,
            name: member.displayName,
            nickname: member.nickname || null,
            avatar_suit: 'denari',
            created_at: member.joinedAt || new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Errore sincronizzazione membro su Supabase:', e);
        }
      }
    }
  },

  // Nomi suggeriti per torneo e partite, derivati dai membri reali e giocatori registrati della casa
  getSuggestedPlayerNames(houseId?: string): string[] {
    const id = houseId || this.getActiveHouseId();
    if (!id) return [];

    const names: string[] = [];
    const addName = (rawName?: string) => {
      const clean = rawName?.trim();
      if (!clean) return;
      if (!names.some((n) => n.toLowerCase() === clean.toLowerCase())) {
        names.push(clean);
      }
    };

    const currentUser = AuthService.getCurrentUser();
    const members = this.getHouseMembers(id);

    // 1. Membri effettivi della casa: SOLO IL NICKNAME (se presente), altrimenti displayName. Mai entrambi!
    for (const m of members) {
      if (!m) continue;
      if (currentUser?.id && m.userId === currentUser.id) {
        addName(AuthService.getEffectiveNickname(id));
      } else {
        const raw = (m.nickname && m.nickname.trim()) || (m.displayName && m.displayName.trim()) || '';
        if (raw) addName(raw);
      }
    }

    // 2. Giocatori amici registrati nella casa: SOLO IL NICKNAME (se presente), altrimenti name. Mai entrambi!
    const playersRaw = getStorageItem(getHouseResourceKey(id, 'players'));
    if (playersRaw) {
      try {
        const players: Player[] = JSON.parse(playersRaw);
        for (const p of players) {
          if (!p || (p.id && p.id.startsWith('p_mem_'))) continue;
          const pNameLower = typeof p.name === 'string' ? p.name.trim().toLowerCase() : '';
          if (!pNameLower) continue;

          const isMember = members.some((m) => {
            if (!m) return false;
            const mDisp = typeof m.displayName === 'string' ? m.displayName.trim().toLowerCase() : '';
            const mNick = typeof m.nickname === 'string' ? m.nickname.trim().toLowerCase() : '';
            return (mDisp && mDisp === pNameLower) || (mNick && mNick === pNameLower);
          });
          if (isMember) continue;

          const friendEff = (p.nickname && p.nickname.trim()) || (p.name && p.name.trim()) || '';
          if (friendEff) addName(friendEff);
        }
      } catch {
        // ignore
      }
    }

    return names;
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

    // Salva metadati casa
    setStorageItem(getHouseResourceKey(id, 'meta'), JSON.stringify(house));

    // Aggiungi utente creatore come primo membro della casa
    const currentUser = AuthService.getCurrentUser();
    const userNick = AuthService.getHouseNickname(id);
    const creatorMember: HouseMember = {
      houseId: id,
      userId: currentUser.id,
      displayName: currentUser.displayName,
      nickname: userNick || currentUser.displayName,
      avatarUrl: currentUser.avatarUrl,
      role: 'owner',
      joinedAt: now,
    };
    this.saveHouseMember(creatorMember);

    // Salva anche i coinquilini/membri iniziali specificati dall'utente
    for (const pName of initialPlayerNames) {
      const trimmed = pName.trim();
      if (!trimmed || trimmed.toLowerCase() === currentUser.displayName.toLowerCase()) continue;
      const memberId = `member_${id}_${Math.random().toString(36).substring(2, 7)}`;
      const memberObj: HouseMember = {
        houseId: id,
        userId: memberId,
        displayName: trimmed,
        nickname: trimmed,
        role: 'member',
        joinedAt: now,
      };
      this.saveHouseMember(memberObj);
    }

    // Crea giocatori iniziali se specificati dall'utente
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
    this.pushHouseToCloud(house, players, [creatorMember]);

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
      const currentUser = AuthService.getCurrentUser();
      const existingMember = this.getHouseMembers(localMatch.id).find((m) => m.userId === currentUser.id);
      if (!existingMember) {
        await this.saveHouseMember({
          houseId: localMatch.id,
          userId: currentUser.id,
          displayName: currentUser.displayName,
          nickname: AuthService.getHouseNickname(localMatch.id),
          avatarUrl: currentUser.avatarUrl,
          role: 'member',
          joinedAt: new Date().toISOString(),
        });
      } else {
        existingMember.displayName = currentUser.displayName;
        existingMember.avatarUrl = currentUser.avatarUrl;
        const currentHouseNick = AuthService.getHouseNickname(localMatch.id);
        if (currentHouseNick) existingMember.nickname = currentHouseNick;
        await this.saveHouseMember(existingMember);
      }
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

            // Aggiungi utente come membro
            const currentUser = AuthService.getCurrentUser();
            await this.saveHouseMember({
              houseId: fetchedHouse.id,
              userId: currentUser.id,
              displayName: currentUser.displayName,
              nickname: AuthService.getHouseNickname(fetchedHouse.id),
              avatarUrl: currentUser.avatarUrl,
              role: 'member',
              joinedAt: new Date().toISOString(),
            });

            // Scarica tutti i dati della casa e i membri dal cloud
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

      const currentUser = AuthService.getCurrentUser();
      await this.saveHouseMember({
        houseId: fallbackHouse.id,
        userId: currentUser.id,
        displayName: currentUser.displayName,
        nickname: AuthService.getHouseNickname(fallbackHouse.id),
        avatarUrl: currentUser.avatarUrl,
        role: 'member',
        joinedAt: new Date().toISOString(),
      });

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

    // Se stiamo eliminando la casa attiva, passa alla prima disponibile o a nessuna
    if (this.getActiveHouseId() === houseId) {
      const nextId = known[0]?.id || '';
      if (nextId) {
        setStorageItem(HOUSE_STORAGE_KEYS.ACTIVE_ID, nextId);
      } else {
        removeStorageItem(HOUSE_STORAGE_KEYS.ACTIVE_ID);
      }
    }

    // Rimuovi dati locali della casa
    removeStorageItem(getHouseResourceKey(houseId, 'meta'));
    removeStorageItem(getHouseResourceKey(houseId, 'members'));
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
  async pushHouseToCloud(house: House, initialPlayers: Player[] = [], members: HouseMember[] = []): Promise<void> {
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

      if (members.length > 0) {
        for (const m of members) {
          if (m.userId && !m.userId.startsWith('guest_')) {
            await client.from('house_members').upsert({
              house_id: house.id,
              user_id: m.userId,
              nickname: m.nickname || null,
              role: m.role || 'member',
              joined_at: m.joinedAt || new Date().toISOString(),
            });
          }
        }
      }

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
      // 0. Membri della Casa
      const { data: membersData } = await client
        .from('house_members')
        .select('house_id, user_id, nickname, role, joined_at, profiles(display_name, avatar_url)')
        .eq('house_id', houseId);

      if (Array.isArray(membersData)) {
        interface CloudMemberRecord {
          house_id: string;
          user_id: string;
          nickname?: string | null;
          role?: 'owner' | 'member';
          joined_at: string;
          profiles?: { display_name?: string; avatar_url?: string } | null;
        }
        const mappedMembers: HouseMember[] = (membersData as CloudMemberRecord[]).map((m) => {
          const profile = m.profiles;
          return {
            houseId: m.house_id,
            userId: m.user_id,
            displayName: profile?.display_name || 'Membro',
            nickname: m.nickname || undefined,
            avatarUrl: profile?.avatar_url || undefined,
            role: m.role || 'member',
            joinedAt: m.joined_at,
          };
        });

        // Preserva eventuali membri locali non ancora sincronizzati sul cloud o guest
        const existingLocal = this.getHouseMembers(houseId);
        for (const localM of existingLocal) {
          const cloudIndex = mappedMembers.findIndex((m) => m.userId === localM.userId);
          if (cloudIndex >= 0) {
            // Se in locale c'è un soprannome più recente impostato dall'utente, mantienilo
            if (localM.nickname && !mappedMembers[cloudIndex].nickname) {
              mappedMembers[cloudIndex].nickname = localM.nickname;
            }
          } else {
            mappedMembers.push(localM);
          }
        }

        setStorageItem(getHouseResourceKey(houseId, 'members'), JSON.stringify(mappedMembers));

        // Sincronizza anche ciascun membro nei players della casa
        for (const m of mappedMembers) {
          this.syncMemberToPlayer(m);
        }
      }

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

  async syncUserHousesFromCloud(userId: string): Promise<void> {
    if (!isSupabaseConfigured() || !userId || userId.startsWith('guest_')) return;
    if (syncHousesPromise) return syncHousesPromise;

    syncHousesPromise = (async () => {
      const client = getSupabaseClient();
      if (!client) return;

      try {
        // 1. Cerca tutte le associazioni casa per questo utente da Supabase
        const { data: memberRecords, error: memberErr } = await client
          .from('house_members')
          .select('house_id, role, nickname, joined_at')
          .eq('user_id', userId);

        if (memberErr) {
          console.warn('Errore lettura house_members da Supabase:', memberErr);
          // La tabella potrebbe non essere ancora stata creata dall'utente nel SQL Editor
          return;
        }

        const known = this.getKnownHouses();
        let hasChanges = false;

        if (Array.isArray(memberRecords) && memberRecords.length > 0) {
          const cloudHouseIds = memberRecords.map((m) => m.house_id);
          const { data: cloudHouses, error: houseErr } = await client
            .from('houses')
            .select('*')
            .in('id', cloudHouseIds);

          if (!houseErr && Array.isArray(cloudHouses)) {
            for (const ch of cloudHouses) {
              const memberMeta = memberRecords.find((m) => m.house_id === ch.id);
              const houseObj: House = {
                id: ch.id,
                name: ch.name,
                inviteCode: ch.invite_code,
                createdAt: ch.created_at,
                updatedAt: ch.updated_at,
              };

              // Salva metadati locali
              setStorageItem(getHouseResourceKey(ch.id, 'meta'), JSON.stringify(houseObj));

              // Aggiorna o inserisci in known_houses
              const existingIdx = known.findIndex((k) => k.id === ch.id);
              if (existingIdx >= 0) {
                known[existingIdx].name = ch.name;
                known[existingIdx].inviteCode = ch.invite_code;
              } else {
                known.push({
                  id: ch.id,
                  name: ch.name,
                  inviteCode: ch.invite_code,
                  joinedAt: memberMeta?.joined_at || ch.created_at,
                  lastActiveAt: new Date().toISOString(),
                });
                hasChanges = true;
              }

              // Scarica i dati completi della casa dal cloud (giocatori, squadre, partite, tornei, membri)
              await this.pullHouseDataFromCloud(ch.id);
            }
          }
        }

        // 2. Controllo inverso (upload): se su questo dispositivo ci sono case locali create da questo utente
        // che non sono ancora su Supabase (ad esempio create prima che l'utente eseguisse lo script SQL), caricale ora
        for (const k of known) {
          const members = this.getHouseMembers(k.id);
          const userIsMember = members.some((m) => m.userId === userId);
          const houseMeta = this.getHouse(k.id);
          if (houseMeta && (userIsMember || members.length === 0)) {
            if (!userIsMember) {
              const currentProfile = AuthService.getCurrentUser();
              const myMember: HouseMember = {
                houseId: k.id,
                userId,
                displayName: currentProfile.displayName,
                nickname: AuthService.getHouseNickname(k.id),
                role: 'owner',
                joinedAt: new Date().toISOString(),
              };
              members.push(myMember);
              setStorageItem(getHouseResourceKey(k.id, 'members'), JSON.stringify(members));
            }
            const players = this.getHousePlayers(k.id);
            await this.pushHouseToCloud(houseMeta, players, members);
          }
        }

        // Salva known_houses aggiornate
        setStorageItem(HOUSE_STORAGE_KEYS.KNOWN_HOUSES, JSON.stringify(known));

        // Se non c'è una casa attiva impostata e abbiamo trovato case, attiva la prima
        const currentActive = this.getActiveHouseId();
        if (!currentActive && known.length > 0) {
          setStorageItem(HOUSE_STORAGE_KEYS.ACTIVE_ID, known[0].id);
          hasChanges = true;
        }

        if (hasChanges || known.length > 0) {
          this.notifyUpdate();
          const activeId = this.getActiveHouseId();
          if (activeId) {
            this.setupCloudSync(activeId);
          }
        }
      } catch (err) {
        console.warn('Eccezione durante syncUserHousesFromCloud:', err);
      } finally {
        syncHousesPromise = null;
      }
    })();

    return syncHousesPromise;
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
      const onCloudChange = () => {
        this.pullHouseDataFromCloud(houseId).then(() => {
          this.notifyUpdate();
        });
      };

      activeRealtimeChannel = client
        .channel(`realtime_house_${houseId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'house_members', filter: `house_id=eq.${houseId}` },
          onCloudChange
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'players', filter: `house_id=eq.${houseId}` },
          onCloudChange
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'teams', filter: `house_id=eq.${houseId}` },
          onCloudChange
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'matches', filter: `house_id=eq.${houseId}` },
          onCloudChange
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tournament_sessions', filter: `house_id=eq.${houseId}` },
          onCloudChange
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          onCloudChange
        )
        .subscribe();
    } catch (e) {
      console.warn('Errore setup realtime Supabase:', e);
    }
  },
};
