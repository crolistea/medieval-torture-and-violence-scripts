import raw from '../../../no_clean_fights.js?raw'
import { createScriptSource, readSetting } from '../../utils/scriptSource'
import { buildInstallSteps } from '../installFlow'
import type { ModuleDefinition } from '../types'

const script = createScriptSource('no_clean_fights.js', raw)
const name = 'No Clean Fights'

export const noCleanFights: ModuleDefinition = {
  slug: 'no-clean-fights',
  name,
  theme: 'blood',
  tagline: 'Keeps the mess, fatigue, damaged surroundings, clothing wear and disruption of an established fight from magically resetting.',
  blurb: 'The room remembers. The clothes remember. The fight leaves a mess.',
  script,
  settings: [
    { key: 'HISTORY_DEPTH', value: readSetting(script, 'HISTORY_DEPTH'), meaning: 'How many recent messages are checked for conflict and continuity signals.' },
    { key: 'MAX_TOKENS', value: readSetting(script, 'MAX_TOKENS'), meaning: 'Approximate maximum size of the continuity note.' },
    { key: 'MIN_ACTIVATION_SCORE', value: readSetting(script, 'MIN_ACTIVATION_SCORE'), meaning: 'How much conflict evidence is required before the module activates.' },
    { key: 'DEBUG', value: readSetting(script, 'DEBUG'), meaning: 'Logs the activation score and detected continuity signals while testing.' },
  ],
  steps: buildInstallSteps({
    scriptName: name,
    marker: '[NO CLEAN FIGHTS]',
    testMessage: 'The fight has wrecked the room. I am panting, my coat is torn, and broken glass is scattered across the floor.',
  }),
  completeNote: 'It activates around established physical conflict and carries its broad consequences forward without forcing escalation.',
}
