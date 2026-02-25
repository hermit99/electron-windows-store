import path from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'
import * as utils from './utils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default async function zip (program) {
  if (!program.containerVirtualization) return

  const input = program.inputDirectory
  const output = program.outputDirectory
  const args = `& {& '${path.resolve(__dirname, '..', 'ps1', 'zip.ps1')}' -source '${input}' -destination '${output}'}`

  utils.log(chalk.green('Zipping up built Electron application...'))

  await utils.executeChildProcess('powershell.exe', ['-NoProfile', '-NoLogo', args])
}
