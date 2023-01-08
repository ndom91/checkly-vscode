const { build } = require('esbuild')
const [, , arg] = process.argv

const logger = console

const isWatchMode = arg === '--watch'

build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  minify: arg === '--minify',
  platform: 'node',
  outdir: 'dist/',
  external: ['vscode'],
  format: 'cjs',
  sourcemap: false,
  watch: isWatchMode,
})
  .then(({ errors, warnings }) => {
    if (warnings.length) {
      logger.warn(...warnings)
    }
    if (errors.length) {
      logger.error(...errors)
    }

    logger.log('Successfully bundled checkly-vscode 🚀')

    if (isWatchMode) {
      logger.log('Watching... 🕰')
    } else {
      process.exit()
    }
  })
  .catch((err) => {
    logger.error(err)
    process.exit(1)
  })
