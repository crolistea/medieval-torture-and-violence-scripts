/*
 * The Ripper: shared types.
 *
 * Everything the ripper reads ends up as a list of RipEntry. A field that the
 * source did not contain is null (or an empty list), never a made-up value.
 * The only exception is listed by name in `inferred`.
 *
 * These files are plain erasable TypeScript with no browser or Node APIs, so
 * the site, the command line tool and the tests all run the same code.
 */

export type RipFormat =
  /** A JSON array of lorebook entries, the shape JanitorAI exports. */
  | 'lorebook-json'
  /** A JSON object with an `entries` list or map, the World Info shape. */
  | 'worldinfo-json'
  /** A character card with a `character_book` inside it. */
  | 'character-card-json'
  /** A saved JanitorAI script record whose `script` field holds the lorebook. */
  | 'script-record-json'
  /** A chat request with a `messages` list, as printed by the Scraper. */
  | 'chat-payload-json'
  /** JavaScript source of a script or advanced lorebook. */
  | 'javascript'
  /** Pasted prompt text made of <Tag>...</Tag> sections. */
  | 'prompt-text'
  /** Pasted notes: blocks of text, optionally with Name: / Keys: lines. */
  | 'plain-text'

/** Where and when an entry is inserted. Only fields found in the source are set. */
export interface RipInsertion {
  position?: string | number
  depth?: number
  probability?: number
  selective?: boolean
  selectiveLogic?: string | number
  caseSensitive?: boolean
  matchWholeWords?: boolean
  scanDepth?: number
}

export interface RipEntry {
  /** 1-based position in the output. */
  index: number
  name: string | null
  content: string
  /** Primary trigger words. */
  keys: string[]
  secondaryKeys: string[]
  order: number | null
  priority: number | null
  category: string | null
  comment: string | null
  enabled: boolean | null
  constant: boolean | null
  insertion: RipInsertion
  /** Any other field the source had, copied as it was. */
  extra: Record<string, unknown>
  /** Names of fields above that were guessed instead of read. Usually empty. */
  inferred: string[]
}

export interface RipResult {
  format: RipFormat
  /** The format in plain words, for the page. */
  formatLabel: string
  /** Facts about the whole book or script, when the source had them. */
  source: Record<string, unknown>
  entries: RipEntry[]
  /** Things that were skipped or looked odd. Not fatal. */
  warnings: string[]
}

export type RipErrorCode = 'empty' | 'bad-json' | 'bad-javascript' | 'no-entries'

/** A failure the reader can act on: what went wrong and, when known, where. */
export class RipError extends Error {
  code: RipErrorCode
  hint: string | null
  line: number | null
  column: number | null

  constructor(code: RipErrorCode, message: string, detail: { hint?: string; line?: number; column?: number } = {}) {
    super(message)
    this.name = 'RipError'
    this.code = code
    this.hint = detail.hint ?? null
    this.line = detail.line ?? null
    this.column = detail.column ?? null
  }
}

export const FORMAT_LABELS: Record<RipFormat, string> = {
  'lorebook-json': 'Lorebook JSON (list of entries)',
  'worldinfo-json': 'World Info JSON',
  'character-card-json': 'Character card with a lorebook',
  'script-record-json': 'JanitorAI script record',
  'chat-payload-json': 'Chat request (assembled prompt)',
  javascript: 'JavaScript source',
  'prompt-text': 'Prompt text with tagged sections',
  'plain-text': 'Plain text',
}
