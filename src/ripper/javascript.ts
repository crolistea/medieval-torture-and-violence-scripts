import { findInJson, lineAndColumn } from './json.ts'
import { isRecord, looksLikeEntry } from './normalize.ts'
import { RipError } from './types.ts'

/*
 * JavaScript input: a script file or an advanced lorebook written as code.
 *
 * The source is READ, never run. There is no eval and no Function here. A
 * small reader understands literal values (objects, lists, text, numbers) and
 * skips anything that would need running code to know. A field that was
 * skipped is reported, not guessed.
 */

type Raw = Record<string, unknown>

/** Thrown inside the reader when the text at this point is not a plain literal. */
class NotLiteral extends Error {}

const IDENTIFIER = /^[A-Za-z_$][\w$]*/
const REGEX_MAY_FOLLOW = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^'])

export interface FoundList {
  /** The variable the list was assigned to, when there was one. */
  variable: string | null
  line: number
  entries: unknown[]
}

export interface JavascriptRead {
  lists: FoundList[]
  /** A flat CONFIG / SETTINGS object, when the script has one. */
  settings: Raw | null
  /** Every top-level variable that was seen, for error messages. */
  variables: string[]
  warnings: string[]
}

function problem(source: string, offset: number, message: string): RipError {
  const where = lineAndColumn(source, offset)
  return new RipError('bad-javascript', `${message} (line ${where.line}, column ${where.column}).`, {
    ...where,
    hint: 'The JavaScript looks cut off or broken at that point. Copy the whole script again and retry.',
  })
}

/**
 * Finds the end of the string, template, comment or regular expression that
 * starts at `at`. Returns `at` itself when nothing of that kind starts there.
 */
function endOfNonCode(source: string, at: number, previous: string): number {
  const char = source[at]
  const next = source[at + 1]

  if (char === '/' && next === '/') {
    const end = source.indexOf('\n', at)
    return end === -1 ? source.length : end
  }

  if (char === '/' && next === '*') {
    const end = source.indexOf('*/', at + 2)
    if (end === -1) throw problem(source, at, 'A /* comment is never closed')
    return end + 2
  }

  if (char === '"' || char === "'") {
    let i = at + 1
    while (i < source.length && source[i] !== char) {
      if (source[i] === '\n') throw problem(source, at, 'A quote is never closed')
      i += source[i] === '\\' ? 2 : 1
    }
    if (i >= source.length) throw problem(source, at, 'A quote is never closed')
    return i + 1
  }

  if (char === '`') {
    let i = at + 1
    while (i < source.length && source[i] !== '`') {
      if (source[i] === '\\') i += 2
      else if (source[i] === '$' && source[i + 1] === '{') i = endOfBrackets(source, i + 1)
      else i++
    }
    if (i >= source.length) throw problem(source, at, 'A ` template is never closed')
    return i + 1
  }

  if (char === '/' && (previous === '' || REGEX_MAY_FOLLOW.has(previous))) {
    let i = at + 1
    let inClass = false
    while (i < source.length && source[i] !== '\n') {
      if (source[i] === '\\') i++
      else if (source[i] === '[') inClass = true
      else if (source[i] === ']') inClass = false
      else if (source[i] === '/' && !inClass) {
        i++
        while (/[a-z]/i.test(source[i] ?? '')) i++
        return i
      }
      i++
    }
  }

  return at
}

const CLOSER: Record<string, string> = { '{': '}', '[': ']', '(': ')' }

/** Given the offset of an opening bracket, returns the offset just past its partner. */
function endOfBrackets(source: string, open: number): number {
  const stack = [CLOSER[source[open]]]
  let previous = source[open]
  let i = open + 1
  while (i < source.length) {
    const skip = endOfNonCode(source, i, previous)
    if (skip !== i) {
      i = skip
      previous = '"'
      continue
    }
    const char = source[i]
    if (CLOSER[char]) stack.push(CLOSER[char])
    else if (char === '}' || char === ']' || char === ')') {
      if (stack.pop() !== char) throw problem(source, i, `Unexpected "${char}"`)
      if (!stack.length) return i + 1
    }
    if (!/\s/.test(char)) previous = char
    i++
  }
  throw problem(source, open, `"${source[open]}" is never closed`)
}

