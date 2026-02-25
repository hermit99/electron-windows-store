import path from 'path'
import inquirer from 'inquirer'
import { pathExistsSync } from 'path-exists'
import defaults from 'lodash.defaults'
import chalk from 'chalk'
import * as utils from './utils.js'
import sign from './sign.js'
import Config from './dotfile.js'

const dotfile = new Config()

/**
 * Determines whether all setup settings are okay.
 *
 * @returns {boolean} - Whether everything is setup correctly.
 */
function isSetupRequired (program) {
  const config = dotfile.get() || {}
  const hasPublisher = (config.publisher || program.publisher)
  const hasDevCert = (config.devCert || program.devCert)
  const hasWindowsKit = (config.windowsKit || program.windowsKit)
  const hasBaseImage = (config.expandedBaseImage || program.expandedBaseImage)
  const hasConverterTools = (config.desktopConverter || program.desktopConverter)

  if (!program.containerVirtualization) {
    return (hasPublisher && hasDevCert && hasWindowsKit)
  } else {
    return (hasPublisher && hasDevCert && hasWindowsKit && hasBaseImage && hasConverterTools)
  }
}

/**
 * Asks the user if dependencies are installed. If she/he declines, we exit the process.
 *
 * @param program - Commander program object
 * @returns {Promise} - Promise that returns once user responded
 */
async function askForDependencies (program) {
  if (program.isModuleUse) return

  const questions = [
    {
      name: 'didInstallDesktopAppConverter',
      type: 'confirm',
      message: 'Did you download and install the Desktop App Converter? It is *not* required to run this tool. '
    },
    {
      name: 'makeCertificate',
      type: 'confirm',
      message: 'You need to install a development certificate in order to run your app. Would you like us to create one? '
    }
  ]

  const answers = await inquirer.prompt(questions)
  program.didInstallDesktopAppConverter = answers.didInstallDesktopAppConverter
  program.makeCertificate = answers.makeCertificate
}

/**
 * Runs a wizard, helping the user setup configuration
 *
 * @param program - Commander program object
 * @returns {Promise} - Promise that returns once wizard completed
 */
async function wizardSetup (program) {
  const welcome = `Welcome to the electron2appx tool!

This tool will assist you with turning your Electron app into
a swanky Windows Store app.

We need to know some settings. We will ask you only once and store
your answers in your profile folder in a .electron2appx
file.`
  const complete = `Setup complete, moving on to package your app!`

  let questions = [
    {
      name: 'desktopConverter',
      type: 'input',
      message: 'Please enter the path to your Desktop App Converter (DesktopAppConverter.ps1): ',
      validate: (input) => pathExistsSync(input),
      when: () => (!program.desktopConverter)
    },
    {
      name: 'expandedBaseImage',
      type: 'input',
      message: 'Please enter the path to your Expanded Base Image: ',
      default: 'C:\\ProgramData\\Microsoft\\Windows\\Images\\BaseImage-14316\\',
      validate: (input) => pathExistsSync(input),
      when: () => (!program.expandedBaseImage)
    },
    {
      name: 'devCert',
      type: 'input',
      message: 'Please enter the path to your development PFX certficate: ',
      default: null,
      when: () => (!dotfile.get().makeCertificate || !program.devCert)
    },
    {
      name: 'publisher',
      type: 'input',
      message: 'Please enter your publisher identity: ',
      default: 'CN=developmentca',
      when: () => (!program.publisher)
    },
    {
      name: 'windowsKit',
      type: 'input',
      message: "Please enter the location of your Windows Kit's bin folder: ",
      default: utils.getDefaultWindowsKitLocation(),
      when: () => (!program.windowsKit)
    }
  ]

  if (!program.isModuleUse) {
    utils.log(welcome)
  }

  // Remove the Desktop Converter Questions if not installed
  if (program.didInstallDesktopAppConverter === false) {
    questions = questions.slice(3)
  }

  if (program.isModuleUse) {
    program.windowsKit = program.windowsKit || utils.getDefaultWindowsKitLocation()
    return
  }

  const answers = await inquirer.prompt(questions)

  dotfile.set({
    desktopConverter: answers.desktopConverter || false,
    expandedBaseImage: answers.expandedBaseImage || false,
    devCert: answers.devCert,
    publisher: answers.publisher,
    windowsKit: answers.windowsKit,
    makeCertificate: dotfile.get().makeCertificate
  })

  program.desktopConverter = answers.desktopConverter
  program.expandedBaseImage = answers.expandedBaseImage
  program.devCert = answers.devCert
  program.publisher = answers.publisher
  program.windowsKit = answers.windowsKit

  if (program.makeCertificate) {
    utils.log(chalk.bold.green('Creating Certificate'))
    const publisher = dotfile.get().publisher.split('=')[1]
    const certFolder = path.join(process.env.APPDATA, 'electron2appx', publisher)

    const pfxFile = await sign.makeCert({ publisherName: publisher, certFilePath: certFolder, program })
    utils.log('Created and installed certificate:')
    utils.log(pfxFile)
    dotfile.set({ devCert: pfxFile })
  }

  utils.log(complete)
}

/**
 * Logs the current configuration to utils
 *
 * @param program - Commander program object
 */
function logConfiguration (program) {
  utils.log(chalk.bold.green.underline('\nConfiguration: '))
  utils.log(`Desktop Converter Location:    ${program.desktopConverter}`)
  utils.log(`Expanded Base Image:           ${program.expandedBaseImage}`)
  utils.log(`Publisher:                     ${program.publisher}`)
  utils.log(`Dev Certificate:               ${program.devCert}`)
  utils.log(`Windows Kit Location:          ${program.windowsKit}\n`)
}

/**
 * Runs setup, checking if all configuration is existent,
 * and merging the dotfile with the program object
 *
 * @param program - Commander program object
 * @returns {Promise} - Promise that returns once setup completed
 */
async function setup (program) {
  if (isSetupRequired(program)) {
    // If we're setup, merge the dotfile configuration into the program
    defaults(program, dotfile.get())
    logConfiguration(program)
  } else {
    // We're not setup, let's do that now
    await askForDependencies(program)
    await wizardSetup(program)
    logConfiguration(program)
  }
}

export default setup
