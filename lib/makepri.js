import path from 'path'
import chalk from 'chalk'
import * as utils from './utils.js'

async function createConfig (program) {
  if (!program.windowsKit) {
    throw new Error('Path to Windows Kit not specified')
  }

  if (!program.makePri) return

  utils.log(chalk.bold.green('Creating priconfig...'))

  const makepri = path.join(program.windowsKit, 'makepri.exe')
  const source = path.join('pre-appx', 'priconfig.xml')
  const params = ['createconfig', '/cf', source, '/dq', 'en-US'].concat(program.createConfigParams || [])
  const options = { cwd: program.outputDirectory }

  utils.debug(`Using makepri.exe in: ${makepri}`)
  utils.debug(`Using pre-appx folder in: ${source}`)
  utils.debug(`Using parameters: ${JSON.stringify(params)}`)

  await utils.executeChildProcess(makepri, params, options)
}

async function createPri (program) {
  if (!program.windowsKit) {
    throw new Error('Path to Windows Kit not specified')
  }

  if (!program.makePri) return

  utils.log(chalk.bold.green('Creating pri file...'))

  const makepri = path.join(program.windowsKit, 'makepri.exe')
  const source = path.join('pre-appx', 'priconfig.xml')
  const projectFolder = 'pre-appx'
  const outFile = path.join('pre-appx', 'resources.pri')
  const params = ['new', '/pr', projectFolder, '/cf', source, '/of', outFile].concat(program.createPriParams || [])
  const options = { cwd: program.outputDirectory }

  utils.debug(`Using makepri.exe in: ${makepri}`)
  utils.debug(`Using pre-appx folder in: ${source}`)
  utils.debug(`Using parameters: ${JSON.stringify(params)}`)

  await utils.executeChildProcess(makepri, params, options)
}

export default async function makepri (program) {
  await createConfig(program)
  await createPri(program)
}
