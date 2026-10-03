import { site } from './site'
import type { CopyField } from './types'

/*
 * The scraper is the Prompt Inspector tool in tools/prompt-inspector.
 * Everything said about it here comes from that folder's README and main.go.
 * If the tool changes, this is the one file to update.
 */

export interface ScraperStep {
  /** Starts with a verb: "Run it". */
  title: string
  /** Rich text. See the marks listed in types.ts. */
  text: string
  copy?: CopyField[]
  /** Not needed for a first run. */
  optional?: boolean
}

const folder = 'tools/prompt-inspector'
const repoFolder = site.repoUrl.slice(site.repoUrl.lastIndexOf('/') + 1)

const steps: ScraperStep[] = [
  {
    title: 'Get it',
    text: 'It needs [Go](https://go.dev/dl/) 1.22 or newer. Download the repository, then open the tool folder.',
    copy: [
      { label: 'Download', value: `git clone ${site.repoUrl}.git` },
      { label: 'Open the folder', value: `cd ${repoFolder}/${folder}` },
    ],
  },
  {
    title: 'Run it',
    text: 'It starts listening on `127.0.0.1:8080`, which only your own computer can reach.',
    copy: [{ label: 'Start', value: 'go run .' }],
  },
  {
    title: 'Send a chat through it',
    text: 'Point an OpenAI-compatible client at this address and send a message. The whole prompt prints in the terminal. Nothing is passed on to a provider: the scraper answers with an error on purpose.',
    copy: [{ label: 'Address', value: 'http://127.0.0.1:8080/v1/chat/completions' }],
  },
  {
    title: 'Read the output',
    text: 'Every message is printed with its role. A script that ran leaves its marker in the prompt: `[HISTORICAL EQUIPMENT]`, `[ACTION VARIETY]` or `[DYNAMIC ESCALATION]`. No marker means that script stayed silent.',
  },
  {
    title: 'Forward to a provider',
    optional: true,
    text: 'To get real replies while you watch, give it a provider to pass each request on to. Only use one you trust: requests can carry character cards, chat history and your API key.',
    copy: [{ label: 'Start with forwarding', value: 'go run . -upstream https://YOUR-PROVIDER-BASE-URL' }],
  },
  {
    title: 'Hide keys in the output',
    optional: true,
    text: 'A small helper blanks out API keys before they are printed. It needs [Rust](https://rustup.rs/). It only changes what you see, not what is forwarded, and it can miss a key, so check the output before you share it.',
    copy: [
      { label: 'Build the helper', value: 'cargo build --release --manifest-path redactor/Cargo.toml' },
      { label: 'Start with it', value: 'go run . -redactor ./redactor/target/release/prompt-redactor' },
    ],
  },
]

export const scraper = {
  name: 'The Scraper',
  /** One sentence for the home page and the top of the scraper page. */
  blurb: 'A small local tool that prints the exact prompt sent to an AI provider, so you can see what a script added.',
  folderUrl: `${site.repoUrl}/tree/main/${folder}`,
  steps,
}
