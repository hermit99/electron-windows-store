// Ensures correct parameters
import inquirer from 'inquirer'
import fs from 'fs'
import path from 'path'
import * as utils from './utils.js'

const cwd = process.cwd()

export default async function ensureParams (program) {
  const questions = [
    {
      name: 'inputDirectory',
      type: 'input',
      message: 'Please enter the path to your built Electron app: ',
      validate: (input) => {
        if (!utils.isDirectory(input)) {
          // Not found, let's try the subdir
          return (utils.isDirectory(path.join(cwd, input)))
        }

        return true
      },
      filter: (input) => {
        if (!utils.isDirectory(input)) {
          return path.join(cwd, input)
        } else {
          return input
        }
      },
      when: () => (!program.inputDirectory)
    },
    {
      name: 'outputDirectory',
      type: 'input',
      message: 'Please enter the path to your output directory: ',
      default: path.join(cwd, 'windows-store'),
      validate: (input) => {
        utils.log(input)
        if (!utils.isDirectory(input) && !utils.isDirectory(path.join(cwd, input))) {
          try {
            fs.mkdirSync(input)
            return true
          } catch (err) {
            utils.log(err)
            return false
          }
        }

        return true
      },
      when: () => (!program.outputDirectory)
    },
    {
      name: 'packageName',
      type: 'input',
      message: "Please enter your app's package name (name of your exe - without '.exe'): ",
      when: () => (!program.packageName)
    },
    {
      name: 'packageVersion',
      type: 'input',
      default: '1.0.0.0',
      message: "Please enter your app's package version: ",
      when: () => (!program.packageVersion)
    }
  ]

  // First, ensure that we're even running Windows
  // (and the right version of it)
  utils.ensureWindows()

  // Then, let's ensure our parameters
  const answers = await inquirer.prompt(questions)

  if (!program.packageExecutable && program.containerVirtualization) {
    program.packageExecutable = `C:\\Users\\ContainerAdministrator\\AppData\\Roaming\\e\\${program.packageName}.exe`
  }

  Object.assign(program, answers)

  // Verify optional parameters
  if (program.devCert && program.devCert.match(/\.p12$/i)) {
    if (!program.certPass) {
      utils.debug('Error: Using a P12 certification file but the password is missing')
      throw new Error('No certificate password specified!')
    }
  }
}
