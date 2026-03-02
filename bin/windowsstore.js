#!/usr/bin/env node

import { program } from 'commander'
import os from 'os'
import chalk from 'chalk'
import { createRequire } from 'module'

import setup from '../lib/setup.js'
import ensureParams from '../lib/params.js'
import zip from '../lib/zip.js'
import sign from '../lib/sign.js'
import assets from '../lib/assets.js'
import convert from '../lib/convert.js'
import finalSay from '../lib/finalsay.js'
import makeappx from '../lib/makeappx.js'
import manifest from '../lib/manifest.js'
import deploy from '../lib/deploy.js'
import makepri from '../lib/makepri.js'

const require = createRequire(import.meta.url)
const pack = require('../package.json')

// Little helper function turning string input into an array
function list (val) {
  return val.split(',')
}

program
  .version(pack.version)
  .option('-c, --container-virtualization', 'Create package using Windows Container virtualization')
  .option('-b, --windows-build', 'Display Windows Build information')
  .option('-i, --input-directory <path>', 'Directory containing your application')
  .option('-o, --output-directory <path>', 'Output directory for the appx')
  .option('-p, --package-version <version>', 'Version of the app package')
  .option('-n, --package-name <name>', 'Name of the app package')
  .option('--identity-name <name>', 'Name for identity')
  .option('--application-id <id>', 'Application ID, only A-Za-z0-9. are allowed')
  .option('--package-display-name <displayName>', 'Display name of the package')
  .option('--package-description <description>', 'Description of the package')
  .option('--package-background-color <color>', 'Background color for the app icon (example: #464646, default: transparent)')
  .option('-e, --package-executable <executablePath>', 'Path to the package executable')
  .option('-a, --assets <assetsPath>', 'Path to the visual assets for the appx')
  .option('-m, --manifest <manifestPath>', 'Path to a manifest, if you want to overwrite the default one')
  .option('-d, --deploy <true|false>', 'Should the app be deployed after creation?')
  .option('--publisher <publisher>', 'Publisher to use (example: CN=developmentca)')
  .option('--publisher-display-name <publisherDisplayName>', 'Publisher display name to use')
  .option('--windows-kit <windows-kit>', 'Path to the Windows Kit bin folder')
  .option('--dev-cert <dev-cert>', 'Path to the developer certificate to use OR nil if no signing wanted, i.e. windows store submission')
  .option('--cert-pass <cert-pass>', 'Certification password')
  .option('--desktop-converter <desktop-converter>', 'Path to the desktop converter tools')
  .option('--expanded-base-image <base-image>', 'Path to the expanded base image')
  .option('--make-pri <true|false>', 'Use makepri.exe (you don\'t need to unless you know you do)', (i) => (i === 'true'))
  .option('--makeappx-params <params>', 'Additional parameters for Make-AppXPackage (example: --makeappx-params "/l","/d")', list)
  .option('--signtool-params <params>', 'Additional parameters for signtool.exe (example: --makeappx-params "/l","/d")', list)
  .option('--create-config-params <params>', 'Additional parameters for makepri.exe "createconfig" (example: --create-config-params "/l","/d")', list)
  .option('--create-pri-params <params>', 'Additional parameters for makepri.exe "new" (example: --create-pri-params "/l","/d")', list)
  .option('--verbose <true|false>', 'Enable debug mode')
  .parse()

const opts = program.opts()

if (opts.windowsBuild) {
  console.log(os.release())
}

if (opts.verbose) {
  const debug = process.env.DEBUG || ''
  process.env.DEBUG = 'electron2appx,' + debug
}

setup(opts)
  .then(() => ensureParams(opts))
  .then(() => zip(opts))
  .then(() => convert(opts))
  .then(() => assets(opts))
  .then(() => manifest(opts))
  .then(() => makepri(opts))
  .then(() => finalSay(opts))
  .then(() => makeappx(opts))
  .then(() => sign.signAppx(opts))
  .then(() => deploy(opts))
  .then(() => console.log(chalk.bold.green('All done!')))
  .catch(e => {
    console.log(e)
    console.log(e.stack)
  })
