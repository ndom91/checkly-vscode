import * as vscode from 'vscode'
import axios from 'axios'
import * as WebSocket from 'ws'
import * as mqtt from 'mqtt'
import { uuid } from 'uuidv4'
import { checkBody } from './fixtures'

// @ts-ignore
global.WebSocket = WebSocket

const CLIENT_CONNECTED = 'client-connected'
const CLIENT_DISCONNECTED = 'client-disconnected'

const fileName = (url: string): string =>
  url.substring(url.lastIndexOf('/') + 1)

let checklyStatusBarItem: vscode.StatusBarItem

const config = {
  accountId: '',
  token: '',
}

const getSignedUrl = async () => {
  try {
    const signedUrl = await axios.get(
      `https://api.checklyhq.com/sockets/signed-url`,
      {
        headers: {
          'X-Checkly-Account': config.accountId,
          Authorization: `Bearer ${config.token}`,
        },
      }
    )
    if (signedUrl.status === 200) {
      console.log('Got Signed URL', signedUrl)
      return signedUrl.data.url
    }
  } catch (e) {
    console.log('Error getting signed url', e)
  }
}

const runBrowserCheck = async (websocketClientId: string) => {
  try {
    const runRequest = await axios.post(
      `https://api.checklyhq.com/accounts/${config.accountId}/browser-check-runs`,
      { ...checkBody, websocketClientId, runLocation: 'eu-west-1' },
      {
        headers: {
          'X-Checkly-Account': config.accountId,
          Authorization: `Bearer ${config.token}`,
        },
      }
    )
    if (runRequest.status === 202) {
      console.log('Run successfully submitted -', websocketClientId)
    }
  } catch (e) {
    console.log('Error submitting run', e)
  }
}

const submitCheck = async () => {
  const configuration = vscode.workspace.getConfiguration('checkly-code')
  config.accountId = configuration.get('accountId') as string
  config.token = configuration.get('token') as string
  const checkRunId = uuid()

  // Check for required Checkly Info
  // Prompt for it if missing
  if (!config.accountId || !config.token) {
    console.error(
      'Missing Checkly Config: AccountID and/or Token. Requesting from User.'
    )

    const accountId = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: 'ABC123',
      prompt: 'Checkly Account ID',
    })

    const token = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: 'eyJh...',
      prompt: 'Checkly Bearer Token',
    })

    if (accountId && token) {
      // Set checkly.accountId config
      await vscode.workspace
        .getConfiguration('checkly-code')
        .update('accountId', accountId, vscode.ConfigurationTarget.Global)

      config.accountId = accountId

      // Set checkly.token config
      await vscode.workspace
        .getConfiguration('checkly-code')
        .update('token', token, vscode.ConfigurationTarget.Global)

      config.token = token
    }
  }

  try {
    if (!config.accountId || !config.token) {
      console.error('Still missing Checkly Config: AccountID and/or Token.')
      throw new Error('Still missing Checkly Config: AccountID and/or Token.')
    }

    const activeTextEditor = vscode.window.activeTextEditor
    if (activeTextEditor?.document.uri) {
      // Get current file contents
      const fileUri = activeTextEditor.document.uri
      if (activeTextEditor.document.uri.scheme === 'untitled') {
        console.log('Invalid File', fileUri)
        vscode.window.showInformationMessage('Invalid File, please save first!')
      }
      const fileContents = await vscode.workspace.fs.readFile(fileUri)

      console.log('fileContents', fileContents)
      console.log('typeof fileContents', typeof fileContents)

      vscode.window.showInformationMessage(
        `Running "${fileName(activeTextEditor.document.fileName)}"...`
      )

      // Fetch AWS IOT Signed URL
      const signedUrl = await getSignedUrl()
      console.log('Final SignedURL', signedUrl)

      // Submit Check Run
      runBrowserCheck(checkRunId)

      // Connect to MQTT over WSS
      const topic = `browser-check-results/${checkRunId}/#`
      const client = mqtt.connect(signedUrl)
      /* const client = mqtt.connect(signedUrl, { */
      /*   // @ts-ignore */
      /*   will: { */
      /*     topic: LAST_WILL_TOPIC, */
      /*     // @ts-ignore */
      /*     payload: (info) => JSON.stringify({ info }), */
      /*   }, */
      /* }) */
      client.on('connect', () => {
        console.log('checkly:socket-client:connected')
        client.subscribe(CLIENT_CONNECTED)
        client.subscribe(CLIENT_DISCONNECTED, (err) => {
          if (err) {
            console.error('MQTT Error', err)
          }
        })
        client.subscribe(topic, (err) => {
          if (err) {
            console.error('MQTT Subscribe Error', err)
          }
          console.log('checkly:socket-client:subscribed:', topic)
        })
      })
      client.on('message', (topic: string, message: string) => {
        const type = topic.split('/')[2]
        const jsonString = Buffer.from(message).toString('utf8')
        const parsedData = JSON.parse(jsonString)

        switch (type) {
          case 'run-start':
            vscode.window.showInformationMessage(
              `Run started "${checkRunId}"...`
            )
            break
          case 'run-end': {
            const passed = !parsedData.hasFailures && !parsedData.hasErrors
            vscode.window.showInformationMessage(
              `Check Run ${passed ? 'Passed' : 'Failed'}`
            )
          }
        }
      })
    }
  } catch (e) {
    console.error(e)
    vscode.window.showErrorMessage(
      `Theres been an error submitting your Check - ${e}`
    )
  }
}

export function activate({ subscriptions }: vscode.ExtensionContext) {
  const runCommandId = 'checkly-code.run'
  subscriptions.push(vscode.commands.registerCommand(runCommandId, submitCheck))

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
