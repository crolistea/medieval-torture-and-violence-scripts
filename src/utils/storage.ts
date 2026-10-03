/*
 * localStorage can throw (private windows, blocked site data), so every call
 * is guarded. The site works without it; progress just is not remembered.
 */

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Nothing to do: storage is unavailable.
  }
}
