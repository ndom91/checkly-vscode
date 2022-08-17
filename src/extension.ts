// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'

let myStatusBarItem: vscode.StatusBarItem

export function activate({ subscriptions }: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "checkly-code" is now active!')

  // register a command that is invoked when the status bar
  // item is selected
  const myCommandId = 'checkly-code.run'
  subscriptions.push(
    vscode.commands.registerCommand(myCommandId, () => {
      const n = getNumberOfSelectedLines(vscode.window.activeTextEditor)
      vscode.window.showInformationMessage(
        `Yeah, ${n} line(s) selected... Keep going!`
      )
    })
  )

  // create a new status bar item that we can now manage
  myStatusBarItem = vscode.window.createStatusBarItem(
    'checklyCode',
    vscode.StatusBarAlignment.Right,
    Number.MAX_SAFE_INTEGER
  )
  myStatusBarItem.command = myCommandId
  myStatusBarItem.show()
  subscriptions.push(myStatusBarItem)

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
  const n = getNumberOfSelectedLines(vscode.window.activeTextEditor)
  if (n > 0) {
    myStatusBarItem.text = `[🦝] $(megaphone) ${n} line(s) selected`
    myStatusBarItem.show()
  } else {
    myStatusBarItem.hide()
  }
}

function getNumberOfSelectedLines(
  editor: vscode.TextEditor | undefined
): number {
  let lines = 0
  if (editor) {
    lines = editor.selections.reduce(
      (prev, curr) => prev + (curr.end.line - curr.start.line),
      0
    )
  }
  return lines
}

// this method is called when your extension is deactivated
export function deactivate() {}
