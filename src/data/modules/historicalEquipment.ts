// The real script, loaded as text from the repository root. Never copy it into this folder.
import raw from '../../../historical_equipment.js?raw'
import { countEntries, createScriptSource, formatSize, readSetting } from '../../utils/scriptSource'
import { buildInstallSteps } from '../installFlow'
import type { ModuleDefinition } from '../types'

const script = createScriptSource('historical_equipment.js', raw)

const catalogueSize = countEntries(script)
const historyDepth = readSetting(script, 'HISTORY_DEPTH')
const maxInjected = readSetting(script, 'MAX_INJECTED')
const maxTokens = readSetting(script, 'MAX_TOKENS')
const marker = '[HISTORICAL EQUIPMENT]'

export const historicalEquipment: ModuleDefinition = {
  slug: 'historical-equipment',
  name: 'Historical Equipment',
  navLabel: 'Historical Equipment',
  kind: 'Prop knowledge',
  theme: 'verdigris',
  tagline:
    'Gives your character accurate knowledge of historical punishment, restraint and confinement equipment, only when the scene calls for it.',
  description: `The script holds a catalogue of ${catalogueSize} historical and historically inspired devices. Before each reply it reads the last few messages, scores what is relevant, and adds only the strongest matches to the character's scenario. The model never receives the whole catalogue.`,
  does: [
    `Adds up to ${maxInjected} relevant equipment entries to a reply, chosen from ${catalogueSize}.`,
    'Labels each piece as documented, disputed, legendary or a reconstruction, so myths are not presented as medieval fact.',
    'Keeps equipment that is already in the scene available over the next few messages.',
    'Holds back room-sized apparatus until the story has established a place for it.',
  ],
  doesNot: [
    'Make a character cruel or give them a motive.',
    'Start a punishment scene on its own.',
    'Replace or rewrite the character card.',
    'Give real-world instructions. Entries describe objects.',
  ],
  script,
  installTime: 'About 5 minutes',
  difficulty: 'Beginner. No coding.',
  cardFacts: [
    { label: 'Install time', value: 'About 5 min' },
    { label: 'Catalogue', value: `${catalogueSize} devices` },
    { label: 'Adds per reply', value: `Up to ${maxInjected} entries` },
  ],
  facts: [
    { label: 'Install time', value: 'About 5 minutes' },
    { label: 'Difficulty', value: 'Beginner. No coding.' },
    { label: 'Script file', value: script.filename },
    { label: 'Version', value: script.version ? `v${script.version}` : 'See script header' },
    { label: 'Size', value: `${script.lineCount} lines, ${formatSize(script.byteSize)}` },
    { label: 'Reads', value: `Last ${historyDepth} messages` },
    { label: 'Adds per reply', value: `Up to ${maxInjected} entries, about ${maxTokens} tokens` },
  ],
  settings: [
    { key: 'HISTORY_DEPTH', value: historyDepth, meaning: 'How many recent messages the script reads.' },
    {
      key: 'MAX_INJECTED',
      value: maxInjected,
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
    scriptName: 'Historical Equipment',
    scriptDescription:
      'Adds context about historical punishment and restraint equipment when the scene calls for it.',
    marker,
    calmMessage: 'How was your day? I made tea for us.',
    triggerMessage: 'Tell me about the iron maiden in your collection.',
    triggerExpect: [
      `New text that begins with \`${marker}\`.`,
      'A line for the Iron Maiden, labelled `legendary/misattributed`.',
    ],
    calmCaveat:
      'This module also reads the character card. If the card or the opening message already describes cruelty, captives or a dungeon, it can activate straight away. That is expected and does not mean the install failed.',
    debugOff: 'DEBUG: false',
    debugOn: 'DEBUG: true',
    debugShows: 'its activation score and the entries it selected',
  }),
  completion: {
    intro:
      'Historical Equipment is attached to your character. It stays silent until a scene makes equipment relevant, then adds a short note for that reply.',
    checklist: [
      { id: 'calm', label: `A calm message in a fresh chat added no \`${marker}\` note.` },
      { id: 'trigger', label: `The trigger message added a note that begins with \`${marker}\`.` },
      { id: 'voice', label: 'The character still speaks and behaves like its card.' },
      { id: 'debug', label: 'If you turned on `DEBUG`, it is set back to `false`.' },
    ],
    testIdeas: [
      {
        title: 'Name a device',
        body: 'Mention the rack or the stocks in your message. That device should be listed first in the note.',
      },
      {
        title: 'Ask about a myth',
        body: 'Ask about an iron maiden. The note should label it legendary or misattributed, not proven medieval.',
      },
      {
        title: 'Leave the room',
        body: `Move the story somewhere else. After about ${historyDepth} messages the old equipment should stop appearing.`,
      },
      {
        title: 'Use a gentle character',
        body: 'Have a kind character talk about a museum collection. They should gain object knowledge only, with no change in personality.',
      },
    ],
    troubleshooting: [
      {
        problem: 'No note appears, even for the trigger message',
        fix: 'Check that the script is assigned to this exact character, that the first line is `"use worker";`, and that the whole file was pasted. Then send the trigger message again in a new chat.',
      },
      {
        problem: 'A note appears on calm messages',
        fix: `The module also reads the character card and the last ${historyDepth} messages. A card that describes cruelty, captives or a dungeon can activate it early. That is intended.`,
      },
      {
        problem: 'A huge device shows up with no setup',
        fix: 'Room-sized equipment is held back until the story mentions a collection, a dedicated room, or the device by name. Check whether recent messages did that.',
      },
      {
        problem: 'Replies use too many tokens',
        fix: `In the \`CONFIG\` block near the top of the script, lower \`MAX_INJECTED\` from ${maxInjected} to 3, then click **Save**.`,
      },
    ],
  },
}
