# 🦝 Checkly VS Code Extension

Run your local Playwright/Puppeteer E2E tests through your Checkly Account directly from VS Code!

## 📱 Features

- Adds a `🦝 Run in Checkly` button and command palette option to VS Code
- Will report the adhoc test result directly via a VS Code notification

## 📌 Installation

1. Search 'Checkly' on the VS Code Extension Sidebar

2. Or you can install it manually by downloading the `.vsix` file from the latest [Github Release](https://github.com/ndom91/checkly-vscode/releases) and choosing ["install from a vsix"](https://code.visualstudio.com/docs/editor/extension-marketplace#_install-from-a-vsix)

## 🏗️ Usage

1. You must have a valid Checkly check open in VS Code, with a filename like `*.check.js`
2. When attempting to start an adhoc check run for the first time, it will ask you for two config options:
   1. A Checkly `accountId`
   2. A Checkly API Key
3. Then there are two ways to initiate a check run:
   1. You can use the `🦝 Run Current File` button in the bottom status bar in VS Code
   2. The command palette command `Checkly: Run Current File`

Checks are always run in `eu-central-1` for now.

## 🏋️‍♀️ Contributing

We're open to most contributions, please stick to the [contributing guidelines]() and formatting settings!

### Todo

- Report logs of failed tests
- Allow customising check run location

## 📝 License

MIT
