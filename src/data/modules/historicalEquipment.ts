// The real script, loaded as text from the repository root. Never copy it into this folder.
import raw from '../../../historical_equipment.js?raw'
import { createScriptSource, readSetting } from '../../utils/scriptSource'
import { buildInstallSteps } from '../installFlow'
import type { ModuleDefinition } from '../types'

const script = createScriptSource('historical_equipment.js', raw)
const name = 'Medieval Torture Devices'

export const historicalEquipment: ModuleDefinition = {
  slug: 'medieval-torture-devices',
  name,
  theme: 'blood',
  tagline:
    'Gives your character accurate knowledge of historical punishment, restraint and confinement equipment, only when the scene calls for it.',
  blurb: 'Real punishment and restraint equipment, described accurately.',
  script,
  settings: [
    {
      key: 'HISTORY_DEPTH',
      value: readSetting(script, 'HISTORY_DEPTH'),
      meaning: 'How many recent messages the script reads.',
    },
    {
      key: 'MAX_INJECTED',
      value: readSetting(script, 'MAX_INJECTED'),
      meaning: 'The most entries added to one reply. Lower it for a smaller footprint.',
    },
    {
      key: 'MIN_ACTIVATION_SCORE',
      value: readSetting(script, 'MIN_ACTIVATION_SCORE'),
      meaning: 'How much scene evidence is needed before the module activates. Raise it if it activates too easily.',
    },
    {
      key: 'DEBUG',
      value: readSetting(script, 'DEBUG'),
      meaning: 'Set to true while testing to log the activation score and the selected entries.',
    },
  ],
  steps: buildInstallSteps({
    scriptName: name,
    // The header the script writes. It comes from the script itself, not from the site name.
    marker: '[HISTORICAL EQUIPMENT]',
    testMessage: 'Tell me about the iron maiden in your collection.',
  }),
  completeNote:
    'It stays silent in calm scenes and adds a short note when a scene involves historical punishment or restraint equipment.',
}
