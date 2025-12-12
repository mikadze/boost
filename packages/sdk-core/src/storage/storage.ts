import type { StorageAdapter } from '../types.js';

/**
 * LocalStorage adapter with automatic JSON serialization
 */
class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly prefix: string) {}

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (item === null) return null;
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch {
      // Storage quota exceeded or unavailable - silently fail
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch {
      // Ignore errors
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // Ignore errors
    }
  }
}

/**
 * In-memory storage fallback for environments without localStorage
 */
class MemoryStorageAdapter implements StorageAdapter {
  private readonly store = new Map<string, string>();

  constructor(private readonly prefix: string) {}

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  get<T>(key: string): T | null {
    const item = this.store.get(this.getKey(key));
    if (item === undefined) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    this.store.set(this.getKey(key), JSON.stringify(value));
  }

  remove(key: string): void {
    this.store.delete(this.getKey(key));
  }

  clear(): void {
    const keysToDelete: string[] = [];
    for (const key of this.store.keys()) {
      if (key.startsWith(this.prefix)) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      this.store.delete(key);
    }
  }
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__gamify_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create appropriate storage adapter based on environment
 */
export function createStorage(prefix: string): StorageAdapter {
  if (typeof window !== 'undefined' && isLocalStorageAvailable()) {
    return new LocalStorageAdapter(prefix);
  }
  return new MemoryStorageAdapter(prefix);
}
