import raw from '../../../youre_cooked.js?raw'
import { createScriptSource, readSetting } from '../../utils/scriptSource'
import { buildInstallSteps } from '../installFlow'
import type { ModuleDefinition } from '../types'

const script = createScriptSource('youre_cooked.js', raw)
const name = "You're Cooked"

export const youreCooked: ModuleDefinition = {
  slug: 'youre-cooked',
  name,
  theme: 'blood',
  tagline: 'Makes genuinely helpless, high-danger scenes feel immediate without turning ordinary conversations into horror.',
  blurb: "When you're actually cooked, the writing should make you feel it.",
  script,
  settings: [
    { key: 'HISTORY_DEPTH', value: readSetting(script, 'HISTORY_DEPTH'), meaning: 'How many recent messages are checked for danger, helplessness and scene context.' },
    { key: 'MAX_TOKENS', value: readSetting(script, 'MAX_TOKENS'), meaning: 'Approximate maximum size of the situational dread note.' },
    { key: 'MIN_ACTIVATION_SCORE', value: readSetting(script, 'MIN_ACTIVATION_SCORE'), meaning: 'How much combined danger and helplessness evidence is required before activation.' },
    { key: 'DEBUG', value: readSetting(script, 'DEBUG'), meaning: 'Logs the activation score while testing.' },
  ],
  steps: buildInstallSteps({
    scriptName: name,
    marker: "[YOU'RE COOKED — SITUATIONAL DREAD]",
    testMessage: 'The assassination failed. I am trapped in the room with someone far stronger than me, with no safe way out.',
  }),
  completeNote: 'It requires both credible danger and established helplessness, then reinforces atmosphere, consequence and the absence of automatic plot armor.',
}
