import { janitorLinks, ui, unverified } from './janitor'
import type { InstallStep } from './types'

/*
 * The install steps every script module shares.
 *
 * Installing a script into JanitorAI is the same six steps no matter which
 * module it is, so the steps are written once here and each module only
 * supplies what differs: its name, its test messages, and what to look for.
 * A module that needs something extra can add to the returned array.
 */

export interface InstallFlowOptions {
  /** What the reader should call the script inside JanitorAI. */
  scriptName: string
  /** Optional description to paste into JanitorAI. */
  scriptDescription: string
  /** The bracketed header the script adds, for example "[HISTORICAL EQUIPMENT]". */
  marker: string
  /** A message that must NOT activate the module. */
  calmMessage: string
  /** A message that must activate the module. */
  triggerMessage: string
  /** What appears after the trigger message. Rich text lines. */
  triggerExpect: string[]
  /** Why a calm message can still activate the module. Rich text. */
  calmCaveat: string
  /** The exact DEBUG text in the script, for example "DEBUG: false". */
  debugOff: string
  debugOn: string
  /** What the debug log reports, as a short phrase. */
  debugShows: string
}

export function buildInstallSteps(options: InstallFlowOptions): InstallStep[] {
  return [
    {
      id: 'open',
      title: 'Open Scripts in JanitorAI',
      summary: 'Everything is done inside your own JanitorAI account.',
      blocks: [
        {
          kind: 'actions',
          items: [
            `Open [janitorai.com](${janitorLinks.site}) in a new tab and log in.`,
            'Open the main menu. On a computer, click your profile picture in the top right corner. On a phone, tap your profile picture in the bottom right corner.',
            `Select **${ui.scriptsMenu}**. It appears with a code symbol, like \`</> Scripts\`.`,
          ],
        },
        {
          kind: 'notice',
          tone: 'info',
          title: 'Keep this guide open',
          body: 'You will switch between this page and JanitorAI a few times. Your progress is saved in this browser, so you can return to the same step.',
        },
      ],
    },
    {
      id: 'create',
      title: 'Create a new script',
      summary: 'This makes an empty script in your account, ready for the module code.',
      blocks: [
        {
          kind: 'actions',
          items: [
            `Click **${ui.createNewScript}**.`,
            `Choose the **${unverified.advancedTypeLabel}** type. This is the code editor. Do not pick **${ui.lorebookType}**, which is the visual keyword editor.`,
            'Pick any color theme. It only changes how the script looks in your list.',
            {
              text: 'Give it a name. Use this one so it is easy to find later.',
              copy: { label: 'Script name', value: options.scriptName },
            },
            {
              text: 'Add a description if you want one. It is optional.',
              copy: { label: 'Description', value: options.scriptDescription },
            },
            `Click **${ui.createScript}**.`,
          ],
        },
        {
          kind: 'notice',
          tone: 'verify',
          title: `The "${unverified.advancedTypeLabel}" label is unconfirmed`,
          body: `JanitorAI describes two script modes: Lorebook, a visual editor, and Advanced, a code editor. Its official step-by-step guide only walks through Lorebook, so we could not confirm the exact wording of the Advanced option. If you only see **${ui.lorebookType}**, create a Lorebook, click **${ui.addEntry}**, and choose **${ui.advancedEntry}** inside that entry. JanitorAI documents that route. Then continue with the next step.`,
        },
      ],
    },
    {
      id: 'copy',
      title: 'Copy the module code',
      summary: 'One button copies the whole script. You do not need to read or edit it.',
      blocks: [
        { kind: 'script' },
        {
          kind: 'notice',
          tone: 'warning',
          title: 'Copy all of it',
          body: 'The script only works when it is complete. If you select the text by hand instead of using the button, start at the first line, `"use worker";`, and go to the very end.',
        },
      ],
    },
    {
      id: 'paste',
      title: 'Paste the code and save',
      summary: 'Put the copied code into the script you created.',
      blocks: [
        {
          kind: 'actions',
          items: [
            'Go back to the JanitorAI tab, to the script you just created.',
            'Click inside the code editor. If it already contains any text, select all of it and delete it.',
            'Paste the code. On a computer press `Ctrl` + `V`, or `Cmd` + `V` on a Mac. On a phone, press and hold inside the editor, then tap Paste.',
            'Check that the very first line reads `"use worker";`.',
            `Click **${ui.save}**.`,
          ],
        },
        {
          kind: 'notice',
          tone: 'verify',
          title: 'The editor layout is unconfirmed',
          body: `The official guide documents the Lorebook editor, where the button is called **${ui.save}**. We could not check the Advanced code editor against it, so the layout or wording may differ slightly. The goal stays the same: the script contains only the pasted code, and it is saved.`,
        },
      ],
    },
    {
      id: 'assign',
      title: 'Assign the script to your character',
      summary: 'A script does nothing until it is attached to a character.',
      blocks: [
        {
          kind: 'actions',
          items: [
            `On the script's page, find the **${ui.assignSection}** section. On a computer it is on the right side.`,
            'Find your character in the list and click it to select it.',
            `Click **${ui.assignButton}**.`,
          ],
        },
        {
          kind: 'notice',
          tone: 'info',
          title: 'Scripts stack',
          body: 'JanitorAI lets one character use several scripts, and one script serve several characters. You can install every module from this site on the same character.',
        },
        {
          kind: 'notice',
          tone: 'verify',
          title: 'Characters made by someone else',
          body: 'The list is labelled as your characters. We have not confirmed whether a script can be attached to a character you did not create.',
        },
      ],
    },
    {
      id: 'test',
      title: 'Test it in a chat',
      summary: 'Two short messages confirm the module is installed and stays quiet when it should.',
      blocks: [
        {
          kind: 'actions',
          items: [
            `Select the character you assigned the script to and open **${ui.testChat}**. Use **${ui.newChat}** to start a fresh chat.`,
            `Click **${ui.showDebugPanel}** at the bottom.`,
            {
              text: 'Send this calm message first.',
              copy: { label: 'Calm message', value: options.calmMessage },
            },
            `Open the **${ui.changesTab}** tab in the debug panel.`,
          ],
        },
        {
          kind: 'expect',
          title: 'After the calm message',
          lines: [`No text that begins with \`${options.marker}\`. The module stayed silent.`],
        },
        {
          kind: 'actions',
          start: 5,
          items: [
            {
              text: 'Now send a message that fits the module.',
              copy: { label: 'Trigger message', value: options.triggerMessage },
            },
            `Look at the **${ui.changesTab}** tab again.`,
          ],
        },
        {
          kind: 'expect',
          title: 'After the trigger message',
          lines: options.triggerExpect,
        },
        {
          kind: 'notice',
          tone: 'info',
          title: 'If the calm message added a note',
          body: options.calmCaveat,
        },
        {
          kind: 'details',
          summary: 'Optional: see why the module activated',
          blocks: [
            {
              kind: 'text',
              body: `Find \`${options.debugOff}\` near the top of the script, change it to \`${options.debugOn}\`, and click **${ui.save}**. The script then logs ${options.debugShows} for every reply. Community documentation reports that this output appears in the debug panel. Change it back when you finish testing.`,
            },
          ],
        },
      ],
    },
  ]
}
