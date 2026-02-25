import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'
import * as utils from './utils.js'

export default async function manifest (program) {
  if (!program.manifest) return

  utils.log(chalk.bold.green('Overwriting manifest...'))

  const source = path.normalize(program.manifest)
  const destination = path.join(program.outputDirectory, 'pre-appx', 'AppXManifest.xml')

  utils.debug(`Copying manifest from ${source} to ${destination}`)

  try {
    await fs.copy(source, destination)
  } catch (error) {
    utils.debug(`Could not overwrite manifest. Error: ${JSON.stringify(error)}`)
    throw error
  }
}
