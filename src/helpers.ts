import * as vscode from 'vscode'
import { checklyExternalPackages } from './constants'
import { rollup } from 'rollup'
import commonjs from '@rollup/plugin-commonjs'

export const fileName = (url: string): string =>
  url.substring(url.lastIndexOf('/') + 1)

export const checkConfig = async (config: {
  accountId: string | undefined
  token: string | undefined
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
      placeHolder: 'cu_...',
      prompt: 'Checkly API Key',
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

// Currently unused - keeping for potential future use
export const bundleCheckFile = async (filePath: string) => {
  let bundle
  let code

  try {
    bundle = await rollup({
      external: checklyExternalPackages,
      input: filePath,
      plugins: [commonjs()],
    })

    code = await generateOutputs(bundle)
  } catch (error) {
    console.error(error)
  }
  if (bundle) {
    await bundle.close()
  }
  return code
}

async function generateOutputs(bundle: any) {
  const { output } = await bundle.generate({
    format: 'cjs',
    exports: 'default',
  })

  return output[0].code
}
