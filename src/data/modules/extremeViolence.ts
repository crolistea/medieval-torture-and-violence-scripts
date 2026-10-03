import raw from '../../../dynamic_escalation_engine.js?raw'
import { createScriptSource, readSetting } from '../../utils/scriptSource'
import { buildInstallSteps } from '../installFlow'
import type { ModuleDefinition } from '../types'

const script = createScriptSource('dynamic_escalation_engine.js', raw)
const name = 'Very Very Extreme Violence Engine'

export const extremeViolence: ModuleDefinition = {
  slug: 'very-very-extreme-violence',
  name,
  kind: 'Dynamic escalation',
  theme: 'blood',
  tagline:
    'Tracks how intense the current scene actually is, lets conflict build when the story supports it, and allows the scene to cool back down instead of escalating forever.',

  script,

  settings: [
    {
      key: 'HISTORY_DEPTH',
      value: readSetting(script, 'HISTORY_DEPTH'),
      meaning:
        'How many recent messages the engine reads when estimating the current scene intensity.',
    },
    {
      key: 'MAX_TOKENS',
      value: readSetting(script, 'MAX_TOKENS'),
      meaning:
        'Approximate maximum amount of context this module may inject for a reply.',
    },
    {
      key: 'LATEST_WEIGHT',
      value: readSetting(script, 'LATEST_WEIGHT'),
      meaning:
        'How strongly the newest message influences the current intensity compared with older context.',
    },
    {
      key: 'DEESCALATION_WEIGHT',
      value: readSetting(script, 'DEESCALATION_WEIGHT'),
      meaning:
        'How strongly current calming, surrender or separation signals lower the scene intensity.',
    },
    {
      key: 'DEBUG',
      value: readSetting(script, 'DEBUG'),
      meaning:
        'Set this to true while testing to log the inferred intensity and detected signal families.',
    },
  ],

  steps: buildInstallSteps({
    scriptName: name,
    marker: '[DYNAMIC ESCALATION]',
    testMessage:
      'After the fight, I stop struggling, step back, and tell you I do not want to keep fighting.',
  }),

  completeNote:
    'The engine estimates scene intensity from current narrative evidence. It can rise during established conflict and fall again when the scene calms down.',
}