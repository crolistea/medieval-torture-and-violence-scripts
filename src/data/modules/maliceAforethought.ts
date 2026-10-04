import raw from '../../../malice_aforethought.js?raw'
import { createScriptSource, readSetting } from '../../utils/scriptSource'
import { buildInstallSteps } from '../installFlow'
import type { ModuleDefinition } from '../types'
const script = createScriptSource('malice_aforethought.js', raw)
const name = 'Malice Aforethought'
export const maliceAforethought: ModuleDefinition = {
  slug: 'malice-aforethought', name, theme: 'blood',
  tagline: 'Makes consequential fictional choices follow established motives and intentions instead of receiving convenient retroactive explanations.',
  blurb: 'Motive first. Intention second. Action after.',
  script,
  settings: [
    { key: 'HISTORY_DEPTH', value: readSetting(script, 'HISTORY_DEPTH'), meaning: 'Recent narrative context considered when reconstructing motive.' },
    { key: 'MAX_TOKENS', value: readSetting(script, 'MAX_TOKENS'), meaning: 'Maximum approximate size of the intent-continuity guidance.' },
    { key: 'MIN_SCORE', value: readSetting(script, 'MIN_SCORE'), meaning: 'Evidence required before deliberate-intent guidance activates.' },
    { key: 'DEBUG', value: readSetting(script, 'DEBUG'), meaning: 'Logs the activation score while testing.' },
  ],
  steps: buildInstallSteps({ scriptName: name, marker: '[MALICE AFORETHOUGHT — INTENT CONTINUITY]', testMessage: 'She has been planning revenge for days. An opportunity to betray him finally appears.' }),
  completeNote: 'It reinforces deliberate motives only when the card and story already support them.',
}
