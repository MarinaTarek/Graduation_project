import { useEffect, useSyncExternalStore } from 'react'

export const MOCK_STORE_VERSION = 1
export const MOCK_STORAGE_PREFIX = 'navigen_mock_v1:'

export type MockStore<T> = {
  get: () => T
  set: (value: T) => void
  update: (fn: (current: T) => T) => void
  subscribe: (listener: () => void) => () => void
  hydrate: () => void
  getSnapshot: () => T
  getServerSnapshot: () => T
  reset: () => void
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

const registry: MockStore<unknown>[] = []

function persist<T>(key: string, data: T) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      MOCK_STORAGE_PREFIX + key,
      JSON.stringify({ version: MOCK_STORE_VERSION, data }),
    )
  } catch {
    /* private mode / quota */
  }
}

export function createStore<T>(key: string, seed: T): MockStore<T> {
  const serverSnapshot = clone(seed)
  let snapshot = clone(seed)
  let hydrated = false
  const listeners = new Set<() => void>()

  const emit = () => {
    listeners.forEach((l) => l())
  }

  const hydrate = () => {
    if (typeof window === 'undefined' || hydrated) return
    hydrated = true
    try {
      const raw = localStorage.getItem(MOCK_STORAGE_PREFIX + key)
      if (!raw) {
        persist(key, snapshot)
        return
      }
      const parsed = JSON.parse(raw) as { version?: number; data?: T }
      if (parsed?.version !== MOCK_STORE_VERSION || parsed.data === undefined) {
        snapshot = clone(seed)
        persist(key, snapshot)
        emit()
        return
      }
      snapshot = parsed.data
      emit()
    } catch {
      snapshot = clone(seed)
    }
  }

  const store: MockStore<T> = {
    get: () => {
      if (typeof window !== 'undefined') hydrate()
      return snapshot
    },
    set: (value) => {
      snapshot = value
      persist(key, snapshot)
      emit()
    },
    update: (fn) => {
      store.set(fn(store.get()))
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    hydrate,
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
    reset: () => {
      hydrated = true
      snapshot = clone(seed)
      emit()
    },
  }

  registry.push(store as MockStore<unknown>)
  return store
}

export function useStore<T>(store: MockStore<T>): T {
  const value = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)
  useEffect(() => {
    store.hydrate()
  }, [store])
  return value
}

export function clearMockStorage() {
  if (typeof window === 'undefined') return
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(MOCK_STORAGE_PREFIX)) keys.push(k)
    }
    keys.forEach((k) => localStorage.removeItem(k))
  } catch {
    /* ignore */
  }
}

export function resetDemoData() {
  clearMockStorage()
  registry.forEach((s) => s.reset())
  if (typeof window !== 'undefined') window.location.reload()
}
