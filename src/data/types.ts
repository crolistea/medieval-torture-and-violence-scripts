import type { ThemeId } from '../themes/themes'

/*
 * Text fields marked "rich" accept three inline marks, rendered by <RichText>:
 *   **Create New Script**   a button or label the reader has to find on screen
 *   `"use worker";`         literal code or text
 *   [help page](https://…)  an external link
 */

/** A script file from the repository root, loaded as text. */
export interface ScriptSource {
  filename: string
  code: string
  /** Read from the header comment of the file, when present. */
  version: string | null
  lineCount: number
  byteSize: number
}

export interface CopyField {
  label: string
  value: string
}

/** One thing the reader has to do. May carry a short piece of text to copy. */
export interface ActionItem {
  /** Rich text. */
  text: string
  copy?: CopyField
}

/**
 * `info`     helpful context
 * `warning`  something that breaks the install if ignored
 * `verify`   a detail we could not confirm against JanitorAI's documentation
 */
export type NoticeTone = 'info' | 'warning' | 'verify'

export type StepBlock =
  /** A plain paragraph. Rich text. */
  | { kind: 'text'; body: string }
  /** A numbered list of things to click or type. */
  | { kind: 'actions'; items: Array<string | ActionItem>; start?: number }
  /** The module's full script with the big copy button. */
  | { kind: 'script' }
  /** What the reader should see when the step worked. Lines are rich text. */
  | { kind: 'expect'; title: string; lines: string[] }
  | { kind: 'notice'; tone: NoticeTone; title: string; body: string }
  /** Optional extra detail, collapsed by default. */
  | { kind: 'details'; summary: string; blocks: StepBlock[] }

export interface InstallStep {
  id: string
  /** Starts with a verb: "Create the script". */
  title: string
  /** One sentence shown under the title. */
  summary: string
  blocks: StepBlock[]
}

export interface ChecklistItem {
  id: string
  /** Rich text. */
  label: string
}

export interface Fact {
  label: string
  value: string
}

export interface TestIdea {
  title: string
  body: string
}

export interface Troubleshoot {
  problem: string
  /** Rich text. */
  fix: string
}

export interface ModuleCompletion {
  /** Shown under "Installation complete". */
  intro: string
  checklist: ChecklistItem[]
  testIdeas: TestIdea[]
  troubleshooting: Troubleshoot[]
}

export interface ModuleSetting {
  key: string
  value: string
  meaning: string
}

/** Everything the site needs to present and install one module. */
export interface ModuleDefinition {
  /** URL segment: /modules/<slug>. */
  slug: string
  name: string
  /** Optional second name, shown as "Also known as". */
  alias?: string
  /** Short label for the navigation bar. */
  navLabel: string
  /** Two-word category shown above the name. */
  kind: string
  theme: ThemeId
  /** One sentence, about 20 words. Used on the home page and module header. */
  tagline: string
  /** A short paragraph explaining how it works, in plain language. */
  description: string
  does: string[]
  doesNot: string[]
  script: ScriptSource
  installTime: string
  difficulty: string
  /** Three short facts for the home page card. */
  cardFacts: Fact[]
  /** Full fact list for the module page. */
  facts: Fact[]
  /** Settings a reader may want to tune, for the documentation page. */
  settings: ModuleSetting[]
  steps: InstallStep[]
  completion: ModuleCompletion
}
