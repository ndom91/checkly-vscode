# 🦝 Checkly VS Code Extension

Run your local Playwright/Puppeteer E2E tests through your Checkly Account directly from VS Code!

> Now using the new [`checkly`](https://github.com/checkly/checkly-cli) CLI package!

## 📱 Features

- Adds a `🦝 Run in Checkly` button and command palette option to VS Code
- Will report the adhoc test result directly in VS Code

## 📌 Installation

A. Search 'Checkly' on the VS Code Extension Sidebar
B. Or you can install it manually by downloading the `.vsix` file from the latest [Github Release](https://github.com/ndom91/checkly-vscode/releases) and choosing ["install from a vsix"](https://code.visualstudio.com/docs/editor/extension-marketplace#_install-from-a-vsix)

## 🏗️ Usage

1. When attempting to start an adhoc check run for the very first time, it will ask you for two config options:
   1. A Checkly Account ID (found in your Checkly "Settings" page)
   2. A Checkly API Key (Also found in "Settings" -> "User API Keys")
2. Then there are two ways to initiate a check run:
   1. You can use the `🦝 Run Current File` button in the bottom status bar in VS Code
   2. The command palette command `Checkly: Run Current File`

The check will be run with the [`checkly`](https://npm.im/checkly) CLI command `checkly test --record ${file}`

## 🏋️‍♀️ Contributing

We're open to most contributions, please stick to the [contributing guidelines]() and formatting settings!

## 📝 License

MIT
