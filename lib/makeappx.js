import path from 'path'
import chalk from 'chalk'
import * as utils from './utils.js'

export default async function makeappx (program) {
  if (!program.windowsKit) {
    throw new Error('Path to Windows Kit not specified')
  }

  utils.log(chalk.bold.green('Creating appx package...'))

  const makeappxExe = path.join(program.windowsKit, 'makeappx.exe')
  const source = path.join(program.outputDirectory, 'pre-appx')
  const destination = path.join(
    program.outputDirectory,
    `${program.packageName}${program.packageVersion ? ' ' + program.packageVersion : ''}${program.devCert && program.devCert.toLowerCase() === 'nil' ? ' unsigned' : ''}.appx`
  )
  const params = ['pack', '/d', source, '/p', destination, '/o'].concat(program.makeappxParams || [])

  utils.debug(`Using makeappx.exe in: ${makeappxExe}`)
  utils.debug(`Using pre-appx folder in: ${source}`)
  utils.debug(`Using following destination: ${destination}`)
  utils.debug(`Using parameters: ${JSON.stringify(params)}`)

  if (program.assets) {
    const assetPath = path.normalize(program.assets)
    if (utils.hasVariableResources(assetPath)) {
      utils.debug('Determined that package has variable resources, calling makeappx.exe with /l')
      params.push('/l')
    }
  }

  await utils.executeChildProcess(makeappxExe, params)
}
