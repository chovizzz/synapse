import "@testing-library/jest-dom";
import { vi } from "vitest";

// jsdom 29+ removed in-memory localStorage; provide a simple Map-backed mock
class LocalStorageMock {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }
}

vi.stubGlobal("localStorage", new LocalStorageMock());
