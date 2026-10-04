import { isRecord, looksLikeEntry } from './normalize.ts'
import { RipError, type RipFormat } from './types.ts'

/*
 * JSON input: exports and saved records.
 *
 * The job here is only to find where the entries are and what kind of file
 * this is. Turning each entry into a RipEntry happens in normalize.ts.
 */

type Raw = Record<string, unknown>

export interface Found {
  format: RipFormat
  /** Facts about the book as a whole. */
  source: Raw
  entries: unknown[]
  /** Set instead of `entries` when the lorebook is JavaScript source inside a script record. */
  javascript?: string
  /** Set instead of `entries` when this is a chat request; holds the system prompt text. */
  prompt?: string
}

/** Where in the text a character offset falls, 1-based. */
export function lineAndColumn(input: string, offset: number): { line: number; column: number } {
  const before = input.slice(0, Math.max(0, offset))
  const line = before.split('\n').length
  return { line, column: before.length - before.lastIndexOf('\n') }
}

/*
 * Browsers word JSON errors differently and often leave out the position, so
 * this walks the text itself and returns the offset of the first thing that
 * is not JSON, with a short reason.
 */
function firstJsonProblem(input: string): { offset: number; reason: string } {
  let at = 0
  const fail = (reason: string) => ({ offset: Math.min(at, input.length), reason })
  const space = () => {
    while (/\s/.test(input[at] ?? '')) at++
  }

  function value(): string | null {
    space()
    const char = input[at]
    if (char === undefined) return 'The text ends too early'
    if (char === '{' || char === '[') {
      const close = char === '{' ? '}' : ']'
      at++
      space()
      if (input[at] === close) {
        at++
        return null
      }
      for (;;) {
        if (char === '{') {
          space()
          if (input[at] !== '"') return input[at] === close ? 'There is a comma with nothing after it' : 'Expected a field name in double quotes'
          const key = string()
          if (key) return key
          space()
          if (input[at] !== ':') return 'Expected ":" after the field name'
          at++
        } else {
          space()
          if (input[at] === close) return 'There is a comma with nothing after it'
        }
        const inner = value()
        if (inner) return inner
        space()
        if (input[at] === ',') at++
        else if (input[at] === close) {
          at++
          return null
        }
        else if (input[at] === undefined) return `The text ends before "${close}"`
        else return `Expected "," or "${close}"`
      }
    }
    if (char === '"') return string()
    const literal = /^(?:-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)/.exec(input.slice(at, at + 40))
    if (!literal) return char === "'" ? 'Text must use double quotes, not single quotes' : `Unexpected "${char}"`
    at += literal[0].length
    return null
  }

  function string(): string | null {
    const start = at++
    while (at < input.length && input[at] !== '"') {
      if (input[at] === '\n') {
        at = start
        return 'This quote is never closed on its line'
      }
      at += input[at] === '\\' ? 2 : 1
    }
    if (at >= input.length) {
      at = start
      return 'This quote is never closed'
    }
    at++
    return null
  }

  const reason = value()
  if (reason) return fail(reason)
  space()
  return fail(at < input.length ? 'There is extra text after the end of the JSON' : 'The JSON could not be read')
}

/** JSON.parse with an error that says where the problem is. */
export function parseJson(input: string): unknown {
  try {
    return JSON.parse(input)
  } catch {
    const problem = firstJsonProblem(input)
    const where = lineAndColumn(input, problem.offset)
    throw new RipError('bad-json', `This is not valid JSON. ${problem.reason} (line ${where.line}, column ${where.column}).`, {
      ...where,
      hint: 'Check for a missing comma, a trailing comma, or a quote that was never closed. If the file was cut off, export it again.',
    })
  }
}

/** Top-level fields that describe the book, not an entry. Only simple values are kept. */
function describe(value: Raw, skip: string[]): Raw {
  const source: Raw = {}
  for (const [field, item] of Object.entries(value)) {
    if (skip.includes(field)) continue
    if (typeof item === 'string' ? item.trim() : typeof item === 'number' || typeof item === 'boolean') source[field] = item
  }
  return source
}

