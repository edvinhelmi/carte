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
}
