import chalk from 'chalk'
import * as utils from './utils.js'

export default async function deploy (program) {
  if (!program.deploy) return

  utils.log(chalk.bold.green('Deploying package to system...'))

  const args = `& {& Add-AppxPackage '${program.outputDirectory}/${program.packageName}.appx'}`

  await utils.executeChildProcess('powershell.exe', ['-NoProfile', '-NoLogo', args])
}
