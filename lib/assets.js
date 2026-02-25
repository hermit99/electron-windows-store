import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'
import * as utils from './utils.js'

export default async function assets (program) {
  if (!program.assets) return

  utils.log(chalk.bold.green('Copying visual assets into pre-appx folder...'))

  const source = path.normalize(program.assets)
  const destination = path.join(program.outputDirectory, 'pre-appx', 'Assets')

  utils.debug(`Copying visual assets from ${source} to ${destination}`)

  try {
    await fs.copy(source, destination)
    utils.debug('Copying visual assets succeeded')
  } catch (error) {
    utils.debug(`Copying visual assets failed: ${JSON.stringify(error)}`)
    throw error
  }
}
