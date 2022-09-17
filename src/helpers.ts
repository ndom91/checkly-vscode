import * as vscode from 'vscode'
import { checklyExternalPackages } from './constants'
import { rollup } from 'rollup'
import commonjs from '@rollup/plugin-commonjs'

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

export const bundleCheckFile = async (filePath: string): Promise<string> => {
  let bundle
  let code

  try {
    // create a bundle
    bundle = await rollup({
      // core input options
      external: checklyExternalPackages,
      input: filePath,
      plugins: [commonjs()],
    })

    code = await generateOutputs(bundle)
  } catch (error) {
    console.error(error)
  }
  if (bundle) {
    // closes the bundle
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
