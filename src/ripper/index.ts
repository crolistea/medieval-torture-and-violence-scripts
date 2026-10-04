import { readJavascript, readLooseLiteral } from './javascript.ts'
import { findInJson, parseJson } from './json.ts'
import { looksLikeEntry, normalizeAll } from './normalize.ts'
import { looksLikePrompt, readPrompt, readText } from './text.ts'
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

  if (looksLikeJson(text)) return ripJson(text, warnings)
  if (LOOKS_LIKE_JAVASCRIPT.test(text)) return ripJavascript(text, {}, warnings)
  if (looksLikePrompt(text)) return ripPrompt(text, 'prompt-text', {}, warnings)
  return ripText(text, warnings)
}

const LOOKS_LIKE_JAVASCRIPT =
  /(?:^|\n)\s*(?:["']use (?:worker|strict)["']|(?:export\s+)?(?:const|let|var)\s+[\w$]+\s*=|function\s+[\w$]+\s*\(|module\.exports\s*=|export\s+default\b|context\.[\w.]+\s*\+?=)/

/** Starts like JSON, and is not just a [Heading] line at the top of some notes. */
function looksLikeJson(text: string): boolean {
  if (text[0] === '{') return true
  return text[0] === '[' && !/^\[[^\][{}"',]*[A-Za-z][^\][{}"',]*\]\s*\n/.test(text)
}

/*
 * An assembled prompt mixes the card, the persona, instructions and any
 * lorebook text. The tags say which section is which; nothing says which
 * loose paragraph is lore, so those are passed through unnamed and unsorted.
 */
function ripPrompt(text: string, format: RipFormat, source: Record<string, unknown>, warnings: string[]): RipResult {
  const read = readPrompt(text)
  if (read.loose) {
    warnings.push(`${read.loose} block${read.loose === 1 ? '' : 's'} of text sat outside any tag. They were split at blank lines and left unnamed, because the prompt does not say what they are.`)
  }
  return finish(format, source, normalizeAll(read.entries, warnings), warnings)
}

function ripText(text: string, warnings: string[]): RipResult {
  const read = readText(text)
  if (!read.structured) {
    warnings.push('No headings, Name: or Keys: lines, or --- separators were found, so each paragraph became one entry with no name and no keys.')
  }
  return finish('plain-text', {}, normalizeAll(read.entries, warnings), warnings)
}

function ripJson(text: string, warnings: string[]): RipResult {
  let value: unknown
  try {
    value = parseJson(text)
  } catch (error) {
    // JSON written the JavaScript way (single quotes, bare field names, a last comma) is still readable.
    let loose
    try {
      loose = readLooseLiteral(text)
    } catch {
      loose = null
    }
    // Still unreadable: report it as the JSON problem it is.
    if (!loose) throw error
    value = loose.value
    warnings.push('This is not strict JSON (single quotes, bare field names or a trailing comma). It was read as a JavaScript value.')
  }

  const found = findInJson(value)
  if (found.prompt !== undefined) return ripPrompt(found.prompt, found.format, found.source, warnings)
  if (found.javascript !== undefined) return ripJavascript(found.javascript, found.source, warnings, 'script-record-json')
  return finish(found.format, found.source, normalizeAll(found.entries, warnings), warnings)
}

function ripJavascript(text: string, source: Record<string, unknown>, warnings: string[], format: RipFormat = 'javascript'): RipResult {
  const read = readJavascript(text)
  warnings.push(...read.warnings)

  if (!read.lists.length) {
    throw new RipError('no-entries', 'This is JavaScript, but no list of entries was found in it.', {
      hint: read.variables.length
        ? `Variables seen: ${read.variables.slice(0, 12).join(', ')}${read.variables.length > 12 ? ', ...' : ''}. None of them is a list of objects with fields such as "name", "keys" or "content".`
        : 'Expected something like: const entries = [{ keys: [...], content: "..." }]',
    })
  }

  const entries: RipEntry[] = []
  for (const list of read.lists) {
    const before = entries.length
    for (const entry of normalizeAll(list.entries.filter(looksLikeEntry), warnings)) {
      entry.index = entries.length + 1
      // With several lists in one script, the variable name is the only thing that tells them apart.
      if (read.lists.length > 1 && list.variable && entry.category === null) {
        entry.category = list.variable
        entry.inferred.push('category')
      }
      entries.push(entry)
    }
    const dropped = list.entries.length - (entries.length - before)
    if (dropped) warnings.push(`${dropped} item${dropped === 1 ? '' : 's'} in ${list.variable ?? `the list at line ${list.line}`} did not look like entries and were skipped.`)
  }

  return finish(
    format,
    {
      ...source,
      lists: read.lists.map((list) => ({ variable: list.variable, line: list.line, entries: list.entries.length })),
      ...(read.settings ? { settings: read.settings } : {}),
    },
    entries,
    warnings,
  )
}

/** The clean output, as text ready to save or copy. */
export function toCleanJson(result: RipResult): string {
  return JSON.stringify(
    { format: result.format, source: result.source, count: result.entries.length, entries: result.entries },
    null,
    2,
  )
}
