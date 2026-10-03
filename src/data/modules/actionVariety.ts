// The real script, loaded as text from the repository root. Never copy it into this folder.
import raw from '../../../action_variety_engine.js?raw'
import { countEntries, createScriptSource, formatSize, readSetting } from '../../utils/scriptSource'
import { buildInstallSteps } from '../installFlow'
import type { ModuleDefinition } from '../types'

const script = createScriptSource('action_variety_engine.js', raw)

const beatCount = countEntries(script)
const historyDepth = readSetting(script, 'HISTORY_DEPTH')
const maxActions = readSetting(script, 'MAX_ACTIONS')
const maxTokens = readSetting(script, 'MAX_TOKENS')
const marker = '[ACTION VARIETY]'

export const actionVariety: ModuleDefinition = {
  slug: 'action-variety',
  name: 'Action Variety',
  alias: 'Violence Engine',
  navLabel: 'Action Variety',
  kind: 'Prose variety',
  theme: 'signal',
  tagline:
    'Offers your character varied ways to play a confrontation that is already happening, so fights stop repeating the same moves.',
  description: `Models fall back on the same few beats: a chin grab, a wall pin, a smirk. When recent messages already contain a confrontation, this script adds a short ranked list of alternative beats and points out which ones have been overused. It holds ${beatCount} beats and offers only a few at a time.`,
  does: [
    `Suggests up to ${maxActions} alternative action beats for a reply, chosen from ${beatCount}.`,
    'Spots overused beats in recent messages, such as chin grabs, wall pins and smirks, and steers away from them.',
    'Rates scene intensity from 0 to 4 and holds back high-intensity beats until the scene supports them.',
    'Words weapon beats so they apply only when the story has already established a weapon.',
  ],
  doesNot: [
    'Make a calm scene violent. Ordinary conversation leaves it inactive.',
    'Raise the intensity for the sake of novelty.',
    "Change the character's temperament, skill or morality.",
    'Explain real fighting technique. Beats stay at story level.',
  ],
  script,
  installTime: 'About 5 minutes',
  difficulty: 'Beginner. No coding.',
  cardFacts: [
    { label: 'Install time', value: 'About 5 min' },
    { label: 'Action beats', value: `${beatCount} in the set` },
    { label: 'Adds per reply', value: `Up to ${maxActions} suggestions` },
  ],
  facts: [
    { label: 'Install time', value: 'About 5 minutes' },
    { label: 'Difficulty', value: 'Beginner. No coding.' },
    { label: 'Script file', value: script.filename },
    { label: 'Version', value: script.version ? `v${script.version}` : 'See script header' },
    { label: 'Size', value: `${script.lineCount} lines, ${formatSize(script.byteSize)}` },
    { label: 'Reads', value: `Last ${historyDepth} messages` },
    { label: 'Adds per reply', value: `Up to ${maxActions} suggestions, about ${maxTokens} tokens` },
  ],
  settings: [
    { key: 'HISTORY_DEPTH', value: historyDepth, meaning: 'How many recent messages the script reads.' },
    {
      key: 'MAX_ACTIONS',
      value: maxActions,
      meaning: 'The most suggestions added to one reply. Lower it for a smaller footprint.',
    },
    { key: 'MAX_TOKENS', value: maxTokens, meaning: 'Approximate size limit for the list of suggestions.' },
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
    scriptName: 'Action Variety',
    scriptDescription:
      'Adds varied action options when a confrontation is already happening. Never starts one.',
    marker,
    calmMessage: 'How was your day? I made tea for us.',
    triggerMessage: 'I shove past you and try to escape through the door, but you grab my arm to stop me.',
    triggerExpect: [
      `New text that begins with \`${marker}\`.`,
      'One or more suggestion lines, each starting with a dash.',
      'A closing line that reports `Current inferred confrontation intensity`.',
    ],
    calmCaveat:
      "The module reads the last few messages, including the character's opening message. If that message already contains a threat or a fight, it can activate straight away. That is expected and does not mean the install failed.",
    debugOff: 'DEBUG:false',
    debugOn: 'DEBUG:true',
    debugShows: 'the intensity level and the beats it selected',
  }),
  completion: {
    intro:
      'Action Variety is attached to your character. It stays silent in calm scenes and offers alternatives only when a confrontation is already under way.',
    checklist: [
      { id: 'calm', label: `A calm message in a fresh chat added no \`${marker}\` note.` },
      { id: 'trigger', label: `The trigger message added a note that begins with \`${marker}\`.` },
      { id: 'voice', label: 'The character still speaks and behaves like its card.' },
      { id: 'debug', label: 'If you turned on `DEBUG`, it is set back to `false`.' },
    ],
    testIdeas: [
      {
        title: 'Start calm',
        body: 'Hold an ordinary conversation. Nothing should be added and nobody should turn violent.',
      },
      {
        title: 'Build a confrontation',
        body: 'Play an argument that turns into a struggle. The suggestions should match the level the scene has reached.',
      },
      {
        title: 'Repeat a familiar move',
        body: 'Use a chin grab or a wall pin a few turns in a row. The note should name the repeated beat and suggest something different.',
      },
      {
        title: 'Let it cool down',
        body: `End the confrontation and return to calm talk. After about ${historyDepth} messages the note should stop appearing.`,
      },
    ],
    troubleshooting: [
      {
        problem: 'No note appears, even for the trigger message',
        fix: 'Check that the script is assigned to this exact character, that the first line is `"use worker";`, and that the whole file was pasted. Then send the trigger message again in a new chat.',
      },
      {
        problem: 'The note keeps appearing after a fight ends',
        fix: `The module reads the last ${historyDepth} messages, so it fades a few replies after the confrontation leaves the chat.`,
      },
      {
        problem: 'The character seems more aggressive than before',
        fix: `The note tells the model to match the existing scene and never raise intensity for novelty. If your model still escalates, lower \`MAX_ACTIONS\` from ${maxActions} so fewer suggestions are offered, then click **Save**.`,
      },
      {
        problem: 'Replies use too many tokens',
        fix: 'In the `CONFIG` line near the top of the script, lower `MAX_ACTIONS` or `MAX_TOKENS`, then click **Save**.',
      },
    ],
  },
}
