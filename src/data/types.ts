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

export type StepBlock =
  /** A short list of things to click or type. */
  | { kind: 'actions'; items: Array<string | ActionItem> }
  /** The module's full script with the big copy button. */
  | { kind: 'script' }
  /** What the reader should see when the step worked. Rich text. */
  | { kind: 'result'; text: string }
  /**
   * A one-line aside. Rich text. Set `unconfirmed` for a detail we could not
   * check against JanitorAI's documentation.
   */
  | { kind: 'note'; text: string; unconfirmed?: boolean }

export interface InstallStep {
  id: string
  /** Starts with a verb: "Create a new script". */
  title: string
  blocks: StepBlock[]
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
  /** Shown in the navigation, on the home page and as the page heading. */
  name: string
  theme: ThemeId
  /** One sentence for the documentation page. */
  tagline: string
  /** A few words under the name in the home page catalogue. */
  blurb: string
  script: ScriptSource
  /** Settings a reader may want to tune, for the documentation page. */
  settings: ModuleSetting[]
  steps: InstallStep[]
  /** One sentence shown under "Installation complete": when the module speaks up. */
  completeNote: string
}
