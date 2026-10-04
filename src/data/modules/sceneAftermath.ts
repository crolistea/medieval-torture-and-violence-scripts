import raw from '../../../scene_aftermath.js?raw'
import { createScriptSource, readSetting } from '../../utils/scriptSource'
import { buildInstallSteps } from '../installFlow'
import type { ModuleDefinition } from '../types'

const script = createScriptSource('scene_aftermath.js', raw)
const name = 'Scene Aftermath'

export const sceneAftermath: ModuleDefinition = {
  slug: 'scene-aftermath',
  name,
  theme: 'blood',
  tagline: 'Keeps injuries, pain, exhaustion, ruined clothing and a wrecked room true after the violence is over, and lets them recover only as fast as the story says.',
  blurb: 'The fight ended. What it did to everyone has not.',
  script,
  settings: [
    { key: 'HISTORY_DEPTH', value: readSetting(script, 'HISTORY_DEPTH'), meaning: 'How many recent messages are checked for consequences the story already established.' },
    { key: 'MAX_TOKENS', value: readSetting(script, 'MAX_TOKENS'), meaning: 'Approximate maximum size of the aftermath note.' },
    { key: 'COMPACT_TOKENS', value: readSetting(script, 'COMPACT_TOKENS'), meaning: 'Smaller maximum used when Bloodloss or No Clean Fights already added a note to the same reply.' },
    { key: 'MIN_ACTIVATION_SCORE', value: readSetting(script, 'MIN_ACTIVATION_SCORE'), meaning: 'How much established evidence is required before the module activates.' },
    { key: 'FADE_AFTER', value: readSetting(script, 'FADE_AFTER'), meaning: 'After this many turns without a mention, breathlessness and shock are no longer carried. Wounds are.' },
    { key: 'DEBUG', value: readSetting(script, 'DEBUG'), meaning: 'Logs the score, what was found established and the recovery stage while testing.' },
  ],
  steps: buildInstallSteps({
    scriptName: name,
    marker: '[SCENE AFTERMATH]',
    testMessage: 'The fight is over. I am limping, my sleeve is torn and bloody, and the cut on my arm is still bleeding.',
  }),
  completeNote: 'It only speaks when the recent story already established a consequence. It never starts violence, adds an injury or makes one worse.',
}
