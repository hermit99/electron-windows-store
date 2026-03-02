import zip from './zip.js'
import setup from './setup.js'
import sign from './sign.js'
import assets from './assets.js'
import convert from './convert.js'
import finalSay from './finalsay.js'
import makeappx from './makeappx.js'
import manifest from './manifest.js'
import deploy from './deploy.js'
import makepri from './makepri.js'

/**
 * Transforms a given input directory into a Windows Store package.
 *
 * @param {WindowsStoreOptions} program
 *
 * @typedef WindowsStoreOptions
 * @type {Object}
 * @property {boolean}   containerVirtualization - Create package using Windows Container virtualization
 * @property {string}    inputDirectory          - Directory containing your application
 * @property {string}    outputDirectory         - Output directory for the appx
 * @property {string}    packageVersion          - Version of the app package
 * @property {string}    packageName             - Name of the app package
 * @property {string}    packageDisplayName      - Display name of the package
 * @property {string}    packageDescription      - Description of the package
 * @property {string}    packageBackgroundColor  - Background color for the app icon (example: #464646, default: transparent)
 * @property {string}    packageExecutable       - Path to the package executable
 * @property {string}    assets                  - Path to the visual assets for the appx
 * @property {string}    manifest                - Path to a manifest, if you want to overwrite the default one
 * @property {boolean}   deploy                  - Should the app be deployed after creation?
 * @property {string}    publisher               - Publisher to use (example: CN=developmentca)
 * @property {string}    windowsKit              - Path to the Windows Kit bin folder
 * @property {string}    devCert                 - Path to the developer certificate to use
 * @property {string}    desktopConverter        - Path to the desktop converter tools
 * @property {string}    expandedBaseImage       - Path to the expanded base image
 * @property {[string]}  makeappxParams          - Additional parameters for Make-AppXPackage
 * @property {[string]}  signtoolParams          - Additional parameters for signtool.exe
 * @property {[string]}  createConfigParams      - Additional parameters for makepri.exe createconfig
 * @property {[string]}  createPriParams         - Additional parameters for makepri.exe new
 * @property {function}  finalSay                - A function that is called before makeappx.exe executes. Accepts a promise.
 *
 * @returns {Promise} - A promise that completes once the appx has been created
 */
export default async function windowsStore (program) {
  program.isModuleUse = true

  await setup(program)
  await zip(program)
  await convert(program)
  await assets(program)
  await manifest(program)
  await makepri(program)
  await finalSay(program)
  await makeappx(program)
  await sign.signAppx(program)
  await deploy(program)
}
