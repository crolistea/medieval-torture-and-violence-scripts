# Universal Historical Equipment Module for JanitorAI

A reusable, character-agnostic JanitorAI Script providing context-sensitive knowledge of historical, penal, reconstructed, and famous disputed/legendary punishment and torture equipment.

## v0.2 design

The catalogue lives in JavaScript; the LLM never receives the whole database. Each generation the script reads a short recent-message window, scores candidates, and appends only the strongest matches to `context.character.scenario`.

Defaults are deliberately conservative:

```js
HISTORY_DEPTH: 6,
MAX_INJECTED: 4,
MAX_TOKENS: 220,
FULL_SCORE: 14,
SUMMARY_SCORE: 8,
MIN_ACTIVATION_SCORE: 4
```

Entries automatically degrade through **full → summary → bullet** representations as relevance falls or the token budget fills. This follows the adaptive-lorebook approach documented by Tydorius, but uses a much smaller default budget because this module is supplemental equipment knowledge rather than an entire world lorebook.

## Behavior

The module does not make a character cruel, initiate torture, supply a motivation, or rewrite the setting. The character card remains authoritative.

Activation weights the latest user message more strongly than older context while recent messages provide continuity. Direct device mentions receive the strongest bonus. Already-mentioned equipment stays salient. Large/stationary apparatus receives a penalty unless the conversation establishes a collection, dedicated room, workshop, museum/gallery, private dungeon, replica/custom equipment, or directly names the apparatus. This reduces the chance of a room-sized object appearing from nowhere.

Selection is deterministic: there is no random novelty cycling.

## Historical labels

Catalogue entries carry provenance labels such as `documented`, `documented variants`, `mixed provenance`, `disputed`, `legendary/misattributed`, and `generic/reconstruction`. A modern fictional collector can still own replicas of disputed objects without the model presenting them as unquestionably medieval.

## Performance

A larger internal catalogue does not automatically mean a larger model prompt. The main controls are the number of entries injected and the character/token budget. v0.2 scans only six recent messages, uses simple string/array operations, selects at most four entries, and targets about 220 tokens of injected context.

If you need an even smaller footprint:

```js
MAX_INJECTED: 3,
MAX_TOKENS: 150
```

## Installation

1. Add a JanitorAI Script lorebook entry to the character.
2. Paste `historical_equipment.js`.
3. Test with `DEBUG: true` first.
4. In Test Chat, inspect activation score, selected IDs, approximate tokens, and whether access to large equipment was detected.
5. Set `DEBUG: false` for normal use.

The script starts with `"use worker";`, guards writable context fields, reads `context.chat.last_message` / `last_messages`, and only appends with `+=`.

## Files

- `historical_equipment.js` — production module.
- `tests/test-scenarios.md` — behavioral test matrix.
- `docs/DESIGN.md` — selection/token architecture and tuning notes.

## Website

A guided installation site for the modules lives in `src/` (React, TypeScript, Vite). Pushing to `main` builds and deploys it to GitHub Pages through `.github/workflows/pages.yml`:

<https://sawyer100.github.io/medieval-torture-and-violence-scripts/>

```sh
npm install
npm run dev      # local preview with live reload
npm run build    # TypeScript checks, then a production build in dist/
```

The site loads `historical_equipment.js` and `action_variety_engine.js` directly from the repository root, so the code a visitor copies is always the file in this repository. Edit the scripts here, never inside `src/`.

To add a module: put the script in the repository root, copy one of the files in `src/data/modules/`, edit its text, and add it to the list in `src/data/modules/index.ts`. The navigation, home page, and installer are generated from that list. The JanitorAI button and menu names used by the install steps are kept in one place, `src/data/janitor.ts`.

## Safety / scope

Catalogue descriptions are identification, provenance, visual/narrative context, and selection metadata. They intentionally avoid operational instructions for injuring a real person.

## Version

**v0.2.0** — adaptive detail, 220-token default budget, stronger latest-message weighting, continuity scoring, access checks for large apparatus, deterministic selection, tests and design documentation.
