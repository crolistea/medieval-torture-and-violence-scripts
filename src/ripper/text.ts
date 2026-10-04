import { toList } from './normalize.ts'

/*
 * Plain text input: notes someone typed or pasted.
 *
 * Text has no fixed shape, so this only trusts what is written down:
 *
 *   ## The Harbor            a heading starts an entry and names it
 *   Name: The Harbor         so does a Name: / Title: line
 *   Keys: harbor, docks      Keys: / Keywords: / Triggers: are the trigger words
 *   Category: place          Category:, Order:, Priority:, Comment: are kept
 *   ---                      a line of dashes ends an entry
 *
 * Text with none of those is split at blank lines, one entry per paragraph,
 * and nothing is named or keyed, because nothing said what the names are.
 */

type Raw = Record<string, unknown>

const SEPARATOR = /^\s*(?:-{3,}|\*{3,}|={3,}|_{3,})\s*$/
const HEADING = /^\s*(?:#{1,6}\s+(.+?)\s*#*|\[([^\][]{1,80})\]|={2,}\s*(.+?)\s*={2,})\s*$/
const FIELD = /^\s*(name|title|entry|keys?|keywords?|triggers?|secondary keys?|category|order|priority|comment|content)\s*[:=]\s*(.*)$/i

export interface TextRead {
  entries: Raw[]
  /** False when the text had no headings, fields or separators to go by. */
  structured: boolean
}

function paragraphs(text: string): Raw[] {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((content) => ({ content }))
}

export function readText(text: string): TextRead {
  const lines = text.split('\n')
  const structured = lines.some((line) => SEPARATOR.test(line) || HEADING.test(line) || FIELD.test(line))
  if (!structured) return { entries: paragraphs(text), structured }

  const entries: Raw[] = []
  let current: Raw = {}
  let body: string[] = []

  const flush = () => {
    const content = body.join('\n').trim()
    if (content) current.content = content
    if (Object.keys(current).length) entries.push(current)
    current = {}
    body = []
  }

  const hasBody = () => body.some((line) => line.trim())

  for (const line of lines) {
    if (SEPARATOR.test(line)) {
      flush()
      continue
    }

    const heading = HEADING.exec(line)
    if (heading) {
      flush()
      current.name = (heading[1] ?? heading[2] ?? heading[3]).trim()
      continue
    }

    const field = FIELD.exec(line)
    if (!field) {
      body.push(line)
      continue
    }

    const label = field[1].toLowerCase()
    const value = field[2].trim()

    if (label === 'name' || label === 'title' || label === 'entry') {
      if ('name' in current || hasBody()) flush()
      current.name = value
    } else if (label === 'content') {
      body.push(value)
    } else if (label.startsWith('secondary')) {
      current.secondaryKeys = toList(value)
    } else if (label.startsWith('key') || label.startsWith('trigger')) {
      // A second Keys: line after some content belongs to the next entry.
      if ('keys' in current && hasBody()) flush()
      current.keys = toList(value)
    } else {
      current[label] = value
    }
  }
  flush()

  return { entries, structured }
}

/*
 * Prompt text: the assembled prompt a chat sends, as the Scraper prints it.
 * It is made of sections wrapped in tags, for example
 *
 *   <Scenario> ... </Scenario>
 *
 * with loose text in between. Each tagged section becomes an entry named
 * after its tag. Loose text is split at blank lines and left unnamed.
 */

const TAGGED = /<([^<>/\n]{1,80})>([\s\S]*?)<\/\1>/g

export function looksLikePrompt(text: string): boolean {
  TAGGED.lastIndex = 0
  return TAGGED.test(text)
}

export function readPrompt(text: string): { entries: Raw[]; loose: number } {
  const entries: Raw[] = []
  let loose = 0
  let last = 0

  const takeLoose = (chunk: string) => {
    for (const entry of paragraphs(chunk)) {
      entries.push(entry)
      loose++
    }
  }

  TAGGED.lastIndex = 0
  for (let match = TAGGED.exec(text); match; match = TAGGED.exec(text)) {
    takeLoose(text.slice(last, match.index))
    const content = match[2].trim()
    if (content) entries.push({ name: match[1].trim(), content })
    last = match.index + match[0].length
  }
  takeLoose(text.slice(last))

  return { entries, loose }
}
