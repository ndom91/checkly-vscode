import * as vscode from 'vscode'
import { build } from 'esbuild'
import { checklyExternalPackages } from './constants'

export const fileName = (url: string): string =>
  url.substring(url.lastIndexOf('/') + 1)

export const checkConfig = async (config: {
  accountId: string
  token: string
}) => {
  if (!config.accountId || !config.token) {
    console.debug(
      '🦝: Missing Checkly `accountId` and/or `token` - Requesting from User'
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
}

export const bundleCheckFile = async (filePath: string) => {
  return build({
    entryPoints: [filePath],
    bundle: true,
    platform: 'node',
    external: checklyExternalPackages,
    write: false,
    format: 'iife',
    sourcemap: false,
    watch: false,
  })
}