/** Reads literal values out of source text. */
function createReader(source: string, bindings: Map<string, unknown>) {
  let at = 0
  /** What the current read had to leave out. Starts empty for every read. */
  let skipped = new Set<string>()

  function trivia() {
    for (;;) {
      while (/\s/.test(source[at] ?? '')) at++
      if (source[at] === '/' && (source[at + 1] === '/' || source[at + 1] === '*')) at = endOfNonCode(source, at, '')
      else return
    }
  }

  /** Moves past one expression that is not a literal: up to the next , ) ] } or ; at this level. */
  function skipExpression() {
    let previous = ''
    while (at < source.length) {
      const skip = endOfNonCode(source, at, previous)
      if (skip !== at) {
        at = skip
        previous = '"'
        continue
      }
      const char = source[at]
      if (CLOSER[char]) {
        at = endOfBrackets(source, at)
        previous = ')'
        continue
      }
      if (char === ',' || char === ')' || char === ']' || char === '}' || char === ';') return
      if (!/\s/.test(char)) previous = char
      at++
    }
  }

  function quoted(): string {
    const quote = source[at]
    const end = endOfNonCode(source, at, '')
    const raw = source.slice(at + 1, end - 1)
    at = end
    const text = raw.replace(/\\(?:u\{([0-9a-fA-F]+)\}|u([0-9a-fA-F]{4})|x([0-9a-fA-F]{2})|\n|([\s\S]))/g, (_, long, unicode, hex, single) => {
      if (long || unicode || hex) return String.fromCodePoint(parseInt(long || unicode || hex, 16))
      if (single === undefined) return ''
      return ({ n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' } as Record<string, string>)[single] ?? single
    })
    if (quote === '`' && /\$\{/.test(raw)) skipped.add('a ${...} placeholder inside a template (kept as written)')
    return text
  }

  function object(): Raw {
    const result: Raw = {}
    at++
    for (;;) {
      trivia()
      if (source[at] === '}') {
        at++
        return result
      }
      if (at >= source.length) throw new NotLiteral()

      let key: string
      if (source[at] === '"' || source[at] === "'") key = quoted()
      else {
        const name = IDENTIFIER.exec(source.slice(at, at + 200)) ?? /^\d+/.exec(source.slice(at, at + 40))
        // Spread, computed keys and getters need running code.
        if (!name) throw new NotLiteral()
        key = name[0]
        at += key.length
      }

      trivia()
      if (source[at] === ':') {
        at++
        const start = at
        try {
          result[key] = value()
        } catch (error) {
          if (!(error instanceof NotLiteral)) throw error
          at = start
          skipExpression()
          skipped.add(`"${key}"`)
        }
      } else if ((source[at] === ',' || source[at] === '}') && bindings.has(key)) {
        // Shorthand: { keys } means { keys: keys }.
        result[key] = bindings.get(key)
      } else {
        // A method or an unknown shorthand.
        skipExpression()
        skipped.add(`"${key}"`)
      }

      trivia()
      if (source[at] === ',') at++
      else if (source[at] !== '}') throw new NotLiteral()
    }
  }

  function list(): unknown[] {
    const result: unknown[] = []
    at++
    for (;;) {
      trivia()
      if (source[at] === ']') {
        at++
        return result
      }
      if (at >= source.length) throw new NotLiteral()
      const start = at
      try {
        result.push(value())
      } catch (error) {
        if (!(error instanceof NotLiteral)) throw error
        at = start
        skipExpression()
        if (at === start) throw new NotLiteral()
        skipped.add('a list item made by code')
      }
      trivia()
      if (source[at] === ',') at++
      else if (source[at] !== ']') throw new NotLiteral()
    }
  }

  function primary(): unknown {
    trivia()
    const char = source[at]
    if (char === '{') return object()
    if (char === '[') return list()
    if (char === '"' || char === "'" || char === '`') return quoted()

    const rest = source.slice(at, at + 200)
    const numeric = /^[-+]?(?:0[xX][0-9a-fA-F]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?|\.\d+)/.exec(rest)
    if (numeric) {
      at += numeric[0].length
      return Number(numeric[0].replace(/_/g, ''))
    }

    const word = IDENTIFIER.exec(rest)
    if (!word) throw new NotLiteral()
    const after = source.slice(at + word[0].length).trimStart()[0]
    if (word[0] === 'true' || word[0] === 'false' || word[0] === 'null' || word[0] === 'undefined') {
      at += word[0].length
      return word[0] === 'true' ? true : word[0] === 'false' ? false : null
    }
    // A plain reference to a list or value defined earlier in the same script.
    if (bindings.has(word[0]) && after !== '(' && after !== '.' && after !== '[') {
      at += word[0].length
      return bindings.get(word[0])
    }
    throw new NotLiteral()
  }

  /** A literal, plus the few things written after one that do not need running code. */
  function value(): unknown {
    let result = primary()
    for (;;) {
      trivia()
      const rest = source.slice(at, at + 12)
      if (source[at] === '+' && source[at + 1] !== '+' && typeof result === 'string') {
        at++
        const right = primary()
        if (typeof right !== 'string' && typeof right !== 'number') throw new NotLiteral()
        result += String(right)
      } else if (/^\.join\s*\(/.test(rest) && Array.isArray(result) && result.every((item) => typeof item === 'string')) {
        at = source.indexOf('(', at) + 1
        trivia()
        const separator = source[at] === ')' ? ',' : primary()
        trivia()
        if (typeof separator !== 'string' || source[at] !== ')') throw new NotLiteral()
        at++
        result = result.join(separator)
      } else if (/^\.trim\s*\(\s*\)/.test(rest) && typeof result === 'string') {
        at = source.indexOf(')', at) + 1
        result = result.trim()
      } else {
        break
      }
    }
    trivia()
    const end = source[at]
    // Anything else after the literal (a call, an operator) means it is computed.
    if (end !== undefined && end !== ',' && end !== ')' && end !== ']' && end !== '}' && end !== ';' && !IDENTIFIER.test(end)) {
      throw new NotLiteral()
    }
    return result
  }

  return {
    readAt(offset: number): { value: unknown; end: number; skipped: Set<string> } | null {
      at = offset
      skipped = new Set()
      try {
        const result = value()
        return { value: result, end: at, skipped }
      } catch (error) {
        if (error instanceof NotLiteral) return null
        throw error
      }
    },
  }
}

/** A list is worth keeping when at least one item in it looks like an entry. */
function entriesIn(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value.some(looksLikeEntry) ? value : null
  if (!isRecord(value)) return null
  try {
    const found = findInJson(value)
    return found.entries.some(looksLikeEntry) ? found.entries : null
  } catch {
    return null
  }
}

function isFlatSettings(value: unknown): value is Raw {
  if (!isRecord(value)) return false
  const values = Object.values(value)
  return values.length > 0 && values.every((item) => ['string', 'number', 'boolean'].includes(typeof item))
}

export function readJavascript(source: string): JavascriptRead {
  const bindings = new Map<string, unknown>()
  const skipped = new Set<string>()
  const reader = createReader(source, bindings)

  const lists: FoundList[] = []
  const variables: string[] = []
  let settings: Raw | null = null

  const lineOf = (offset: number) => lineAndColumn(source, offset).line

  let at = 0
  let previous = ''
  while (at < source.length) {
    const skip = endOfNonCode(source, at, previous)
    if (skip !== at) {
      at = skip
      previous = '"'
      continue
    }

    const char = source[at]

    // const NAME = <literal>
    const declared = char === 'c' || char === 'l' || char === 'v' ? /^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*/.exec(source.slice(at, at + 300)) : null
    if (declared && !/[\w$.]/.test(source[at - 1] ?? '')) {
      const name = declared[1]
      variables.push(name)
      const read = reader.readAt(at + declared[0].length)
      if (read) {
        bindings.set(name, read.value)
        const entries = entriesIn(read.value)
        if (entries) {
          lists.push({ variable: name, line: lineOf(at), entries })
          read.skipped.forEach((item) => skipped.add(item))
        }
        else if (!settings && /^(?:CONFIG|SETTINGS|OPTIONS)$/i.test(name) && isFlatSettings(read.value)) settings = read.value
        at = read.end
        previous = ')'
        continue
      }
      at += declared[0].length
      previous = '='
      continue
    }

    // A list that is not assigned to a variable: an argument, a return value, a property.
    if (char === '[' || (char === '{' && (previous === '=' || previous === '(' || previous === ','))) {
      const read = reader.readAt(at)
      const entries = read ? entriesIn(read.value) : null
      if (read && entries) {
        const assigned = /([A-Za-z_$][\w$.]*)\s*=\s*$/.exec(source.slice(Math.max(0, at - 120), at))
        lists.push({ variable: assigned ? assigned[1] : null, line: lineOf(at), entries })
        read.skipped.forEach((item) => skipped.add(item))
        at = read.end
        previous = ')'
        continue
      }
    }

    if (!/\s/.test(char)) previous = char
    at++
  }

  const warnings: string[] = []
  if (skipped.size) {
    warnings.push(`Some values are built by code and could not be read without running the script, so they were left out: ${[...skipped].slice(0, 8).join(', ')}${skipped.size > 8 ? ', ...' : ''}.`)
  }

  return { lists, settings, variables, warnings }
}

/** Reads text that is one JavaScript literal and nothing else, such as JSON with single quotes. */
export function readLooseLiteral(source: string): { value: unknown; warnings: string[] } | null {
  const read = createReader(source, new Map()).readAt(0)
  if (!read || read.skipped.size || source.slice(read.end).replace(/[\s;]/g, '') !== '') return null
  return { value: read.value, warnings: [] }
}
