// The real script, loaded as text from the repository root. Never copy it into this folder.
import raw from '../../../action_variety_engine.js?raw'
import { createScriptSource, readSetting } from '../../utils/scriptSource'
import { buildInstallSteps } from '../installFlow'
import type { ModuleDefinition } from '../types'

const script = createScriptSource('action_variety_engine.js', raw)
const name = 'Violence and Shit'

export const actionVariety: ModuleDefinition = {
  slug: 'violence-and-shit',
  name,
  theme: 'blood',
  tagline:
    'Offers your character varied ways to play a confrontation that is already happening, so fights stop repeating the same moves.',
  blurb: 'Fights that stop repeating the same moves.',
  script,
  settings: [
    {
      key: 'HISTORY_DEPTH',
      value: readSetting(script, 'HISTORY_DEPTH'),
      meaning: 'How many recent messages the script reads.',
    },
    {
      key: 'MAX_ACTIONS',
      value: readSetting(script, 'MAX_ACTIONS'),
      meaning: 'The most suggestions added to one reply. Lower it for a smaller footprint.',
    },
    {
      key: 'MAX_TOKENS',
      value: readSetting(script, 'MAX_TOKENS'),
      meaning: 'Approximate size limit for the list of suggestions.',
    },
    {
      key: 'RECENT_PENALTY',
      value: readSetting(script, 'RECENT_PENALTY'),
      meaning: 'How strongly recently used beats are pushed down the ranking.',
    },
    {
      key: 'DEBUG',
      value: readSetting(script, 'DEBUG'),
      meaning: 'Set to true while testing to log the intensity level and the selected beats.',
    },
  ],
  steps: buildInstallSteps({
    scriptName: name,
    // The header the script writes. It comes from the script itself, not from the site name.
    marker: '[ACTION VARIETY]',
    testMessage: 'I shove past you and try to escape through the door, but you grab my arm to stop me.',
  }),
  completeNote:
    'It stays silent in calm scenes and offers alternative action beats when a confrontation is already under way.',
}
