import { findInJson, parseJson } from './json.ts'
import { normalizeAll } from './normalize.ts'
import { FORMAT_LABELS, RipError, type RipEntry, type RipFormat, type RipResult } from './types.ts'

/*
 * The Ripper.
 *
 * Takes script or lorebook data the reader already has (an export, a script
 * file, pasted text) and returns it as one clean, consistent list of entries.
 * It works on text only: it never opens a network connection, never reads
 * cookies or tokens, and never talks to JanitorAI.
 */

export { RipError, FORMAT_LABELS }
export type { RipEntry, RipFormat, RipResult }

/** Removes a byte order mark and a surrounding ``` fence, which pasted text often has. */
function unwrap(input: string): string {
  const text = input.replace(/^﻿/, '').replace(/\r\n?/g, '\n').trim()
  const fence = /^```[\w-]*\n([\s\S]*?)\n?```$/.exec(text)
  return fence ? fence[1].trim() : text
}

function finish(format: RipFormat, source: Record<string, unknown>, entries: RipEntry[], warnings: string[]): RipResult {
  if (!entries.length) {
    throw new RipError('no-entries', 'Nothing usable was found: every item was empty or not an entry.', {
      hint: warnings.length ? warnings.slice(0, 3).join(' ') : undefined,
    })
  }
  return { format, formatLabel: FORMAT_LABELS[format], source, entries, warnings }
}

/**
 * Reads the input, works out what it is, and returns the entries.
 * Throws RipError when the input cannot be read; it never returns a guess.
 */
export function rip(input: string): RipResult {
  if (typeof input !== 'string' || !input.trim()) {
    throw new RipError('empty', 'There is nothing to read. Paste some text or choose a file first.')
  }

  const text = unwrap(input)
  const warnings: string[] = []

  const found = findInJson(parseJson(text))
  return finish(found.format, found.source, normalizeAll(found.entries, warnings), warnings)
}

/** The clean output, as text ready to save or copy. */
export function toCleanJson(result: RipResult): string {
  return JSON.stringify(
    { format: result.format, source: result.source, count: result.entries.length, entries: result.entries },
    null,
    2,
  )
}
