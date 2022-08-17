// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'

let checklyStatusBarItem: vscode.StatusBarItem

export function activate({ subscriptions }: vscode.ExtensionContext) {
  const runCommandId = 'checkly-code.run'
  subscriptions.push(
    vscode.commands.registerCommand(runCommandId, () => {
      // vscode.workspace.fs.readDirectory('**/*', '**/*.ts', '**/*.tsx')
      vscode.window.showInformationMessage(`Running current file...`)
    })
  )

  checklyStatusBarItem = vscode.window.createStatusBarItem(
    'checklyCode',
    vscode.StatusBarAlignment.Right,
    Number.MAX_SAFE_INTEGER
  )
  checklyStatusBarItem.command = runCommandId
  subscriptions.push(checklyStatusBarItem)

  // register some listener that make sure the status bar
  // item always up-to-date
  subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem)
  )
  subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem)
  )

  // update status bar item once at start
  updateStatusBarItem()
}

function updateStatusBarItem(): void {
  checklyStatusBarItem.text = `🦝 $(raccoon) Run Current File`
  checklyStatusBarItem.show()
}

// this method is called when your extension is deactivated
export function deactivate() {}
