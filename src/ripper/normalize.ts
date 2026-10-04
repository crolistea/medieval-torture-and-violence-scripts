import type { RipEntry, RipInsertion } from './types.ts'

/*
 * Turns one loosely shaped entry object into a RipEntry.
 *
 * Lorebooks from different tools name the same thing differently (`key`,
 * `keys`, `keywords`, `keysRaw`...). Each field below lists the names it is
 * read from, first match wins. Whatever is left over goes into `extra`
 * unchanged, so nothing the source had is lost.
 */

type Raw = Record<string, unknown>

const NAME_FIELDS = ['name', 'title', 'label']
const COMMENT_FIELDS = ['comment', 'memo', 'note', 'notes']
const CONTENT_FIELDS = ['content', 'text', 'entry', 'body', 'value', 'description', 'desc', 'line', 'summary']
const KEY_FIELDS = ['keys', 'key', 'keywords', 'keysRaw', 'triggers', 'primary_keys', 'aliases', 'terms']
const SECONDARY_FIELDS = ['secondaryKeys', 'secondary_keys', 'keysecondary', 'keySecondary', 'secondaryKeywords']
const ORDER_FIELDS = ['order', 'insertion_order', 'insertionOrder']
const PRIORITY_FIELDS = ['priority']
const CATEGORY_FIELDS = ['category', 'group', 'type']
/** Used as content only when no content field exists, each under its own label. */
const FALLBACK_CONTENT_FIELDS = ['personality', 'scenario']

const INSERTION_FIELDS: Array<[keyof RipInsertion, string[], 'number' | 'boolean' | 'any']> = [
  ['position', ['position'], 'any'],
  ['depth', ['depth'], 'number'],
  ['probability', ['probability'], 'number'],
  ['selective', ['selective'], 'boolean'],
  ['selectiveLogic', ['selectiveLogic', 'selective_logic'], 'any'],
  ['caseSensitive', ['caseSensitive', 'case_sensitive'], 'boolean'],
  ['matchWholeWords', ['matchWholeWords', 'match_whole_words'], 'boolean'],
  ['scanDepth', ['scanDepth', 'scan_depth'], 'number'],
]

export function isRecord(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return null
}

function number(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value)
  return null
}

function boolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

/** Positions and logic modes are a number in some tools and a word in others. Keep either. */
function positionValue(value: unknown): string | number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

/** Accepts a list, or one comma separated string. Drops blanks and repeats. */
export function toList(value: unknown): string[] {
  const parts = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []
  const seen = new Set<string>()
  const list: string[] = []
  for (const part of parts) {
    const item = text(part)
    if (item === null || seen.has(item)) continue
    seen.add(item)
    list.push(item)
  }
  return list
}

/** Reads the first field that is present and usable, and marks it as used. */
function take<T>(raw: Raw, fields: string[], read: (value: unknown) => T | null, used: Set<string>): T | null {
  for (const field of fields) {
    if (!(field in raw)) continue
    const value = read(raw[field])
    if (value === null) continue
    used.add(field)
    return value
  }
  return null
}

function takeList(raw: Raw, fields: string[], used: Set<string>): string[] {
  const list: string[] = []
  for (const field of fields) {
    const value = raw[field]
    if (!Array.isArray(value) && typeof value !== 'string') continue
    used.add(field)
    for (const item of toList(value)) if (!list.includes(item)) list.push(item)
  }
  return list
}

/** True when the object has something an entry would have. */
export function looksLikeEntry(value: unknown): value is Raw {
  if (!isRecord(value)) return false
  const hasContent = [...CONTENT_FIELDS, ...FALLBACK_CONTENT_FIELDS].some((field) => typeof value[field] === 'string')
  const hasKeys = KEY_FIELDS.some((field) => Array.isArray(value[field]) || typeof value[field] === 'string')
  const hasName = NAME_FIELDS.some((field) => typeof value[field] === 'string')
  return hasContent || (hasKeys && hasName)
}

export function normalizeEntry(raw: Raw, index: number): RipEntry {
  const used = new Set<string>()

  const name = take(raw, NAME_FIELDS, text, used)
  const comment = take(raw, COMMENT_FIELDS, text, used)

  let content = take(raw, CONTENT_FIELDS, text, used)
  if (content === null) {
    const parts: string[] = []
    for (const field of FALLBACK_CONTENT_FIELDS) {
      const part = text(raw[field])
      if (part === null) continue
      used.add(field)
      parts.push(`${field}: ${part}`)
    }
    content = parts.join('\n\n') || null
  }

  const enabled = take(raw, ['enabled'], boolean, used)
  const disabled = take(raw, ['disable', 'disabled'], boolean, used)

  const insertion: RipInsertion = {}
  for (const [target, fields, kind] of INSERTION_FIELDS) {
    const read: (value: unknown) => unknown = kind === 'number' ? number : kind === 'boolean' ? boolean : positionValue
    const value = take(raw, fields, read, used)
    if (value !== null) (insertion as Record<string, unknown>)[target] = value
  }

  const entry: RipEntry = {
    index,
    name,
    content: content ?? '',
    keys: takeList(raw, KEY_FIELDS, used),
    secondaryKeys: takeList(raw, SECONDARY_FIELDS, used),
    order: take(raw, ORDER_FIELDS, number, used),
    priority: take(raw, PRIORITY_FIELDS, number, used),
    category: take(raw, CATEGORY_FIELDS, text, used),
    comment,
    enabled: enabled ?? (disabled === null ? null : !disabled),
    constant: take(raw, ['constant'], boolean, used),
    insertion,
    extra: {},
    inferred: [],
  }

  for (const [field, value] of Object.entries(raw)) {
    if (used.has(field) || value === undefined) continue
    entry.extra[field] = value
  }

  return entry
}

/**
 * Normalizes a list of raw values. Things that are not entries, and entries
 * with nothing in them, are skipped and reported instead of passed through.
 */
export function normalizeAll(list: unknown[], warnings: string[]): RipEntry[] {
  const entries: RipEntry[] = []
  list.forEach((raw, position) => {
    if (!isRecord(raw)) {
      warnings.push(`Item ${position + 1} is not an entry object and was skipped.`)
      return
    }
    const entry = normalizeEntry(raw, entries.length + 1)
    if (!entry.content && !entry.keys.length && !entry.name) {
      warnings.push(`Item ${position + 1} has no name, keys or content and was skipped.`)
      return
    }
    if (!entry.content) warnings.push(`Entry ${entry.index}${entry.name ? ` (${entry.name})` : ''} has no content.`)
    entries.push(entry)
  })
  return entries
}
