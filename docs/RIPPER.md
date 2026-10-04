# The Ripper

Turns script and lorebook data you already have into one clean, consistent list of entries. Code: `src/ripper/`. Page: `#/ripper` on the website. Terminal: `tools/ripper/cli.mjs`.

## What it is for, and what it is not

It is a reader for text you give it: a file you exported, a script you wrote, notes you typed.

It does not log in, fetch, or talk to JanitorAI or any other site. It does not read cookies, tokens or passwords. It cannot reach content your account cannot already see. On the website it runs entirely in your browser tab and nothing is uploaded.

## Input it understands

The format is detected automatically.

| Input | Detected as | Notes |
|---|---|---|
| A JSON list of entries | `lorebook-json` | Also a `{ "lorebook": [...] }` wrapper, a single entry, or a name-to-entry map. |
| An object with `entries` | `worldinfo-json` | `entries` may be a list or a map keyed by id. Book-level fields are kept in `source`. |
| A character card | `character-card-json` | Reads `character_book` (or `data.character_book`). |
| A saved script record | `script-record-json` | The `script` field may hold JSON or JavaScript; both are read. |
| A chat request with `messages` | `chat-payload-json` | Reads the system message. This is what the Scraper prints. |
| JavaScript source | `javascript` | Read, never run. See below. |
| Text with `<Tag>...</Tag>` sections | `prompt-text` | Each tagged section becomes an entry named after its tag. |
| Anything else | `plain-text` | See below. |

A ``` fence around pasted text and a byte order mark are ignored. JSON written the JavaScript way (single quotes, bare field names, a trailing comma) is read, with a warning.

### JavaScript

The source is never executed: there is no `eval`. A small reader finds lists of objects that look like entries (`const loreEntries = [...]`, a list passed to a function, a list assigned to a property) and reads their literal values. It follows references to earlier variables, joins `"a" + "b"`, and resolves `[...].join("\n")`.

A value that only exists when the code runs (`Math.max(...)`, a function call) is left out and named in a warning. A template with a `${...}` placeholder is kept as written.

If a script has a flat `CONFIG` object, it is copied to `source.settings`.

### Plain text

```text
Name: The Harbor
Keys: harbor, docks
Category: place
Order: 10
A crowded harbor that smells of tar.
---
## Captain Voss
Keys: voss
Runs the night watch.
```

`Name:` / `Title:` lines and `## headings`, `[Headings]` or `== Headings ==` start and name an entry. `Keys:` / `Keywords:` / `Triggers:` set its keys. `Category:`, `Order:`, `Priority:`, `Comment:` and `Secondary keys:` are kept. A line of `---` ends an entry.

Text with none of that is split at blank lines, one entry per paragraph, unnamed and without keys, and a warning says so.

### Assembled prompts

A prompt mixes the card, the persona, instructions and any lorebook text. The tags say which section is which. Nothing in the prompt says which loose paragraph is lore and which is an instruction, so loose text is split at blank lines and passed through unnamed. Sorting it is left to you.

## Output

```json
{
  "format": "lorebook-json",
  "source": {},
  "count": 1,
  "entries": [
    {
      "index": 1,
      "name": null,
      "content": "A crowded harbor that smells of tar.",
      "keys": ["harbor", "docks"],
      "secondaryKeys": ["night"],
      "order": 10,
      "priority": 3,
      "category": "place",
      "comment": "The Harbor",
      "enabled": true,
      "constant": false,
      "insertion": { "probability": 100, "selective": true },
      "extra": { "uid": 0 },
      "inferred": []
    }
  ]
}
```

Every entry has the same fields. Rules:

- A field the source did not have is `null` or an empty list. Nothing is made up.
- Different spellings map to one field: `key`, `keys`, `keywords`, `keysRaw`, `triggers` and `aliases` all become `keys`; `insertion_order` becomes `order`; `disable: true` becomes `enabled: false`.
- Fields the ripper does not know are copied unchanged into `extra`.
- The one guess it makes is listed in `inferred`: when a script holds several lists, an entry with no category gets its list's variable name as the category, and `inferred` contains `"category"`.

## Errors

Bad input is refused with a reason. It never returns a guess.

| Code | Meaning |
|---|---|
| `empty` | Nothing was given. |
| `bad-json` | Not valid JSON. The message gives the reason, line and column. |
| `bad-javascript` | The source is broken (an unclosed quote, comment or bracket), with line and column. |
| `no-entries` | It was read, but there are no entries in it. The hint says what was found instead. |

Items that are skipped (an empty object, a string in a list of entries, an entry with no content) are listed as warnings next to the result.

## Using it

**Website.** Open the Ripper page, paste text or choose a file (or drop one on the panel), and press **Rip it**. The entries are previewed. **Copy clean JSON** copies the output; **Download .json** saves it.

**Terminal.** Needs Node 22.18 or newer.

```sh
npm run rip -- lorebook.json                 # clean JSON on screen
npm run rip -- script.js -o clean.json       # clean JSON in a file
npm run rip -- notes.txt --summary           # one line per entry
```

**Code.**

```js
import { rip, toCleanJson, RipError } from './src/ripper/index.ts'

const result = rip(text)        // throws RipError on bad input
console.log(result.entries)
```

## Tests

```sh
npm run test:ripper
```

`tests/ripper.test.mjs` covers every format above, metadata preservation, malformed JSON, broken and awkward JavaScript, missing fields, empty input, and that the same output shape comes back whatever the input was. Fixtures are in `tests/fixtures/ripper/`.
