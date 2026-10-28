import type { UserProfile } from '../types/house.ts';
import { getSupabaseClient, isSupabaseConfigured, getSupabaseAnonKey } from './supabaseClient.ts';
import {
  getStoredItem as getStorageItem,
  setStoredItem as setStorageItem,
  removeStoredItem as removeStorageItem,
} from './storagePrimitives.ts';
import { HouseService, getHouseResourceKey } from './houseService.ts';

const AUTH_STORAGE_KEYS = {
  GUEST_ID: 'carte_guest_user_id',
  DISPLAY_NAME: 'carte_user_display_name',
  CACHED_PROFILE: 'carte_cached_profile_v2',
};

let cachedUser: UserProfile | null = null;
let isInitialized = false;

function generateGuestId(): string {
  return `guest_${Math.random().toString(36).substring(2, 9)}`;
}

export const AuthService = {
  init(): void {
    if (isInitialized) return;
    isInitialized = true;

    // Assicura la presenza di un guest ID se non loggato
    let guestId = getStorageItem(AUTH_STORAGE_KEYS.GUEST_ID);
    if (!guestId) {
      guestId = generateGuestId();
      setStorageItem(AUTH_STORAGE_KEYS.GUEST_ID, guestId);
    }

    // Se Supabase è configurato, ascolta lo stato dell'autenticazione
    if (isSupabaseConfigured() && typeof window !== 'undefined') {
      const client = getSupabaseClient();
      if (client) {
        // Recupera la sessione attiva corrente
        client.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            this.handleSupabaseUser(session.user);
          }
        });

        // Ascolta modifiche allo stato auth (login, logout, token refresh)
        client.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            this.handleSupabaseUser(session.user);
          } else {
            cachedUser = null;
            removeStorageItem(AUTH_STORAGE_KEYS.CACHED_PROFILE);
            this.notifyAuthChange();
          }
        });
      }
    }
  },

  async handleSupabaseUser(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }): Promise<void> {
    const defaultName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email?.split('@')[0] ||
      'Giocatore';

    const avatarUrl =
      (user.user_metadata?.avatar_url as string) ||
      (user.user_metadata?.picture as string) ||
      undefined;

    let displayName = defaultName;

    // Controlla se c'è un nickname salvato sul database profiles
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data: profile } = await client
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', user.id)
            .maybeSingle();

          if (profile?.display_name) {
            displayName = profile.display_name;
          } else {
            // Crea profilo iniziale
            await client.from('profiles').upsert({
              id: user.id,
              email: user.email,
              display_name: defaultName,
              avatar_url: avatarUrl || null,
              updated_at: new Date().toISOString(),
            });
          }
        } catch {
          // ignore error
        }
      }
    }

    cachedUser = {
      id: user.id,
      email: user.email,
      displayName,
      avatarUrl,
      isGoogleUser: true,
    };

    setStorageItem(AUTH_STORAGE_KEYS.CACHED_PROFILE, JSON.stringify(cachedUser));

    // Se ci sono case note o attive, migra o registra l'utente collegandolo al nuovo account Google
    try {
      const known = HouseService.getKnownHouses();
      for (const house of known) {
        const currentMembers = HouseService.getHouseMembers(house.id);
        const guestIdx = currentMembers.findIndex((m) => m.userId.startsWith('guest_'));
        const existingAuthIdx = currentMembers.findIndex((m) => m.userId === user.id);
        const role =
          existingAuthIdx >= 0
            ? currentMembers[existingAuthIdx].role
            : guestIdx >= 0
            ? currentMembers[guestIdx].role
            : 'member';

        // Rimuovi eventuale membro guest locale per non lasciare record fantasma
        if (guestIdx >= 0 && guestIdx !== existingAuthIdx) {
          const oldGuestId = currentMembers[guestIdx].userId;
          currentMembers.splice(guestIdx, 1);
          setStorageItem(getHouseResourceKey(house.id, 'members'), JSON.stringify(currentMembers));

          // Rimuovi vecchio player guest corrispondente
          const playersKey = getHouseResourceKey(house.id, 'players');
          const rawPlayers = getStorageItem(playersKey);
          if (rawPlayers) {
            try {
              let pList = JSON.parse(rawPlayers);
              if (Array.isArray(pList)) {
                pList = pList.filter((p: { id: string }) => p.id !== `p_mem_${oldGuestId}`);
                setStorageItem(playersKey, JSON.stringify(pList));
              }
            } catch {
              // ignore
            }
          }
        }

        const houseNick = this.getHouseNickname(house.id);
        await HouseService.saveHouseMember({
          houseId: house.id,
          userId: user.id,
          displayName,
          nickname: houseNick,
          avatarUrl,
          role: role || 'member',
          joinedAt: new Date().toISOString(),
        });
      }
    } catch {
      // ignore
    }

    this.notifyAuthChange();
  },

  getCurrentUser(): UserProfile {
    this.init();

    // 1. Profilo in cache di memoria
    if (cachedUser) return cachedUser;

    // 2. Profilo in cache locale
    const storedCached = getStorageItem(AUTH_STORAGE_KEYS.CACHED_PROFILE);
    if (storedCached) {
      try {
        const parsed: UserProfile = JSON.parse(storedCached);
        if (parsed && parsed.id) {
          cachedUser = parsed;
          return parsed;
        }
      } catch {
        // ignore
      }
    }

    // 3. Profilo Guest locale
    let guestId = getStorageItem(AUTH_STORAGE_KEYS.GUEST_ID);
    if (!guestId) {
      guestId = generateGuestId();
      setStorageItem(AUTH_STORAGE_KEYS.GUEST_ID, guestId);
    }

    const savedName = getStorageItem(AUTH_STORAGE_KEYS.DISPLAY_NAME);
    const guestUser: UserProfile = {
      id: guestId,
      displayName: savedName?.trim() || 'Giocatore',
      isGoogleUser: false,
    };

    return guestUser;
  },

  isLoggedIn(): boolean {
    return this.getCurrentUser().isGoogleUser;
  },

  async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error:
          'Supabase non è ancora configurato con le credenziali Google. Segui le istruzioni nelle impostazioni per collegare Google Cloud.',
      };
    }

    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Inizializzazione Supabase fallita.' };
    }

    try {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const anonKey = getSupabaseAnonKey();
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl || undefined,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            ...(anonKey ? { apikey: anonKey } : {}),
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore imprevisto durante il login';
      return { success: false, error: msg };
    }
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.auth.signOut();
        } catch {
          // ignore
        }
      }
    }

    cachedUser = null;
    removeStorageItem(AUTH_STORAGE_KEYS.CACHED_PROFILE);
    this.notifyAuthChange();
  },

  async updateGlobalNickname(newNickname: string): Promise<void> {
    const clean = newNickname.trim();
    if (!clean) return;

    const current = this.getCurrentUser();
    current.displayName = clean;
    cachedUser = current;

    setStorageItem(AUTH_STORAGE_KEYS.DISPLAY_NAME, clean);
    setStorageItem(AUTH_STORAGE_KEYS.CACHED_PROFILE, JSON.stringify(current));

    // Aggiorna il displayName per questo utente in tutte le case note e nei rispettivi players
    try {
      const known = HouseService.getKnownHouses();
      for (const house of known) {
        const members = HouseService.getHouseMembers(house.id);
        let changed = false;
        for (const m of members) {
          if (m.userId === current.id) {
            m.displayName = clean;
            changed = true;
            HouseService.syncMemberToPlayer(m);
          }
        }
        if (changed) {
          setStorageItem(getHouseResourceKey(house.id, 'members'), JSON.stringify(members));
        }
      }
    } catch {
      // ignore
    }

    if (current.isGoogleUser && isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from('profiles').upsert({
            id: current.id,
            display_name: clean,
            email: current.email,
            avatar_url: current.avatarUrl || null,
            updated_at: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Errore aggiornamento profilo cloud:', e);
        }
      }
    }

    this.notifyAuthChange();
    HouseService.notifyUpdate();
  },

  getHouseNickname(houseId: string): string | undefined {
    if (!houseId) return undefined;
    const key = `carte_house_${houseId}_nickname`;
    const val = getStorageItem(key);
    return val?.trim() || undefined;
  },

  async updateHouseNickname(houseId: string, nickname: string): Promise<void> {
    if (!houseId) return;
    const clean = nickname.trim();
    const key = `carte_house_${houseId}_nickname`;

    if (clean) {
      setStorageItem(key, clean);
    } else {
      removeStorageItem(key);
    }

    const current = this.getCurrentUser();

    // Aggiorna o crea il record membro della casa con il nuovo soprannome preservando il ruolo
    try {
      const members = HouseService.getHouseMembers(houseId);
      const existing = members.find((m) => m.userId === current.id);
      if (existing) {
        existing.nickname = clean || undefined;
        existing.displayName = current.displayName;
        await HouseService.saveHouseMember(existing);
      } else {
        await HouseService.saveHouseMember({
          houseId,
          userId: current.id,
          displayName: current.displayName,
          nickname: clean || undefined,
          avatarUrl: current.avatarUrl,
          role: 'member',
          joinedAt: new Date().toISOString(),
        });
      }
    } catch {
      // ignore
    }

    this.notifyAuthChange();
    HouseService.notifyUpdate();
  },

  getEffectiveNickname(houseId?: string): string {
    if (houseId) {
      const houseNick = this.getHouseNickname(houseId);
      if (houseNick) return houseNick;
    }
    return this.getCurrentUser().displayName;
  },

  notifyAuthChange(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('carte_auth_change'));
    }
  },
};