/** An `entries` field is a list in some tools and a map keyed by id in others. */
function entryList(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value
  if (isRecord(value) && Object.values(value).every(isRecord)) return Object.values(value)
  return null
}

const LIST_FIELDS = ['entries', 'lorebook', 'lore', 'loreEntries', 'items', 'data']

export function findInJson(value: unknown): Found {
  if (Array.isArray(value)) {
    if (!value.length) {
      throw new RipError('no-entries', 'The JSON is an empty list. There are no entries in it.')
    }
    // A list of saved scripts: open each one and join what is inside.
    if (value.every((item) => isRecord(item) && typeof item.script === 'string')) {
      const found = value.map((item) => findInJson(item))
      const javascript = found.map((item) => item.javascript ?? '').filter(Boolean).join('\n\n')
      return {
        format: 'script-record-json',
        source: { scripts: found.map((item) => item.source) },
        entries: found.flatMap((item) => item.entries),
        ...(javascript ? { javascript } : {}),
      }
    }
    if (!value.some(isRecord)) {
      throw new RipError('no-entries', 'The JSON is a list, but the items in it are not entry objects.', {
        hint: 'A lorebook export is a list of objects, each with fields such as "keys" and "content".',
      })
    }
    return { format: 'lorebook-json', source: {}, entries: value }
  }

  if (!isRecord(value)) {
    throw new RipError('no-entries', `The JSON holds a single ${value === null ? 'null' : typeof value}, not a lorebook.`)
  }

  // A chat request, such as the Scraper prints: the prompt is in the messages.
  if (Array.isArray(value.messages)) {
    const system = value.messages.filter((message) => isRecord(message) && message.role === 'system' && typeof message.content === 'string')
    if (!system.length) {
      throw new RipError('no-entries', 'This looks like a chat request, but it has no system message to read.', {
        hint: 'The assembled prompt is the message with "role": "system".',
      })
    }
    return {
      format: 'chat-payload-json',
      source: describe(value, ['messages']),
      entries: [],
      prompt: system.map((message) => (message as Raw).content as string).join('\n\n'),
    }
  }

  // A saved script: the lorebook is a string inside `script`.
  if (typeof value.script === 'string') {
    const source = describe(value, ['script'])
    const inner = value.script.trim()
    if (!inner) throw new RipError('no-entries', 'This script record is empty: its "script" field has nothing in it.')
    let parsed: unknown
    try {
      parsed = JSON.parse(inner)
    } catch {
      return { format: 'script-record-json', source, entries: [], javascript: inner }
    }
    const found = findInJson(parsed)
    return { ...found, format: 'script-record-json', source: { ...found.source, ...source } }
  }

  // A character card with a lorebook inside.
  const card = isRecord(value.data) && isRecord(value.data.character_book) ? value.data : isRecord(value.character_book) ? value : null
  if (card) {
    const book = card.character_book as Raw
    const entries = entryList(book.entries)
    if (!entries) throw new RipError('no-entries', 'The character card has a "character_book", but no entries inside it.')
    const source = describe(book, ['entries'])
    if (typeof card.name === 'string' && card.name.trim()) source.character = card.name
    return { format: 'character-card-json', source, entries }
  }

  for (const field of LIST_FIELDS) {
    const entries = entryList(value[field])
    if (entries && entries.some(isRecord)) {
      return { format: field === 'entries' ? 'worldinfo-json' : 'lorebook-json', source: describe(value, [field]), entries }
    }
  }

  // A map of name -> entry.
  const values = Object.values(value)
  if (values.length > 1 && values.every(looksLikeEntry)) {
    return { format: 'lorebook-json', source: {}, entries: values }
  }

  if (looksLikeEntry(value)) return { format: 'lorebook-json', source: {}, entries: [value] }

  const fields = Object.keys(value)
  throw new RipError('no-entries', 'This is valid JSON, but no lorebook entries were found in it.', {
    hint: fields.length
      ? `Its top-level fields are: ${fields.slice(0, 12).join(', ')}${fields.length > 12 ? ', ...' : ''}. Expected a list of entries, or an object with "entries".`
      : 'The object is empty.',
  })
}
