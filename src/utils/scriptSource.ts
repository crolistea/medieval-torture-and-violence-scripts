import type { ScriptSource } from '../data/types'

/*
 * Helpers that read facts straight out of a script file.
 *
 * The site never keeps its own copy of a script. Each module imports the real
 * file from the repository root as text, and the numbers shown on the site
 * (size, settings) are read from that text, so they cannot go stale.
 */

/** Wraps raw file text. Line endings are normalised so every platform copies the same text. */
export function createScriptSource(filename: string, raw: string): ScriptSource {
  const code = raw.replace(/\r\n?/g, '\n').trimEnd() + '\n'
  const versionMatch = /^\s*\*\s*v(\d+\.\d+\.\d+)\s*$/m.exec(code)
  return {
    filename,
    code,
    version: versionMatch ? versionMatch[1] : null,
    lineCount: code.trimEnd().split('\n').length,
    byteSize: new TextEncoder().encode(code).length,
  }
}

/**
 * Reads a setting such as `MAX_TOKENS: 220` or `DEBUG:false` from the script.
 * Returns the fallback if the script no longer contains that setting.
 */
export function readSetting(script: ScriptSource, key: string, fallback = 'see script'): string {
  const match = new RegExp(`\\b${key}\\s*:\\s*(\\d+|true|false)\\b`).exec(script.code)
  return match ? match[1] : fallback
}

export function formatSize(bytes: number): string {
  return bytes < 1024 ? `${bytes} bytes` : `${Math.round(bytes / 1024)} KB`
}
