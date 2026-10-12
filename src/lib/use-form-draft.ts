"use client";

import { useSyncExternalStore, useCallback } from "react";

export type DraftValue = string | boolean | number;
export type DraftState = Record<string, DraftValue>;

// In-memory cache to prevent reference churn during snapshot checks
const memoryCache: Record<string, { raw: string | null; parsed: DraftState }> = {};
const listeners: Record<string, Set<() => void>> = {};

const EMPTY_DRAFT: DraftState = Object.freeze({});

function getSnapshot(key: string): DraftState {
  if (typeof window === "undefined") return EMPTY_DRAFT;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return EMPTY_DRAFT;
    if (!memoryCache[key] || memoryCache[key].raw !== raw) {
      memoryCache[key] = {
        raw,
        parsed: JSON.parse(raw),
      };
    }
    return memoryCache[key].parsed;
  } catch {
    return EMPTY_DRAFT;
  }
}

function getServerSnapshot(): DraftState {
  return EMPTY_DRAFT;
}

function subscribe(key: string, callback: () => void): () => void {
  if (!listeners[key]) {
    listeners[key] = new Set();
  }
  listeners[key].add(callback);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === key) {
      callback();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    listeners[key]?.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function notify(key: string) {
  listeners[key]?.forEach((cb) => cb());
}

export function useFormDraft(storageKey: string) {
  const subscribeKey = useCallback(
    (callback: () => void) => subscribe(storageKey, callback),
    [storageKey]
  );
  const getSnapshotKey = useCallback(() => getSnapshot(storageKey), [storageKey]);

  const draft = useSyncExternalStore(subscribeKey, getSnapshotKey, getServerSnapshot);

  const updateDraft = useCallback(
    (key: string, val: DraftValue) => {
      try {
        if (typeof window !== "undefined") {
          const current = getSnapshot(storageKey);
          const next = { ...current, [key]: val };
          localStorage.setItem(storageKey, JSON.stringify(next));
          notify(storageKey);
        }
      } catch {
        // Ignore storage errors
      }
    },
    [storageKey]
  );

  const clearDraft = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(storageKey);
        notify(storageKey);
      }
    } catch {
      // Ignore storage errors
    }
  }, [storageKey]);

  const getDraftVal = useCallback(
    <T extends DraftValue>(key: string, fallback: T): T => {
      const val = draft[key];
      if (val !== undefined && val !== null) {
        return val as T;
      }
      return fallback;
    },
    [draft]
  );

  return {
    draft,
    updateDraft,
    clearDraft,
    getDraftVal,
  };
}
