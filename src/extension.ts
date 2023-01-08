import * as vscode from 'vscode'
import { fileName, checkConfig } from './helpers'
import { RUN_COMMAND_ID } from './constants'

let checklyStatusBarItem: vscode.StatusBarItem

let terminal: vscode.Terminal

const config: {
  accountId: string | undefined
  token: string | undefined
} = {
  accountId: undefined,
  token: undefined,
}

const runCheck = async (): Promise<void> => {
  try {
    // Setup configuration values
    const configuration = vscode.workspace.getConfiguration('checkly-code')
    config.accountId = configuration.get('accountId')
    config.token = configuration.get('token')

    await checkConfig(config)

    // Get active window and file / directory path
    const activeTextEditor = vscode.window.activeTextEditor
    if (activeTextEditor?.document.uri) {
      if (activeTextEditor.document.uri.scheme === 'untitled') {
        throw new Error('🦝: Invalid File - Please save first')
      }
      const file = fileName(activeTextEditor.document.fileName)

      // Open progress notification
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Submitting ${fileName(activeTextEditor.document.fileName)}`,
          cancellable: false,
        },
        async (progress) => {
          for (let i = 0; i < 40; i++) {
            setTimeout(() => {
              progress.report({
                increment: i * 1,
                message: `${i} Submitting ${fileName(
                  activeTextEditor.document.fileName
                )}`,
              })
            }, 120000)
          }
        }
      )

      // Reuse existing terminal or open a new one and clear it
      if (!terminal) {
        terminal = vscode.window.createTerminal(`Checkly: ${file}`)
      }
      await vscode.commands.executeCommand('workbench.action.terminal.clear')

      // Use the locally installed @checkly/cli to run the current file
      terminal.sendText(
        `CHECKLY_API_KEY=${config.token} CHECKLY_ACCOUNT_ID=${config.accountId} ./node_modules/.bin/checkly test ${file}`
      )
      terminal.show()
    }
  } catch (e) {
    console.error('checkly:error', e)
  }
}

export function activate({ subscriptions }: vscode.ExtensionContext) {
  subscriptions.push(vscode.commands.registerCommand(RUN_COMMAND_ID, runCheck))

  checklyStatusBarItem = vscode.window.createStatusBarItem(
    'checklyCode',
    vscode.StatusBarAlignment.Right,
    Number.MAX_SAFE_INTEGER
  )
  checklyStatusBarItem.command = RUN_COMMAND_ID
  subscriptions.push(checklyStatusBarItem)

  // Register some listener that make sure the status bar item always up-to-date
  subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem)
  )

  // Update status bar item once at start
  updateStatusBarItem()
}

function updateStatusBarItem(): void {
  checklyStatusBarItem.text = `🦝 Run Current File`
  checklyStatusBarItem.show()
}
