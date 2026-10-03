import { janitorLinks, ui, unverified } from './janitor'
import type { InstallStep } from './types'

/*
 * The install steps every script module shares.
 *
 * Installing a script into JanitorAI is the same six steps no matter which
 * module it is, so the steps are written once here and each module only
 * supplies what differs: its name, its test message, and what to look for.
 * A module that needs something extra can add to the returned array.
 */

export interface InstallFlowOptions {
  /** What the reader should call the script inside JanitorAI. */
  scriptName: string
  /** The bracketed header the script adds, for example "[HISTORICAL EQUIPMENT]". */
  marker: string
  /** A message that activates the module. */
  testMessage: string
}

export function buildInstallSteps({ scriptName, marker, testMessage }: InstallFlowOptions): InstallStep[] {
  return [
    {
      id: 'open',
      title: 'Open Scripts in JanitorAI',
      blocks: [
        {
          kind: 'actions',
          items: [
            `Open [janitorai.com](${janitorLinks.site}) and log in.`,
            'Click your profile picture. It is in the top right corner on a computer and the bottom right corner on a phone.',
            `Select **${ui.scriptsMenu}**.`,
          ],
        },
      ],
    },
    {
      id: 'create',
      title: 'Create a new script',
      blocks: [
        {
          kind: 'actions',
          items: [
            `Click **${ui.createNewScript}**.`,
            `Choose **${unverified.advancedTypeLabel}**, the code editor. Do not pick **${ui.lorebookType}**.`,
            {
              text: 'Pick any color theme, then name the script.',
              copy: { label: 'Script name', value: scriptName },
            },
            `Click **${ui.createScript}**.`,
          ],
        },
        {
          kind: 'note',
          unconfirmed: true,
          text: `The exact label of the Advanced option. If you only see **${ui.lorebookType}**, create one, click **${ui.addEntry}**, and choose **${ui.advancedEntry}** inside the entry.`,
        },
      ],
    },
    {
      id: 'copy',
      title: 'Copy the code',
      blocks: [{ kind: 'script' }],
    },
    {
      id: 'paste',
      title: 'Paste and save',
      blocks: [
        {
          kind: 'actions',
          items: [
            'Back in JanitorAI, click inside the code editor of your new script and delete anything already there.',
            'Paste the code. The first line must read `"use worker";`.',
            `Click **${ui.save}**. The label may differ slightly in the Advanced editor.`,
          ],
        },
      ],
    },
    {
      id: 'assign',
      title: 'Assign it to your character',
      blocks: [
        {
          kind: 'actions',
          items: [
            `Find **${ui.assignSection}**. On a computer it is on the right side.`,
            `Select your character, then click **${ui.assignButton}**.`,
          ],
        },
      ],
    },
    {
      id: 'test',
      title: 'Test it',
      blocks: [
        {
          kind: 'actions',
          items: [
            `Open **${ui.testChat}** with your character. Use **${ui.newChat}** if there is no chat yet.`,
            `Click **${ui.showDebugPanel}** at the bottom.`,
            {
              text: 'Send this message.',
              copy: { label: 'Test message', value: testMessage },
            },
            `Open the **${ui.changesTab}** tab.`,
          ],
        },
        {
          kind: 'result',
          text: `You should see new text that begins with \`${marker}\`.`,
        },
      ],
    },
  ]
}
