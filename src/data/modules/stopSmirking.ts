import raw from '../../../stop_fucking_smirking.js?raw'
import { createScriptSource, readSetting } from '../../utils/scriptSource'
import { buildInstallSteps } from '../installFlow'
import type { ModuleDefinition } from '../types'

const script = createScriptSource('stop_fucking_smirking.js', raw)
const name = 'Stop Fucking Smirking'

export const stopSmirking: ModuleDefinition = {
  slug: 'stop-fucking-smirking',
  name,
  theme: 'blood',
  tagline: 'Detects overused roleplay mannerisms in recent prose and nudges the next reply toward fresher reactions without changing the character.',
  blurb: 'Make fights and mannerisms NOT CLICHE.',
  script,
  settings: [
    { key: 'HISTORY_DEPTH', value: readSetting(script, 'HISTORY_DEPTH'), meaning: 'How many recent messages are checked for repeated prose beats.' },
    { key: 'MAX_TOKENS', value: readSetting(script, 'MAX_TOKENS'), meaning: 'Approximate maximum size of the anti-cliche reminder.' },
    { key: 'REPEAT_THRESHOLD', value: readSetting(script, 'REPEAT_THRESHOLD'), meaning: 'How many recent repetitions are needed before a cliche is flagged.' },
    { key: 'DEBUG', value: readSetting(script, 'DEBUG'), meaning: 'Logs which repeated mannerisms were detected while testing.' },
  ],
  steps: buildInstallSteps({
    scriptName: name,
    marker: '[ANTI-CLICHE PROSE]',
    testMessage: 'He smirked again, leaned closer, then smirked as he answered with another dark chuckle.',
  }),
  completeNote: 'It stays quiet until recent prose actually repeats one of its tracked cliches.',
}
