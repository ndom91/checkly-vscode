import axios from 'axios'
import * as vscode from 'vscode'
import * as WebSocket from 'ws'
import * as mqtt from 'mqtt'
import { uuid } from 'uuidv4'
import { fileName, checkConfig } from './helpers'
import {
  RUN_COMMAND_ID,
  CLIENT_DISCONNECTED,
  CLIENT_CONNECTED,
} from './constants'

// @ts-ignore
global.WebSocket = WebSocket

let checklyStatusBarItem: vscode.StatusBarItem

const config = {
  accountId: '',
  token: '',
}

const getSignedUrl = async (): Promise<string> => {
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
      return signedUrl.data.url
    } else {
      throw new Error('checkly:error:no-aws-iot-signed-url')
    }
  } catch (e) {
    console.error('checkly:error', e)
    throw new Error('checkly:error:no-aws-iot-signed-url')
  }
}

const runBrowserCheck = async ({
  websocketClientId,
  checkScript,
}: {
  websocketClientId: string
  checkScript: string
}): Promise<void> => {
  const check = {
    accountId: config.accountId,
    activated: true,
    locations: ['eu-central-1'],
    checkType: 'BROWSER',
    script: checkScript,
    scriptPath: null,
    dependencies: [],
    githubCheckLink: null,
    recordResponseBody: false,
    runLocation: {
      type: 'PUBLIC',
      region: 'eu-central-1',
    },
  }

  try {
    const runRequest = await axios.post(
      `https://api.checklyhq.com/accounts/${config.accountId}/browser-check-runs`,
      { ...check, websocketClientId, runLocation: 'eu-west-1' },
      {
        headers: {
          'X-Checkly-Account': config.accountId,
          Authorization: `Bearer ${config.token}`,
        },
      }
    )
    if (runRequest.status === 202) {
      console.debug(`🦝: Run successfully submitted (${websocketClientId})`)
    }
  } catch (e) {
    console.error('checkly:error', e)
  }
}

const submitCheck = async (): Promise<void> => {
  const configuration = vscode.workspace.getConfiguration('checkly-code')
  config.accountId = configuration.get('accountId') as string
  config.token = configuration.get('token') as string
  const checkRunId = uuid()

  // Check for required Checkly Info
  // Prompt user if missing
  await checkConfig(config)

  try {
    if (!config.accountId || !config.token) {
      throw new Error(
        '🦝: Still missing Checkly config (`accountId` and/or `token`)'
      )
    }

    const activeTextEditor = vscode.window.activeTextEditor
    if (activeTextEditor?.document.uri) {
      // Get current file contents
      const fileUri = activeTextEditor.document.uri

      if (activeTextEditor.document.uri.scheme === 'untitled') {
        throw new Error('🦝: Invalid File - Please save first')
      }

      if (!fileName(activeTextEditor.document.fileName).includes('.check.js')) {
        console.error('checkly:error:invalid-file-name')
        throw new Error('🦝: Invalid Checkly Filename')
      }

      vscode.window.showInformationMessage(
        `Submitting "${fileName(activeTextEditor.document.fileName)}"...`
      )

      // Fetch AWS IOT Signed URL
      const signedUrl = await getSignedUrl()

      // Submit Check Run
      const fileContents = await vscode.workspace.fs.readFile(fileUri)
      runBrowserCheck({
        websocketClientId: checkRunId,
        checkScript: Buffer.from(fileContents).toString('utf8'),
      })

      // Connect to MQTT over WSS
      const topic = `browser-check-results/${checkRunId}/#`
      const client = mqtt.connect(signedUrl)

      // Subscribe to MQTT topics
      client.on('connect', () => {
        console.debug('checkly:socket-client:connected')
        client.subscribe(CLIENT_CONNECTED)
        client.subscribe(CLIENT_DISCONNECTED)
        client.subscribe(topic, (err) => {
          if (err) {
            console.error('MQTT Subscribe Error', err)
          }
          console.debug(`checkly:socket-client:subscribed:${topic}`)
        })
      })

      // Listen to MQTT messages
      client.on('message', (topic: string, message: string) => {
        const type = topic.split('/')[2]
        const jsonString = Buffer.from(message).toString('utf8')
        const checkRunResults = JSON.parse(jsonString)

        switch (type) {
          case 'run-start':
            vscode.window.showInformationMessage(`Run started [${checkRunId}]`)
            break
          case 'run-end': {
            console.debug('checkly:run-ended')
            console.debug('checkly:run-results', checkRunResults)
            const passed =
              !checkRunResults.hasFailures && !checkRunResults.hasErrors
            vscode.window.showInformationMessage(
              `Check Run ${passed ? 'Passed' : 'Failed'}`
            )
          }
        }
      })
    }
  } catch (e) {
    console.error(e)
    vscode.window.showErrorMessage(`checkly:error ${e}`)
  }
}

export function activate({ subscriptions }: vscode.ExtensionContext) {
  subscriptions.push(
    vscode.commands.registerCommand(RUN_COMMAND_ID, submitCheck)
  )

  checklyStatusBarItem = vscode.window.createStatusBarItem(
    'checklyCode',
    vscode.StatusBarAlignment.Right,
    Number.MAX_SAFE_INTEGER
  )
  checklyStatusBarItem.command = RUN_COMMAND_ID
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
/* export function deactivate() {} */
