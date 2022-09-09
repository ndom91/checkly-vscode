// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'

let checklyStatusBarItem: vscode.StatusBarItem

export function activate({ subscriptions }: vscode.ExtensionContext) {
  const runCommandId = 'checkly-code.run'
  subscriptions.push(
    vscode.commands.registerCommand(runCommandId, async () => {
      const activeTextEditor = vscode.window.activeTextEditor
      if (activeTextEditor?.document.uri) {
        const fileUri = activeTextEditor.document.uri
        if (activeTextEditor.document.uri.scheme === 'untitled') {
          console.log('Invalid File', fileUri)
          vscode.window.showInformationMessage(
            'Invalid File, please save first!'
          )
        }
        const fileContents = await vscode.workspace.fs.readFile(fileUri)
        console.log('fileName', activeTextEditor.document.fileName)
        console.log('uri', fileUri)
        console.log('fileContents', fileContents)
        vscode.window.showInformationMessage(
          `Running current file...${fileUri}`
        )
      }
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
  checklyStatusBarItem.text = `🦝 Run Current File`
  checklyStatusBarItem.show()
}

// this method is called when your extension is deactivated
export function deactivate() {}
