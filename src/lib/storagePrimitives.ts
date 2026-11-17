// Storage primitives with shared in-memory fallback for Node/tests/SSR

export const memoryStore: Record<string, string> = {};

export function getStoredItem(key: string): string | null {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem(key);
    } catch {
      return memoryStore[key] ?? null;
    }
  }
  return memoryStore[key] ?? null;
}

export function setStoredItem(key: string, value: string): void {
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

export function removeStoredItem(key: string): void {
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

export function clearMemoryStore(): void {
  for (const k of Object.keys(memoryStore)) {
    delete memoryStore[k];
  }
  for (const k of Object.keys(localMutationTimestamps)) {
    delete localMutationTimestamps[k];
  }
}

// Track recent local mutations so in-flight background polls never overwrite an action just taken by the user
const localMutationTimestamps: Record<string, number> = {};

export function markLocalMutation(id: string): void {
  if (!id) return;
  localMutationTimestamps[id] = Date.now();
}

export function isRecentlyMutatedLocally(id: string, windowMs = 6000): boolean {
  if (!id) return false;
  const ts = localMutationTimestamps[id];
  if (!ts) return false;
  return Date.now() - ts < windowMs;
}

// Tombstone tracking per house so deleted items are never resurrected by peer sync or in-flight polls
function getDeletedKey(houseId: string): string {
  const safeId = (houseId || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'casa_none';
  return `carte_house_${safeId}_deleted_ids`;
}

const DEFAULT_IGNORED_IDS = ['test_sync_check', 'p_mem_guest_vjiaxx1'];

export function getDeletedIds(houseId: string): string[] {
  if (!houseId) return [...DEFAULT_IGNORED_IDS];
  const raw = getStoredItem(getDeletedKey(houseId));
  let list: string[] = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed.filter((x) => typeof x === 'string');
    } catch {
      list = [];
    }
  }
  for (const defId of DEFAULT_IGNORED_IDS) {
    if (!list.includes(defId)) list.push(defId);
  }
  return list;
}

export function markIdDeleted(houseId: string, id: string): void {
  if (!houseId || !id) return;
  const current = getDeletedIds(houseId);
  if (!current.includes(id)) {
    current.push(id);
    const trimmed = current.slice(-500);
    setStoredItem(getDeletedKey(houseId), JSON.stringify(trimmed));
  }
}

export function mergeDeletedIds(houseId: string, incomingIds?: string[]): Set<string> {
  const current = getDeletedIds(houseId);
  const set = new Set<string>(current);
  let changed = false;
  if (Array.isArray(incomingIds)) {
    for (const id of incomingIds) {
      if (typeof id === 'string' && id && !set.has(id)) {
        set.add(id);
        changed = true;
      }
    }
  }
  if (changed && houseId) {
    const arr = Array.from(set).slice(-500);
    setStoredItem(getDeletedKey(houseId), JSON.stringify(arr));
  }
  return set;
}
