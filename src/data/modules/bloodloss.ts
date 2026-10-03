import raw from '../../../bloodloss.js?raw'
import { createScriptSource, readSetting } from '../../utils/scriptSource'
import { buildInstallSteps } from '../installFlow'
import type { ModuleDefinition } from '../types'

const script = createScriptSource('bloodloss.js', raw)
const name = 'Bloodloss'

export const bloodloss: ModuleDefinition = {
  slug: 'bloodloss',
  name,
  theme: 'blood',
  tagline: 'Tracks broad fictional bleeding and injury continuity so established wounds and weakness do not disappear from one reply to the next.',
  blurb: 'If the story established the wound, the next reply remembers it.',
  script,
  settings: [
    { key: 'HISTORY_DEPTH', value: readSetting(script, 'HISTORY_DEPTH'), meaning: 'How many recent messages are checked for established injury state.' },
    { key: 'MAX_TOKENS', value: readSetting(script, 'MAX_TOKENS'), meaning: 'Approximate maximum size of the continuity note.' },
    { key: 'MIN_ACTIVATION_SCORE', value: readSetting(script, 'MIN_ACTIVATION_SCORE'), meaning: 'How much injury evidence is required before the module activates.' },
    { key: 'DEBUG', value: readSetting(script, 'DEBUG'), meaning: 'Logs the inferred injury-continuity signals while testing.' },
  ],
  steps: buildInstallSteps({
    scriptName: name,
    marker: '[BLOODLOSS CONTINUITY]',
    testMessage: 'My sleeve is already bloodied from the wound, and I am unsteady as I try to keep moving.',
  }),
  completeNote: 'It remembers broad fictional injury state without becoming a medical simulator or escalating harm on its own.',
}
